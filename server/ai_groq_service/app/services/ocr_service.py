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

    async def extract_certificate_number_from_text(self, text: str) -> Dict[str, Any]:
        """
        Robustly extract certificate number using regex patterns and scoring.
        Returns: {
            "certificate_number": str | None,
            "confidence": float,
            "status": "found" | "needs_review" | "not_found",
            "candidate": dict | None
        }
        """
        import re
        
        if not text:
            return {"certificate_number": None, "confidence": 0.0, "status": "not_found", "candidate": None}

        # Patterns and keywords
        CERT_KEYWORDS = [
            "certificate no", "certificate number", "cert no", "cert no.", "cert.", "certificate id",
            "credential id", "registration no", "regn no", "ref no", "serial no", "certificate #", "cert #:"
        ]

        CERT_PATTERNS = [
            re.compile(r'\b[0-9a-f]{8}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{12}\b', re.I), # UUID (e.g. 2851e07c-a5ee...)
            re.compile(r'\b[A-Z]{2,8}\-?\d{3,12}\b', re.I),     # ABC-12345 or ACTNAADO2008500-001904
            re.compile(r'\b[A-Z0-9\-]{6,40}\b', re.I),           # fallback alnum 6-40 chars, NOW WITH DASHES
            re.compile(r'\b\d{4}\/\d{2,8}\b'),                 # 2021/12345
            re.compile(r'\b\d{6,12}\b')                        # 6-12 digits
        ]

        def _keyword_nearby(context: str) -> bool:
            lc = context.lower()
            return any(kw in lc for kw in CERT_KEYWORDS)

        # Find all matches and score them
        candidates = []
        for pat in CERT_PATTERNS:
            for m in pat.finditer(text):
                val = m.group(0).strip()
                start, end = max(0, m.start() - 80), min(len(text), m.end() + 80)
                context = text[start:end]
                keyword_flag = _keyword_nearby(context)
                
                base_score = 60.0
                if keyword_flag:
                    base_score += 30.0
                if re.search(r'[A-Za-z]', val) and re.search(r'\d', val):
                    base_score += 5.0
                if '-' in val or '/' in val:
                    base_score += 3.0
                
                score = min(100.0, base_score)
                candidates.append({
                    "value": val,
                    "normalized": re.sub(r'[^A-Za-z0-9\-\/]', '', val),
                    "evidence": context,
                    "start": m.start(),
                    "end": m.end(),
                    "score": score
                })

        # Deduplicate + pick best
        uniq = {}
        for c in candidates:
            k = (c['normalized'] or c['value']).upper()
            if not k:
                continue
            if k not in uniq or c['score'] > uniq[k]['score']:
                uniq[k] = c
        
        candidate_list = sorted(uniq.values(), key=lambda x: x['score'], reverse=True)

        if not candidate_list:
             # Fallback: Look for standalone IPFS CID or Eth Hash if no regex match
             # (Preserving old fallback behavior just in case)
            ipfs_match = re.search(r"\b(Qm[a-zA-Z0-9]{44})\b", text)
            if ipfs_match:
                val = ipfs_match.group(1)
                return {"certificate_number": val, "confidence": 100.0, "status": "found", "candidate": {"value": val, "score": 100.0}}
            
            eth_match = re.search(r"\b(0x[a-fA-F0-9]{40,})\b", text)
            if eth_match:
                 val = eth_match.group(1)
                 return {"certificate_number": val, "confidence": 100.0, "status": "found", "candidate": {"value": val, "score": 100.0}}

            return {"certificate_number": None, "confidence": 0.0, "status": "not_found", "candidate": None}

        top = candidate_list[0]
        AUTO_ACCEPT = 80.0
        REVIEW_THRESHOLD = 60.0

        if top['score'] >= AUTO_ACCEPT:
            return {
                "certificate_number": top['value'],
                "confidence": top['score'],
                "status": "found",
                "candidate": top
            }
        elif top['score'] >= REVIEW_THRESHOLD:
            return {
                "certificate_number": top['value'],
                "confidence": top['score'],
                "status": "needs_review",
                "candidate": top
            }
        else:
            return {
                "certificate_number": None,
                "confidence": top['score'],
                "status": "not_found",
                "candidate": top
            }

ocr_service = OCRService()
