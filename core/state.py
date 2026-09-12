"""
SahayAI - Core State Definitions and Pydantic Models
Provides typed state representation for the tri-agent pipeline.
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from typing_extensions import TypedDict


class CitizenProfile(BaseModel):
    name: Optional[str] = Field(default=None, description="Full name of the citizen")
    age: Optional[int] = Field(default=None, description="Age in years")
    gender: Optional[str] = Field(default="Unknown", description="Male, Female, Other, or Unknown")
    state: Optional[str] = Field(default="All India", description="State or Union Territory in India")
    district: Optional[str] = Field(default=None, description="District name")
    urban_rural: Optional[str] = Field(default="Rural", description="Rural, Urban, or Semi-Urban")
    occupation: Optional[str] = Field(default=None, description="Primary occupation (e.g. farmer, street vendor, student, unorganized worker)")
    annual_income: Optional[float] = Field(default=None, description="Estimated annual household income in INR")
    income_category: Optional[str] = Field(default="BPL", description="BPL, EWS, LIG, MIG, HIG, or Unknown")
    caste_category: Optional[str] = Field(default="General", description="General, OBC, SC, ST, or Minority")
    landholding_acres: Optional[float] = Field(default=0.0, description="Agricultural landholding in acres")
    has_girl_child: Optional[bool] = Field(default=False, description="Whether the family has a girl child")
    family_members_count: Optional[int] = Field(default=4, description="Number of household members")
    disability_status: Optional[bool] = Field(default=False, description="Person with disability (PwD)")
    intent: str = Field(default="scheme_discovery", description="scheme_discovery, grievance_petition, scholarship, credit_loan, housing, healthcare")
    confidence_score: float = Field(default=0.9, description="Confidence of extraction (0.0 to 1.0)")
    raw_input: Optional[str] = Field(default="", description="Original user text or voice transcription")
    detected_language: Optional[str] = Field(default="Hindi/English", description="Detected language / vernacular")


class SchemeMatchResult(BaseModel):
    scheme_id: str
    scheme_name: str
    hindi_name: Optional[str] = None
    category: str
    ministry: Optional[str] = None
    match_score: float = Field(default=0.0, description="Match confidence score between 0 and 100")
    is_eligible: bool = Field(default=False, description="Deterministic qualification flag")
    benefit_summary: str
    benefit_amount_inr: Optional[float] = None
    matched_reasons: List[str] = Field(default_factory=list)
    unmet_reasons: List[str] = Field(default_factory=list)
    required_documents: List[str] = Field(default_factory=list)
    application_process: Optional[str] = None
    grievance_contact: Optional[str] = None


class IDCardExtraction(BaseModel):
    document_type: str = Field(default="Aadhaar Card", description="Type of document (Aadhaar, Ration Card, etc.)")
    extracted_name: Optional[str] = None
    id_number_masked: Optional[str] = None
    dob_or_age: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    father_or_husband_name: Optional[str] = None
    verification_status: str = Field(default="VERIFIED", description="VERIFIED, PARTIAL_MATCH, or MISMATCH")
    verification_notes: List[str] = Field(default_factory=list)
    confidence: float = 0.95


class FormApplicationPackage(BaseModel):
    application_id: str
    timestamp: str
    scheme_id: str
    scheme_name: str
    ministry: str
    applicant_profile: Dict[str, Any]
    verified_id_details: Dict[str, Any]
    prefilled_fields: Dict[str, str]
    declarations: List[str]
    checklist: List[str]
    submission_authority: str
    tracking_code: str
    pdf_path: Optional[str] = None


class GrievancePetition(BaseModel):
    petition_id: str
    timestamp: str
    to_authority: str
    subject: str
    aggrieved_citizen: Dict[str, Any]
    grievance_details: str
    relief_sought: str
    legal_references: List[str]
    tracking_portal: str
    pdf_path: Optional[str] = None


class VernacularSummary(BaseModel):
    language: str
    headline: str
    spoken_summary_script: str
    bullet_action_points: List[str]
    nearest_helpdesk: str


class SahayAgentState(TypedDict, total=False):
    session_id: str
    raw_input: str
    input_modality: str  # "voice" or "text"
    citizen_profile: Optional[Dict[str, Any]]
    matched_schemes: List[Dict[str, Any]]
    selected_scheme_id: Optional[str]
    document_image_bytes: Optional[bytes]
    document_image_path: Optional[str]
    document_mime_type: Optional[str]  # "image/png", "image/jpeg", or "application/pdf"
    extracted_id: Optional[Dict[str, Any]]
    application_package: Optional[Dict[str, Any]]
    grievance_petition: Optional[Dict[str, Any]]
    vernacular_summary: Optional[Dict[str, Any]]
    audit_logs: List[str]
    current_step: str
