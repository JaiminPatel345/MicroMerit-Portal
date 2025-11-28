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
                cert_skills = cert['metadata'].get('skills', [])
                all_skills.extend(cert_skills)
        
        # Deduplicate skills
        unique_skills = list(set(all_skills))
        
        if not unique_skills:
            return self._empty_recommendations()
        
        # Generate recommendations using LLM
        try:
            prompt = self._build_recommendation_prompt(unique_skills, certificates)
            messages = [
                {"role": "system", "content": "You are an AI career advisor for the Indian job market."},
                {"role": "user", "content": prompt}
            ]
            
            response = groq_service.chat_completion(messages, temperature=0.3)
            
            if response:
                recommendations = json.loads(response)
                recommendations['source'] = 'groq'
                recommendations['confidence'] = 0.9
                return recommendations
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
