# MicroMerit AI Service

AI-powered OCR and Career Recommendation Service (No Database - Pure Processing Service)

## Architecture

The AI service is a **stateless processing service** that:
- Does NOT store any data
- Does NOT connect to any database
- Receives all data from the Node.js backend
- Returns processed results

## Folder Structure

```
ai_groq_service/
├── app/
│   ├── __init__.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py          # Pydantic models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── groq_service.py     # Groq LLM integration
│   │   ├── ocr_service.py      # OCR processing
│   │   └── recommendation_service.py  # Recommendation logic
│   └── routes/
│       ├── __init__.py
│       └── ai_routes.py        # API endpoints
├── main.py                      # FastAPI app entry point
├── requirements.txt
├── .env
└── README.md
```

## Endpoints

### 1. POST /process-ocr
Process OCR for certificate files (called internally by backend during credential issuance)

**Request:**
```
FormData:
- file: Certificate file (PDF/Image)
- learner_email: string
- certificate_title: string
- issuer_name: string
```

**Response:**
```json
{
  "skills": [
    {"name": "Python", "confidence": 0.95}
  ],
  "extracted_text": "...",
  "certificate_data": {
    "certificate_title": "...",
    "issuer_name": "...",
    "learner_email": "..."
  }
}
```

### 2. POST /recommendations
Generate career recommendations based on certificate data

**Request:**
```json
{
  "learner_email": "user@example.com",
  "certificates": [
    {
      "certificate_title": "Python Programming",
      "issuer_name": "TechUniversity",
      "issued_at": "2024-01-15",
      "metadata": {
        "skills": ["Python", "Data Analysis"]
      }
    }
  ]
}
```

**Response:**
```json
{
  "skills": ["Python", "Data Analysis"],
  "recommended_next_skills": [...],
  "role_suggestions": [...],
  "learning_path": [...],
  "recommended_courses": [...],
  "nsqf_level": 5,
  "nsqf_confidence": 0.85,
  "confidence": 0.9,
  "source": "groq"
}
```

### 3. GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "model": "llama-3.1-8b-instant",
  "mock": false,
  "key_loaded": true
}
```

## Environment Variables

Create a `.env` file in the `server/ai_groq_service` directory:

### For Ubuntu/Linux

```bash
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here
MODEL_NAME=llama-3.1-8b-instant
MOCK_MODE=false
GROQ_TIMEOUT_SECONDS=25

# Tesseract - NOT NEEDED on Ubuntu (auto-detected)
# Leave commented out unless you have issues
# TESSERACT_CMD=/usr/bin/tesseract
```

### For Windows

```bash
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here
MODEL_NAME=llama-3.1-8b-instant
MOCK_MODE=false
GROQ_TIMEOUT_SECONDS=25

# Tesseract - REQUIRED on Windows
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

## Prerequisites

### 1. Install Tesseract OCR

#### Ubuntu/Debian
```bash
# Install Tesseract
sudo apt update
sudo apt install tesseract-ocr

# Verify installation
tesseract --version

# Optional: Install additional language packs
sudo apt install tesseract-ocr-eng  # English (usually included)
sudo apt install tesseract-ocr-hin  # Hindi
```

#### Windows
1. Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Run installer and note the installation path
3. Add path to `.env` file as shown above

#### macOS
```bash
brew install tesseract
```

### 2. Verify Tesseract Installation

```bash
# Check if tesseract is installed
tesseract --version

# Should output something like:
# tesseract 4.1.1 or tesseract 5.x.x

# Find tesseract location (if needed)
which tesseract  # Linux/macOS
where tesseract  # Windows
```

## Installation

### Step 1: Install Tesseract (Ubuntu)

```bash
# Update package list
sudo apt update

# Install Tesseract OCR
sudo apt install tesseract-ocr

# Verify installation
tesseract --version
```

### Step 2: Install Python Dependencies

```bash
# Navigate to AI service directory
cd server/ai_groq_service

# Create virtual environment (recommended)
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # On Ubuntu/Linux
# or
.venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables

```bash
# Create .env file
cp .env.example .env

# Edit .env file
nano .env
```

Add your Groq API key:
```bash
GROQ_API_KEY=your_actual_groq_api_key_here
MODEL_NAME=llama-3.1-8b-instant
MOCK_MODE=false
GROQ_TIMEOUT_SECONDS=25

# TESSERACT_CMD - Not needed on Ubuntu (auto-detected)
```

### Step 4: Run the Service

```bash
# Development mode
python main.py

# Or with uvicorn
uvicorn main:app --reload --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The service will start on `http://localhost:8000`

## Usage Flow

### OCR Processing (Internal - Called by Backend)
```
1. Issuer uploads certificate via backend
2. Backend calls /process-ocr with file and metadata
3. AI service extracts text and skills
4. Returns skills data to backend
5. Backend stores in PostgreSQL with credential
```

### Recommendations (User-facing)
```
1. Learner requests recommendations via frontend
2. Frontend calls backend /ai/recommendations
3. Backend fetches certificates from PostgreSQL
4. Backend sends certificate data to AI service /recommendations
5. AI service processes and generates recommendations
6. Backend returns to frontend
```

## Key Features

✅ **No Database Dependency** - Pure processing service  
✅ **Stateless** - No data storage  
✅ **LLM Integration** - Uses Groq for AI processing  
✅ **OCR Support** - PDF and image processing  
✅ **NSQF Framework** - Aligned with Indian qualification framework  
✅ **Proper Structure** - Modular, maintainable codebase  

## Testing

```bash
# Health check
curl http://localhost:8000/health

# Test OCR (from backend)
curl -X POST http://localhost:8000/process-ocr \
  -F "file=@certificate.pdf" \
  -F "learner_email=user@example.com" \
  -F "certificate_title=Python Course" \
  -F "issuer_name=TechUniversity"

# Test recommendations (from backend)
curl -X POST http://localhost:8000/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "learner_email": "user@example.com",
    "certificates": [...]
  }'
```

## Technologies

- **FastAPI** - Web framework
- **Groq** - LLM API for AI processing
- **Tesseract** - OCR engine
- **PyPDF2** - PDF text extraction
- **Pillow** - Image processing
- **Pydantic** - Data validation

## Notes

- All user data fetching is done by the Node.js backend from PostgreSQL
- AI service only processes data sent to it
- No MongoDB or any database connection
- Suitable for containerization and scaling
