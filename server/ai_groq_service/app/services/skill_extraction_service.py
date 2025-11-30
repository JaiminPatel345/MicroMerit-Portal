import logging
import json
import re
from typing import Dict, Any
from app.services.groq_service import groq_service

logger = logging.getLogger(__name__)


class SkillExtractionService:
    """Service for extracting skills and metadata from certificate text"""
    
    def extract_skills_and_metadata(
        self, 
        extracted_text: str, 
        certificate_title: str,
        issuer_name: str,
        nsqf_context: list = None
    ) -> Dict[str, Any]:
        """
        Extract skills, NSQF level, keywords, and metadata from certificate text
        
        Args:
            extracted_text: Full text extracted from certificate via OCR
            certificate_title: Title of the certificate
            issuer_name: Name of the issuing organization
            nsqf_context: List of potential NSQF matches from knowledge base
            
        Returns:
            Dictionary with skills, nsqf, keywords, and metadata
        """
        try:
            print("Extracted Text: ", extracted_text)
            print("Certificate Title: ", certificate_title)
            print("Issuer Name: ", issuer_name)
            print("NSQF Context: ", nsqf_context)
            prompt = self._build_extraction_prompt(extracted_text, certificate_title, issuer_name, nsqf_context)
            
            messages = [
                {
                    "role": "system", 
                    "content": "You are an expert at extracting structured data from educational certificates,Match this certificate to the best NSQF level, QP, NOS, and Skills, always there is potential nsqf mapping , with job roles , skiil. Always return valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            response = groq_service.chat_completion(messages, temperature=0.1)
            
            if response:
                # Clean the response - remove markdown code blocks if present
                cleaned_response = response.strip()
                if cleaned_response.startswith('```json'):
                    cleaned_response = cleaned_response[7:]
                if cleaned_response.startswith('```'):
                    cleaned_response = cleaned_response[3:]
                if cleaned_response.endswith('```'):
                    cleaned_response = cleaned_response[:-3]
                cleaned_response = cleaned_response.strip()
                
                # Parse JSON
                result = json.loads(cleaned_response)
                
                # Validate and normalize the structure
                return self._validate_and_normalize(result)
            else:
                return self._empty_extraction()
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}. Response: {response[:500] if response else 'None'}")
            return self._empty_extraction()
        except Exception as e:
            logger.error(f"Skill extraction error: {e}")
            return self._empty_extraction()
    
    def _validate_and_normalize(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and normalize the extracted data structure"""
        
        # Ensure skills is a list of dicts
        skills = data.get('skills', [])
        if isinstance(skills, list) and len(skills) > 0:
            # If skills are just strings, convert to proper format
            if isinstance(skills[0], str):
                skills = [
                    {
                        "name": skill,
                        "category": "General",
                        "proficiency_level": None,
                        "confidence": 0.7
                    }
                    for skill in skills
                ]
        
        # Ensure nsqf is a dict
        nsqf = data.get('nsqf', {})
        if isinstance(nsqf, (int, float)):
            nsqf = {
                "level": int(nsqf),
                "confidence": 0.7,
                "reasoning": f"Assessed as NSQF level {nsqf}"
            }
        elif not isinstance(nsqf, dict):
            nsqf = {"level": 1, "confidence": 0.0, "reasoning": "Could not assess"}
        
        # Ensure nsqf has required fields
        if 'level' not in nsqf:
            nsqf['level'] = 1
        if 'confidence' not in nsqf:
            nsqf['confidence'] = 0.0
        if 'reasoning' not in nsqf:
            nsqf['reasoning'] = ""
            
        # Ensure nsqf_alignment is a dict if present
        nsqf_alignment = data.get('nsqf_alignment', None)
        if nsqf_alignment and not isinstance(nsqf_alignment, dict):
            nsqf_alignment = None
        
        # Ensure keywords is a list of strings
        keywords = data.get('keywords', [])
        if not isinstance(keywords, list):
            keywords = []
        keywords = [str(k).lower() for k in keywords if k]
        
        # Ensure certificate_metadata is a dict
        cert_metadata = data.get('certificate_metadata', {})
        if not isinstance(cert_metadata, dict):
            cert_metadata = {}
        
        # Ensure description is a string
        description = data.get('description', '')
        if not isinstance(description, str):
            description = ''
        
        return {
            "skills": skills,
            "nsqf": nsqf,
            "nsqf_alignment": nsqf_alignment,
            "keywords": keywords,
            "certificate_metadata": cert_metadata,
            "description": description
        }
    
    def _build_extraction_prompt(
        self, 
        text: str, 
        title: str, 
        issuer: str,
        nsqf_context: list = None
    ) -> str:
        """Build the prompt for Groq LLM"""
        
        # Limit text to first 3000 characters to avoid token limits
        text_preview = text[:3000] if len(text) > 3000 else text
        
        # Format NSQF context if available
        context_str = ""
        if nsqf_context and len(nsqf_context) > 0:
            context_str = "Potential NSQF Matches (use these to determine alignment):\n"
            for item in nsqf_context[:5]:  # Limit to top 5 matches
                qp_code = item.get('qp_code', 'N/A')
                job_role = item.get('job_role', 'N/A')
                level = item.get('nsqf_level', 'N/A')
                desc = item.get('description', '')[:100]
                context_str += f"- QP Code: {qp_code}, Role: {job_role}, Level: {level}, Desc: {desc}\n"
        
        return f"""
Extract skills, NSQF level, and keywords from this certificate. Return ONLY valid JSON, no extra text.

Certificate:
Title: {title}
Issuer: {issuer}
Text: {text_preview}

{context_str}

Return JSON in this EXACT format:
{{
  "skills": [
    {{
      "name": "Python",
      "category": "Programming Languages",
      "proficiency_level": "Intermediate",
      "confidence": 0.95
    }}
  ],
  "nsqf": {{
    "level": 5,
    "confidence": 0.85,
    "reasoning": "Certificate covers intermediate programming with practical applications"
  }},
  "nsqf_alignment": {{
    "aligned": true,
    "qp_code": "QP123",
    "nos_code": null,
    "nsqf_level": 5,
    "confidence": 0.9,
    "reasoning": "Matches Job Role X description"
  }},
  "keywords": ["python", "programming"],
  "certificate_metadata": {{
    "course_name": "Python Programming Course",
    "duration": "3 months",
    "completion_date": "2024-01",
    "grade_or_score": "A",
    "certificate_number": "CERT123"
  }},
  "description": "Programming certificate covering Python and data analysis fundamentals"
}}

Rules:
1. skills: Array of objects with name, category, proficiency_level, confidence (0.0-1.0)
2. nsqf: Object with level (1-10), confidence (0.0-1.0), reasoning (string)
3. nsqf_alignment: Object with aligned (bool), qp_code/nos_code (string or null), nsqf_level (int), confidence (float), reasoning (string). If no strong match in context, set aligned to false.
4. keywords: Array of lowercase strings for search
5. certificate_metadata: Extract available info (all fields optional)
6. description: Brief 1-2 sentence summary

IMPORTANT: Return ONLY the JSON object, nothing else. No markdown, no explanations.
"""
    
    def _empty_extraction(self) -> Dict[str, Any]:
        """Return empty extraction when processing fails"""
        return {
            "skills": [],
            "nsqf": {
                "level": 1,
                "confidence": 0.0,
                "reasoning": "Could not assess NSQF level"
            },
            "nsqf_alignment": None,
            "keywords": [],
            "certificate_metadata": {},
            "description": ""
        }


skill_extraction_service = SkillExtractionService()
