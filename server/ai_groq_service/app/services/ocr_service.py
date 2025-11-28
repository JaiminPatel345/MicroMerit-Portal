import logging
from typing import List, Dict, Any
from io import BytesIO
from PIL import Image
import pytesseract
from PyPDF2 import PdfReader

logger = logging.getLogger(__name__)


class OCRService:
    """Service for OCR processing of certificates"""
    
    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        """Extract text from PDF file"""
        try:
            pdf_reader = PdfReader(BytesIO(file_bytes))
            text = ""
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
            raise
    
    def extract_text_from_image(self, file_bytes: bytes) -> str:
        """Extract text from image using Tesseract OCR"""
        try:
            image = Image.open(BytesIO(file_bytes))
            text = pytesseract.image_to_string(image)
            return text.strip()
        except Exception as e:
            logger.error(f"Image OCR error: {e}")
            raise
    
    def extract_text(self, file_bytes: bytes, filename: str) -> str:
        """
        Extract text from file (auto-detect type)
        """
        filename_lower = filename.lower()
        
        if filename_lower.endswith('.pdf'):
            return self.extract_text_from_pdf(file_bytes)
        elif any(filename_lower.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp']):
            return self.extract_text_from_image(file_bytes)
        else:
            raise ValueError(f"Unsupported file type: {filename}")


ocr_service = OCRService()
