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
        issuer_name: str
    ) -> Dict[str, Any]:
        """
        Extract skills, NSQF level, keywords, and metadata from certificate text
        
        Args:
            extracted_text: Full text extracted from certificate via OCR
            certificate_title: Title of the certificate
            issuer_name: Name of the issuing organization
            
        Returns:
            Dictionary with skills, nsqf, keywords, and metadata
        """
        try:
            prompt = self._build_extraction_prompt(extracted_text, certificate_title, issuer_name)
            
            messages = [
                {
                    "role": "system", 
                    "content": "You are an expert at extracting structured data from educational certificates. Always return valid JSON."
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
            "keywords": keywords,
            "certificate_metadata": cert_metadata,
            "description": description
        }
    
    def _build_extraction_prompt(
        self, 
        text: str, 
        title: str, 
        issuer: str
    ) -> str:
        """Build the prompt for Groq LLM"""
        
        # Limit text to first 3000 characters to avoid token limits
        text_preview = text[:3000] if len(text) > 3000 else text
        
        return f"""
Extract skills, NSQF level, and keywords from this certificate. Return ONLY valid JSON, no extra text.

Certificate:
Title: {title}
Issuer: {issuer}
Text: {text_preview}

Return JSON in this EXACT format:
{{
  "skills": [
    {{
      "name": "Python",
      "category": "Programming Languages",
      "proficiency_level": "Intermediate",
      "confidence": 0.95
    }},
    {{
      "name": "Data Analysis",
      "category": "Data Science",
      "proficiency_level": "Beginner",
      "confidence": 0.85
    }}
  ],
  "nsqf": {{
    "level": 5,
    "confidence": 0.85,
    "reasoning": "Certificate covers intermediate programming with practical applications"
  }},
  "keywords": ["python", "programming", "data", "analysis", "coding"],
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
3. keywords: Array of lowercase strings for search
4. certificate_metadata: Extract available info (all fields optional)
5. description: Brief 1-2 sentence summary

Categories: Programming Languages, Web Development, DevOps, Cloud Computing, Database, Data Science, Mobile Development, Security, Testing, Project Management

Proficiency levels: Beginner, Intermediate, Advanced, Expert

NSQF levels (Indian framework):
- Level 1-2: Basic skills
- Level 3-4: Certificate/competency level
- Level 5-6: Diploma/advanced certificate
- Level 7-8: Bachelor's degree
- Level 9-10: Master's/research level

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
            "keywords": [],
            "certificate_metadata": {},
            "description": ""
        }


skill_extraction_service = SkillExtractionService()
