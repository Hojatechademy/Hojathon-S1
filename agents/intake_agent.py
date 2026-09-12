"""
SahayAI - Agent 1: Intake Agent (ഇൻടേക്ക് ഏജന്റ്)
Extracts normalized socio-economic profile from colloquial Malayalam voice or text.
"""

from typing import Dict, Any, Optional
from core.state import CitizenProfile
from core.gemini_client import GeminiService


class IntakeAgent:
    def __init__(self, gemini_service: Optional[GeminiService] = None):
        self.gemini = gemini_service or GeminiService()

    def process_citizen_input(self, raw_text: str, modality: str = "text") -> CitizenProfile:
        """
        Parses colloquial input (Malayalam script, Manglish, or English)
        and extracts a structured CitizenProfile.
        """
        prompt = f"""
You are the expert Intake Agent for SahayAI Kerala (സഹായ് AI).
A citizen in Kerala has provided the following statement via {modality}:

\"\"\"{raw_text}\"\"\"

Analyze their statement and extract their socio-economic attributes into a strict JSON object with this structure:
{{
    "name": "Full Name in English",
    "age": integer or 35,
    "gender": "Male" / "Female" / "Other",
    "state": "Kerala",
    "district": "One of Kerala's 14 districts (e.g. Wayanad, Ernakulam, Alappuzha, Thrissur, etc.)",
    "urban_rural": "Urban" / "Rural",
    "occupation": "farmer / street vendor / student / senior citizen / unorganized worker / fisherman",
    "annual_income": float (in INR),
    "income_category": "BPL" / "EWS" / "General",
    "caste_category": "General" / "OBC" / "SC" / "ST",
    "landholding_acres": float (e.g. 1.8, 0.0),
    "has_girl_child": boolean,
    "family_members_count": integer,
    "disability_status": boolean,
    "intent": "scheme_discovery" / "grievance_petition" / "scholarship",
    "confidence_score": float between 0.8 and 1.0,
    "detected_language": "Malayalam (മലയാളം)" / "Manglish" / "English"
}}
Ensure the response is valid JSON without explanation.
"""
        extracted = self.gemini.generate_json(
            prompt=prompt,
            system_instruction="You are an empathetic, highly accurate civic intake officer for the Government of Kerala / Akshaya Project."
        )

        # Merge raw input & create typed model
        extracted["raw_input"] = raw_text
        profile = CitizenProfile(**extracted)
        return profile
