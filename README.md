# Hojathon

Build agents that don't just respond — they act.

Hojathon is an agentic AI hackathon. Teams build systems that can reason, plan, call tools or APIs, and carry out multi-step tasks on their own — not just chatbots that answer a single prompt. This repository is the official starter and submission template: fork it, build your project inside your fork, and submit your final work back here through a Pull Request.

There's no required stack. Build your agent with any language, any framework, any model provider or orchestration approach — LangChain, a custom agent loop, raw API calls, whatever gets the job done. This repo itself contains no code. It's just the structure and docs every team needs so judges can actually run and evaluate what you built.

---

## Getting Started

1. **Fork this repository** — click "Fork" at the top of this page, then click the green **"Create fork"** button on the page that follows to confirm.
2. **Clone your fork** to your computer:
   ```bash
   git clone https://github.com/<your-username>/<your-fork>.git
   ```
3. **Read through this README and the [`docs/`](docs/) folder in full** before you write any code, so you understand the rules, the workflow, and what your final submission needs to include.
4. **Add your teammates as collaborators** on your fork (GitHub → Settings → Collaborators) so everyone can push directly.
5. **Build your project** inside your fork, using whatever stack fits your idea.
6. **Commit and push regularly** — don't wait until the deadline to save your work.
7. **Fill in the project documentation** (see [Project Documentation](#project-documentation) below and the [`docs/`](docs/) folder).
8. **Open your final Pull Request** back to this repository before the deadline.

---

## Team Information

**Team ID:** [TODO: Add official Team ID]

**Team Name:** Syntax

**Team Members:**

1. Mohammed Shibin PT
2. Muhammed Siyad MP

**Project Name:** Ente Ward (എന്റെ വാർഡ്)

> Complete project documentation is available in **[`docs/PROJECT_README.md`](docs/PROJECT_README.md)**.

---

## Project Documentation

Replace the placeholders below with your own project's details — this is what judges will actually read.

### Project Name
**Ente Ward (എന്റെ വാർഡ്)** — *"Your ward. One conversation. Real action."*

### Team
* **Team ID:** [TODO: Add official Team ID]
* **Team Name:** Syntax
* **Members:** Mohammed Shibin PT, Muhammed Siyad MP

### Problem Statement
At the grassroots level of Kerala's Local Self-Government Department (LSGD) hierarchy (Grama Panchayats and Municipalities), local civic communication is fragmented across phone calls and WhatsApp messages. This leads to lost accountability, zero follow-up tracking, and high friction for citizens. Traditional grievance portals are complex, form-heavy, and disconnected from the ward representative's operational workflow.

### Proposed Solution
Ente Ward is a Malayalam-first, hyper-localized private civic governance platform. It features **Ward Sahayakan (വാർഡ് സഹായി)** — an autonomous action agent powered by Google Gemini (gemini-2.5-flash) that understands everyday Malayalam, Manglish, and English. The agent retrieves resident and ward context, selects authorized backend tools, and executes real database transactions in Supabase to register and track complaints. Elected representatives receive these issues in an operational Action Hub, record actions taken, attach photographic evidence of repairs, and resolve issues, generating a live, transparent timeline for residents.

### Key Features
* **Ward Sahayakan (Real Action Agent):** Understands Malayalam/Manglish, checks authenticated ward context, calls authorized tools (`create_issue`, `get_my_issues`, `get_ward_contacts`, `get_government_contacts`, `get_ward_statistics`), and logs agent runs to Supabase.
* **Representative Action Hub:** Dedicated operational triage dashboard for the ward member to acknowledge complaints, upload photographic evidence of repairs, and update statuses.
* **Username + Password Authentication:** Accessible identity layer without requiring email inputs, backed securely by Supabase Auth with zero plaintext password storage.
* **Strict Ward-Level Security Isolation:** Data is strictly isolated by ward boundary; representatives and residents cannot access or alter another ward's private data.
* **Bilingual Notice Board & Directories:** Verified Grama Sabha schedules, Haritha Karma Sena collection calendars, Kerala welfare schemes (LIFE Mission, Karunya KASP), and public contact directories.

### Technology Stack
| Category | Technology |
| -------- | ---------- |
| Frontend | React 19, TypeScript, Vite |
| Backend  | Supabase (PostgreSQL 15+, PostgREST, Row-Level Security) |
| Database | Supabase PostgreSQL |
| AI/ML    | Google Gemini (`gemini-2.5-flash`) via `@google/generative-ai` |
| Security | Supabase Auth (Argon2 / Bcrypt encryption), Role-Based Access |
| Styling  | Vanilla CSS Design System + Tailwind Utility Tokens |

### How It Works
```
Resident ➜ Ward Sahayakan ➜ Goal Understanding ➜ Ward Context Check ➜ Tool Selection ➜ Supabase Mutation ➜ Representative Action Hub ➜ Status Update & Photo Evidence ➜ Resident Live Timeline
```
For the complete, in-depth architectural breakdown, see **[`docs/PROJECT_README.md`](docs/PROJECT_README.md)**.

### Setup & Installation
```bash
git clone https://github.com/mshibin04/Hojathon-S1.git
cd Hojathon-S1
npm install
cp .env.example .env.local
# Add your VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_GEMINI_API_KEY
```

### Running the Project
```bash
npm run dev
# Open http://localhost:5173
```
* Complete detailed documentation: **[`docs/PROJECT_README.md`](docs/PROJECT_README.md)**
* Judge FAQ: **[`docs/JUDGE_FAQ.md`](docs/JUDGE_FAQ.md)**
* Final PR Description: **[`docs/FINAL_PR_DESCRIPTION.md`](docs/FINAL_PR_DESCRIPTION.md)**

---

## Participant Rules

* Teams must contain **1–3 members**.
* Teams may use **any technology stack**.
* Teams should commit their work regularly.
* Do **not** commit passwords, API keys, tokens, or other secrets.
* The final state of the repository at the submission deadline will be considered for judging.
* The final Pull Request must be submitted before the official deadline.
* Participants are responsible for ensuring their project can be evaluated.

---

## GitHub Workflow

```
Official Hojathon Repository
        ↓
      Fork
        ↓
   Team's Fork
        ↓
  Build Project
        ↓
  Commit & Push
        ↓
 Complete README
        ↓
   Final PR
        ↓
   Organizers
        ↓
    Judges
```

Don't open a Pull Request for every change. Work normally inside your own fork, committing and pushing as often as you like — only open a Pull Request to the official repository when you're ready to make your **final submission**.

---

## Final Pull Request

When your project is ready, open a Pull Request from your fork's default branch into the official Hojathon repository.

**PR title format:**

```
[TEAM-ID] Project Name
```

**Example:**

```
[TEAM-042] Smart Campus Assistant
```

**The PR description must contain:**

* Team ID
* Team name
* Team members
* Project name
* Problem statement
* Solution
* Technology stack
* Demo URL
* Demo video
* Special instructions for judges

See [`docs/SUBMISSION.md`](docs/SUBMISSION.md) for the full submission checklist and process, and use the [Pull Request template](.github/PULL_REQUEST_TEMPLATE.md) when you open your final PR.
