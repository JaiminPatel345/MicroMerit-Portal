import logging
from typing import List, Dict, Any
from io import BytesIO
from PIL import Image
import pytesseract
from PyPDF2 import PdfReader
from pdf2image import convert_from_bytes
from pdf2image.exceptions import PDFInfoNotInstalledError

logger = logging.getLogger(__name__)


class OCRService:
    """Service for OCR processing of certificates"""
    
    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        """
        Extract text from PDF file. 
        Falls back to OCR (pdf2image + pytesseract) if standard extraction yields little text (scanned PDF).
        """
        text = ""
        try:
            logger.info(f"Attempting PDF text extraction, file size: {len(file_bytes)} bytes")
            pdf_reader = PdfReader(BytesIO(file_bytes))
            page_count = len(pdf_reader.pages)
            logger.info(f"PDF has {page_count} page(s)")
            
            # 1. Try Standard Text Extraction (PyPDF2)
            for idx, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            extracted_length = len(text.strip())
            logger.info(f"Standard PDF extraction yielded: {extracted_length} characters")
            
            # 2. Fallback to OCR if text is suspicious (too short for a certificate)
            if extracted_length < 50:
                logger.warning("Low text count detected. Likely a scanned PDF. Attempting OCR conversion...")
                
                try:
                    # Convert PDF pages to images
                    images = convert_from_bytes(file_bytes)
                    ocr_text = ""
                    
                    for i, image in enumerate(images):
                        logger.info(f"Processing scanned page {i+1} with OCR...")
                        page_ocr = pytesseract.image_to_string(image)
                        ocr_text += page_ocr + "\n"
                        
                    ocr_length = len(ocr_text.strip())
                    logger.info(f"OCR fallback yielded: {ocr_length} characters")
                    
                    if ocr_length > extracted_length:
                        text = ocr_text

                except PDFInfoNotInstalledError:
                    error_msg = "Poppler is not installed. Unable to process scanned PDF."
                    logger.error(error_msg)
                    # We wrap this in a way that the route handler can see it's a server config issue
                    raise Exception(f"OCR Fallback Failed: {error_msg} (Please install poppler)")
                except Exception as e:
                    logger.error(f"OCR Fallback error: {e}")
                    # Don't crash entirely if just fallback fails, return what we have
            
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

    def extract_credential_identifier(self, text: str) -> str:
        """
        Extract specific credential identifiers (Credential No, CID, Certificate No) using Regex.
        Returns the found identifier or None.
        """
        import re
        
        # Patterns to look for
        patterns = [
            r"Credential ID\s*[:#-]?\s*([A-Za-z0-9-]+)",
            r"Credential No\.?\s*[:#-]?\s*([A-Za-z0-9-]+)",
            r"CID\s*[:#-]?\s*([A-Za-z0-9]+)",
            r"Certificate No\.?\s*[:#-]?\s*([A-Za-z0-9-]+)",
            r"Cert No\.?\s*[:#-]?\s*([A-Za-z0-9-]+)",
            r"Registration No\.?\s*[:#-]?\s*([A-Za-z0-9-]+)",
            # Look for explicit hash-like or ID-like strings just labeled "No." or similar if context implies
            r"No\.?\s*[:#-]?\s*([A-Za-z0-9-]{6,})", 
        ]
        
        # Search for labeled patterns first (more reliable)
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                extract = match.group(1).strip()
                logger.info(f"Extracted identifier '{extract}' using pattern '{pattern}'")
                return extract
                
        # Fallback: Look for standalone IPFS CID (Qm...) or Eth Hash (0x...)
        # IPFS CID (Qm...)
        ipfs_match = re.search(r"\b(Qm[a-zA-Z0-9]{44})\b", text)
        if ipfs_match:
            logger.info("Extracted IPFS CID")
            return ipfs_match.group(1)
            
        # Eth Hash (0x...)
        eth_match = re.search(r"\b(0x[a-fA-F0-9]{40,})\b", text)
        if eth_match:
            logger.info("Extracted Transaction Hash")
            return eth_match.group(1)
            
        return None

ocr_service = OCRService()
