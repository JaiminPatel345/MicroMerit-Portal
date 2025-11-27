# 📘 AI Microservice Documentation 
This document explains the **OCR → Certificate Schema → Recommendation Engine → Employer Chat** pipeline.

---

# 🚀 Project Overview

Our platform helps **learners organize their certificates** and enables **employers to instantly evaluate a candidate** without manually checking each certificate.

We solve 3 major problems:

### 1️⃣ Learners

* Certificates scattered across devices / emails
* No unified skill profile
* Hard to understand career path or next skills to learn

### 2️⃣ Institutes

* Issue certificates but no way to structure data
* No API integration

### 3️⃣ Employers

* Have to manually inspect certificates
* No instant summary of candidate skills

---

# 🌟 Core Features

### ✔ OCR-Based Certificate Extraction

Extracts: Name, Email, Course, Skills, Issue Date, Institute Name, Raw Text.

### ✔ AI-Based Unified Skill Profile

Merges skills from **all certificates** using email ID.

### ✔ Smart Career Recommendation Engine

Outputs:

* Recommended next skills
* Learning path
* Role suggestions
* Courses
* NSQF level

### ✔ Employer Chatbot

Employers ask questions like:

> "Does this candidate know ML?"

AI answers based on **all certificates**.

### ✔ Institute-Level Certificate Search

Learners can search:

> "Show all certificates issued by TATVAMASI LABS"

---

# 🏗 System Architecture

```
        +-------------------------+
        |  Institute / Learner    |
        | Upload PDF / Image     |
        +-----------+-------------+
                    |
                    v
        +-------------------------+
        |   OCR + AI Microservice |
        |  (FastAPI + LLM)   
        +-----------+-------------+
                    |
                    v
        +-------------------------+
        |  MongoDB Atlas (DB)     |
        | Stores Clean Schema      |
        +-----------+-------------+
                    |
        +-----------+-------------+
        | Learner Panel           |
        | - View Certs            |
        | - Recommendations        |
        | - Search by Institute    |
        +-------------------------+
                    |
        +-----------+-------------+
        | Employer Chatbot        |
        | AI reads all certs       |
        +-------------------------+
```

---

# 🧠 Certificate Schema (Stored in DB)

```json
{
  "certificate_id": "uuid",
  "organization_id": null,
  "issuer_name": "TATVAMASI LABS",
  "learner_name": "Hasti Movaliya",
  "learner_email": "student@example.com",
  "course_name": "Machine Learning Bootcamp",
  "course_category": null,
  "issue_date": "30-06-2025",
  "expiry_date": null,
  "certificate_code": null,
  "grade": null,
  "score": 0,
  "location": "Surat, India",
  "skills": [ { "name": "Python", "confidence": 0.95 } ],
  "raw_text": "Full OCR text...",
  "meta": {
    "source": "ocr_extracted",
    "processed_at": null,
    "is_verified": false
  }
}
```

---

# 🔍 API Endpoints

## 1️⃣ **POST /ocr-schema-ocr**

Uploads PDF/image → Returns extracted certificate schema + saves it in DB.

### Request:

```
file: PDF/Image
learner_email: optional
```

### Response:

* Clean structured certificate schema
* Saved in MongoDB

---

## 2️⃣ **POST /recommend-from-skills**

Input → `email`

Backend does:

* Fetch all certificates belonging to that email
* Merge skills
* Generate recommendation

### Output Includes:

* Skills
* Recommended next skills
* Role suggestions
* Learning path
* Courses
* NSQF level
* Confidence score

---

## 3️⃣ **POST /search-certificates-by-institution**

Input:

```json
{
  "email": "user@example.com",
  "institution_query": "labs"
}
```

Returns matching certificates.

---

## 4️⃣ **POST /employer-chat**

Employers ask questions like:

> "Is the candidate suitable for backend role?"

AI answers using:

* All certificates
* All skills
* Course content
* Achievements

---

# 🧩 Why This Architecture Works (SIH Justification)

### ✔ Scalable for any institute

No dependency on certificate format.

### ✔ Universal search & skill extraction

AI normalizes messy data.

### ✔ Employer-ready

Short, factual responses.

### ✔ NSQF-Aligned

Judges will appreciate the education standard alignment.

### ✔ Blockchain Compatible

Since schema is fixed → hashing is possible.

---

# 🏆 Innovation Summary 

* **One learner → multiple certificates → unified skill graph**.
* **Email-based auto mapping** removes manual linking.
* **LLM gives personalized learning path**, not generic suggestions.
* **Employer chatbot reduces screening time dramatically**.
* **OCR allows institutes with zero digital infra to onboard**.

---

# 📌 Future Enhancements

* Blockchain-based verification
* Institute dashboard for analytics
* Skill graph visualization
* Industry job-role mapping

---


