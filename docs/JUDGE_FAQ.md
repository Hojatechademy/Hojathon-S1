# Ente Ward (എന്റെ വാർഡ്) — Judge Evaluation FAQ

This document provides concise, fact-based answers about **Ente Ward** and **Ward Sahayakan (വാർഡ് സഹായി)** for Hojathon judges.

---

### 1. What is Ente Ward?
**Ente Ward (എന്റെ വാർഡ്)** is a Malayalam-first, hyper-localized private civic governance platform connecting citizens directly with their elected ward representatives (വാർഡ് മെമ്പർമാർ). It turns natural-language citizen communication into structured, auditable ward workflows.

---

### 2. What problem does it solve?
In grassroots Kerala governance, civic grievances (potholes, water pipe leaks, damaged streetlights, garbage accumulation) are reported informally through phone calls or WhatsApp messages. These issues get lost, lack chronological tracking, and provide no proof of resolution. Ente Ward provides an organized, bi-directional system with real-time accountability.

---

### 3. Why is Ward Sahayakan agentic?
Ward Sahayakan does not merely return canned text. It follows an autonomous execution loop:
$$\text{Goal} \longrightarrow \text{Intent Classification} \longrightarrow \text{Context Guard} \longrightarrow \text{Plan} \longrightarrow \text{Tool Selection} \longrightarrow \text{Execute Tool in Supabase} \longrightarrow \text{Observe Result} \longrightarrow \text{Respond}$$
It writes real records to the database, generates permanent tracking IDs (`EW-XXXX`), and records each execution in `agent_runs` and `agent_tool_calls` tables.

---

### 4. What makes it different from a chatbot?
* A **chatbot** answers questions based on training data or static FAQs without altering the system state.
* **Ward Sahayakan** is an **Action Agent**: it checks who the resident is, verifies their ward jurisdiction, calls authenticated backend functions to create complaints, retrieves real contact numbers from the database, and schedules ward actions.

---

### 5. What tools can Ward Sahayakan use?
The agent has access to a secure, categorized tool suite implemented in `src/tools/executor.ts`:
* **Issues:** `create_issue`, `get_my_issues`, `get_issue`, `get_issue_timeline`, `add_issue_evidence`, `submit_issue_feedback`.
* **Ward & Contacts:** `get_ward_contacts`, `get_ward_information`, `get_ward_statistics`.
* **Public Information:** `get_government_contacts`, `search_schemes`, `search_health_facilities`.

---

### 6. How does it know the resident's ward?
The ward context is **never** provided by the LLM or untrusted client parameters. When a resident logs in via Supabase Auth, their verified profile and `ward_id` are loaded into an immutable `AuthenticatedUserContext`. The tool executor strictly pins all queries and mutations to this session.

---

### 7. How is authorization handled?
Authorization is enforced in two strict layers:
1. **Application Execution Boundary (`src/tools/executor.ts`):** Statically binds all queries to `authContext.wardId` and `authContext.userId`.
2. **Supabase PostgreSQL Layer:** Uses Row-Level Security (RLS) policies ensuring users can only read and write data authorized for their role and ward membership.

---

### 8. Can the AI access another ward?
**No.** Even if a user prompts the AI to modify or view another ward's data, the tool executor enforces a strict security perimeter: it ignores any external ward parameter and only queries the resident's authenticated `authContext.wardId`.

---

### 9. What happens when an AI tool fails?
* If the Gemini API is offline or unconfigured, the system automatically falls back to a deterministic, rule-based heuristic parser so core reporting remains functional.
* If a database tool execution fails, the executor returns a structured failure message (`success: false`). The agent acknowledges the failure honestly and never fabricates a successful ticket number.
* Residents can also bypass AI at any time using the standard manual modal form.

---

### 10. How does a complaint reach a representative?
When `create_issue` completes, a row is inserted into `public.issues` with the resident's `ward_id`. When the representative for that ward opens their **Action Hub**, their dashboard queries `issues` where `ward_id = user.wardId`, causing the new complaint to appear instantly in their triage queue.

---

### 11. How does the resident track resolution?
Residents click on any complaint to open the **Chronological Action Timeline**. Each status update (`Submitted` ➜ `Triaged` ➜ `In Progress` ➜ `Action Taken` ➜ `Resolved`) records:
* The timestamp
* The actor role (`resident`, `representative`, `agent`)
* Official remarks
* Attached photographic proof/evidence of the repair

---

### 12. Why Malayalam and Manglish?
Malayalam is the primary language of daily life and grassroots democracy in Kerala. Many citizens hesitate to report issues on formal English-only portals. Supporting spoken Malayalam and Manglish (phonetic Malayalam in English script) removes language friction and democratizes civic participation.

---

### 13. Is this an official government application?
**No.** Ente Ward is an independent civic prototype developed for the Hojathon hackathon. It is not affiliated with, endorsed by, or operated by the Government of Kerala or any Local Self-Government Department.

---

### 14. Why Google Gemini?
We use Google Gemini (`gemini-3.6-flash`) because of its native multilingual comprehension of Indic languages (particularly Malayalam syntax and colloquial phrasing), fast response latency, and support for structured JSON schema outputs.

---

### 15. What would you build next?
1. **Audio Voice Messages:** Direct audio processing using speech-to-text for elderly residents.
2. **Automated WhatsApp Webhooks:** Instant status alerts dispatched directly to residents' WhatsApp numbers.
3. **Panchayat GIS Heatmaps:** Spatial analytics mapping recurring water leaks and road damages for Grama Panchayat annual planning.
