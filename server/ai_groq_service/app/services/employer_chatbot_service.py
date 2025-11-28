import logging
import json
from typing import List, Dict, Any
from app.services.groq_service import groq_service

logger = logging.getLogger(__name__)


class EmployerChatbotService:
    """Service for employer chatbot to query learner skills"""
    
    def answer_employer_question(
        self,
        learner_email: str,
        question: str,
        learner_credentials: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Answer employer's question about learner's skills based on certificates
        
        Args:
            learner_email: Email of the learner
            question: Employer's question (e.g., "Does this candidate have Docker skills?")
            learner_credentials: List of credentials with OCR-extracted data
            
        Returns:
            Dictionary with answer, relevant skills, and confidence
        """
        try:
            if not learner_credentials:
                return {
                    "answer": f"No certificates found for {learner_email}. Cannot assess skills.",
                    "relevant_skills": [],
                    "certificates_referenced": [],
                    "confidence": 0.0
                }
            
            # Build context from all credentials
            skills_context = self._build_skills_context(learner_credentials)
            
            prompt = self._build_chatbot_prompt(question, skills_context, learner_email)
            
            messages = [
                {
                    "role": "system",
                    "content": "You are an AI assistant helping employers evaluate candidates based on their verified certificates and skills. Provide accurate, data-driven answers."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            response = groq_service.chat_completion(messages, temperature=0.3)
            
            if response:
                result = json.loads(response)
                return result
            else:
                return self._default_response(question)
                
        except Exception as e:
            logger.error(f"Employer chatbot error: {e}")
            return self._default_response(question)
    
    def _build_skills_context(self, credentials: List[Dict[str, Any]]) -> str:
        """Build context string from all credentials"""
        context_parts = []
        
        for cred in credentials:
            metadata = cred.get('metadata', {})
            
            cert_info = f"Certificate: {cred.get('certificate_title', 'Unknown')}\n"
            cert_info += f"Issuer: {metadata.get('issuer_name', 'Unknown')}\n"
            
            # Skills
            skills = metadata.get('ai_extracted', {}).get('skills', [])
            if skills:
                skill_names = [s.get('name', '') for s in skills]
                cert_info += f"Skills: {', '.join(skill_names)}\n"
            
            # Keywords
            keywords = metadata.get('ai_extracted', {}).get('keywords', [])
            if keywords:
                cert_info += f"Keywords: {', '.join(keywords)}\n"
            
            # NSQF
            nsqf = metadata.get('ai_extracted', {}).get('nsqf', {})
            if nsqf:
                cert_info += f"NSQF Level: {nsqf.get('level', 'Unknown')}\n"
            
            # Description
            description = metadata.get('ai_extracted', {}).get('description', '')
            if description:
                cert_info += f"Description: {description}\n"
            
            context_parts.append(cert_info)
        
        return "\n---\n".join(context_parts)
    
    def _build_chatbot_prompt(
        self,
        question: str,
        skills_context: str,
        learner_email: str
    ) -> str:
        """Build prompt for chatbot response"""
        
        return f"""
Based on the verified certificates and skills of candidate {learner_email}, answer this employer question:

Question: {question}

Candidate's Verified Certificates and Skills:
{skills_context}

Provide a JSON response in this format:
{{
  "answer": "Natural language answer to the employer's question. Be specific and reference certificates when applicable.",
  "relevant_skills": [
    {{
      "name": "Docker",
      "category": "DevOps",
      "proficiency_level": "Intermediate",
      "confidence": 0.95
    }}
  ],
  "certificates_referenced": ["Certificate Title 1", "Certificate Title 2"],
  "confidence": 0.95
}}

Instructions:
1. **Answer**: Provide a clear, professional answer. If the candidate has the skill, specify which certificate(s) prove it. If not, clearly state that.
2. **Relevant Skills**: List only the skills directly relevant to the question asked.
3. **Certificates Referenced**: List certificate titles that support your answer.
4. **Confidence**: Your confidence in the answer (0.0-1.0).

Examples:
- Q: "Does this candidate have Docker skills?" 
  A: "Yes, the candidate has Docker skills as evidenced by their DevOps Certificate from TechUniversity, which covers containerization and Docker deployment."

- Q: "Can this person work with AWS?"
  A: "Yes, the candidate's Cloud Computing Certificate includes AWS services and cloud deployment skills."

- Q: "Does the candidate know React?"
  A: "No, based on the available certificates, there is no evidence of React skills. The candidate's certificates focus on backend development."

Return ONLY valid JSON, no explanations.
"""
    
    def _default_response(self, question: str) -> Dict[str, Any]:
        """Default response when processing fails"""
        return {
            "answer": f"I'm unable to process the question '{question}' at this time. Please try again.",
            "relevant_skills": [],
            "certificates_referenced": [],
            "confidence": 0.0
        }


employer_chatbot_service = EmployerChatbotService()
