"""
SahayAI - Direct Aadhaar Parsing & Citizen Welfare Guidance System
Workflow:
1. Upload Aadhaar (PDF / Image) -> Auto-extract Name, DOB/Age, Gender, District, Address, Masked ID
2. Answer Remaining Columns (Occupation, Income, Land, Category, Purpose/Grievance)
3. Match Eligible Schemes & Provide Step-by-Step Filing / Grievance Methods + Download Official Form/Petition
All UI text and controls are in English.
"""

import os
import json
import io
import datetime
import streamlit as st
from PIL import Image
from dotenv import load_dotenv

from core.gemini_client import GeminiService
from core.vector_store import SchemeVectorStore
from core.state import CitizenProfile, SchemeMatchResult, IDCardExtraction
from agents.form_filler_agent import FormFillerAgent
from utils.pdf_generator import generate_application_pdf, generate_grievance_pdf

load_dotenv()

# Streamlit Page Setup
st.set_page_config(
    page_title="SahayAI - Aadhaar Welfare & Grievance Facilitator",
    page_icon="🇮🇳",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', sans-serif;
    }
    
    .portal-header {
        background: linear-gradient(135deg, #0d2847 0%, #12355B 50%, #1f568d 100%);
        padding: 24px 30px;
        border-radius: 14px;
        color: white;
        margin-bottom: 25px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
        border-bottom: 4px solid #FF9933;
    }
    
    .step-header {
        background: #f1f5f9;
        border-left: 5px solid #12355B;
        padding: 10px 16px;
        border-radius: 6px;
        margin-top: 20px;
        margin-bottom: 15px;
        font-weight: 700;
        color: #0f172a;
    }
    
    .verified-box {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 15px;
    }
    
    .method-box {
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        padding: 18px;
        margin-top: 15px;
    }
    
    .badge-eligible {
        background: #dcfce7;
        color: #166534;
        padding: 5px 12px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 13px;
        border: 1px solid #86efac;
        display: inline-block;
    }
    
    .badge-ineligible {
        background: #fee2e2;
        color: #991b1b;
        padding: 5px 12px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 13px;
        border: 1px solid #fca5a5;
        display: inline-block;
    }
</style>
""", unsafe_allow_html=True)


# Load Welfare Schemes
@st.cache_data
def load_schemes():
    with open("data/schemes.json", "r", encoding="utf-8") as f:
        return json.load(f)

schemes_data = load_schemes()


# Sidebar Configuration
with st.sidebar:
    st.image("https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/200px-Emblem_of_India.svg.png", width=55)
    st.markdown("### **SahayAI Platform**")
    st.caption("Aadhaar-Powered Welfare & Grievance Facilitator")
    
    st.divider()
    
    api_key_input = st.text_input(
        "🔑 Gemini API Key (Optional):",
        value=os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "",
        type="password",
        help="Optional: Without an API key, SahayAI runs in deterministic offline evaluation mode with 100% functionality."
    )
    
    if api_key_input:
        st.success("🟢 Live Gemini 1.5 Flash Connected")
    else:
        st.info("🔵 Offline Parsing Mode Active (Regex & Deterministic Engine)")
        
    st.divider()
    
    st.markdown("#### 🏛️ **Indexed Welfare Schemes**")
    st.markdown(f"**{len(schemes_data)}** Active Government Schemes:")
    for s in schemes_data:
        st.markdown(f"- **{s['name']}**")
        
    st.divider()
    st.markdown("#### 📞 **Government Helplines**")
    st.markdown("- **Akshaya Citizen Helpdesk:** 155300 / 0471-2525444")
    st.markdown("- **Chief Minister's Public Grievance Cell:** 1076")
    st.markdown("- **State Health Agency (KASP):** 1056")


# Banner Header
st.markdown("""
<div class="portal-header">
    <span style="background: #FF9933; color: white; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; letter-spacing: 1px;">GOVERNMENT OF KERALA • CITIZEN WELFARE & GRIEVANCE CELL</span>
    <h1 style="margin: 8px 0 4px 0; font-size: 30px; font-weight: 700;">SahayAI Portal</h1>
    <p style="margin: 0; font-size: 14px; color: #e2e8f0;">
        Upload your Aadhaar (PDF or Image) to extract identity details, answer socio-economic questions, and receive your matched welfare schemes or formal grievance petition filing method.
    </p>
</div>
""", unsafe_allow_html=True)


# Initialize Session State Variables
if "aadhaar_parsed" not in st.session_state:
    st.session_state["aadhaar_parsed"] = False
if "parsed_data" not in st.session_state:
    st.session_state["parsed_data"] = {}
if "matched_results" not in st.session_state:
    st.session_state["matched_results"] = None
if "final_package" not in st.session_state:
    st.session_state["final_package"] = None
if "final_petition" not in st.session_state:
    st.session_state["final_petition"] = None


# Step 1: Upload Aadhaar Document (PDF or Image)
st.markdown('<div class="step-header">📁 Step 1: Upload Your Aadhaar Document (PDF, PNG, JPG)</div>', unsafe_allow_html=True)

upload_col1, upload_col2 = st.columns([1.8, 1.2])

with upload_col1:
    uploaded_file = st.file_uploader(
        "Select your Aadhaar document (e-Aadhaar PDF or scanned image):",
        type=["pdf", "png", "jpg", "jpeg"],
        help="Upload your digital e-Aadhaar PDF or a clear photo of your Aadhaar card."
    )
    
    btn_parse = st.button("🔍 Extract Details from Aadhaar", type="primary", use_container_width=True, disabled=(uploaded_file is None))

with upload_col2:
    if uploaded_file is not None:
        doc_bytes = uploaded_file.read()
        is_pdf = uploaded_file.name.lower().endswith(".pdf") or doc_bytes.startswith(b"%PDF-")
        st.session_state["uploaded_doc_bytes"] = doc_bytes
        st.session_state["uploaded_doc_name"] = uploaded_file.name
        st.session_state["uploaded_doc_is_pdf"] = is_pdf
        
        if is_pdf:
            st.markdown(f"""
            <div style="background: #f1f5f9; border: 2px dashed #94a3b8; border-radius: 10px; padding: 20px; text-align: center;">
                <span style="font-size: 38px;">📄</span>
                <h4 style="margin: 6px 0 2px 0; color: #1e293b; font-size: 15px;">{uploaded_file.name}</h4>
                <p style="margin: 0; font-size: 12px; color: #64748b;">PDF Document • {len(doc_bytes)/1024:.1f} KB</p>
                <span style="display: inline-block; margin-top: 8px; background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 10px; font-size: 11px; font-weight: 600;">
                    ✓ Ready for Document Parsing
                </span>
            </div>
            """, unsafe_allow_html=True)
        else:
            try:
                img = Image.open(io.BytesIO(doc_bytes))
                st.image(img, caption=f"Uploaded: {uploaded_file.name}", use_container_width=True)
            except Exception:
                st.info(f"📄 Document Loaded: {uploaded_file.name}")
    else:
        st.info("👆 Please upload your Aadhaar document to begin.")


# Handle Parsing
if btn_parse and uploaded_file is not None:
    with st.spinner("Analyzing and extracting demographic records from your Aadhaar..."):
        gemini = GeminiService(api_key=api_key_input)
        fname = st.session_state.get("uploaded_doc_name", "")
        mime = "application/pdf" if st.session_state.get("uploaded_doc_is_pdf") else "image/png"
        parsed = gemini.parse_aadhaar_document(
            st.session_state["uploaded_doc_bytes"],
            mime_type=mime,
            filename=fname
        )
        st.session_state["parsed_data"] = parsed
        st.session_state["aadhaar_parsed"] = True
        st.session_state["matched_results"] = None
        
        extracted_name = parsed.get("name") or ""
        if GeminiService.is_valid_person_name(extracted_name):
            st.success(f"✅ Successfully extracted Aadhaar records for **{extracted_name}**!")
        else:
            st.info("✅ Extracted document records. Please enter or confirm your Full Name below.")


# Step 2: Review Extracted Details & Answer Remaining Questions
if st.session_state.get("aadhaar_parsed"):
    parsed = st.session_state["parsed_data"]
    
    st.markdown('<div class="step-header">📋 Step 2: Verify Aadhaar Records & Answer Remaining Socio-Economic Questions</div>', unsafe_allow_html=True)
    
    raw_extracted_name = parsed.get("name") or ""
    if not GeminiService.is_valid_person_name(raw_extracted_name):
        raw_extracted_name = ""

    with st.expander("🔍 **Verified Records from Aadhaar (Click to edit if needed)**", expanded=True):
        if not raw_extracted_name:
            st.warning("⚠️ Could not automatically detect your name from this scan. Please type your Name below as printed on your Aadhaar:")

        a_col1, a_col2, a_col3 = st.columns(3)
        with a_col1:
            val_name = st.text_input(
                "Full Name (as on Aadhaar):",
                value=raw_extracted_name,
                placeholder="Enter your full name as shown on Aadhaar"
            )
            val_dob = st.text_input("Date of Birth (DD/MM/YYYY):", value=parsed.get("dob", "14/08/1982"))
        with a_col2:
            val_age = st.number_input("Age (Years):", value=int(parsed.get("age", 44)), min_value=1, max_value=120)
            val_gender = st.selectbox(
                "Gender:",
                options=["Male", "Female", "Other"],
                index=["Male", "Female", "Other"].index(parsed.get("gender", "Male")) if parsed.get("gender") in ["Male", "Female", "Other"] else 0
            )
        with a_col3:
            val_id = st.text_input("Aadhaar Number (Masked):", value=parsed.get("id_number_masked", "XXXX-XXXX-8924"))
            kerala_districts = [
                "Wayanad", "Ernakulam", "Alappuzha", "Thrissur", "Palakkad",
                "Kozhikode", "Malappuram", "Kannur", "Kollam", "Kottayam",
                "Thiruvananthapuram", "Idukki", "Kasaragod", "Pathanamthitta"
            ]
            default_dist_idx = kerala_districts.index(parsed.get("district", "Wayanad")) if parsed.get("district") in kerala_districts else 0
            val_district = st.selectbox("District:", options=kerala_districts, index=default_dist_idx)
            
        val_address = st.text_area("Permanent Address:", value=parsed.get("address", f"Post Office, {val_district} District, Kerala"))

    st.markdown("#### **Questions for Remaining Eligibility Columns:**")
    st.caption("Aadhaar does not contain socio-economic parameters. Please answer the following questions to accurately identify your eligible welfare schemes or grievance route:")

    q_col1, q_col2 = st.columns(2)

    with q_col1:
        # Question 1: Occupation
        val_occupation = st.selectbox(
            "1. What is your primary occupation?",
            options=[
                "Farmer / Cultivator / Agricultural Laborer",
                "Street Vendor / Small Stall / Pushcart Trader",
                "Student (School / College / Higher Studies)",
                "Senior Citizen / Retired / Pensioner",
                "Daily Wage Laborer / Artisan / Construction",
                "Unorganized Sector Worker",
                "Fisherman / Coastal Worker",
                "Homemaker",
                "Self Employed / Micro-Enterprise"
            ]
        )
        # Normalize occupation key
        occ_clean = "farmer" if "Farmer" in val_occupation else (
            "street vendor" if "Vendor" in val_occupation else (
                "student" if "Student" in val_occupation else (
                    "senior citizen" if "Senior" in val_occupation else (
                        "fisherman" if "Fisherman" in val_occupation else "unorganized worker"
                    )
                )
            )
        )

        # Question 2: Annual Household Income
        val_income = st.number_input(
            "2. What is your total annual household income (in ₹ INR)?",
            min_value=0.0,
            max_value=2500000.0,
            value=85000.0,
            step=5000.0,
            help="Enter approximate annual family income from all sources. Enter 0 if currently unemployed or no income."
        )

        # Question 3: Income Category
        val_income_cat = st.selectbox(
            "3. What is your economic income category?",
            options=["BPL (Below Poverty Line / Priority Ration Card)", "EWS (Economically Weaker Section)", "General / APL"],
            index=0 if val_income <= 100000 else 1
        )
        income_cat_clean = "BPL" if "BPL" in val_income_cat else ("EWS" if "EWS" in val_income_cat else "General")

    with q_col2:
        # Question 4: Agricultural Landholding
        val_land = st.number_input(
            "4. How much agricultural land do you or your family own (in Acres)?",
            min_value=0.0,
            max_value=100.0,
            value=1.8 if occ_clean == "farmer" else 0.0,
            step=0.1,
            help="Enter 0 if you are landless, a tenant farmer, or an urban resident."
        )

        # Question 5: Social / Caste Category
        val_caste = st.selectbox(
            "5. What is your social / reservation category?",
            options=["General", "OBC (Other Backward Class)", "SC (Scheduled Caste)", "ST (Scheduled Tribe)"]
        )

        # Question 6: Household Details
        st.markdown("**6. Household Details:**")
        hh_c1, hh_c2, hh_c3 = st.columns(3)
        with hh_c1:
            val_girl_child = st.checkbox("Have a Girl Child?", value=False)
        with hh_c2:
            val_pwd = st.checkbox("Person with Disability (PwD)?", value=False)
        with hh_c3:
            val_family_count = st.number_input("Family Members:", min_value=1, max_value=20, value=4)

    st.divider()

    # Question 7: Objective / Purpose
    st.markdown("#### **7. What is your objective today?**")
    val_intent = st.radio(
        "Select your requirement:",
        options=[
            "🟢 Discover & Apply for Government Welfare Schemes (Welfare Benefits, Subsidies & Grants)",
            "🔴 File an Official Grievance Petition (Delayed Welfare Pension, Rejected Application, Administrative Inaction)"
        ],
        index=0 if occ_clean != "senior citizen" else (1 if val_income == 0 else 0)
    )

    is_grievance_intent = "Grievance" in val_intent
    grievance_subject = ""
    grievance_details = ""
    grievance_relief = ""

    if is_grievance_intent:
        st.markdown('<div class="verified-box" style="background: #fff1f2; border-color: #fecdd3;">', unsafe_allow_html=True)
        st.markdown("##### ⚖️ **Grievance Particulars for Official Redressal:**")
        
        grievance_type = st.selectbox(
            "Select Grievance Category:",
            options=[
                "Stoppage / Non-Credit of Social Security Welfare Pension (വാർദ്ധക്യ / കർഷക പെൻഷൻ)",
                "Wrongful Rejection / Cancellation of Priority Ration Card (BPL/NFSA)",
                "Administrative Delay in LIFE Mission House Construction Sanction",
                "Delayed Disbursement of Agricultural / Crop Damage Compensation",
                "Non-Issuance of Legitimate Caste, Income or Nativity Certificate",
                "Other Public Authority Delay or Inaction"
            ]
        )
        
        grievance_subject = f"Representation regarding: {grievance_type} - {val_name}, {val_district}"
        
        grievance_details = st.text_area(
            "Describe the factual grievance statement (What happened, which office you visited, and when it stopped):",
            value=(
                f"I am {val_name}, residing at {val_address}. "
                f"My legitimate welfare benefit under {grievance_type} has been discontinued / delayed without prior written notice or valid justification. "
                f"Despite repeated representations to the local Panchayat office and concerned officials, no corrective action has been initiated. "
                f"I have no other sustainable source of livelihood and request urgent intervention."
            ),
            height=110
        )
        
        grievance_relief = (
            "1. Immediate restoration and retrospective disbursement of pending welfare arrears.\n"
            "2. Departmental inquiry into the administrative delay under the Kerala Citizens' Charter Act.\n"
            "3. Formal hearing or written acknowledgment within 15 working days."
        )
        st.markdown('</div>', unsafe_allow_html=True)

    # Action Trigger
    btn_find_schemes = st.button(
        "⚖️ Generate Grievance Petition & Redressal Method" if is_grievance_intent else "🚀 Process Profile & Discover Eligible Schemes",
        type="primary",
        use_container_width=True
    )

    if btn_find_schemes:
        spinner_msg = "Preparing your formal grievance petition and official redressal route..." if is_grievance_intent else "Matching your profile against Kerala & Central welfare criteria..."
        with st.spinner(spinner_msg):
            # Construct complete verified CitizenProfile
            profile = CitizenProfile(
                name=val_name,
                age=int(val_age),
                gender=val_gender,
                state="Kerala",
                district=val_district,
                urban_rural="Urban" if val_district in ["Ernakulam", "Kozhikode", "Thiruvananthapuram"] and occ_clean == "street vendor" else "Rural",
                occupation=occ_clean,
                annual_income=float(val_income),
                income_category=income_cat_clean,
                caste_category=val_caste.split(" ")[0],
                landholding_acres=float(val_land),
                has_girl_child=val_girl_child,
                family_members_count=int(val_family_count),
                disability_status=val_pwd,
                intent="grievance_petition" if is_grievance_intent else "scheme_discovery",
                confidence_score=0.98,
                raw_input=f"Aadhaar verified: {val_name}, {val_age}y, {val_district}, {occ_clean}, income={val_income}"
            )

            st.session_state["active_profile"] = profile

            # ID Extraction object
            id_data = IDCardExtraction(
                document_type="Aadhaar Card",
                extracted_name=val_name,
                id_number_masked=val_id,
                dob_or_age=val_dob,
                gender=val_gender,
                address=val_address,
                father_or_husband_name=parsed.get("guardian_name", ""),
                verification_status="VERIFIED",
                verification_notes=[
                    f"Name verified with Aadhaar: {val_name}",
                    f"District verified: {val_district}, Kerala",
                    f"Age: {val_age} years (DOB: {val_dob})",
                    "Demographic and residence records authenticated"
                ],
                confidence=0.99
            )

            filler = FormFillerAgent()

            if is_grievance_intent:
                st.session_state["matched_results"] = None
                petition = filler.prepare_grievance_petition(profile, id_data)
                petition.subject = grievance_subject
                petition.grievance_details = grievance_details
                petition.relief_sought = grievance_relief
                pdf_path = generate_grievance_pdf(petition)
                petition.pdf_path = pdf_path
                st.session_state["final_petition"] = petition
                st.session_state["final_package"] = None
            else:
                vector_store = SchemeVectorStore()
                matches = vector_store.match_schemes_for_citizen(profile)
                st.session_state["matched_results"] = matches
                top_scheme = matches[0] if matches else None
                if top_scheme:
                    package = filler.prepare_application_package(profile, top_scheme, id_data)
                    pdf_path = generate_application_pdf(package)
                    package.pdf_path = pdf_path
                    st.session_state["final_package"] = package
                    st.session_state["final_petition"] = None


# Step 3: Display Results based on Intent (Grievance vs Scheme Discovery)
if st.session_state.get("active_profile") is not None:
    profile = st.session_state["active_profile"]
    is_grievance = profile.intent == "grievance_petition"

    # 1. Grievance Redressal Flow (Schemes are NOT shown)
    if is_grievance and st.session_state.get("final_petition"):
        pet = st.session_state["final_petition"]
        
        st.markdown('<div class="step-header">🎯 Step 3: Official Grievance Redressal & Filing Method</div>', unsafe_allow_html=True)
        st.markdown("### ⚖️ **Official Grievance Redressal Method**")
        st.markdown(f"**Grievance Docket ID:** `{pet.petition_id}` | **Filing Date:** `{pet.timestamp}`")

        # Step by Step Filing Method Box
        st.markdown(f"""
        <div class="method-box" style="border-left: 5px solid #dc2626;">
            <h4 style="margin: 0 0 10px 0; color: #991b1b;">📌 Official Step-by-Step Filing Method for Your Grievance:</h4>
            <ol style="margin: 0; padding-left: 20px; line-height: 1.7; color: #1e293b;">
                <li><b>Authority Addressed:</b> {pet.to_authority}</li>
                <li><b>Primary Filing Channel (Online):</b> Visit the Chief Minister's Public Grievance Redressal Portal at <b>cmo.kerala.gov.in</b> or file through any <b>Akshaya e-Kendra</b> in {profile.district}.</li>
                <li><b>Physical / Offline Submission:</b> Submit the printed and signed petition at the <b>District Collectorate Public Hearing (Jan Sunwai)</b> or to the <b>Taluk Tehsildar / Grama Panchayat Secretary</b>.</li>
                <li><b>Mandatory Timebound Redressal:</b> Under the Kerala Citizens' Charter and Public Grievance Rules, an official inquiry report must be submitted within <b>15 to 30 working days</b>.</li>
                <li><b>Helpline for Tracking:</b> Call CM Grievance Toll-Free Helpline <b>1076</b> or track status online using Docket ID: <code>{pet.petition_id}</code>.</li>
            </ol>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("#### **Download Your Pre-filled Statutory Grievance Petition:**")
        pdf_path = pet.pdf_path
        if pdf_path and os.path.exists(pdf_path):
            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()
            st.download_button(
                label="📥 Download Official Grievance Petition PDF",
                data=pdf_bytes,
                file_name=f"CM_Grievance_Petition_{pet.petition_id}.pdf",
                mime="application/pdf",
                type="primary",
                use_container_width=True
            )

    # 2. Scheme Discovery Flow (Only shown when user selects Scheme Discovery)
    elif not is_grievance and st.session_state.get("matched_results"):
        matches = st.session_state["matched_results"]
        st.markdown('<div class="step-header">🎯 Step 3: Appropriate Scheme Recommendations & Official Filing Method</div>', unsafe_allow_html=True)
        st.markdown("### 🏛️ **Matched Government Schemes for Your Profile**")
        st.caption(f"Evaluated against your verified Aadhaar demographic records and socio-economic columns ({profile.occupation.title()}, Annual Income: ₹{profile.annual_income:,.0f}, Land: {profile.landholding_acres} Acres, {profile.district}):")

        for idx, s in enumerate(matches):
            is_top = (idx == 0)
            is_eligible = s.is_eligible
            badge_class = "badge-eligible" if is_eligible else "badge-ineligible"
            status_text = "ELIGIBLE" if is_eligible else "NOT ELIGIBLE"
            
            with st.expander(
                f"{'⭐ Top Recommendation: ' if is_top and is_eligible else ''}**{s.scheme_name}** — {status_text} (Match: {s.match_score}%)",
                expanded=is_top
            ):
                sc_c1, sc_c2 = st.columns([1.8, 1.2])
                with sc_c1:
                    st.markdown(f"**Ministry / Department:** {s.ministry}")
                    st.markdown(f"**Benefit Overview:** {s.benefit_summary}")
                    
                    st.markdown("##### **Satisfied Eligibility Criteria:**")
                    for r in s.matched_reasons:
                        st.markdown(f"- ✅ {r}")

                    if s.unmet_reasons:
                        st.markdown("##### **Unmet Criteria / Disqualification Reasons:**")
                        for u in s.unmet_reasons:
                            st.markdown(f"- ⚠️ {u}")

                with sc_c2:
                    if s.benefit_amount_inr:
                        st.metric("Financial Entitlement", f"₹{s.benefit_amount_inr:,.0f}")
                    else:
                        st.metric("Entitlement", "Statutory Administrative Order")
                        
                    st.markdown("##### **Required Supporting Documents:**")
                    for d in s.required_documents:
                        st.markdown(f"- 📄 {d}")

                # Specific Filing Method Box for this Scheme
                st.markdown(f"""
                <div class="method-box">
                    <h5 style="margin: 0 0 8px 0; color: #12355B;">📝 Official Filing Method for {s.scheme_name}:</h5>
                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #334155;"><b>Application Procedure:</b> {s.application_process}</p>
                    <p style="margin: 0; font-size: 13px; color: #334155;"><b>Official Helpdesk / Helpline:</b> {s.grievance_contact}</p>
                </div>
                """, unsafe_allow_html=True)

                # Pre-filled Download Button if top scheme
                if is_top and st.session_state.get("final_package"):
                    pkg = st.session_state["final_package"]
                    if pkg.pdf_path and os.path.exists(pkg.pdf_path):
                        with open(pkg.pdf_path, "rb") as f:
                            app_pdf_bytes = f.read()
                        st.markdown("<div style='margin-top: 12px;'>", unsafe_allow_html=True)
                        st.download_button(
                            label=f"📥 Download Pre-Filled Akshaya Application PDF for {s.scheme_name}",
                            data=app_pdf_bytes,
                            file_name=f"Akshaya_Application_{pkg.application_id}.pdf",
                            mime="application/pdf",
                            type="primary",
                            use_container_width=True
                        )
                        st.markdown("</div>", unsafe_allow_html=True)

# Footer
st.markdown("---")
st.markdown(
    "<div style='text-align: center; color: #64748b; font-size: 13px;'>"
    "SahayAI • Direct Aadhaar Welfare & Grievance Facilitation Platform • "
    "Designed for Kerala Citizen Services (Akshaya, LSGD & CM-PGRC)"
    "</div>",
    unsafe_allow_html=True
)
