# Sahay AI

## Team Information
- **Team ID:** 39
- **Team Name:** Sahay AI
- **Team Members:**
  - Ansil Bayan
- **Project Name:** Sahay AI

---

## Project Documentation

### Project Name
**Sahay AI** — Aadhaar-Powered Citizen Welfare & Grievance Facilitator

### Team
- **Team ID:** 39
- **Team Name:** Sahay AI
- **Team Member:** Ansil Bayan

---

### Problem Statement
Over 300 million vulnerable citizens in India are entitled to government welfare schemes and social security pensions, yet billions of rupees in welfare funds lapse annually due to bureaucratic friction, complex qualification rules, fragmented portals, and the lack of accessible grievance escalation channels.

#### Why an Agent is Required (Rather than a Static Script or Plain UI)
1. **Identity & Document Ambiguity:** Identity documents like e-Aadhaars vary widely in layout, font streams, and scan quality. Static regex or rigid forms break on real-world PDFs. An intelligent document ingestion agent is needed to parse, validate, and authenticate demographic records while filtering OCR noise.
2. **Multi-Variable Socio-Economic Reasoning:** Welfare criteria span multiple interdependent parameters (income thresholds, landholding limits, family composition, caste, disability, occupation). A static form cannot explain *why* a citizen is ineligible or identify alternative programs without an autonomous matching agent.
3. **Actionable Legal & Administrative Execution:** Simply informing a citizen about a scheme is insufficient. An agentic workflow closes the loop by reasoning through administrative procedures, calculating benefits, and synthesizing official, pre-filled Akshaya application packages and formal statutory grievance petitions under the **Kerala Citizens'' Charter**.

---

### Proposed Solution
Sahay AI is a stateful multi-agent system designed to bridge the last-mile gap between citizens and government administration:
- **Intake & Document Intelligence Agent:** Automatically extracts ground-truth demographic records (Full Name, Date of Birth, Age, Gender, Masked Aadhaar ID, District, Full Residential Address, PIN code) from uploaded Aadhaar PDFs or images.
- **Adaptive Intake Questionnaire:** Interactively prompts the citizen only for remaining socio-economic criteria not present on identity cards (occupation, annual income, landholding, category).
- **Scheme Matcher Agent:** Performs semantic and rule-based evaluation against indexed Kerala and Central welfare schemes (KASP Health Insurance, LIFE Mission Housing, Kudumbashree Micro-Finance, Sevana Social Security Pension, PM-KISAN, KCC, Vidyakiranam, CM-PGRC).
- **Form Filler & Grievance Agent:** Generates official application packages or drafts legally structured representation petitions addressed to the District Collector and Chief Minister''s Public Grievance Cell with timebound redressal prayers and tracking credentials.

---

### Key Features
1. **Multimodal Aadhaar Document Extraction:**
   - Supports digital e-Aadhaar PDFs.
   - Deep heuristic parser with font-glyph noise filtering and human name validation that extracts verified citizen identity records.
2. **Dedicated Grievance Redressal Pipeline:**
   - When a citizen selects the grievance pathway, unrelated welfare schemes are suppressed.
   - Synthesizes a formal legal representation petition detailing facts, violated provisions under the Kerala Citizens'' Charter, and specific timebound relief prayers (15–30 days inquiry).
3. **Scheme Discovery & Procedural Guidance:**
   - Displays matched schemes with transparent eligibility scores, satisfied criteria, and disqualification reasons.
   - Provides official Akshaya and departmental submission instructions and grievance helpline contacts.
4. **Instant PDF Generation:**
   - Generates official application forms and formal statutory grievance petitions with docket numbers, verification seals, and signature blocks.
5. **Dual Operation (Live Gemini 1.5 Flash + 100% Offline Evaluation):**
   - Judges can evaluate the entire pipeline immediately without an API key (using deterministic rule and vector matching) or plug in a Gemini API key for live multimodal processing.

---

### Technology Stack
| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | Streamlit, HTML5, Custom CSS | Clean, responsive English UI with Plus Jakarta Sans typography |
| **Agent Orchestration** | LangGraph StateGraph | Stateful multi-agent graph coordinating Intake, Matching, and Form Filling |
| **Document Intelligence** | Gemini 1.5 Flash Vision, pypdf | Multimodal document understanding & resilient PDF text extraction |
| **Vector DB / Matching** | In-Memory Cosine Vector Store | High-performance Numpy semantic search & deterministic rule evaluation |
| **Document Generation** | fpdf2 | Official PDF application packages and legal grievance petitions |
| **Security & Privacy** | python-dotenv, Aadhaar Masking | First 8 digits masked (XXXX-XXXX-1234); zero hardcoded secrets |

---

### How It Works

#### Architecture & Agent Data Flow
```
   [Citizen: Aadhaar PDF / Image Upload]
                    │
                    ▼
   ┌───────────────────────────────────┐
   │ 1. Intake & Document Agent        │ ◄── Extracts Name, DOB, Gender, Address, Masked ID
   └────────────────┬──────────────────┘
                    │ Verified Demographics + Remaining Columns
                    ▼
         [ Citizen Intent Router ]
                    ├───────────────────────────────────────┐
                    ▼                                       ▼
       [ Welfare Discovery Intent ]              [ Grievance Petition Intent ]
                    │                                       │
                    ▼                                       ▼
   ┌───────────────────────────────────┐   ┌───────────────────────────────────┐
   │ 2. Scheme Matcher Agent           │   │ 2. Grievance Form Filler Agent    │
   │    • Evaluates Vector Store       │   │    • Formulates Legal Representation
   │    • Transparent Criteria Checks  │   │    • Statutory Relief under Charter
   └────────────────┬──────────────────┘   └────────────────┬──────────────────┘
                    │                                       │
                    ▼                                       ▼
   ┌───────────────────────────────────┐   ┌───────────────────────────────────┐
   │ 3. Akshaya Application Package    │   │ 3. CM Grievance Petition PDF      │
   │    • Download Official Form PDF   │   │    • Download Legal Petition PDF  │
   │    • Step-by-Step Filing Guide    │   │    • Redressal Channels & Timeline│
   └───────────────────────────────────┘   └───────────────────────────────────┘
```

#### Run Through Example:
1. **Upload:** Citizen uploads `aadhar.pdf`.
2. **Extraction:** The Intake Agent parses `Citizen Name`, `DOB: DD/MM/YYYY`, `Age`, `Gender`, `District`, `Address`.
3. **Questionnaire:** Citizen confirms details and answers remaining columns (Occupation, Income, Land, Category).
4. **Outcome Selection:**
   - If **Scheme Discovery**: Matches the Scheme, outlines the PACS filing procedure, and provides pre-filled Akshaya application PDF.
   - If **Grievance**: Generates a formal petition to the the concerned authorities / CM-PGRC with Docket ID, outlines 15–30 day inquiry rules, and provides a signed legal petition PDF.

---

### Setup & Installation

#### Prerequisites
- Python 3.10 to 3.14
- Git

#### 1. Clone Repository
```bash
git clone https://github.com/<your-username>/hojathon-S1.git
cd hojathon-S1
```

#### 2. Create and Activate Virtual Environment
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Configure Environment (Optional)
```bash
# Copy example configuration
cp .env.example .env

# Optional: Add your Gemini API Key in .env
# GEMINI_API_KEY="your_api_key_here"
```
*(Note: An API key is NOT required. SahayAI runs in 100% functional offline deterministic mode out of the box).*

---

### Running the Project

#### Launch the Web Application
```bash
streamlit run app.py
```
Open your browser at: `http://localhost:8501`

#### Run Automated Test Suite
```bash
python scratch/test_aadhaar_parsing_flow.py
```

---

### Special Instructions for Judges
1. **Zero Setup Requirement:** You do not need a Gemini API key to evaluate the project. The platform operates seamlessly with high-accuracy offline PDF parsing, deterministic rule reasoning, and full PDF petition generation.
2. **Sample Test Documents:** A test document is provided in `scratch/sample_aadhaar.pdf` to test immediate upload and extraction. You can also upload any real or sample Aadhaar PDF/image.
3. **Testing Grievance vs. Scheme Discovery:**
   - In Step 2, select **"Discover & Apply for Government Welfare Schemes"** to review ranked schemes and pre-filled Akshaya application forms.
   - Select **"File an Official Grievance Petition"** to experience the dedicated grievance route with official redressal procedures and statutory petition generation.
