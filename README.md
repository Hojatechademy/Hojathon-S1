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

Fill this in as soon as your team is formed.

**Team ID:** 77

**Team Name:** Mohammed Nihal

**Team Members:**

1. Mohammed Nihal

**Project Name:** Symptom-to-Care Navigator

> Teams may have **1, 2, or 3 members**.

---

## Project Documentation

### Project Name

Symptom-to-Care Navigator

### Team

Team 77 — Mohammed Nihal (solo)

### Problem Statement

When someone feels unwell, the hardest part often isn't finding a doctor — it's figuring out *how urgently* they need one, and getting that context in front of a clinician efficiently. A static symptom-checker form asks the same fixed questions to everyone regardless of what they've already said, and can't reason about which follow-up would actually rule a serious cause in or out. This calls for an agent: something that reads what the patient has said so far, decides *for itself* what to ask next to most efficiently narrow down red flags, checks the answers against a real clinical decision table, and then acts on the result — not just a chatbot that talks about symptoms.

### Proposed Solution

Symptom-to-Care Navigator takes a patient's free-text description of what's wrong and runs an agent loop with a real division of labor: an LLM (Gemini) reads the conversation so far and decides what single follow-up question would be most useful to ask next, prioritizing whatever would confirm or rule out an emergency; a deterministic rules engine (not the LLM) checks the accumulated facts against a red-flag table after every answer and decides the urgency tier; and once a tier is reached, the agent takes a concrete action — for Emergency/Urgent cases it looks up the nearest appropriate hospital, asks the patient to confirm, and (in this prototype) simulates notifying the ED and scheduling a callback. Every reasoning step is printed live ("Checking red flag: ... -> YES/no") so the decision process is visible, not hidden inside a single opaque LLM call. The whole thing stops early and gracefully if the complaint falls outside its current scope (headache/neurological), rather than asking mismatched questions.

### Key Features

* **Dynamic follow-up questioning** — the agent decides what to ask next based on the conversation so far, not a fixed form; it stops asking as soon as an emergency is confirmed instead of working through a script.
* **Deterministic red-flag rules engine as a real tool call** — urgency is decided by checking patient facts against a structured table (thunderclap onset, worst headache of life, meningitic signs, etc.), not by LLM judgment, and every check is printed live as it runs.
* **Hospital routing with simulated real-world action** — for Urgent/Emergency tiers, the agent selects the nearest appropriate hospital from a real local directory (Perinthalmanna, Kerala), asks for confirmation, then simulates notifying the ED and scheduling a callback with a reference ID — a stand-in for a real hospital API integration.
* **Doctor-ready pre-visit summary** — every run ends with a structured summary (presenting complaint, Q&A given, structured findings, suspected concern, urgency tier, recommended care level) that a clinician could actually use.
* **Scope check** — gracefully declines out-of-scope complaints (e.g. stomach pain) instead of forcing them through headache-specific questions.
* **Two interfaces, one unmodified core** — a terminal CLI (`main.py`) and an optional Streamlit web UI (`app.py`) that call the exact same conversation/rules/hospital-routing logic; a `--mock` mode (CLI flag / sidebar toggle) exercises the entire flow with canned responses and zero API calls, for demoing and testing under tight free-tier quotas.

### Technology Stack

| Category | Technology |
| -------- | ---------- |
| Frontend | Streamlit (optional web UI); plain terminal for the CLI |
| Backend  | Python 3.10+, no framework |
| Database | None — in-memory conversation state for the duration of one run |
| AI/ML    | Google Gemini (`gemini-3.5-flash-lite`) via the `google-genai` SDK |
| APIs     | Google Gemini API; hospital ED notification/callback are simulated in this prototype, standing in for a real hospital system API |
| Other    | `python-dotenv` for loading the API key from `.env` |

### How It Works

1. **Scope check** — the patient's free-text description is sent to Gemini once, which extracts any known clinical facts (onset, severity, vision changes, etc.) and a plain-language summary in the same call. A local keyword check (`scope_check.py`) confirms the complaint is headache/neurological before continuing; otherwise the agent stops and says so.
2. **Dynamic questioning** — in the same call (and each call thereafter), Gemini also picks the single most useful still-unknown field to ask about next, prioritizing whatever would most efficiently confirm or rule out an emergency. Extraction of the user's answer and the next question are combined into one Gemini call per turn to minimize API usage.
3. **Red-flag tool call** — after every new fact, `rules_engine.py` checks the accumulated facts against a fixed table of red-flag combinations (e.g. sudden + severe onset, worst headache of life, fever + neck stiffness) and returns an urgency tier: Emergency, Urgent, Routine, or Self-care. This check — not the LLM — is what decides urgency, and every rule checked is printed live.
4. **Early exit on Emergency** — as soon as the rules engine returns Emergency, the agent stops asking questions immediately rather than continuing a fixed script.
5. **Action: hospital routing** (Urgent/Emergency only) — `hospital_routing.py` selects the nearest appropriate hospital from a hardcoded local directory (preferring ER-capable facilities for Emergency), shows the recommendation and contact details, and asks the patient to confirm before doing anything further.
6. **Simulated notification** — on confirmation, `notify_ed()` and `schedule_callback()` print what would be sent to the hospital and return a fake confirmation ID / reference ID — clearly marked as simulated, designed so the same call signatures could plug into a real hospital API in production.
7. **Summary generation** — `summary.py` formats the final doctor-ready output: presenting complaint, all questions and answers, structured findings, suspected concern, urgency tier, and recommended care level.

Both `main.py` (CLI) and `app.py` (Streamlit) drive this exact same sequence — the UI only changes how questions are asked and reasoning is displayed (terminal prints vs. a web page), never the underlying logic.

### Setup & Installation

See [`docs/SETUP.md`](docs/SETUP.md) for full setup instructions and [`src/README.md`](src/README.md) for a per-file breakdown of the code.

Quick start:

```bash
git clone https://github.com/<your-username>/<your-fork>.git
cd Hojathon-S1
pip install -r requirements.txt
cp .env.example .env   # then add your GEMINI_API_KEY
```

### Running the Project

**CLI:**

```bash
python src/main.py
```

**Web UI:**

```bash
streamlit run src/app.py
```

Try the demo scenario: *"I've had a headache since yesterday and I feel a bit dizzy."* For an Emergency scenario (triggers hospital routing), try: *"This is the worst headache of my life, it started suddenly and I feel dizzy."*

Add `--mock` (CLI) or check "Use mock agent" in the sidebar (web UI) to run the full flow with canned responses and zero Gemini API calls.

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
