import os
import json
import asyncio
import logging
import re
from typing import Optional, List, Dict, Any
from io import BytesIO
from uuid import uuid4

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from groq import Groq

# OCR libraries
from PIL import Image
import pytesseract
from PyPDF2 import PdfReader

# MongoDB
from pymongo import MongoClient

# ====== SET TESSERACT PATH (WINDOWS) ======
# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
TESSERACT_CMD = os.getenv("TESSERACT_CMD")
if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD



# ================================================================
# LOAD ENV & LOGGING
# ================================================================
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger(__name__)


# ================================================================
# GROQ CONFIG
# ================================================================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "llama-3.1-8b-instant")
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"
TIMEOUT_SECONDS = float(os.getenv("GROQ_TIMEOUT_SECONDS", 25))

client = Groq(api_key=GROQ_API_KEY) if (not MOCK_MODE and GROQ_API_KEY) else None


# ================================================================
# MONGODB CONFIG
# ================================================================
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "certificate_ai")
MONGO_CERT_COLLECTION = os.getenv("MONGO_CERT_COLLECTION", "certificates")

mongo_client: Optional[MongoClient] = None
cert_collection = None

if MONGO_URI:
    try:
        mongo_client = MongoClient(MONGO_URI)
        cert_collection = mongo_client[MONGO_DB_NAME][MONGO_CERT_COLLECTION]
        logger.info("Connected to MongoDB")
    except Exception as e:
        logger.error(f"Mongo connection error: {e}")
        mongo_client = None
        cert_collection = None
else:
    logger.warning("MONGO_URI not set; MongoDB will be unavailable")

app = FastAPI(title="AI OCR + Recommendation + Employer Chat (MongoDB)")


# ================================================================
# MODELS
# ================================================================
class OCRSkill(BaseModel):
    name: str
    confidence: float = Field(ge=0.0, le=1.0)


class OCRMeta(BaseModel):
    source: str
    processed_at: Optional[str] = None
    is_verified: Optional[bool] = False


class CertificateOCRSchema(BaseModel):
    """
    Ye structure har certificate ka “clean AI schema” hai.
    Isko hi DB me store karoge, search & chat isi par chalega.
    """
    certificate_id: Optional[str] = None
    organization_id: Optional[str] = None

    issuer_name: Optional[str] = None
    learner_name: Optional[str] = None
    learner_email: Optional[str] = None

    course_name: Optional[str] = None
    course_category: Optional[str] = None

    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None

    certificate_code: Optional[str] = None
    grade: Optional[str] = None
    score: Optional[float] = None
    location: Optional[str] = None

    skills: List[OCRSkill] = []
    raw_text: str

    meta: Optional[OCRMeta] = None


class RecommendationResponse(BaseModel):
    """
    Recommendation response: nested cheezein dict rakhe,
    taki LLM thoda up-down kare to Pydantic fail na ho.
    """
    skills: List[str]
    recommended_next_skills: List[dict]
    role_suggestions: List[dict]
    learning_path: List[dict]
    recommended_courses: List[dict]
    nsqf_level: int = Field(ge=1, le=10)
    nsqf_confidence: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    source: str = "groq"
    extracted_text: Optional[str] = None


class CertTextIn(BaseModel):
    certificate_text: str


class RecommendByEmailIn(BaseModel):
    email: str


class EmployerChatByEmailIn(BaseModel):
    email: str
    question: str


class SearchByInstitutionIn(BaseModel):
    email: str
    institution_query: str


# ================================================================
# PROMPTS
# ================================================================
def build_ocr_schema_prompt(text: str) -> str:
    safe = text.replace('"""', '\\"""')

    return f"""
You are an AI that extracts structured fields from a certificate.

CERTIFICATE TEXT:
\"\"\"{safe}\"\"\"

Return ONLY THIS EXACT JSON STRUCTURE:

{{
  "certificate_id": null,
  "organization_id": null,
  "issuer_name": "",
  "learner_name": "",
  "learner_email": null,
  "course_name": "",
  "course_category": "",
  "issue_date": null,
  "expiry_date": null,
  "certificate_code": "",
  "grade": "",
  "score": 0,
  "location": "",
  "skills": [
    {{"name": "Python", "confidence": 0.95}}
  ],
  "raw_text": "",
  "meta": {{
    "source": "ocr_extracted",
    "processed_at": null,
    "is_verified": false
  }}
}}

VERY IMPORTANT RULES:
- "issuer_name" MUST be the ORGANIZATION / INSTITUTE / COMPANY giving the certificate,
  NOT a person’s name.
- NEVER use names starting with or containing titles like "Mr.", "Mrs.", "Ms.", "Miss", "Dr.",
  or "Sir" as issuer_name. Those are signatories, not issuers.
- Ignore signatures and personal names completely when filling issuer_name.
- If multiple organizations appear, choose the most prominent or the first main institute name.
- "learner_name" is the name of the person who RECEIVES the certificate.
- "learner_email" should only be filled if an email is clearly written in the text,
  otherwise it must be null.
- "skills" = list of objects {{name, confidence}} inferred from course/description.
- "raw_text" must be an empty string (backend will fill it).
- Use null for unknown fields.
- Return ONLY JSON, no markdown, no comments, no extra text.
"""


def build_profile_recommendation_prompt(email: str, certs: List[CertificateOCRSchema]) -> str:
    # merge skills
    all_skills = sorted({s.name for c in certs for s in c.skills})
    skills_str = ", ".join(all_skills)

    # small summary to show LLM
    certs_summary = []
    for c in certs:
        certs_summary.append({
            "issuer_name": c.issuer_name,
            "course_name": c.course_name,
            "issue_date": c.issue_date,
            "skills": [s.name for s in c.skills],
        })
    certs_json = json.dumps(certs_summary, indent=2)

    return f"""
You are an AI career assistant. This is a learner profile built from multiple certificates.

LEARNER EMAIL: {email}

CERTIFICATES (summary):
{certs_json}

MERGED SKILLS:
[{skills_str}]

Based on this overall profile, generate a rich career recommendation.

Return STRICT JSON in EXACTLY this structure (no extra keys):

{{
  "skills": [
    "HTML",
    "CSS",
    "JavaScript"
  ],
  "recommended_next_skills": [
    {{
      "skill": "React",
      "description": "A JavaScript library for building user interfaces.",
      "market_demand_percent": 80,
      "career_outcome": "Front-end Developer"
    }},
    {{
      "skill": "Node.js",
      "description": "A JavaScript runtime for building server-side applications.",
      "market_demand_percent": 70,
      "career_outcome": "Back-end Developer"
    }},
    {{
      "skill": "TypeScript",
      "description": "A statically typed JavaScript language for large applications.",
      "market_demand_percent": 60,
      "career_outcome": "Full-stack Developer"
    }},
    {{
      "skill": "Angular",
      "description": "A JavaScript framework for building complex web applications.",
      "market_demand_percent": 50,
      "career_outcome": "Front-end Developer"
    }},
    {{
      "skill": "Vue.js",
      "description": "A progressive and flexible JavaScript framework for building web applications.",
      "market_demand_percent": 40,
      "career_outcome": "Front-end Developer"
    }}
  ],
  "role_suggestions": [
    {{
      "role": "Front-end Developer",
      "required_skills": [
        "HTML",
        "CSS",
        "JavaScript",
        "React"
      ],
      "matched_skills": [
        "JavaScript"
      ],
      "percent_complete": 33
    }},
    {{
      "role": "Back-end Developer",
      "required_skills": [
        "JavaScript",
        "Node.js"
      ],
      "matched_skills": [
        "JavaScript"
      ],
      "percent_complete": 50
    }}
  ],
  "learning_path": [
    {{
      "stage": "Foundation",
      "skills": [
        "HTML",
        "CSS",
        "JavaScript"
      ],
      "est_time_weeks": 12
    }},
    {{
      "stage": "Intermediate",
      "skills": [
        "React",
        "Node.js"
      ],
      "est_time_weeks": 20
    }},
    {{
      "stage": "Advanced",
      "skills": [
        "TypeScript",
        "Angular",
        "Vue.js"
      ],
      "est_time_weeks": 30
    }}
  ],
  "recommended_courses": [
    {{
      "title": "Full Stack Development with React",
      "provider": "Coursera",
      "url": "https://www.coursera.org/specializations/full-stack-development-with-react"
    }},
    {{
      "title": "Node.js Development",
      "provider": "Udemy",
      "url": "https://www.udemy.com/course/nodejs-development/"
    }},
    {{
      "title": "TypeScript Fundamentals",
      "provider": "edX",
      "url": "https://www.edx.org/course/typescript-fundamentals"
    }}
  ],
  "nsqf_level": 6,
  "nsqf_confidence": 0.8,
  "confidence": 0.9,
  "source": "groq"
}}

RULES:
- "skills": fill with the learner's merged skill set (you can add obvious related skills).
- "recommended_next_skills": AT LEAST 5 items, each with:
  - "skill"
  - "description"
  - "market_demand_percent" (0–100)
  - "career_outcome" (e.g. Front-end Developer, Data Analyst, etc.)
- "role_suggestions": AT LEAST 2 roles. Each must contain:
  - "role"
  - "required_skills" (3–8 skills)
  - "matched_skills" (intersection with learner skills)
  - "percent_complete" (0–100)
- "learning_path": AT LEAST 3 stages (Foundation / Intermediate / Advanced).
- "recommended_courses": AT LEAST 3 courses with:
  - "title", "provider", "url".
- "nsqf_level": integer 1–10.
- "nsqf_confidence" & "confidence": floats 0–1.
- Output ONLY valid JSON. No markdown, no extra text.
"""


def build_employer_chat_prompt(email: str, certs: List[CertificateOCRSchema], question: str) -> str:
    certs_json = json.dumps([c.dict() for c in certs], indent=2)
    return f"""
You are an HR / employer assistant AI.

Candidate identifier (email): {email}

Here are all certificates for this candidate:
{certs_json}

Employer question:
\"\"\"{question}\"\"\"


Give a VERY SHORT, DIRECT answer:

- Maximum 3 short sentences in total.
- No bullet points, no lists, no markdown.
- Focus only on: suitability, core skills, and one clear suggestion (if needed).
- Do NOT repeat the question. Just answer it.
"""


# ================================================================
# SAFE JSON PARSER
# ================================================================
def safe_extract_json(raw: str):
    if not raw:
        return None

    cleaned = raw.strip()

    # Remove ```json or ``` wrappers if present
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z0-9]*\n?", "", cleaned)
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]

    # 1) Try direct JSON parse first (works when we use json_mode)
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # 2) Fallback: try to extract from first { to last }
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1:
        logger.error(f"Could not find JSON braces in: {raw[:200]}")
        return None

    text = cleaned[start:end + 1]

    # If model tried to put raw_text in triple quotes, normalize it
    text = re.sub(
        r'"raw_text"\s*:\s*""".*?"""',
        '"raw_text": ""',
        text,
        flags=re.S
    )
    # Remove stray triple quotes
    text = text.replace('"""', '"')

    # Replace Python-style None/True/False with JSON equivalents
    replacements = [
        (": None", ": null"),
        (" None", " null"),
        (": True", ": true"),
        (" True", " true"),
        (": False", ": false"),
        (" False", " false"),
    ]
    for bad, good in replacements:
        text = text.replace(bad, good)

    try:
        return json.loads(text)
    except Exception:
        # Try to fix trailing commas
        try:
            text2 = text.replace(",}", "}").replace(",]", "]")
            return json.loads(text2)
        except Exception as e:
            logger.error(f"JSON parse error: {e}\nRAW LLM OUTPUT:\n{raw}")
            return None


def normalize_reco(parsed: dict, skills_fallback: Optional[List[str]] = None) -> dict:
    if parsed is None:
        return {}

    if skills_fallback is None:
        skills_fallback = parsed.get("skills") or []

    parsed.setdefault("skills", skills_fallback)
    parsed.setdefault("recommended_next_skills", [])
    parsed.setdefault("role_suggestions", [])
    parsed.setdefault("learning_path", [])
    parsed.setdefault("recommended_courses", [])

    parsed.setdefault("nsqf_level", 6)
    parsed.setdefault("nsqf_confidence", 0.7)
    parsed.setdefault("confidence", 0.8)
    parsed.setdefault("source", "groq")

    return parsed


# ================================================================
# MONGO HELPERS
# ================================================================
def get_cert_collection():
    if cert_collection is None:
        raise RuntimeError("MongoDB not configured (cert_collection is None)")
    return cert_collection


async def save_certificate_to_mongo(schema: CertificateOCRSchema) -> None:
    col = get_cert_collection()

    # ensure certificate_id
    if not schema.certificate_id:
        schema.certificate_id = str(uuid4())

    doc = schema.dict()
    # _id for Mongo
    doc["_id"] = schema.certificate_id

    # normalized email for search
    email_key = (schema.learner_email or "").strip().lower()
    doc["email_key"] = email_key or None

    def _insert():
        # upsert by _id (in case we want to avoid duplicates)
        col.replace_one({"_id": doc["_id"]}, doc, upsert=True)

    await asyncio.to_thread(_insert)


async def fetch_certificates_by_email(email: str) -> List[CertificateOCRSchema]:
    col = get_cert_collection()
    email_key = email.strip().lower()

    def _find():
        return list(col.find({"email_key": email_key}))

    docs = await asyncio.to_thread(_find)

    certs: List[CertificateOCRSchema] = []
    for d in docs:
        # remove Mongo-specific keys
        d.pop("_id", None)
        d.pop("email_key", None)
        certs.append(CertificateOCRSchema(**d))
    return certs


async def search_certificates_for_email_by_institution(email: str, q: str) -> List[CertificateOCRSchema]:
    col = get_cert_collection()
    email_key = email.strip().lower()

    # regex search on issuer_name + filter by email_key
    def _find():
        return list(col.find({
            "email_key": email_key,
            "issuer_name": {"$regex": q, "$options": "i"}
        }))

    docs = await asyncio.to_thread(_find)

    certs: List[CertificateOCRSchema] = []
    for d in docs:
        d.pop("_id", None)
        d.pop("email_key", None)
        certs.append(CertificateOCRSchema(**d))
    return certs


# ================================================================
# OCR HELPERS
# ================================================================
def ocr_image_bytes(data: bytes) -> str:
    try:
        img = Image.open(BytesIO(data))
        return pytesseract.image_to_string(img)
    except Exception as e:
        logger.error(f"OCR image error: {e}")
        return ""


def extract_text_from_pdf_bytes(data: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(data))
        text = ""
        for p in reader.pages:
            text += p.extract_text() or ""
        return text
    except Exception as e:
        logger.error(f"PDF error: {e}")
        return ""


# ================================================================
# GROQ CALL
# ================================================================
async def groq_call(prompt: str, max_tokens: int = 900, json_mode: bool = False):
    if client is None:
        raise RuntimeError("Groq client not initialized")

    def _call():
        kwargs = dict(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=max_tokens,
        )
        # When we want strict JSON, tell Groq to return a JSON object
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        return client.chat.completions.create(**kwargs)

    return await asyncio.to_thread(_call)


# ================================================================
# HEALTH
# ================================================================
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "mock": MOCK_MODE,
        "key_loaded": bool(GROQ_API_KEY),
        "mongo_connected": cert_collection is not None
    }


# ================================================================
# 1) /ocr-schema-ocr → FILE (+ optional email) → SCHEMA + STORE (Mongo)
# ================================================================
@app.post("/ocr-schema-ocr", response_model=CertificateOCRSchema)
async def ocr_schema_ocr(
    file: UploadFile = File(...),
    learner_email: Optional[str] = Form(None)
):
    if cert_collection is None:
        raise HTTPException(500, "MongoDB not configured")

    data = await file.read()
    ctype = (file.content_type or "").lower()

    # OCR
    if "pdf" in ctype:
        text = extract_text_from_pdf_bytes(data)
    else:
        text = ocr_image_bytes(data)

    text = text.strip()
    if not text:
        raise HTTPException(422, "OCR failed or empty text")

    # Build schema using LLM or mock
    if MOCK_MODE or client is None:
        schema = CertificateOCRSchema(
            certificate_id=str(uuid4()),
            issuer_name="Demo Institute (OCR)",
            learner_name="Demo User",
            learner_email=learner_email,
            course_name="Demo Course OCR",
            raw_text=text,
            skills=[OCRSkill(name="Python", confidence=0.9)],
            meta=OCRMeta(source="mock-ocr")
        )
    else:
        prompt = build_ocr_schema_prompt(text)
        try:
            # Use JSON mode so the model MUST return valid JSON
            resp = await asyncio.wait_for(groq_call(prompt, json_mode=True), timeout=TIMEOUT_SECONDS)
        except asyncio.TimeoutError:
            raise HTTPException(504, "LLM timeout")

        parsed = safe_extract_json(resp.choices[0].message.content)
        if not parsed:
            raise HTTPException(500, "Failed to parse OCR schema JSON")

        parsed["raw_text"] = text
        schema = CertificateOCRSchema(**parsed)

        if learner_email:
            schema.learner_email = learner_email

    # Save to MongoDB
    await save_certificate_to_mongo(schema)
    return schema


# ================================================================
# 2) /recommend-from-skills → EMAIL → ALL CERTS (Mongo) → RECO
# ================================================================
@app.post("/recommend-from-skills", response_model=RecommendationResponse)
async def recommend_from_skills(input: RecommendByEmailIn):
    if cert_collection is None:
        raise HTTPException(500, "MongoDB not configured")

    certs = await fetch_certificates_by_email(input.email)
    if not certs:
        raise HTTPException(404, f"No certificates found for email '{input.email}'")

    all_skills = sorted({s.name for c in certs for s in c.skills})

    if MOCK_MODE or client is None:
        return RecommendationResponse(
            skills=all_skills,
            recommended_next_skills=[{
                "skill": "Data Analysis",
                "description": "Analyze data to generate insights.",
                "market_demand_percent": 80,
                "career_outcome": "Data Analyst"
            }],
            role_suggestions=[],
            learning_path=[],
            recommended_courses=[],
            nsqf_level=6,
            nsqf_confidence=0.8,
            confidence=0.9,
            source="mock-profile"
        )

    prompt = build_profile_recommendation_prompt(input.email, certs)
    try:
        # JSON mode ON to prevent messy JSON like before
        resp = await asyncio.wait_for(
            groq_call(prompt, max_tokens=1200, json_mode=True),
            timeout=TIMEOUT_SECONDS
        )
    except asyncio.TimeoutError:
        raise HTTPException(504, "LLM timeout")

    parsed = safe_extract_json(resp.choices[0].message.content)
    if not parsed:
        raise HTTPException(500, "Failed to parse recommendation JSON")

    if not parsed.get("skills"):
        parsed["skills"] = all_skills

    parsed = normalize_reco(parsed, skills_fallback=all_skills)
    return RecommendationResponse(**parsed)


# ================================================================
# 2.5) /search-certificates-by-institution (Mongo)
# ================================================================
@app.post("/search-certificates-by-institution", response_model=List[CertificateOCRSchema])
async def search_certificates_by_institution(input: SearchByInstitutionIn):
    if cert_collection is None:
        raise HTTPException(500, "MongoDB not configured")

    q = input.institution_query.strip()
    if not q:
        raise HTTPException(400, "institution_query is required")

    results = await search_certificates_for_email_by_institution(input.email, q)
    if not results:
        return []
    return results


# ================================================================
# 3) /employer-chat → EMAIL + QUESTION → ALL CERTS → SHORT ANSWER
# ================================================================
@app.post("/employer-chat", response_model=dict)
async def employer_chat(input: EmployerChatByEmailIn):
    if cert_collection is None:
        raise HTTPException(500, "MongoDB not configured")

    certs = await fetch_certificates_by_email(input.email)
    if not certs:
        raise HTTPException(404, f"No certificates found for email '{input.email}'")

    if MOCK_MODE or client is None:
        return {
            "answer": f"(mock) Short employer answer for {len(certs)} certificates of {input.email}"
        }

    prompt = build_employer_chat_prompt(input.email, certs, input.question)
    try:
        # small max_tokens so answer remains very short
        resp = await asyncio.wait_for(groq_call(prompt, max_tokens=120), timeout=TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        raise HTTPException(504, "LLM timeout")

    answer = resp.choices[0].message.content.strip()
    return {"answer": answer}


# ================================================================
# END OF FILE
# ================================================================
