from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class SkillExtraction(BaseModel):
    """Individual skill extracted from certificate"""
    name: str = Field(description="Skill name (e.g., 'Python', 'Docker', 'AWS')")
    category: str = Field(description="Skill category (e.g., 'Programming', 'DevOps', 'Cloud')")
    proficiency_level: Optional[str] = Field(
        None, 
        description="Proficiency level if mentioned (Beginner/Intermediate/Advanced/Expert)"
    )
    confidence: float = Field(ge=0.0, le=1.0, description="AI confidence score for this skill")


class NSQFLevel(BaseModel):
    """NSQF (National Skills Qualification Framework) level assessment"""
    level: int = Field(ge=1, le=10, description="NSQF level (1-10)")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence in NSQF assessment")
    reasoning: Optional[str] = Field(None, description="Why this NSQF level was assigned")


class CertificateMetadata(BaseModel):
    """Additional certificate information extracted"""
    course_name: Optional[str] = None
    duration: Optional[str] = None
    completion_date: Optional[str] = None
    grade_or_score: Optional[str] = None
    certificate_number: Optional[str] = None


class NSQFAlignment(BaseModel):
    """Alignment with NSQF standards"""
    aligned: bool = Field(description="Whether the certificate aligns with NSQF standards")
    job_role: Optional[str] = Field(None, description="Job role name from NSQF knowledge base")
    qp_code: Optional[str] = Field(None, description="Qualification Pack code if aligned")
    nos_code: Optional[str] = Field(None, description="National Occupational Standards code if aligned")
    nsqf_level: Optional[int] = Field(None, description="NSQF level (1-10)")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence in alignment")
    reasoning: Optional[str] = Field(None, description="Reasoning for alignment or non-alignment")


class OCRResponse(BaseModel):
    """Complete OCR processing response"""
    extracted_text: str = Field(description="Full text extracted from certificate")
    
    skills: List[SkillExtraction] = Field(
        description="List of skills identified in the certificate"
    )
    
    nsqf: NSQFLevel = Field(
        description="NSQF level assessment"
    )
    
    nsqf_alignment: Optional[NSQFAlignment] = Field(
        None,
        description="Alignment with specific NSQF QP/NOS"
    )
    
    keywords: List[str] = Field(
        description="Important keywords for searchability (technical terms, domains, tools)"
    )
    
    certificate_metadata: CertificateMetadata = Field(
        description="Additional certificate information"
    )
    
    description: Optional[str] = Field(
        None,
        description="Brief description of what the certificate is about"
    )


class RecommendedSkill(BaseModel):
    skill: str
    description: str
    market_demand_percent: int
    career_outcome: str


class RoleSuggestion(BaseModel):
    role: str
    required_skills: List[str]
    matched_skills: List[str]
    percent_complete: int


class LearningStage(BaseModel):
    stage: str
    skills: List[str]
    est_time_weeks: int


class CourseRecommendation(BaseModel):
    title: str
    provider: str
    url: str


class RecommendationRequest(BaseModel):
    learner_email: str
    certificates: List[dict]


class RecommendationResponse(BaseModel):
    skills: List[str]
    recommended_next_skills: List[RecommendedSkill]
    role_suggestions: List[RoleSuggestion]
    learning_path: List[LearningStage]
    recommended_courses: List[CourseRecommendation]
    nsqf_level: int
    nsqf_confidence: float
    confidence: float
    source: str


class EmployerChatRequest(BaseModel):
    """Request for employer chatbot to query learner skills"""
    learner_email: str
    question: str = Field(
        description="Employer's question (e.g., 'Does this candidate have Docker and AWS skills?')"
    )


class EmployerChatResponse(BaseModel):
    """Response from employer chatbot"""
    answer: str = Field(description="Natural language answer to the question")
    relevant_skills: List[SkillExtraction] = Field(
        description="Skills relevant to the question"
    )
    certificates_referenced: List[str] = Field(
        description="Certificate titles that were referenced in the answer"
    )
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence in the answer")


class StackabilityRequest(BaseModel):
    code: Optional[str] = Field(None, description="Qualification Code")
    level: Optional[float] = Field(None, description="NSQF Level")
    progression_pathway: Optional[str] = Field(None, description="Progression Pathway text")
    qualification_type: Optional[str] = Field(None, description="Qualification Type")
    sector_name: Optional[str] = Field(None, description="Sector Name")
    training_delivery_hours: Optional[str] = Field(None, description="Training Delivery Hours")
    min_notational_hours: Optional[float] = Field(None, description="Min Notational Hours")
    max_notational_hours: Optional[float] = Field(None, description="Max Notational Hours")
    proposed_occupation: Optional[str] = Field(None, description="Proposed Occupation")
    skills: List[str] = Field(default=[], description="List of current skills")


class PathwaySkill(BaseModel):
    name: str = Field(description="Name of the skill")
    credits_earned: int = Field(description="Credits earned by learner")
    credits_total: int = Field(description="Total credits required for this skill")
    status: str = Field(description="completed, in_progress, or missing")


class StackablePathwayReport(BaseModel):
    pathway_title: str = Field(description="Title of the pathway (e.g. 'Full Stack Developer')")
    progress_percentage: int = Field(description="Overall completion percentage")
    skills: List[PathwaySkill] = Field(description="Breakdown of skills in this pathway")


class StackabilityResponse(BaseModel):
    """Response containing list of potential pathways"""
    pathways: List[StackablePathwayReport]
