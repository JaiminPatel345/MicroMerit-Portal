import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# ===== CRITICAL: Load .env BEFORE any other imports =====
# Get the directory where this file is located
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from .env file in the same directory
env_path = BASE_DIR / '.env'
load_dotenv(dotenv_path=env_path)
# =========================================================

# Now import after .env is loaded
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.ai_routes import router as ai_router

# Log whether .env was found
logger = logging.getLogger(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger.info(f".env file path: {env_path}")
logger.info(f".env file exists: {env_path.exists()}")
logger.info(f"Current working directory: {os.getcwd()}")
logger.info("=" * 50)
logger.info("Environment Variables:")
logger.info(f"  GROQ_API_KEY: {'*' * 20 if os.getenv('GROQ_API_KEY') else 'NOT SET'}")
logger.info(f"  MODEL_NAME: {os.getenv('MODEL_NAME', 'NOT SET')}")
logger.info(f"  MOCK_MODE: {os.getenv('MOCK_MODE', 'NOT SET')}")
logger.info(f"  GROQ_TIMEOUT_SECONDS: {os.getenv('GROQ_TIMEOUT_SECONDS', 'NOT SET')}")
logger.info("=" * 50)

# Create FastAPI app
app = FastAPI(
    title="MicroMerit AI Service",
    description="AI-powered OCR and Career Recommendation Service",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(ai_router, tags=["AI"])

@app.get("/")
async def root():
    return {
        "service": "MicroMerit AI Service",
        "version": "2.0.0",
        "endpoints": {
            "health": "/health",
            "ocr": "/process-ocr (internal)",
            "recommendations": "/recommendations"
        }
    }
