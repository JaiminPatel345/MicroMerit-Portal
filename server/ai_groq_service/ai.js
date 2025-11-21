// ai-groq-service.js
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

// Basic fallback logic (deterministic)
function fallbackRecommendation({ certificateText, qpList = [], topK = 5 }) {
  // very naive skill extraction: split by commas and common words
  const raw = (certificateText || "").toLowerCase();
  const tokens = raw
    .replace(/[^a-z0-9, ]/gi, " ")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  // heuristics: pick tokens that look like skills (length>2 and not generic)
  const generic = new Set(["course", "training", "certificate", "hours", "program", "certification", "project"]);
  let skills = tokens
    .map(t => t.split(" ").slice(0, 3).join(" ").trim())
    .filter(t => t.length > 2 && !generic.has(t));

  if (skills.length === 0) {
    // fallback: some safe common skills
    skills = ["communication", "problem solving"];
  }

  // naive recommended skills: choose common progression map
  const progression = {
    python: ["pandas", "numpy", "sql"],
    javascript: ["react", "nodejs", "express"],
    sql: ["data modeling", "performance tuning"]
  };

  let recommended_skills = [];
  for (const s of skills) {
    const key = Object.keys(progression).find(k => s.includes(k));
    if (key) {
      recommended_skills = recommended_skills.concat(progression[key]);
    }
  }
  recommended_skills = Array.from(new Set(recommended_skills)).slice(0, topK);

  // recommended courses (static small catalog)
  const courseCatalog = [
    { id: "c_sql", title: "Intro to SQL", provider: "Coursera" },
    { id: "c_ds", title: "Data Science Foundations", provider: "edX" },
    { id: "c_ml", title: "Machine Learning Basics", provider: "Coursera" },
    { id: "c_web", title: "Web Development with React", provider: "Udemy" }
  ];
  const recommended_courses = courseCatalog.filter(c =>
    recommended_skills.some(rs => c.title.toLowerCase().includes(rs.split(" ")[0]))
  ).slice(0, topK);

  // naive NSQF: use duration hints or fallback to 4
  const nsqf_level = raw.includes("advanced") || raw.includes("advanced") ? 6 : 4;

  // simple linear pathway: skills -> recommended_skills
  const pathway = [
    ...skills.map(s => ({ skill: s, status: "has" })),
    ...recommended_skills.map(s => ({ skill: s, status: "recommended" }))
  ];

  return {
    skills,
    recommended_skills,
    recommended_courses,
    nsqf_level,
    pathway,
    source: "fallback"
  };
}

// Helper to safely parse JSON that might be wrapped in markdown/code fences
function tryParseJSON(text) {
  if (!text || typeof text !== "string") return null;
  const cleaned = text.trim()
    .replace(/^```json\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // sometimes model returns single quotes or trailing commas; try to normalize simple cases
    try {
      const fixed = cleaned
        .replace(/(\r\n|\n)+/g, " ")
        .replace(/(['"])?([a-z0-9_]+)(['"])?:/gi, '"$2":')
        .replace(/'/g, '"')
        .replace(/,(\s*[}\]])/g, "$1");
      return JSON.parse(fixed);
    } catch (err) {
      return null;
    }
  }
}

// Primary function: call Groq, parse response, fallback if necessary
async function extractAndRecommend({ certificateText, qpList = [], topK = 6, model = "llama3-8b-8192", temperature = 0.2 }) {
  // prompt design - ask for strict JSON only
  const prompt = `
You are an assistant for a national micro-credential aggregator (NCVET context).
Given a certificate text describe skills, suggest next skills/courses, propose an NSQF level (1-10) with a short reason, and produce a simple learning pathway.

Input certificate text:
"""${certificateText}"""

Return STRICT JSON only with fields:
{
  "skills": ["skill1", "skill2", "..."],
  "recommended_skills": ["skillA", "skillB"],
  "recommended_courses": [{"title":"Course Title","provider":"Provider","url":""}],
  "nsqf_level": 5,
  "nsqf_reason": "short reason here",
  "pathway": [{"skill":"python","status":"has"},{"skill":"sql","status":"recommended"}]
}

Constraints:
- Respond ONLY with valid JSON (no additional commentary).
- Keep lists concise (max ${topK} items).
- If uncertain, output best-effort values but still valid JSON.
`;

  // If no API key configured, return fallback immediately
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.length < 10) {
    return fallbackRecommendation({ certificateText, qpList, topK });
  }

  try {
    const completion = await groq.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: 800
    });

    const raw = completion?.choices?.[0]?.message?.content;
    if (!raw || raw.trim().length === 0) {
      return fallbackRecommendation({ certificateText, qpList, topK });
    }

    const parsed = tryParseJSON(raw);
    if (!parsed) {
      // If parsing fails, attempt a second-call repair: ask model to reformat into JSON
      // secondary prompt to reformat the raw response - best effort
      const repairPrompt = `
The assistant previously returned this text:
"""${raw}"""
Please reformat the above EXACT content into valid JSON only, following the schema:
{ "skills": [...], "recommended_skills": [...], "recommended_courses": [...], "nsqf_level": number, "nsqf_reason": "", "pathway": [...] }
Respond ONLY with JSON.
`;
      const repair = await groq.chat.completions.create({
        model,
        messages: [{ role: "user", content: repairPrompt }],
        temperature: 0.0,
        max_tokens: 600
      });
      const repairedRaw = repair?.choices?.[0]?.message?.content || "";
      const parsed2 = tryParseJSON(repairedRaw);
      if (parsed2) {
        parsed2.source = "groq_repaired";
        return parsed2;
      }

      // as last resort return fallback
      return fallbackRecommendation({ certificateText, qpList, topK });
    }

    // Normalize parsed JSON: ensure fields exist with safe defaults
    const normalized = {
      skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, topK) : [],
      recommended_skills: Array.isArray(parsed.recommended_skills) ? parsed.recommended_skills.slice(0, topK) : [],
      recommended_courses: Array.isArray(parsed.recommended_courses) ? parsed.recommended_courses.slice(0, topK) : [],
      nsqf_level: typeof parsed.nsqf_level === "number" ? parsed.nsqf_level : (parseInt(parsed.nsqf_level) || null),
      nsqf_reason: parsed.nsqf_reason || parsed.reason || "",
      pathway: Array.isArray(parsed.pathway) ? parsed.pathway : [],
      source: "groq"
    };

    // fallback fill-ins if something missing
    if (normalized.skills.length === 0) normalized.skills = fallbackRecommendation({ certificateText }).skills;
    if (normalized.recommended_skills.length === 0) normalized.recommended_skills = fallbackRecommendation({ certificateText }).recommended_skills;
    if (!normalized.nsqf_level) normalized.nsqf_level = fallbackRecommendation({ certificateText }).nsqf_level;

    return normalized;
  } catch (err) {
    // In case of network/Groq errors, return fallback
    console.error("Groq call failed:", err && err.message ? err.message : err);
    return fallbackRecommendation({ certificateText, qpList, topK });
  }
}

module.exports = {
  extractAndRecommend,
  fallbackRecommendation
};
