# Ente Ward (എന്റെ വാർഡ്)

> **"Your ward. One conversation. Real action."**
> 
> **"എന്റെ വാർഡ്"** — Hyper-localized, privacy-first civic governance platform.  
> **"Ward Sahayakan — വാർഡ് സഹായി"** — Authentic Malayalam-first action agent for grassroots civic democracy.

---

> [!IMPORTANT]
> **Statutory & Institutional Disclaimer:**  
> **Ente Ward is NOT an official government portal, it is NOT a government department, and it does NOT represent or act on behalf of the Government of Kerala or any Local Self-Government Department (LSGD).**  
> Ente Ward is an independent, private civic communication prototype engineered to bridge everyday communication friction between residents and their localized ward-level elected representatives.

---

## 1. Project Overview

**Ente Ward (എന്റെ വാർഡ്)** is a Malayalam-first, hyper-localized private civic platform connecting citizens directly with their ward-level elected representative (വാർഡ് മെമ്പർ / കൗൺസിലർ).

Rather than forcing residents through complicated multi-step forms or impersonal departmental ticketing software, Ente Ward introduces **Ward Sahayakan (വാർഡ് സഹായി)** — a goal-driven, action-taking AI civic agent. Ward Sahayakan understands conversational Malayalam, Manglish (Malayalam written in the English alphabet), and English, transforming natural resident expressions into structured, trackable, and authorized ward workflows backed by Supabase.

---

## 2. Problem Statement

At the grassroots level of Kerala's decentralized governance (Grama Panchayats and Municipalities), local civic communication is fragmented:
- **Scattered Communication:** Residents report daily infrastructure issues (damaged roads, broken streetlights, water supply disruptions, uncollected waste) through informal WhatsApp messages, direct telephone calls, or casual verbal conversations.
- **Lost Accountability & Follow-up:** Because these requests lack centralized tracking, issues are frequently forgotten, duplicated, or lost without any chronological status audit.
- **Language & Bureaucracy Barriers:** Traditional government web grievance portals are often English-heavy, form-cluttered, difficult to navigate on mobile devices, and disconnected from the ward member's direct operational workflow.
- **Representative Overwhelm:** Ward representatives lack a structured operational dashboard to triage complaints, record official actions taken, attach work completion proof/photos, and communicate transparent progress back to their residents.

---

## 3. Our Solution

Ente Ward solves this by establishing a direct, bi-directional, ward-isolated bridge:

- **Resident Dashboard:** Ward-specific notices, health programs, verified Kerala welfare schemes, public contacts directory, complaint tracking, and live chat with Ward Sahayakan.
- **Ward Sahayakan (Action Agent):** An autonomous civic agent that listens to citizens in everyday Malayalam, extracts problem locations, verifies ward authorization, plans tool execution, writes to Supabase, and issues real tracking IDs.
- **Representative Dashboard (Action Hub):** A focused operational workspace where the elected representative reviews new issues, acknowledges them, records actions taken, uploads photographic evidence, and marks problems resolved.
- **Public Contacts Directory:** Split cleanly between **My Ward Contacts** (exclusively visible to that ward's residents) and **Global Kerala Government Contacts** (District Collectors, Secretariat, Ministers).

### The Core Architectural Workflow

```
                  RESIDENT
                     ↓
        WARD SAHAYAKAN (വാർഡ് സഹായി)
                     ↓
             UNDERSTAND REQUEST
                     ↓
          RETRIEVE USER & WARD CONTEXT
                     ↓
             SELECT AUTHORIZED TOOL
                     ↓
          EXECUTE REAL BACKEND ACTION
                     ↓
            SUPABASE DATABASE (PostgreSQL)
                     ↓
      REPRESENTATIVE RECEIVES REAL ISSUE
                     ↓
            REVIEW & ACKNOWLEDGE
                     ↓
        RECORD ACTION & ATTACH EVIDENCE
                     ↓
                 RESOLUTION
                     ↓
         RESIDENT SEES UPDATED TIMELINE
```

---

## 4. Ward Sahayakan — Real Agentic AI (വാർഡ് സഹായി)

**Ward Sahayakan is NOT a traditional Q&A chatbot.**

| Traditional Civic Chatbot | Ward Sahayakan (Real Action Agent) |
|---|---|
| User asks question ➜ Chatbot outputs static text reply | User expresses goal ➜ Agent evaluates context ➜ Plans tool execution |
| Does not modify or verify database state | Executes real mutations in Supabase (`issues`, `issue_timeline`, `agent_runs`) |
| Cannot check localized civic jurisdiction | Strictly checks and enforces authenticated ward boundaries |
| No persistent audit trail of reasoning | Audits all tool invocations and results in database tables |

### Language Comprehension
Ward Sahayakan natively handles:
1. **Malayalam Script:** `"സ്‌കൂളിന്റെ അടുത്തുള്ള റോഡ് വളരെ മോശമാണ്, ഒരു പരാതി രജിസ്റ്റർ ചെയ്യണം"`
2. **Manglish (Phonetic Romanized Malayalam):** `"Schoolinte aduthulla road valare mosham aanu, complaint register cheyyanam"`
3. **English:** `"The streetlight near the temple junction has not been functioning for 3 days"`

### Concrete Execution Example:
1. **Resident prompt:** `"Schoolinte aduthulla road valare mosham aanu."`
2. **Understand Goal:** Identifies civic grievance regarding public road damage.
3. **Check Context:** Reads authenticated resident profile (`authContext.wardId = 'ward-kulukkallur-07'`).
4. **Classify Intent:** Detects `REPORT_ISSUE` (Category: `roads`, Priority: `medium`, Landmark: `സ്‌കൂളിന് സമീപം`).
5. **Plan & Select Tool:** Selects authorized `create_issue` tool.
6. **Execute Action:** Inserts into Supabase `issues` table and generates a permanent tracking number (e.g. `EW-00123`).
7. **Observe Result & Respond:** Verifies database response and confirms in natural Malayalam:
   > *"താങ്കളുടെ വാർഡിലെ (Ward 7) റോഡ് പ്രശ്നം വിജയകരമായി രേഖപ്പെടുത്തിയിട്ടുണ്ട്. പരാതി നമ്പർ: EW-00123. വാർഡ് പ്രതിനിധി ഇത് പരിശോധിക്കുന്നതാണ്."*
8. **Audit Trail:** Logs state transitions and tool calls in `agent_runs` and `agent_tool_calls`.

---

## 5. Why It Is Agentic

Ward Sahayakan embodies real agentic autonomy:
- **Multi-Step Reasoning Loop:** `IDLE` ➜ `UNDERSTAND_GOAL` ➜ `CLASSIFY_INTENT` ➜ `CHECK_CONTEXT` ➜ `PLAN` ➜ `SELECT_TOOL` ➜ `EXECUTE_TOOL` ➜ `OBSERVE_RESULT` ➜ `DECIDE_NEXT_ACTION` ➜ `RESPOND` ➜ `SAVE_RUN`.
- **Dynamic Action Decision:** Can loop up to 6 iterations to query additional data or ask for targeted clarification if location details are missing.
- **Strict Security Boundaries:** The LLM does **not** receive arbitrary database access or service-role keys. Tool calls are strictly routed through `AuthorizedToolExecutor`, which statically pins all SQL queries to `authContext.wardId` and `authContext.userId`.

---

## 6. Resident Experience

- **Civic Grievances & Ward Sahayakan:** Dual interface allowing voice-like natural language reporting with live visual steps (`അഭ്യർത്ഥന വിശകലനം ചെയ്യുന്നു`, `വാർഡ് അംഗീകാരം പരിശോധിക്കുന്നു`, `ടൂൾ പ്രവർത്തിപ്പിക്കുന്നു`), alongside an explicit manual fallback form.
- **My Complaints & Live Timeline:** Chronological progression tracking each stage (`Submitted` ➜ `Triaged` ➜ `In Progress` ➜ `Action Taken` ➜ `Resolved`) with actor roles and timestamps.
- **Evidence & Proof Viewer:** Photos and documentation submitted by the resident and representative.
- **Announcements & Notice Board:** Ward-specific Grama Sabha meetings, Haritha Karma Sena waste collection schedules, and local alerts.
- **Health & Welfare Services:** Verified Kerala government welfare schemes (LIFE Mission, Karunya KASP, Kudumbashree, Aikyashree) and local Primary Health Centre (PHC) hours and contacts.
- **Ward & Government Contacts:** Immediate phone and email access to the local Ward Member, Asha Worker, and all 14 Kerala District Collectors.

---

## 7. Representative Experience

The Representative Dashboard is the **Action Center**:
- **Ward Action Hub:** Real-time summary metrics calculated directly from database records (Total Complaints, Pending, In-Progress, Resolved).
- **Triage & Review Queue:** Issues reported by ward residents appear instantly in the representative's private queue.
- **Status & Evidence Update Workflow:** Representative can acknowledge complaints, record detailed actions taken, upload photographic proof of repairs, and mark issues resolved.
- **Residents Management:** Provision new ward residents using simple **Username + Password** credentials. The resident's ward is automatically inherited from the representative's session (no manual selection; zero ward leakage).
- **Ward Contacts Management:** Publish and update emergency and utility helper contacts for ward citizens.

---

## 8. Platform Admin Experience

- **LSGD Location Master:** Structured Kerala administrative hierarchy: `Kerala` ➜ `14 Districts` ➜ `Grama Panchayats` ➜ `Delimited Wards`.
- **Representative Provisioning:** Admin provisions official ward representatives by selecting verified LSGD locations.
- **Deduplication & Re-assignment:** Prevents multiple active representatives from occupying the same ward; permits deactivation and reassignment.

---

## 9. Technical Architecture

```
+-------------------------------------------------------------------------+
|                              USER CLIENT                                |
|   (Resident Browser / Representative Browser / Admin Portal - React 19) |
+-------------------------------------------------------------------------+
                                    │
                                    │ HTTPS / REST / WebSockets
                                    ▼
+-------------------------------------------------------------------------+
|                       ENTE WARD APPLICATION LAYER                       |
|  ┌───────────────────────────────────────────────────────────────────┐  |
|  | Authentication Service (Username + Password ➜ Internal Supabase) |  |
|  └───────────────────────────────────────────────────────────────────┘  |
|  ┌───────────────────────────────────────────────────────────────────┐  |
|  | Ward Sahayakan Agent Core (runner.ts + state.ts)                  |  |
|  |   - Multi-Step ReAct Loop                                         |  |
|  |   - Google Gemini SDK (gemini-2.5-flash)                          |  |
|  |   - Natural Language Parser (Malayalam / Manglish / English)      |  |
|  └───────────────────────────────────────────────────────────────────┘  |
|  ┌───────────────────────────────────────────────────────────────────┐  |
|  | Authorized Tool Executor (executor.ts)                            |  |
|  |   - Identity Pinned (authContext.userId)                          |  |
|  |   - Ward Pinned (authContext.wardId) - Zero Cross-Ward Leakage    |  |
|  └───────────────────────────────────────────────────────────────────┘  |
+-------------------------------------------------------------------------+
                                    │
                                    │ Supabase JS Client (RLS Protected)
                                    ▼
+-------------------------------------------------------------------------+
|                           SUPABASE BACKEND                              |
|  ┌───────────────┐ ┌───────────────┐ ┌────────────────┐ ┌─────────────┐ |
|  | Supabase Auth | | public.issues | | issue_timeline | | agent_runs  | |
|  └───────────────┘ └───────────────┘ └────────────────┘ └─────────────┘ |
|  ┌───────────────┐ ┌───────────────┐ ┌────────────────┐ ┌─────────────┐ |
|  |   profiles    | |  public.wards | | ward_contacts  | | tool_calls  | |
|  └───────────────┘ └───────────────┘ └────────────────┘ └─────────────┘ |
+-------------------------------------------------------------------------+
```

---

## 10. Database Entities

- `profiles`: Core user records containing username, display name, verified role (`resident`, `representative`, `admin`), and ward binding.
- `wards`: Official delimitation units (ward number, Malayalam name, local body name, district).
- `ward_memberships`: Validated links associating users to their specific ward.
- `issues`: Civic grievances with tracking IDs (`EW-XXXX`), category, priority, status, and coordinates/landmarks.
- `issue_timeline`: Chronological progression log capturing all status transitions, actor roles, and official remarks.
- `issue_evidence`: Media files, captions, and photographic proofs uploaded during reporting or resolution.
- `ward_contacts`: Ward-isolated public directory (Asha worker, ward member, health nurse).
- `government_contacts`: Statewide public directory of Kerala ministers, district collectors, and senior officials.
- `agent_runs` & `agent_tool_calls`: Audit tables recording all AI tool invocations, inputs, results, and latency.

---

## 11. Security & Privacy Guarantees

1. **Username + Password Abstraction:** Residents and representatives log in using simple IDs without entering an email. Passwords are encrypted directly inside Supabase Auth. **Zero plaintext passwords** are ever stored in custom database tables.
2. **Zero Service-Role Key Exposure:** No administrative service-role keys are bundled into the browser client.
3. **Strict Ward Isolation:** Representatives can only access issues and residents belonging to their authorized `ward_id`. Residents only see their own issues and their own ward contacts.
4. **AI Safety Pinning:** The AI agent cannot fabricate `user_id` or `ward_id`. All database queries are statically enforced by the server-side tool executor using the verified session.

---

## 12. Failure Handling & Resilience

- **AI Fallback:** If the Gemini API key is not configured or experiences rate limiting, Ward Sahayakan seamlessly falls back to a deterministic rule-based heuristic parser capable of recognizing standard Malayalam/English civic requests.
- **Manual Form Fallback:** Residents can always submit issues using the traditional manual modal dialog (`New Issue Report`).
- **Database Graceful Degradation:** If network connectivity to Supabase drops, the application falls back safely to cached local state without crashing the UI.

---

## 13. Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | Vanilla CSS Design System + Tailwind Utility Tokens |
| **Backend** | Supabase (PostgreSQL 15+, PostgREST, RLS) |
| **Authentication** | Supabase Auth (Argon2 / Bcrypt Password Hashing) |
| **AI / LLM** | Google Gemini (`gemini-2.5-flash` via `@google/generative-ai`) |
| **Icons & Media** | Material Symbols Outlined, Canvas Confetti |

---

## 14. Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- Supabase Project URL and Public Anon Key
- Google Gemini API Key

### Step 1: Clone the Repository
```bash
git clone https://github.com/mshibin04/Hojathon-S1.git
cd Hojathon-S1
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your valid credentials:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini AI Configuration
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### Step 4: Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 15. Production Build Verification

Verify that TypeScript and the production Vite bundle compile cleanly:

```bash
# Type check
npx tsc -b

# Production bundle
npm run build
```
*(Verified: 100 modules transformed into `dist/` with **0 errors**).*

---

## 16. Judge Evaluation & Demo Walkthrough

### Recommended 3-Minute Demo Flow:

1. **Resident Experience & Ward Sahayakan:**
   - Log in as Resident (`Username: resident001` or use the quick role switcher in header).
   - In the Ward Sahayakan box, enter: `"Schoolinte aduthulla road valare mosham aanu, complaint register cheyyanam"`
   - Watch the safe live activity pipeline:
     - `അഭ്യർത്ഥന വിശകലനം ചെയ്യുന്നു` (Understanding request)
     - `വാർഡ് അംഗീകാരം പരിശോധിക്കുന്നു` (Checking ward context)
     - `ഉദ്ദേശ്യം തിരിച്ചറിഞ്ഞു: REPORT_ISSUE`
     - `ഡാറ്റാബേസിൽ നടപടി നടപ്പിലാക്കുന്നു (create_issue)`
     - `ഫലം പരിശോധിച്ചു`
   - Observe the returned real tracking number (e.g. `#EW-00123`).
   - Notice the complaint appearing immediately in the **Active Ward Issues** feed.

2. **Representative Action Center:**
   - Switch to Representative (`Username: ward7_rep` or use the role switcher).
   - In the **Action Hub**, see the resident's complaint in the triage queue.
   - Click **പരിശോധിച്ചു (Acknowledge)** ➜ status updates to `Triaged`.
   - Click **അപ്ഡേറ്റ് ചെയ്യുക** ➜ enter remarks and optional repair photo URL ➜ status updates to `In Progress`.
   - Click **പരിഹരിച്ചു (Resolve)** ➜ closes the complaint.

3. **Verification on Resident Timeline:**
   - Switch back to Resident.
   - Click on the issue to view the **Chronological Action Timeline**.
   - See the verified progression: `Submitted` ➜ `Triaged` ➜ `In Progress` ➜ `Resolved` with official representative remarks and evidence photos.

---

## 17. Project Differentiator

> **"Problem → Action → Proof → Resolution"**

Most civic applications stop at information retrieval or ticket creation. **Ente Ward** closes the loop:
1. **Problem:** Expressed freely in spoken Malayalam/Manglish.
2. **Action:** Converted autonomously into real database records by an authorized agent.
3. **Proof:** Grounded in photographic evidence uploaded by the representative.
4. **Resolution:** Tracked transparently by the citizen on a permanent timeline.

---

## 18. Future Scope (Not Currently Implemented)

- **Voice Input & Malayalam Speech-to-Text:** Direct audio message recording for elderly citizens.
- **Automated WhatsApp Notification Webhooks:** Pushing status updates directly to residents' WhatsApp numbers.
- **Spatial GIS Mapping:** Heatmaps displaying recurring infrastructure bottlenecks across Panchayats.
- **Multi-Panchayat Scaling:** Expanding location master data across all 941 Grama Panchayats and 87 Municipalities in Kerala.

---

## 19. Team Information

**Hojathon Series 1 — AI Agentic Hackathon 2026**

- **Team ID:** `[TODO: Add official Team ID]`
- **Team Name:** Syntax
- **Project Name:** Ente Ward (എന്റെ വാർഡ്)
- **Members:**
  - Mohammed Shibin PT
  - Muhammed Siyad MP
