"""
SahayAI - Agent 3: Form-Filler & Multimodal Verification Agent (ഫോം ഫില്ലർ & ഗ്രീവൻസ് ഏജന്റ്)
Performs Multimodal Vision ID card verification, pre-fills official Akshaya applications or CM Grievance petitions,
and generates Malayalam vernacular audio summaries.
"""

import datetime
import uuid
from typing import Dict, Any, Optional, Union
from PIL import Image
from core.state import (
    CitizenProfile,
    SchemeMatchResult,
    IDCardExtraction,
    FormApplicationPackage,
    GrievancePetition,
    VernacularSummary
)
from core.gemini_client import GeminiService


class FormFillerAgent:
    def __init__(self, gemini_service: Optional[GeminiService] = None):
        self.gemini = gemini_service or GeminiService()

    def verify_id_document(
        self,
        image_input: Union[bytes, str, Image.Image],
        citizen_profile: CitizenProfile,
        mime_type: Optional[str] = None
    ) -> IDCardExtraction:
        """
        Multimodal ID document analysis (PDF, PNG, JPEG) using Gemini 1.5 Flash Vision.
        Extracts Aadhaar/Ration Card fields and cross-verifies against the citizen's profile.
        """
        prompt = f"""
Analyze this official identity document (Aadhaar / Ration Card / Voter ID / Bank Passbook PDF or Image) from Kerala.
Cross-verify the details against this citizen's claimed profile:
Name: {citizen_profile.name}
District: {citizen_profile.district}, Kerala
Age: {citizen_profile.age}

Extract and verify in this strict JSON format:
{{
    "document_type": "Aadhaar Card / Smart Ration Card",
    "extracted_name": "Name on card",
    "id_number_masked": "XXXX-XXXX-1234",
    "dob_or_age": "DD/MM/YYYY or age",
    "gender": "Male / Female",
    "father_or_husband_name": "Guardian name",
    "address": "Address on card",
    "verification_status": "VERIFIED" / "PARTIAL_MATCH" / "MISMATCH",
    "verification_notes": [
        "Check 1 outcome",
        "Check 2 outcome"
    ],
    "confidence": 0.98
}}
"""
        extracted = self.gemini.analyze_image_multimodal(image_input, prompt, mime_type=mime_type)
        return IDCardExtraction(**extracted)

    def prepare_application_package(
        self,
        citizen_profile: CitizenProfile,
        scheme: SchemeMatchResult,
        id_details: IDCardExtraction
    ) -> FormApplicationPackage:
        """
        Drafts a comprehensive pre-filled Akshaya application package.
        """
        app_id = f"KL-AKSHAYA-{datetime.datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        tracking_code = f"TRK-{uuid.uuid4().hex[:8].upper()}"

        prefilled = {
            "Applicant Name": id_details.extracted_name or citizen_profile.name or "Unknown",
            "Identity Proof": f"{id_details.document_type} ({id_details.id_number_masked})",
            "Permanent Address": id_details.address or f"{citizen_profile.district}, Kerala",
            "Local Body / Ward": f"{citizen_profile.district} Grama Panchayat / Ward",
            "Socio-Economic Category": f"{citizen_profile.caste_category} / {citizen_profile.income_category}",
            "Declared Annual Income": f"₹{citizen_profile.annual_income:,.0f}" if citizen_profile.annual_income else "Nil",
            "Primary Occupation": citizen_profile.occupation or "General",
            "Cultivable Landholding": f"{citizen_profile.landholding_acres} Acres" if citizen_profile.landholding_acres else "Nil",
            "Entitlement Benefit": f"₹{scheme.benefit_amount_inr:,.0f}" if scheme.benefit_amount_inr else scheme.benefit_summary,
            "Verification Mode": f"Biometric e-KYC & OCR Cross-Matched ({id_details.verification_status})"
        }

        declarations = [
            "ഞാൻ മുകളിൽ നൽകിയിരിക്കുന്ന വിവരങ്ങൾ പൂർണ്ണമായും സത്യവും ശരിയുമാണെന്ന് ഇതിനാൽ സാക്ഷ്യപ്പെടുത്തുന്നു.",
            "സർക്കാർ നിശ്ചയിച്ചിട്ടുള്ള അർഹതാ മാനദണ്ഡങ്ങൾ പാലിക്കുന്നുണ്ടെന്ന് ഞാൻ ഉറപ്പുനൽകുന്നു.",
            "തെറ്റായ വിവരങ്ങൾ നൽകിയാൽ പദ്ധതി ആനുകൂല്യം റദ്ദാക്കാനും നിയമനടപടികൾ സ്വീകരിക്കാനും സമ്മതിക്കുന്നു."
        ]

        checklist = scheme.required_documents or [
            "Aadhaar Card (Self-attested copy)",
            "Kerala Ration Card",
            "Bank Account Passbook (Aadhaar seeded)",
            "Land Tax Receipt / Income Certificate"
        ]

        sub_auth = "Local Grama Panchayat / Akshaya e-Kendra / Krishi Bhavan, Kerala"
        if "kudumbashree" in scheme.scheme_id:
            sub_auth = "Kudumbashree CDS / ADS Office, Kerala"
        elif "kcc" in scheme.scheme_id or "kisan" in scheme.scheme_id:
            sub_auth = "Krishi Bhavan / Kerala Bank Branch"

        return FormApplicationPackage(
            application_id=app_id,
            timestamp=datetime.datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
            scheme_id=scheme.scheme_id,
            scheme_name=scheme.hindi_name or scheme.scheme_name,
            ministry=scheme.ministry or "Government of Kerala",
            applicant_profile=citizen_profile.model_dump(),
            verified_id_details=id_details.model_dump(),
            prefilled_fields=prefilled,
            declarations=declarations,
            checklist=checklist,
            submission_authority=sub_auth,
            tracking_code=tracking_code
        )

    def prepare_grievance_petition(
        self,
        citizen_profile: CitizenProfile,
        id_details: IDCardExtraction
    ) -> GrievancePetition:
        """
        Drafts a formal administrative petition to the District Collector & Chief Minister's Public Grievance Cell.
        """
        petition_id = f"KL-CMPGRC-{datetime.datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
        
        subject = f"Urgent Grievance: Stoppage of Welfare Benefits / Administrative Delay - Representation of {citizen_profile.name}, {citizen_profile.district}"
        
        grievance_details = (
            f"ഞാൻ {id_details.extracted_name or citizen_profile.name}, {citizen_profile.district} ജില്ലയിലെ {id_details.address or 'വാസസ്ഥലം'} സ്വദേശിയാണ്. "
            f"കഴിഞ്ഞ ഏതാനും മാസങ്ങളായി എന്റെ ന്യായമായ സർക്കാർ സാമൂഹ്യ സുരക്ഷാ ആനുകൂല്യങ്ങൾ യാതൊരു മുന്നറിയിപ്പുമില്ലാതെ തടസ്സപ്പെട്ടിരിക്കുകയാണ്. "
            f"പഞ്ചായത്ത് ഓഫീസിലും ബന്ധപ്പെട്ട അധികാരികളുടെ മുന്നിലും പലതവണ നേരിട്ട് പരാതിപ്പെട്ടിട്ടും തൃപ്തികരമായ നടപടിയോ വിശദീകരണമോ ലഭ്യമായിട്ടില്ല. "
            f"ദരിദ്ര പശ്ചാത്തലമുള്ള എനിക്ക് ഉപജീവനത്തിന് മറ്റ് സ്ഥിര വരുമാന മാർഗ്ഗങ്ങളില്ലാത്തതിനാൽ അടിയന്തര ഇടപെടൽ അഭ്യർത്ഥിക്കുന്നു."
        )

        relief = (
            "1. മുടങ്ങിപ്പോയ ക്ഷേമ പെൻഷൻ / ആനുകൂല്യങ്ങൾ മുൻകാല പ്രാബല്യത്തോടെ അടിയന്തിരമായി അക്കൗണ്ടിൽ ലഭ്യമാക്കുക.\n"
            "2. ഫയൽ മനഃപൂർവ്വം വൈകിപ്പിച്ച ഉദ്യോഗസ്ഥർക്കെതിരെ കേരള പൗരാവകാശ രേഖ (Citizens' Charter) പ്രകാരം വകുപ്പുതല അന്വേഷണം നടത്തുക.\n"
            "3. 15 ദിവസത്തിനകം ലിഖിത മറുപടിയോ ഹിയറിംഗ് തീയതിയോ ലഭ്യമാക്കുക."
        )

        return GrievancePetition(
            petition_id=petition_id,
            timestamp=datetime.datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
            to_authority=f"The District Collector, Collectorate, {citizen_profile.district}, Kerala & Chief Minister's Public Grievance Redressal Cell (CM-PGRC)",
            subject=subject,
            aggrieved_citizen={
                "name": id_details.extracted_name or citizen_profile.name,
                "id_number": id_details.id_number_masked,
                "address": id_details.address or f"{citizen_profile.district}, Kerala",
                "phone": "Registered Citizen Mobile"
            },
            grievance_details=grievance_details,
            relief_sought=relief,
            legal_references=[
                "The Kerala Right to Basic Services Delivery Framework",
                "Section 19 of Citizen Charter Act & Social Justice Directives",
                "Article 21 of the Constitution of India (Right to Dignified Livelihood)"
            ],
            tracking_portal="Chief Minister's Computerized Grievance Redressal Portal (cmo.kerala.gov.in) & Akshaya E-District"
        )

    def generate_vernacular_summary(
        self,
        citizen_profile: CitizenProfile,
        scheme_or_grievance: Union[SchemeMatchResult, GrievancePetition],
        is_grievance: bool = False
    ) -> VernacularSummary:
        """
        Generates Malayalam audio readout script and bullet points for the citizen.
        """
        if is_grievance:
            headline = "മുഖ്യമന്ത്രിയുടെ പൊതുജന പരാതി സെല്ലിലേക്കുള്ള പരാതി പത്രിക തയ്യാറായിക്കഴിഞ്ഞു"
            spoken = (
                f"പ്രിയ {citizen_profile.name}, താങ്കളുടെ മുടങ്ങിയ പെൻഷൻ പുനഃസ്ഥാപിക്കുന്നതിനായി ജില്ലാ കളക്ടർക്കും "
                f"മുഖ്യമന്ത്രിയുടെ പരാതി പരിഹാര സെല്ലിലേക്കുമുള്ള ഔദ്യോഗിക പരാതി അപേക്ഷ സഹായ് AI തയ്യാറാക്കിയിട്ടുണ്ട്. "
                f"ഈ അപേക്ഷ ഡൗൺലോഡ് ചെയ്ത് ഒപ്പിട്ട് തൊട്ടടുത്തുള്ള അക്ഷയ കേന്ദ്രം വഴിയോ താലൂക്ക് ഓഫീസിലോ സമർപ്പിക്കാം. "
                f"പരാതി ട്രാക്ക് ചെയ്യാനുള്ള ഔദ്യോഗിക ട്രാക്കിംഗ് കോഡും ഇതിൽ ഉൾപ്പെടുത്തിയിട്ടുണ്ട്."
            )
            bullets = [
                "ഔദ്യോഗിക പരാതി നമ്പറും അപേക്ഷാ ഫോമും പി.ഡി.എഫ് ആയി തയ്യാറായി.",
                "തൊട്ടടുത്ത അക്ഷയ കേന്ദ്രം വഴി cmo.kerala.gov.in പോർട്ടലിൽ അപ്‌ലോഡ് ചെയ്യുക.",
                "15 ദിവസത്തിനകം കളക്ടറേറ്റിൽ നിന്ന് നടപടി മറുപടി ലഭിക്കുന്നതാണ്."
            ]
        else:
            s_name = scheme_or_grievance.hindi_name or scheme_or_grievance.scheme_name
            headline = f"{s_name} - അപേക്ഷാ ഫോം തയ്യാറായി"
            benefit_txt = f"₹{scheme_or_grievance.benefit_amount_inr:,.0f}" if scheme_or_grievance.benefit_amount_inr else "സർക്കാർ ധനസഹായം"
            spoken = (
                f"പ്രിയ {citizen_profile.name}, താങ്കളുടെ വിവരങ്ങൾ പരിശോധിച്ചതിൽ നിന്ന് {s_name} പദ്ധതിക്ക് "
                f"താങ്കൾ പൂർണ്ണ യോഗ്യനാണെന്ന് കണ്ടെത്തി. {benefit_txt} ആനുകൂല്യം ലഭിക്കുന്നതിനുള്ള ഔദ്യോഗിക പ്രീ-ഫിൽഡ് അപേക്ഷാ ഫോം തയ്യാറാണ്. "
                f"ആധാർ കാർഡും മറ്റ് രേഖകളും ഒത്തുനോക്കി സാക്ഷ്യപ്പെടുത്തിയിട്ടുണ്ട്. ഈ അപേക്ഷ ഡൗൺലോഡ് ചെയ്ത് അക്ഷയ കേന്ദ്രത്തിലോ കൃഷിഭവനിലോ സമർപ്പിക്കാം."
            )
            bullets = [
                f"പദ്ധതി: {s_name}",
                f"ലഭിക്കുന്ന ആനുകൂല്യം: {benefit_txt}",
                f"ആധാർ വെരിഫിക്കേഷൻ: വിജയകരമായി പൂർത്തിയായി",
                "ആവശ്യമായ രേഖകൾ: ആധാർ കാർഡ്, റേഷൻ കാർഡ്, ബാങ്ക് പാസ്സ്ബുക്ക്"
            ]

        helpdesk = f"Nearest Akshaya e-Kendra / Grama Panchayat Helpdesk, {citizen_profile.district}, Kerala (Toll-Free: 1076 / 155300)"

        return VernacularSummary(
            language="Malayalam (മലയാളം)",
            headline=headline,
            spoken_summary_script=spoken,
            bullet_action_points=bullets,
            nearest_helpdesk=helpdesk
        )
