from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.models.schemas import (
    RecommendationRequest, 
    RecommendationResponse, 
    OCRResponse,
    EmployerChatRequest,
    EmployerChatResponse
)
from app.services.recommendation_service import recommendation_service
from app.services.ocr_service import ocr_service
from app.services.skill_extraction_service import skill_extraction_service
from app.services.employer_chatbot_service import employer_chatbot_service
from app.services.groq_service import groq_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/process-ocr", response_model=OCRResponse)
async def process_ocr(
    file: UploadFile = File(...),
    learner_email: str = Form(...),
    certificate_title: str = Form(...),
    issuer_name: str = Form(...),
    nsqf_context: str = Form(None)  # JSON string
):
    """
    Process OCR for a certificate file (called internally by backend during credential issuance)
    
    Flow:
    1. Extract all text from PDF/Image using OCR
    2. Send text to Groq AI for skill extraction
    3. AI returns: skills, NSQF level, keywords, metadata
    4. Return structured data for storage in PostgreSQL
    """
    try:
        # Read file
        file_bytes = await file.read()
        
        # Step 1: Extract text using OCR
        extracted_text = ocr_service.extract_text(file_bytes, file.filename)
        
        if not extracted_text or len(extracted_text.strip()) < 10:
            raise HTTPException(status_code=422, detail="OCR failed or empty text extracted")
        
        logger.info(f"Extracted {len(extracted_text)} characters from {file.filename}")
        
        # Parse NSQF context if provided
        parsed_context = []
        if nsqf_context:
            try:
                import json
                parsed_context = json.loads(nsqf_context)
                logger.info(f"Received NSQF context with {len(parsed_context)} items")
            except Exception as e:
                logger.warning(f"Failed to parse NSQF context: {e}")
        
        # Step 2: Extract skills, NSQF, keywords using AI
        ai_extraction = skill_extraction_service.extract_skills_and_metadata(
            extracted_text=extracted_text,
            certificate_title=certificate_title,
            issuer_name=issuer_name,
            nsqf_context=parsed_context
        )
        
        logger.info(f"Extracted {len(ai_extraction.get('skills', []))} skills and {len(ai_extraction.get('keywords', []))} keywords")
        
        # Return complete OCR response
        return {
            "extracted_text": extracted_text,
            "skills": ai_extraction.get('skills', []),
            "nsqf": ai_extraction.get('nsqf', {"level": 1, "confidence": 0.0, "reasoning": ""}),
            "nsqf_alignment": ai_extraction.get('nsqf_alignment', None),
            "keywords": ai_extraction.get('keywords', []),
            "certificate_metadata": ai_extraction.get('certificate_metadata', {}),
            "description": ai_extraction.get('description', '')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """
    Generate AI-powered recommendations
    Backend sends certificate data from PostgreSQL
    """
    try:
        recommendations = recommendation_service.generate_recommendations(request.certificates)
        return recommendations
    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/employer-chat", response_model=EmployerChatResponse)
async def employer_chat(request: EmployerChatRequest):
    """
    Employer chatbot endpoint for querying learner skills
    
    Example questions:
    - "Does this candidate have Docker skills?"
    - "Can this person work with AWS and Kubernetes?"
    - "What cloud platforms does the candidate know?"
    
    The chatbot will:
    1. Receive learner credentials from backend (with OCR-extracted data)
    2. Use AI to answer employer's question
    3. Reference specific certificates and skills
    4. Provide confidence score
    """
    try:
        # Note: Backend will fetch credentials and send with request
        # For now, return placeholder - backend integration needed
        logger.info(f"Employer chat request for {request.learner_email}: {request.question}")
        
        return {
            "answer": "Backend integration needed. The employer chatbot will analyze learner certificates to answer your question.",
            "relevant_skills": [],
            "certificates_referenced": [],
            "confidence": 0.0
        }
        
    except Exception as e:
        logger.error(f"Employer chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "model": groq_service.model_name,
        "mock": groq_service.mock_mode,
        "key_loaded": groq_service.client is not None
    }
