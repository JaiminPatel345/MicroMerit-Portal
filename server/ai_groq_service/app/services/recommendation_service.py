import logging
import json
from typing import List, Dict, Any
from app.services.groq_service import groq_service
from app.services.stackability_service import stackability_service
from app.models.schemas import StackabilityRequest

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


    def generate_roadmap(self, certificates: List[Dict[str, Any]], learner_profile: Dict[str, Any] = None) -> dict:
        """
        Generate a comprehensive career roadmap based on certificates and profile.
        Includes future plans, conditional paths, and job opportunities.
        """
        try:
            skills = self._extract_skills(certificates)
            cert_titles = [cert.get('certificate_title', '') for cert in certificates]
            
            prompt = f"""
            Analyze the learner's profile and certificates to generate a detailed career roadmap.
            
            Certificates: {", ".join(cert_titles)}
            Skills: {", ".join(skills)}
            Learner Profile: {json.dumps(learner_profile) if learner_profile else "Not provided"}
            
            Generate a JSON response with the following structure:
            {{
              "current_status": "Summary of current standing",
              "future_plans": [
                {{
                  "goal": "Short-term/Long-term goal",
                  "description": "Description of the goal",
                  "timeline": "e.g., 6 months",
                  "skills_to_acquire": {{
                    "basic": ["Skill 1", "Skill 2"],
                    "intermediate": ["Skill 3", "Skill 4"],
                    "advanced": ["Skill 5", "Skill 6"]
                  }}
                }}
              ],
              "conditional_paths": [
                {{
                  "path_name": "Path A (e.g., Specialization X)",
                  "condition": "If you choose to learn X",
                  "outcome": "You become a X Specialist",
                  "next_steps": ["Step 1", "Step 2"]
                }},
                {{
                  "path_name": "Path B (e.g., Specialization Y)",
                  "condition": "If you choose to learn Y",
                  "outcome": "You become a Y Specialist",
                  "next_steps": ["Step 1", "Step 2"]
                }}
              ],
              "job_opportunities": [
                {{
                  "role": "Job Role",
                  "match_percentage": 85,
                  "missing_skills": ["Skill A", "Skill B"],
                  "salary_range": "e.g., 5-8 LPA"
                }}
              ]
            }}
            
            Focus on the Indian job market and be specific.
            """
            
            # 1. Generate core roadmap using LLM
            roadmap_response = self._call_llm(prompt)
            
            # 2. Enhance with Stackable Pathways using dedicated service
            try:
                # Find the most relevant credential (highest level or recent)
                target_cert = None
                max_level = 0
                
                for cert in certificates:
                    meta = cert.get('metadata', {}) or {}
                    
                    # Try to get level from top-level or metadata
                    level = cert.get('nsqf_level')
                    if not level:
                        level = meta.get('nos_data', {}).get('nsqf_level')
                    if not level:
                        level = meta.get('ai_extracted', {}).get('nsqf', {}).get('level')
                        
                    # Try to get QP code
                    qp_code = meta.get('nos_data', {}).get('qp_code')
                    
                    if level:
                        try:
                            lvl_int = int(float(str(level).split()[0])) # Handle "Level 4" or "4.0" strings
                            if lvl_int > max_level:
                                max_level = lvl_int
                                target_cert = cert
                        except:
                            pass
                            
                    elif qp_code and not target_cert:
                        target_cert = cert
                
                if target_cert:
                    meta = target_cert.get('metadata', {}) or {}
                    nos_data = meta.get('nos_data', {})
                    ai_data = meta.get('ai_extracted', {})
                    
                    # Get sector from top-level or metadata
                    sector = target_cert.get('sector')
                    if not sector:
                        sector = meta.get('sector')
                    if not sector:
                         sector = ai_data.get('nsqf_alignment', {}).get('job_role')

                    req = StackabilityRequest(
                        code=nos_data.get('qp_code'),
                        level=max_level if max_level > 0 else 1,
                        sector_name=sector,
                        skills=skills
                    )
                    
                    stack_result = stackability_service.generate_stackable_path(req)
                    
                    if stack_result and 'pathways' in stack_result:
                        # Map to frontend expected format
                        roadmap_response['stackable_pathways'] = []
                        for path in stack_result['pathways']:
                             roadmap_response['stackable_pathways'].append({
                                 "pathway_name": path.get('pathway_title'),
                                 "description": path.get('description', 'Progression pathway based on your current skills.'),
                                 "progress_percentage": path.get('progress_percentage', 0),
                                 "next_credential": path.get('next_credential', 'Next Level Certification'),
                                 "estimated_duration": path.get('estimated_duration', '3-6 months'),
                                 "required_skills": [
                                     {"skill": s.get('name'), "status": s.get('status')} 
                                     for s in path.get('skills', [])
                                 ]
                             })
            except Exception as e:
                logger.error(f"Failed to append stackable pathways: {e}", exc_info=True)
                pass

            return roadmap_response
            
        except Exception as e:
            logger.error(f"Roadmap generation error: {e}")
            return {}

    def generate_skill_profile(self, certificates: List[Dict[str, Any]]) -> dict:
        """
        Generate a comprehensive skill profile.
        Includes current skills, NSQF distribution, and ready-to-apply jobs.
        """
        try:
            skills = self._extract_skills(certificates)
            cert_titles = [cert.get('certificate_title', '') for cert in certificates]
            
            # Extract standards data (QP, NOS, NSQF)
            standards_data = []
            for cert in certificates:
                meta = cert.get('metadata', {})
                # Ensure meta is a dict
                if isinstance(meta, str):
                    import json
                    try:
                        meta = json.loads(meta)
                    except:
                        meta = {}
                
                nos_data = meta.get('nos_data', {})
                qp_code = nos_data.get('qp_code')
                
                ai_data = meta.get('ai_extracted', {})
                nsqf_level = ai_data.get('nsqf_alignment', {}).get('nsqf_level') or ai_data.get('nsqf', {}).get('level')
                
                if qp_code or nsqf_level:
                    info = f"{cert.get('certificate_title')}: "
                    parts = []
                    if qp_code: parts.append(f"QP Code: {qp_code}")
                    if nsqf_level: parts.append(f"NSQF Level: {nsqf_level}")
                    info += ", ".join(parts)
                    standards_data.append(info)
            
            standards_context = "; ".join(standards_data)

            prompt = f"""
            Analyze the certificates and their official standards data to generate a comprehensive skill profile.
            
            Certificates: {", ".join(cert_titles)}
            Standards Data: {standards_context}
            Skills: {", ".join(skills)}
            
            Generate a JSON response with the following structure:
            {{
              "current_skills": [
                {{
                  "skill": "Skill Name",
                  "proficiency": 85,
                  "category": "Technical/Soft/Domain",
                  "verified_by": "Issuer Name"
                }}
              ],
              "ready_to_apply_jobs": [
                {{
                  "role": "Job Role",
                  "match_percentage": 90,
                  "salary_range": "e.g., 4-6 LPA",
                  "matching_skills": ["Skill A", "Skill B"]
                }}
              ],
              "field_analysis": {{
                "current_field": "Inferred Field (e.g. Automotive Manufacturing)",
                "achievable_roles": [
                    {{
                        "role": "Senior Technician",
                        "gap_description": "You are at Level 4. To reach Level 5, you need...",
                        "missing_skills": ["Advanced Diagnostics", "Team Management"],
                        "estimated_time": "3-6 Months"
                    }}
                ]
              }},
              "comprehensive_view": "A summary paragraph of the learner's skill set."
            }}
            
            IMPORTANT: 
            1. Use the Standards Data (QP Codes, NSQF Levels) to precisely identify the learner's current field and level.
            2. Suggest roles that are the official next step in that specific field (e.g. if Level 4, suggest Level 5).
            3. Focus on the Indian job market.
            """
            
            return self._call_llm(prompt)
            
        except Exception as e:
            logger.error(f"Skill profile generation error: {e}")
            return {}

    def enrich_credential_metadata(self, certificate_title: str, nos_data: Dict[str, Any] = None) -> dict:
        """
        Generate job-related metadata for a specific credential.
        """
        try:
            prompt = f"""
            Generate job-related metadata for the certificate: "{certificate_title}".
            NOS Data (if any): {json.dumps(nos_data) if nos_data else "None"}
            
            Generate a JSON response with:
            {{
              "related_job_roles": ["Role 1", "Role 2"],
              "industry_demand": "High/Medium/Low",
              "avg_salary_range": "e.g., 3-5 LPA",
              "top_skills_gained": ["Skill 1", "Skill 2"],
              "job_recommendation": "A specific job recommendation based on this certificate."
            }}
            
            Focus on the Indian job market.
            """
            
            return self._call_llm(prompt)
            
        except Exception as e:
            logger.error(f"Credential enrichment error: {e}")
            return {}

    def _extract_skills(self, certificates: List[Dict[str, Any]]) -> List[str]:
        all_skills = []
        for cert in certificates:
            if 'metadata' in cert and isinstance(cert['metadata'], dict):
                metadata = cert['metadata']
                if 'skills' in metadata and isinstance(metadata['skills'], list):
                    all_skills.extend(metadata['skills'])
                if 'ai_extracted' in metadata and isinstance(metadata['ai_extracted'], dict):
                    ai_skills = metadata['ai_extracted'].get('skills', [])
                    if isinstance(ai_skills, list):
                        all_skills.extend(ai_skills)
        
        # Deduplicate and clean
        cleaned_skills = []
        for skill in all_skills:
            if isinstance(skill, dict):
                cleaned_skills.append(skill.get('name', ''))
            elif isinstance(skill, str):
                cleaned_skills.append(skill)
        
        return list(set([s for s in cleaned_skills if s]))

    def _call_llm(self, prompt: str) -> dict:
        messages = [
            {"role": "system", "content": "You are an AI career advisor. You MUST respond ONLY with valid JSON."},
            {"role": "user", "content": prompt}
        ]
        response = groq_service.chat_completion(messages, temperature=0.3, use_json_mode=True)
        if response:
            try:
                # Clean up response
                cleaned = response.strip()
                if cleaned.startswith('```json'): cleaned = cleaned[7:]
                if cleaned.startswith('```'): cleaned = cleaned[3:]
                if cleaned.endswith('```'): cleaned = cleaned[:-3]
                return json.loads(cleaned.strip())
            except json.JSONDecodeError:
                logger.error("JSON decode error in _call_llm")
                return {}
        return {}

recommendation_service = RecommendationService()
