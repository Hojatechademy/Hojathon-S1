# Care Follow-up Agent — Project Plan

## Problem and product

Patients lose track of follow-up actions after healthcare interactions. The product is a small, stateful AI Follow-up Care Agent for the Healthcare & Wellness Agents category.

The MVP helps one authenticated patient track follow-up tasks, appointments, reminders, and next steps. It demonstrates understanding, state retrieval, decision-making, approved tool use, persisted state change, and later follow-up.

## Safety boundary

The agent handles follow-up coordination, appointment management, reminders, follow-up status, and administrative next steps only. It must not diagnose, prescribe, change medication, interpret clinical results, invent clinical information, or make unsupported medical decisions.

## MVP scope

**P0:** authenticated patient workspace; open/missed task and appointment state; Gemini-backed agent; `get_follow_up_status`; `list_upcoming_appointments`; `update_follow_up_status`; `create_reminder`; persisted in-app reminders; truthful failure handling; complete missed-follow-up demo flow.

**P1:** richer filters, coordinator view, improved intent handling.

**P2:** external notifications, calendar integrations, analytics, clinical-record integrations, and multi-role RBAC.

## Planned architecture

Next.js/React UI using shadcn/ui → Next.js server agent layer → Gemini → allow-listed tool selection → validation and authorization → Supabase Auth/PostgreSQL/RLS → persisted result → refreshed UI state.

Gemini is server-only. It never receives Supabase credentials, accesses Supabase directly, executes arbitrary functions, or bypasses authorization. The Next.js server layer owns tool execution.

## Module ownership

### Developer 1 — Patient Workspace

Own authentication, protected dashboard, patient context reads, task/appointment/reminder presentation, responsive states, and the dashboard integration point. Branch: `feature/patient-workspace`.

### Developer 2 — Follow-up Agent and Actions

Own the Gemini-backed orchestration, context retrieval, four tools, validation, authorization, Supabase mutations, the sole Agent Panel implementation, testing, and documentation. Branch: `feature/follow-up-agent`.

Shared changes require coordination: data contracts, migration/RLS, environment variable names, package files, and API/action-result shapes.

## Implementation schedule

0:00–0:20 shared setup and contracts; 0:20–1:50 parallel patient workspace and agent actions; 1:50–3:10 agent UI and integration; 3:10–4:00 complete core flow; 4:00–5:00 testing, bug fixing, polish, and demo preparation.

## Testing approach

Test authentication, RLS ownership, empty/loading/error states, tool validation, persisted task/reminder changes, Gemini failure fallback, unsupported medical requests, mobile layout, and the complete missed-follow-up flow. The final clean-clone setup must run `npm install`, configure `.env.local`, apply migrations, and start the app.

## Documentation rules

Every implementation agent reads the docs before editing, inspects existing code, implements only its module, tests, updates documentation and status immediately, reviews the diff, and commits on its feature branch. Do not commit secrets.
