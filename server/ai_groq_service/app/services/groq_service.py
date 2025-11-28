import os
import logging
from groq import Groq
from typing import Optional

logger = logging.getLogger(__name__)


class GroqService:
    """Service for interacting with Groq LLM"""
    
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        # Use llama-3.3-70b-versatile - best for structured JSON output
        self.model_name = os.getenv("MODEL_NAME", "llama-3.3-70b-versatile")
        self.mock_mode = os.getenv("MOCK_MODE", "false").lower() == "true"
        self.timeout = float(os.getenv("GROQ_TIMEOUT_SECONDS", 30))
        
        # Debug logging
        logger.info(f"GROQ_API_KEY present: {bool(self.api_key)}")
        logger.info(f"Model: {self.model_name}, Mock mode: {self.mock_mode}")
        
        self.client = Groq(api_key=self.api_key) if (not self.mock_mode and self.api_key) else None
        
        if self.mock_mode:
            logger.warning("Running in MOCK MODE - no real API calls will be made")
        elif not self.api_key:
            logger.warning("No GROQ_API_KEY found - running without AI capabilities")
    
    def chat_completion(self, messages: list, temperature: float = 0.3) -> Optional[str]:
        """
        Send messages to Groq LLM and get response
        """
        if self.mock_mode or not self.client:
            return self._mock_response()
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=temperature,
                timeout=self.timeout
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            raise
    
    def _mock_response(self) -> str:
        """Mock response for testing without API key"""
        return '{"skills": ["Python", "Data Analysis"], "next_skills": [], "roles": [], "path": [], "courses": [], "nsqf": 4}'


groq_service = GroqService()
