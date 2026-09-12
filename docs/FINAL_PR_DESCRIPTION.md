# Submission Information & Pull Request Description

This file contains the exact submission details to be pasted into the final Pull Request on the official Hojathon repository, as specified in `docs/SUBMISSION.md` and `.github/PULL_REQUEST_TEMPLATE.md`.

---

```markdown
# Hojathon Final Submission

## Team Information

**Team ID:** [TODO: Add official Team ID]

**Team Name:** Syntax

**Members:**
* Mohammed Shibin PT
* Muhammed Siyad MP

---

## Project Information

**Project Name:** Ente Ward (എന്റെ വാർഡ്)

### Problem Statement
At the grassroots level of Kerala's Local Self-Government Department (LSGD) hierarchy (Grama Panchayats and Municipalities), civic communication between residents and their elected ward members is fragmented across informal phone calls, unstructured WhatsApp messages, and casual verbal requests. This results in lost accountability, zero follow-up tracking, and high friction for citizens. Traditional grievance portals are complex, English-centric, and disconnected from the ward representative's operational workflow.

### Solution
Ente Ward (എന്റെ വാർഡ്) is a Malayalam-first, hyper-localized private civic governance platform. It features **Ward Sahayakan (വാർഡ് സഹായി)** — a real agentic AI assistant powered by Google Gemini (gemini-2.5-flash) that understands everyday Malayalam, Manglish, and English. The agent retrieves resident and ward context, plans and selects authorized backend tools, and executes real database transactions in Supabase to register complaints. The elected representative receives these issues in an operational Action Hub, records actions taken, attaches photographic evidence, and marks them resolved, creating a transparent, chronological timeline for the resident.

### Key Features
* **Ward Sahayakan (Real Action Agent):** Understands Malayalam/Manglish, checks authenticated ward context, calls authorized tools (`create_issue`, `get_my_issues`, `get_ward_contacts`, `get_government_contacts`, `get_ward_statistics`), and logs agent runs to Supabase.
* **Representative Action Hub:** Dedicated operational triage dashboard for the ward member to acknowledge complaints, upload photographic evidence of repairs, and update statuses.
* **Username + Password Authentication:** Accessible identity layer without requiring email inputs, backed securely by Supabase Auth with zero plaintext password storage.
* **Strict Ward-Level Security Isolation:** Data is strictly isolated by ward boundary; representatives and residents cannot access or alter another ward's private data.
* **Bilingual Notice Board & Directories:** Verified Grama Sabha schedules, Haritha Karma Sena collection calendars, Kerala welfare schemes (LIFE Mission, Karunya KASP), and public contact directories.

### Technology Stack
* **Frontend:** React 19, TypeScript, Vite, Vanilla CSS + Tailwind Utility Tokens
* **Backend & Database:** Supabase (PostgreSQL 15+, PostgREST, Row-Level Security)
* **Authentication:** Supabase Auth (Argon2 / Bcrypt encryption)
* **AI & Agent Core:** Google Gemini (`gemini-2.5-flash`) via `@google/generative-ai`

### Demo URL
[TODO: Insert Live Hosted URL if applicable]

### Demo Video
[TODO: Insert Demo Video Link - e.g. Loom, YouTube, or Google Drive]

### Special Instructions for Judges
1. **Focus on the Agentic Loop:** Ward Sahayakan is not a static chatbot; it performs goal interpretation, ward authorization verification, tool selection, Supabase database insertion, and result observation.
2. **Try Malayalam or Manglish:** In the resident dashboard, try submitting:
   `"Schoolinte aduthulla road valare mosham aanu, complaint register cheyyanam"`
   Observe the live step pipeline and the generated tracking number.
3. **Inspect the Dual-Sided Workflow:** Switch roles from Resident to Representative to see the newly generated complaint arrive in the triage queue, update its status with remarks and photo proof, and switch back to verify the resident's live timeline.
4. **Disclaimer:** Ente Ward is a private civic platform prototype; it is not an official government department and does not represent the Government of Kerala.

---

## Submission Checklist

* [x] Team information is complete (Team ID marked as TODO)
* [x] Project information is complete
* [x] Source code is included and verified
* [x] README is complete and customized for Ente Ward
* [x] Setup instructions are included
* [x] Running instructions are included
* [ ] Demo link is included [TODO: Add live URL]
* [ ] Demo video is included [TODO: Add video link]
* [x] No secrets/API keys/passwords are committed
* [x] Project has been tested (TypeScript and build pass with 0 errors)
* [ ] Final code has been pushed
```
