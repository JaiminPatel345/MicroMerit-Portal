# ================================================================
# FINAL AI MICRO-SERVICE (GROQ + FASTAPI)
# Author: ChatGPT (Optimized for SIH)
# ================================================================

import os
import json
import asyncio
import logging
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# GROQ API CONFIG
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "llama-3.1-8b-instant")
TIMEOUT_SECONDS = float(os.getenv("GROQ_TIMEOUT_SECONDS", 25))
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"

# Safe init of client
client = Groq(api_key=GROQ_API_KEY) if not MOCK_MODE and GROQ_API_KEY else None

# FastAPI instance
app = FastAPI(title="AI Recommendation Microservice (Groq-powered)")

# ================================================================
# REQUEST MODEL
# ================================================================
class CertIn(BaseModel):
    certificate_text: str


# ================================================================
# BUILD PROMPT
# ================================================================
def build_prompt(cert_text: str) -> str:
    safe_text = cert_text.replace('"""', '\\"""')

    return f"""
You are an AI expert for a national Micro-Credential Aggregator.  
You must analyze the certificate text and output STRICT JSON (no markdown).

CERTIFICATE TEXT:
\"\"\"{safe_text}\"\"\"

YOUR TASKS:

1) Extract all identified **skills**.

2) Generate "recommended_next_skills":  
   - MUST contain at least **5 new skills** the learner does NOT already have  
   - Each object MUST be:
     {{
        "skill": "string",
        "description": "one short sentence (<20 words)",
        "market_demand_percent": integer 0–100
     }}
   - Sort in descending order of market_demand_percent.

3) Generate "role_suggestions":
   - AI must identify possible roles based on extracted skills
   - For each:
     {{
       "role": "string",
       "required_skills": ["skill1","skill2"],
       "matched_skills": ["skillA"],
       "percent_complete": number 0–100
     }}
   - Only show roles where percent_complete > 0
   - percent_complete = matched / required * 100

4) Generate a structured "learning_path":
   [
     {{"stage": "Foundation", "skills": [...], "est_time_weeks": number}},
     {{"stage": "Intermediate", "skills": [...], "est_time_weeks": number}},
     {{"stage": "Advanced", "skills": [...], "est_time_weeks": number}}
   ]

5) Generate "recommended_courses" - 3 to 5 items:
   [
     {{"title": "", "provider": "", "url": ""}}
   ]

6) NSQF mapping:
   - "nsqf_level": integer 1–10
   - "nsqf_confidence": float 0–1

7) Include:
   - "confidence": float
   - "source": "groq"

OUTPUT RULES:
- ABSOLUTELY RETURN ONLY JSON
- NO markdown code blocks
- NO explanation
- All percentages must be integers
"""

# ================================================================
# EXTRACT JSON SAFELY
# ================================================================
def safe_extract_json(raw: str) -> Optional[dict]:
    if not raw:
        return None

    cleaned = raw.strip()
    cleaned = cleaned.replace("```json", "").replace("```", "").strip()

    # extract { ... }
    start = cleaned.find("{")
    end = cleaned.rfind("}")

    if start == -1 or end == -1:
        return None

    json_candidate = cleaned[start:end + 1]

    try:
        return json.loads(json_candidate)
    except:
        cleaned2 = json_candidate.replace(",}", "}").replace(",]", "]")
        try:
            return json.loads(cleaned2)
        except:
            return None


# ================================================================
# GROQ CALL (async wrapper)
# ================================================================
async def groq_call(prompt: str):
    return await asyncio.to_thread(
        lambda: client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=900,
        )
    )


# ================================================================
# HEALTH CHECK
# ================================================================
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "groq_key_loaded": bool(GROQ_API_KEY),
        "model": MODEL_NAME,
        "mock_mode": MOCK_MODE,
    }


# ================================================================
# MAIN ENDPOINT
# ================================================================
@app.post("/recommend")
async def recommend(input: CertIn):
    certificate_text = input.certificate_text.strip()

    if not certificate_text:
        raise HTTPException(status_code=400, detail="certificate_text cannot be empty")

    # MOCK MODE
    if MOCK_MODE or client is None:
        return {
            "skills": ["python", "pandas"],
            "recommended_next_skills": [
                {"skill": "SQL", "description": "Query relational databases.", "market_demand_percent": 92},
                {"skill": "Power BI", "description": "Visualize data trends.", "market_demand_percent": 88},
                {"skill": "Machine Learning", "description": "Build predictive models.", "market_demand_percent": 90},
                {"skill": "Statistics", "description": "Understand data behavior.", "market_demand_percent": 85},
                {"skill": "Data Modeling", "description": "Design data structures.", "market_demand_percent": 80},
            ],
            "role_suggestions": [],
            "learning_path": [],
            "recommended_courses": [],
            "nsqf_level": 5,
            "nsqf_confidence": 0.7,
            "confidence": 0.85,
            "source": "mock",
        }

    prompt = build_prompt(certificate_text)

    try:
        logger.info("Calling Groq model…")
        resp = await asyncio.wait_for(groq_call(prompt), timeout=TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Groq request timed out")

    raw_text = resp.choices[0].message.content
    parsed = safe_extract_json(raw_text)

    if parsed:
        return parsed

    # If JSON fails, return raw
    return {"error": "Could not parse JSON", "raw": raw_text}


# ================================================================
# END OF FILE
# ================================================================
