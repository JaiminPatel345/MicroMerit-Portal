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
            logger.info(f"Attempting PDF text extraction, file size: {len(file_bytes)} bytes")
            pdf_reader = PdfReader(BytesIO(file_bytes))
            page_count = len(pdf_reader.pages)
            logger.info(f"PDF has {page_count} page(s)")
            
            text = ""
            for idx, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                    logger.debug(f"Page {idx + 1}: extracted {len(page_text)} characters")
                else:
                    logger.warning(f"Page {idx + 1}: no text extracted (possible scanned image)")
            
            extracted_length = len(text.strip())
            logger.info(f"PDF extraction complete: {extracted_length} total characters")
            
            if extracted_length > 0:
                logger.debug(f"First 100 chars: {text.strip()[:100]}")
            
            return text.strip()
        except Exception as e:
            logger.error(f"PDF extraction error: {e}", exc_info=True)
            raise
    
    def extract_text_from_image(self, file_bytes: bytes) -> str:
        """Extract text from image using Tesseract OCR"""
        try:
            logger.info(f"Attempting image OCR, file size: {len(file_bytes)} bytes")
            image = Image.open(BytesIO(file_bytes))
            logger.info(f"Image opened: {image.format}, size: {image.size}, mode: {image.mode}")
            
            text = pytesseract.image_to_string(image)
            extracted_length = len(text.strip())
            logger.info(f"OCR extraction complete: {extracted_length} characters")
            
            if extracted_length > 0:
                logger.debug(f"First 100 chars: {text.strip()[:100]}")
            else:
                logger.warning("OCR returned empty text - possible blank image or poor quality")
            
            return text.strip()
        except Exception as e:
            logger.error(f"Image OCR error: {e}", exc_info=True)
            raise
    
    def extract_text(self, file_bytes: bytes, filename: str) -> str:
        """
        Extract text from file (auto-detect type)
        """
        filename_lower = filename.lower()
        logger.info(f"Processing file: {filename}, size: {len(file_bytes)} bytes")
        
        if filename_lower.endswith('.pdf'):
            logger.info("Detected file type: PDF")
            return self.extract_text_from_pdf(file_bytes)
        elif any(filename_lower.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp']):
            logger.info(f"Detected file type: Image ({filename_lower.split('.')[-1]})")
            return self.extract_text_from_image(file_bytes)
        else:
            logger.error(f"Unsupported file type: {filename}")
            raise ValueError(f"Unsupported file type: {filename}")


ocr_service = OCRService()
