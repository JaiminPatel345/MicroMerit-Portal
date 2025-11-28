import logging
import json
from typing import List, Dict, Any
from app.services.groq_service import groq_service

logger = logging.getLogger(__name__)


class RecommendationService:
    """Service for generating AI-powered career recommendations"""
    
    def generate_recommendations(self, certificates: List[Dict[str, Any]]) -> dict:
        """
        Generate skill recommendations based on certificates
        Backend sends certificate data from PostgreSQL
        """
        if not certificates:
            return self._empty_recommendations()
        
        # Extract skills from all certificates
        all_skills = []
        for cert in certificates:
            if 'metadata' in cert and isinstance(cert['metadata'], dict):
                metadata = cert['metadata']
                
                # Try to get skills from different possible locations
                cert_skills = []
                
                # Check metadata.skills (direct)
                if 'skills' in metadata and isinstance(metadata['skills'], list):
                    cert_skills.extend(metadata['skills'])
                
                # Check metadata.ai_extracted.skills (nested)
                if 'ai_extracted' in metadata and isinstance(metadata['ai_extracted'], dict):
                    ai_skills = metadata['ai_extracted'].get('skills', [])
                    if isinstance(ai_skills, list):
                        cert_skills.extend(ai_skills)
                
                # Handle skill objects with 'name' and 'confidence'
                cleaned_skills = []
                for skill in cert_skills:
                    if isinstance(skill, dict):
                        cleaned_skills.append(skill.get('name', ''))
                    elif isinstance(skill, str):
                        cleaned_skills.append(skill)
                
                all_skills.extend([s for s in cleaned_skills if s])
        
        # Deduplicate skills
        unique_skills = list(set(all_skills))
        
        logger.info(f"Extracted {len(unique_skills)} unique skills from {len(certificates)} certificates: {unique_skills}")
        
        # If no skills found, try to generate from certificate titles
        if not unique_skills:
            logger.info("No skills found in metadata, attempting to generate from certificate titles")
            cert_titles = [cert.get('certificate_title', '') for cert in certificates if cert.get('certificate_title')]
            
            if not cert_titles:
                logger.warning("No certificate titles available, returning empty recommendations")
                return self._empty_recommendations()
            
            # Generate recommendations based on certificate titles using AI
            return self._generate_from_titles(cert_titles, certificates)
        
        # Generate recommendations using LLM
        try:
            prompt = self._build_recommendation_prompt(unique_skills, certificates)
            messages = [
                {"role": "system", "content": "You are an AI career advisor. You MUST respond ONLY with valid JSON. Do not include any text before or after the JSON."},
                {"role": "user", "content": prompt}
            ]
            
            response = groq_service.chat_completion(messages, temperature=0.3, use_json_mode=True)
            
            if response:
                # Clean up the response - remove markdown code blocks if present
                cleaned_response = response.strip()
                if cleaned_response.startswith('```json'):
                    cleaned_response = cleaned_response[7:]
                if cleaned_response.startswith('```'):
                    cleaned_response = cleaned_response[3:]
                if cleaned_response.endswith('```'):
                    cleaned_response = cleaned_response[:-3]
                cleaned_response = cleaned_response.strip()
                
                logger.info(f"AI Response (first 200 chars): {cleaned_response[:200]}")
                
                try:
                    recommendations = json.loads(cleaned_response)
                    recommendations['source'] = 'groq'
                    recommendations['confidence'] = 0.9
                    return recommendations
                except json.JSONDecodeError as je:
                    logger.error(f"JSON decode error: {je}, Response: {cleaned_response[:500]}")
                    return self._empty_recommendations()
            else:
                return self._empty_recommendations()
                
        except Exception as e:
            logger.error(f"Recommendation generation error: {e}")
            return self._empty_recommendations()
    
    def _build_recommendation_prompt(self, skills: List[str], certificates: List[dict]) -> str:
        """Build prompt for LLM"""
        skills_str = ", ".join(skills)
        cert_titles = [cert.get('certificate_title', '') for cert in certificates]
        
        return f"""
Based on these verified skills from certificates: {skills_str}

Certificate titles: {", ".join(cert_titles)}

Generate career recommendations in JSON format:
{{
  "skills": [list of current skills],
  "recommended_next_skills": [
    {{
      "skill": "skill name",
      "description": "why learn this",
      "market_demand_percent": 85,
      "career_outcome": "potential role"
    }}
  ],
  "role_suggestions": [
    {{
      "role": "job role",
      "required_skills": [skills needed],
      "matched_skills": [skills user has],
      "percent_complete": 70
    }}
  ],
  "learning_path": [
    {{
      "stage": "Foundation/Intermediate/Advanced",
      "skills": [skills to learn],
      "est_time_weeks": 12
    }}
  ],
  "recommended_courses": [
    {{
      "title": "course name",
      "provider": "platform",
      "url": "https://..."
    }}
  ],
  "nsqf_level": 5,
  "nsqf_confidence": 0.85
}}

Focus on Indian job market and NSQF framework.
"""
    
    def _generate_from_titles(self, cert_titles: List[str], certificates: List[dict]) -> dict:
        """Generate recommendations when only certificate titles are available"""
        try:
            titles_str = ", ".join(cert_titles)
            prompt = f"""
Analyze these certificate titles and infer the learner's skills: {titles_str}

Based on these certificates, generate career recommendations in JSON format:
{{
  "skills": [inferred skills from certificate titles],
  "recommended_next_skills": [
    {{
      "skill": "skill name",
      "description": "why learn this",
      "market_demand_percent": 85,
      "career_outcome": "potential role"
    }}
  ],
  "role_suggestions": [
    {{
      "role": "job role",
      "required_skills": [skills needed],
      "matched_skills": [skills inferred from certificates],
      "percent_complete": 70
    }}
  ],
  "learning_path": [
    {{
      "stage": "Foundation/Intermediate/Advanced",
      "skills": [skills to learn],
      "est_time_weeks": 12
    }}
  ],
  "recommended_courses": [
    {{
      "title": "course name",
      "provider": "platform",
      "url": "https://..."
    }}
  ],
  "nsqf_level": 5,
  "nsqf_confidence": 0.7
}}

Focus on Indian job market and NSQF framework.
"""
            
            messages = [
                {"role": "system", "content": "You are an AI career advisor. You MUST respond ONLY with valid JSON. Do not include any text before or after the JSON."},
                {"role": "user", "content": prompt}
            ]
            
            response = groq_service.chat_completion(messages, temperature=0.3, use_json_mode=True)
            
            if response:
                # Clean up the response - remove markdown code blocks if present
                cleaned_response = response.strip()
                if cleaned_response.startswith('```json'):
                    cleaned_response = cleaned_response[7:]
                if cleaned_response.startswith('```'):
                    cleaned_response = cleaned_response[3:]
                if cleaned_response.endswith('```'):
                    cleaned_response = cleaned_response[:-3]
                cleaned_response = cleaned_response.strip()
                
                logger.info(f"AI Response from titles (first 200 chars): {cleaned_response[:200]}")
                
                try:
                    recommendations = json.loads(cleaned_response)
                    recommendations['source'] = 'groq-from-titles'
                    recommendations['confidence'] = 0.75
                    return recommendations
                except json.JSONDecodeError as je:
                    logger.error(f"JSON decode error from titles: {je}, Response: {cleaned_response[:500]}")
                    return self._empty_recommendations()
            else:
                return self._empty_recommendations()
                
        except Exception as e:
            logger.error(f"Title-based recommendation generation error: {e}")
            return self._empty_recommendations()
    
    def _empty_recommendations(self) -> dict:
        """Return empty recommendations structure"""
        return {
            "skills": [],
            "recommended_next_skills": [],
            "role_suggestions": [],
            "learning_path": [],
            "recommended_courses": [],
            "nsqf_level": 1,
            "nsqf_confidence": 0,
            "confidence": 0,
            "source": "none"
        }


recommendation_service = RecommendationService()
