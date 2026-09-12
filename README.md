# Care Follow-up Agent

Build agents that do more than respond: this project helps patients keep track of healthcare follow-up actions, appointments, reminders, and next steps.

## Project

### Problem statement

Patients miss or lose track of follow-up actions after healthcare interactions. This requires an agent because the system must read current state, understand a patient goal, select an administrative action, persist the result, and support a later follow-up—not merely return a static answer.

### Proposed solution

The Care Follow-up Agent gives an authenticated patient a single view of follow-up tasks, appointments, and reminders. A server-side Gemini agent reads relevant patient context, proposes one of a small set of approved actions, and lets validated Next.js server functions perform the change through Supabase.

The product is administrative and informational only. It does not diagnose, prescribe, change medication, interpret clinical results, or invent clinical information.

### Key features

- Patient follow-up workspace with task and appointment status.
- Gemini-backed stateful agent with allow-listed tools.
- Persisted follow-up status updates and in-app reminders.
- Safe fallback behavior when AI, data, or integrations are unavailable.

### Technology stack

| Category | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript, shadcn/ui |
| Server | Next.js Server Actions / Route Handlers |
| Database | Supabase PostgreSQL, Auth, RLS |
| AI | Gemini API through a server-side SDK |

### How it works

```text
Patient
  ↓
Next.js Agent Server Layer
  ↓
Gemini
  ↓
Allow-listed tool selection
  ↓
Validation + authorization
  ↓
Supabase
  ↓
Persisted result and updated application state
```

Approved tools are `get_follow_up_status`, `list_upcoming_appointments`, `update_follow_up_status`, and `create_reminder`. Gemini never accesses Supabase or executes arbitrary functions.

## Setup and installation

Prerequisites: Git, Node.js 20+, npm, access to the shared Supabase project, and a valid Gemini API key.

```bash
git clone https://github.com/mohammadkaifktraihsoft-ai/Hojathon-S1.git
cd Hojathon-S1
npm install
```

Copy `.env.example` to `.env.local` and fill in the shared Supabase URL, shared Supabase publishable key, and `GEMINI_API_KEY`. `GEMINI_MODEL` is optional. Both developers use the same Supabase project; never create separate developer projects. Never commit `.env.local` or real credentials.

Supabase ownership is module-focused: Developer 1 owns Patient Workspace data operations, Developer 2 owns Follow-up Agent data operations, and schema/migrations/RLS/shared contracts are coordinated changes. Privileged operations remain server-side and service-role credentials are never exposed to the browser.

Required variables are documented in [docs/SETUP.md](docs/SETUP.md). The AI Agent requires a valid `GEMINI_API_KEY`; the server should show a clear configuration message if it is missing.

## Running and testing

The application implementation is the next build phase. Once initialized:

```bash
npm run dev
npm run typecheck
npm run build
```

Judges should sign in, inspect follow-up state, ask the agent about a missed appointment, and verify that an approved action updates persisted state.

## Team information

Complete the team ID, team name, and member names in [docs/TEAM.md](docs/TEAM.md) before submission.

## Documentation

- [Project plan](docs/PROJECT_PLAN.md)
- [Setup guide](docs/SETUP.md)
- [Submission checklist](docs/SUBMISSION.md)
- [Team information](docs/TEAM.md)

## Participant and GitHub rules

Teams may contain 1–3 members. Commit regularly, never commit passwords/API keys/tokens, and submit one final Pull Request from the team fork to the official Hojathon repository. Do not open a Pull Request for every feature.

Final PR title format:

```text
[TEAM-ID] Project Name
```
