import logging
import json
from app.services.groq_service import groq_service
from app.models.schemas import StackabilityRequest

logger = logging.getLogger(__name__)

class StackabilityService:
    """Service for analyzing stackable pathways using NSQF data and user skills"""

    def generate_stackable_path(self, request: StackabilityRequest) -> dict:
        try:
            # Construct context from request
            context = {
                "qualification_code": request.code,
                "nsqf_level": request.level,
                "progression_pathway": request.progression_pathway,
                "qualification_type": request.qualification_type,
                "sector": request.sector_name,
                "training_hours": request.training_delivery_hours,
                "notational_hours": f"{request.min_notational_hours}-{request.max_notational_hours}",
                "proposed_occupation": request.proposed_occupation,
                "learner_skills": request.skills
            }

            prompt = f"""
            Analyze the learner's current skills against the requirements for relevant NSQF job roles/pathways based on the input qualification.
            
            Input Qualification Context:
            {json.dumps(context, indent=2)}
            
            Task:
            1. Identify 1-3 relevant "Stackable Pathways".
            2. For each pathway, break down the required skills.
            3. Compare learner's skills to these requirements.
            4. Assign "credits" (arbitrary units, e.g., 1-5) to each skill based on complexity. 
            5. Mark status as "completed" (if learner has it), "missing" (if not), or "in_progress".
            
            Generate a JSON response with this EXACT structure:
            {{
              "pathways": [
                {{
                  "pathway_title": "Title (e.g. Full Stack Developer - NSQF Level 5)",
                  "description": "Brief description of this career progression...",
                  "next_credential": "Name of the next logical certification",
                  "estimated_duration": "Estimated time to complete (e.g. 3-6 months)",
                  "progress_percentage": 50,
                  "skills": [
                    {{ "name": "Skill A", "credits_earned": 2, "credits_total": 2, "status": "completed" }},
                    {{ "name": "Skill B", "credits_earned": 0, "credits_total": 4, "status": "missing" }}
                  ]
                }}
              ]
            }}
            
            Focus on the Indian job market context.
            """
            
            messages = [
                {"role": "system", "content": "You are an expert in the National Skills Qualification Framework (NSQF). Provide structured JSON output matching the requested schema exactly."},
                {"role": "user", "content": prompt}
            ]
            
            response = groq_service.chat_completion(messages, temperature=0.3, use_json_mode=True)
            
            if response:
                cleaned = response.strip()
                if cleaned.startswith('```json'): cleaned = cleaned[7:]
                if cleaned.startswith('```'): cleaned = cleaned[3:]
                if cleaned.endswith('```'): cleaned = cleaned[:-3]
                return json.loads(cleaned.strip())
            
            return {"pathways": []}

        except Exception as e:
            logger.error(f"Stackability analysis failed: {e}")
            raise

stackability_service = StackabilityService()
