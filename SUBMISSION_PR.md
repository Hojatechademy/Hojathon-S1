# Final Pull Request Details for Hojathon Submission

### Pull Request Title:
```
[TEAM-39] Sahay AI
```

---

### Pull Request Description (Copy & Paste below):

**Team ID:** 39  
**Team Name:** Sahay AI  
**Team Members:** Ansil Bayan  
**Project Name:** Sahay AI  

### Problem Statement
Over 300 million vulnerable citizens in India are eligible for government welfare schemes and pensions, yet billions in financial entitlements lapse each year due to administrative hurdles, complex eligibility rules across fragmented department websites, and lack of accessible grievance avenues. Static forms and calculators fail to handle real-world identity documents (e.g., e-Aadhaar PDFs with complex font glyph streams) and cannot dynamically guide a citizen through legal grievance petitions when legitimate benefits are discontinued.

### Solution
Sahay AI is a stateful multi-agent system (powered by LangGraph, Gemini 1.5 Flash Vision, and an in-memory Vector Store) that:
1. Automatically ingests and parses digital e-Aadhaar PDFs or card images, extracting verified ground-truth demographics (Name, DOB/Age, Gender, Address, District, PIN, Masked ID) while eliminating OCR/font noise.
2. Interactively asks only for missing socio-economic parameters (occupation, annual income, landholding, category).
3. Intelligently routes based on citizen intent:
   - **Welfare Discovery**: Ranks eligible Kerala and Central schemes with transparent qualification reasons and generates pre-filled Akshaya application packages.
   - **Grievance Redressal**: Suppresses unrelated schemes and formulates formal statutory grievance petitions under the Kerala Citizens'' Charter with timebound inquiry mandates (15–30 days) and tracking helplines.

### Technology Stack
- **Frontend:** Streamlit, Custom Responsive CSS (Plus Jakarta Sans)
- **Multi-Agent Orchestration:** LangGraph StateGraph, Python 3
- **Document Intelligence:** Google GenAI SDK (Gemini 1.5 Flash Vision), pypdf
- **Vector Search & Matching:** In-Memory Cosine Vector Store (Numpy-based) & deterministic rule engine
- **Document Generation:** fpdf2 (with Unicode font support)
- **Security:** python-dotenv, UIDAI Aadhaar masking (XXXX-XXXX-1234)

### Demo URL
*(Add your deployed Streamlit Community Cloud URL or public IP here, e.g. https://sahay-ai.streamlit.app)*

### Demo Video
*(Add your video demonstration link here, e.g. Loom, YouTube, or Google Drive)*

### Special Instructions for Judges
1. **Zero Setup / Offline Evaluation:** You do not need a Gemini API key to evaluate the project. SahayAI operates with 100% functionality out of the box using offline deterministic evaluation and rule reasoning.
2. **Instant Test Aadhaar:** A sample document is available at `scratch/sample_aadhaar.pdf`, or you can upload any Aadhaar PDF/image directly.
3. **Dedicated Grievance vs. Scheme Discovery:** Try both pathways in Step 2 to experience the clean separation between welfare discovery and legal grievance petition generation.
