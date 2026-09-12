"""
SahayAI - Official PDF Package & Grievance Generator
Uses fpdf2 with Unicode font support (Nirmala UI / fallback) to produce formal
Government of Kerala Akshaya & CM-PGRC application documents.
"""

import os
import re
import tempfile
from typing import Dict, Any, Optional
from fpdf import FPDF
from core.state import FormApplicationPackage, GrievancePetition, IDCardExtraction


def get_configured_pdf() -> FPDF:
    pdf = FPDF()
    # Check if Nirmala font is present on Windows for full Malayalam Unicode rendering
    nirmala_path = "C:/Windows/Fonts/Nirmala.ttc"
    if os.path.exists(nirmala_path):
        try:
            pdf.add_font("Nirmala", "", nirmala_path)
            pdf.add_font("Nirmala", "B", nirmala_path)
            pdf.default_font = "Nirmala"
            return pdf
        except Exception:
            pass
    pdf.default_font = "Helvetica"
    return pdf


def safe_text(text: Any, font_name: str) -> str:
    """Sanitizes text if using Latin-1 core fonts, or returns as-is for Unicode font."""
    s = str(text or "")
    if font_name == "Helvetica":
        # Remove non-latin1 characters or transliterate
        return re.sub(r'[^\x00-\xFF]', '', s)
    return s


def generate_application_pdf(package: FormApplicationPackage, output_path: Optional[str] = None) -> str:
    """
    Generates official pre-filled Akshaya scheme application document.
    """
    if not output_path:
        tmp_dir = os.path.join(tempfile.gettempdir(), "sahayai_docs")
        os.makedirs(tmp_dir, exist_ok=True)
        output_path = os.path.join(tmp_dir, f"{package.application_id}.pdf")

    pdf = get_configured_pdf()
    font_main = getattr(pdf, "default_font", "Helvetica")
    
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Header banner
    pdf.set_fill_color(18, 53, 91)  # Kerala Deep Navy Blue
    pdf.rect(0, 0, 210, 22, 'F')
    
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(font_main, "B" if font_main == "Helvetica" else "", 13)
    pdf.set_xy(10, 4)
    pdf.cell(0, 6, "GOVERNMENT OF KERALA - AKSHAYA E-GOVERNANCE SUITE", ln=True, align="C")
    
    pdf.set_font(font_main, "" if font_main == "Helvetica" else "", 9)
    pdf.cell(0, 5, "SahayAI Citizen Empowerment & Direct Welfare Facilitation Portal", ln=True, align="C")
    pdf.ln(6)

    # Title Box
    pdf.set_fill_color(240, 244, 248)
    pdf.set_draw_color(18, 53, 91)
    pdf.rect(10, 26, 190, 23, 'DF')

    pdf.set_text_color(18, 53, 91)
    pdf.set_font(font_main, "B" if font_main == "Helvetica" else "", 13)
    pdf.set_xy(15, 28)
    pdf.cell(0, 7, safe_text("OFFICIAL WELFARE APPLICATION FORM (അക്ഷയ അപേക്ഷ)", font_main), ln=True)

    pdf.set_font(font_main, "", 9)
    pdf.set_text_color(40, 40, 40)
    pdf.set_x(15)
    pdf.cell(0, 5, safe_text(f"Scheme: {package.scheme_name} ({package.scheme_id})", font_main), ln=True)
    pdf.set_x(15)
    pdf.cell(0, 5, safe_text(f"Authority: {package.submission_authority}", font_main), ln=True)

    pdf.ln(8)

    # Reference Numbers & Barcode line
    pdf.set_font(font_main, "B" if font_main == "Helvetica" else "", 8)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(95, 6, safe_text(f"APPLICATION ID: {package.application_id}", font_main), border=1)
    pdf.cell(95, 6, safe_text(f"TRACKING DOCKET: {package.tracking_code}", font_main), border=1, ln=True)
    pdf.cell(95, 6, safe_text(f"FILING DATE: {package.timestamp}", font_main), border=1)
    pdf.cell(95, 6, safe_text("JURISDICTION: Kerala State LSGD / Akshaya Portal", font_main), border=1, ln=True)

    pdf.ln(5)

    # Section 1: Applicant Demographic Details
    pdf.set_font(font_main, "B" if font_main == "Helvetica" else "", 10)
    pdf.set_text_color(18, 53, 91)
    pdf.cell(0, 7, safe_text("1. APPLICANT VERIFIED DEMOGRAPHIC RECORD", font_main), ln=True)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(2)

    pdf.set_text_color(30, 30, 30)
    for label, val in package.prefilled_fields.items():
        pdf.set_font(font_main, "B" if font_main == "Helvetica" else "", 8)
        pdf.cell(60, 6, safe_text(f"{label}:", font_main), border="B")
        pdf.set_font(font_main, "", 8)
        pdf.cell(130, 6, safe_text(str(val), font_main), border="B", ln=True)

    pdf.ln(4)

    # Section 2: Multimodal ID Verification
    pdf.set_font(font_main, "B" if font_main == "Helvetica" else "", 10)
    pdf.set_text_color(18, 53, 91)
    pdf.cell(0, 7, safe_text("2. MULTIMODAL IDENTITY AUDIT & VISION CROSS-MATCH", font_main), ln=True)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(2)

    id_data = package.verified_id_details
    status = id_data.get("verification_status", "VERIFIED")
    
    if status == "VERIFIED":
        pdf.set_fill_color(220, 245, 225)
        pdf.set_text_color(20, 120, 40)
    else:
        pdf.set_fill_color(255, 243, 205)
        pdf.set_text_color(133, 100, 4)

    pdf.set_font(font_main, "B" if font_main == "Helvetica" else "", 9)
    pdf.cell(190, 7, safe_text(f"   STATUS: {status} via Gemini Vision Multimodal Inspection", font_main), fill=True, ln=True)
    
    pdf.set_font(font_main, "", 8)
    pdf.set_text_color(40, 40, 40)
    pdf.cell(95, 6, safe_text(f"Document Verified: {id_data.get('document_type', 'Aadhaar')}", font_main), border=1)
    pdf.cell(95, 6, safe_text(f"Masked ID: {id_data.get('id_number_masked', 'XXXX-XXXX-XXXX')}", font_main), border=1, ln=True)

    notes = id_data.get("verification_notes", [])
    if notes:
        pdf.ln(2)
        pdf.set_font(font_main, "", 8)
        for note in notes[:3]:
            pdf.cell(0, 4, safe_text(f"  * {note}", font_main), ln=True)

    pdf.ln(4)

    # Section 3: Required Supporting Enclosures
    pdf.set_font(font_main, "B" if font_main == "Helvetica" else "", 10)
    pdf.set_text_color(18, 53, 91)
    pdf.cell(0, 7, safe_text("3. MANDATORY ENCLOSURES & CHECKLIST FOR AKSHAYA DESK", font_main), ln=True)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(2)

    pdf.set_font(font_main, "", 8)
    pdf.set_text_color(40, 40, 40)
    for doc in package.checklist:
        pdf.cell(10, 5, "[ X ]", align="C")
        pdf.cell(180, 5, safe_text(doc, font_main), ln=True)

    pdf.ln(4)

    # Section 4: Citizen Undertaking & Signatures
    pdf.set_font(font_main, "B" if font_main == "Helvetica" else "", 9)
    pdf.set_text_color(18, 53, 91)
    pdf.cell(0, 5, safe_text("4. STATUTORY DECLARATION & AUTHORIZATION", font_main), ln=True)
    pdf.set_font(font_main, "", 8)
    pdf.set_text_color(60, 60, 60)
    declaration_text = (
        "I hereby solemnly affirm that the demographic and financial information provided above "
        "is true, complete, and verified with my Aadhaar and Ration records. I consent to Aadhaar-based "
        "direct benefit transfers (DBT) and verification through Kerala Akshaya / LSGD portals."
    )
    pdf.multi_cell(190, 4, safe_text(declaration_text, font_main))

    pdf.ln(8)

    # Signature blocks
    pdf.set_font(font_main, "", 8)
    pdf.set_text_color(30, 30, 30)
    y_pos = pdf.get_y()
    pdf.rect(15, y_pos, 75, 18)
    pdf.set_xy(15, y_pos + 13)
    pdf.cell(75, 4, safe_text("Signature / Thumb of Applicant", font_main), align="C")

    pdf.rect(120, y_pos, 75, 18)
    pdf.set_xy(120, y_pos + 13)
    pdf.cell(75, 4, safe_text("Akshaya Kendra e-Attestation & Stamp", font_main), align="C")

    # Footer
    pdf.set_y(-12)
    pdf.set_text_color(120, 120, 120)
    pdf.set_font(font_main, "", 7)
    pdf.cell(0, 4, safe_text("SahayAI Automated Welfare Submission System | Verified under Kerala Citizens' Charter Act", font_main), align="L")
    pdf.cell(0, 4, f"Page {pdf.page_no()}", align="R")

    pdf.output(output_path)
    return output_path


def generate_grievance_pdf(petition: GrievancePetition, output_path: Optional[str] = None) -> str:
    """
    Generates formal administrative representation petition for the CM Grievance Cell & District Collector.
    """
    if not output_path:
        tmp_dir = os.path.join(tempfile.gettempdir(), "sahayai_docs")
        os.makedirs(tmp_dir, exist_ok=True)
        output_path = os.path.join(tmp_dir, f"{petition.petition_id}.pdf")

    pdf = get_configured_pdf()
    font_main = getattr(pdf, "default_font", "Helvetica")

    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Header
    pdf.set_fill_color(139, 0, 0)  # Formal Burgundy Red
    pdf.rect(0, 0, 210, 22, 'F')

    pdf.set_text_color(255, 255, 255)
    pdf.set_font(font_main, "B" if font_main == "Helvetica" else "", 12)
    pdf.set_xy(10, 4)
    pdf.cell(0, 6, "OFFICIAL ADMINISTRATIVE REPRESENTATION & GRIEVANCE PETITION", ln=True, align="C")
    pdf.set_font(font_main, "", 9)
    pdf.cell(0, 5, "Kerala Chief Minister's Public Grievance Redressal Cell (CM-PGRC)", ln=True, align="C")

    pdf.ln(6)

    # Title Banner
    pdf.set_fill_color(255, 240, 240)
    pdf.set_draw_color(139, 0, 0)
    pdf.rect(10, 26, 190, 14, 'DF')
    pdf.set_font(font_main, "B" if font_main == "Helvetica" else "", 9)
    pdf.set_text_color(139, 0, 0)
    pdf.set_xy(15, 28)
    pdf.cell(0, 5, safe_text(f"GRIEVANCE DOCKET NO: {petition.petition_id}", font_main), ln=True)
    pdf.set_font(font_main, "", 8)
    pdf.set_x(15)
    pdf.cell(0, 4, safe_text(f"Filing Date: {petition.timestamp} | Portal: {petition.tracking_portal}", font_main), ln=True)

    pdf.ln(6)

    # To Authority
    pdf.set_font(font_main, "B" if font_main == "Helvetica" else "", 9)
    pdf.set_text_color(20, 20, 20)
    pdf.cell(0, 5, safe_text("TO THE COMPETENT AUTHORITY:", font_main), ln=True)
    pdf.set_font(font_main, "", 8)
    pdf.multi_cell(190, 4, safe_text(petition.to_authority, font_main))

    pdf.ln(3)

    # Subject
    pdf.set_font(font_main, "B" if font_main == "Helvetica" else "", 9)
    pdf.set_text_color(139, 0, 0)
    pdf.multi_cell(190, 4, safe_text(f"SUBJECT: {petition.subject}", font_main))

    pdf.ln(3)

    # Aggrieved Citizen Details
    pdf.set_font(font_main, "B" if font_main == "Helvetica" else "", 9)
    pdf.set_text_color(20, 20, 20)
    pdf.cell(0, 5, safe_text("AGGRIEVED CITIZEN PARTICULARS:", font_main), ln=True)
    pdf.set_font(font_main, "", 8)
    c_info = petition.aggrieved_citizen
    pdf.cell(0, 4, safe_text(f"Name: {c_info.get('name')} | ID: {c_info.get('id_number')} | Address: {c_info.get('address')}", font_main), ln=True)

    pdf.ln(3)

    # Grievance Statement
    pdf.set_font(font_main, "B" if font_main == "Helvetica" else "", 9)
    pdf.cell(0, 5, safe_text("DETAILED STATEMENT OF FACTS & GRIEVANCE (പരാതി വിവരണം):", font_main), ln=True)
    pdf.set_font(font_main, "", 8)
    pdf.multi_cell(190, 4, safe_text(petition.grievance_details, font_main))

    pdf.ln(3)

    # Relief Sought
    pdf.set_font(font_main, "B" if font_main == "Helvetica" else "", 9)
    pdf.set_text_color(139, 0, 0)
    pdf.cell(0, 5, safe_text("PRAYER FOR RELIEF & TIME-BOUND ORDERS:", font_main), ln=True)
    pdf.set_font(font_main, "", 8)
    pdf.set_text_color(20, 20, 20)
    pdf.multi_cell(190, 4, safe_text(petition.relief_sought, font_main))

    pdf.ln(3)

    # Legal References
    pdf.set_font(font_main, "B" if font_main == "Helvetica" else "", 8)
    pdf.set_text_color(70, 70, 70)
    pdf.cell(0, 4, safe_text("Statutory Backing & Legal Provisions:", font_main), ln=True)
    pdf.set_font(font_main, "", 7)
    for ref in petition.legal_references:
        pdf.cell(0, 4, safe_text(f"  * {ref}", font_main), ln=True)

    pdf.ln(6)

    # Signatures
    y_pos = pdf.get_y()
    pdf.rect(15, y_pos, 75, 18)
    pdf.set_xy(15, y_pos + 13)
    pdf.set_font(font_main, "", 8)
    pdf.cell(75, 4, safe_text("Signature of Aggrieved Citizen", font_main), align="C")

    pdf.rect(120, y_pos, 75, 18)
    pdf.set_xy(120, y_pos + 13)
    pdf.cell(75, 4, safe_text("Received & Docketed - Akshaya / Taluk Desk", font_main), align="C")

    pdf.output(output_path)
    return output_path
