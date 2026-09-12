# Developer 2 — Follow-up Agent and Actions Implementation Prompt

You are Developer 2 for the Care Follow-up Agent in the team’s canonical Hojathon repository. The foundation is already complete. Do not recreate or redesign it. Read the repository and its documentation, inspect the existing code, and implement only the Follow-up AI Agent & Actions module.

## Read first

Read `README.md`, `docs/PROJECT_PLAN.md`, `docs/SETUP.md`, `docs/SUPABASE_OWNERSHIP.md`, `docs/SUBMISSION.md`, `package.json`, `components.json`, `app/`, `lib/contracts.ts`, `lib/supabase/server.ts`, `lib/gemini/server.ts`, and `supabase/migrations/001_foundation.sql`.

The existing foundation is Next.js App Router, React, TypeScript, Tailwind/shadcn conventions, one shared Supabase project with Auth/Postgres/RLS, and one server-only Gemini client at `lib/gemini/server.ts` using `@google/generative-ai`.

## Product context and MVP

Patients lose track of healthcare follow-up actions, appointments, reminders, and next steps. The core demo is: “I missed my follow-up appointment. What should I do next?” → read current state → select an approved administrative action → validate and authorize it → persist the change → return truthful updated state.

The agent is not a diagnostic or prescribing system. It must not diagnose, prescribe, change medication, interpret clinical results, invent clinical information, or make unsupported medical decisions.

## Your ownership

Own the complete Follow-up AI Agent & Actions module end-to-end:

- Gemini orchestration through the existing server-only client.
- Patient context retrieval for the agent.
- Allow-listed tool/action selection and execution.
- Follow-up status updates and reminder creation.
- Validation and authorization.
- Supabase interaction required by this module.
- The actual Agent Panel UI, suggested prompts, action confirmations, and fallback states.
- Testing and documentation.

Developer 1 owns authentication, the Patient Workspace, dashboard layout, and only the dashboard integration point. Do not assign the Agent Panel implementation to Developer 1 or duplicate it in the dashboard module.

## Required architecture

```text
Patient
  ↓
Next.js Agent Server Layer
  ↓
Existing Gemini server client
  ↓
Allow-listed tool selection
  ↓
Validation + authorization outside the model
  ↓
Supabase through approved server-side functions/actions
  ↓
Persisted result
  ↓
Updated application state
```

Use the existing `lib/gemini/server.ts`. Do not create a second Gemini client, change the provider, add another AI SDK, or reconfigure Gemini unnecessarily. Gemini must not directly access Supabase, receive Supabase credentials, execute arbitrary server functions, modify the database, or bypass authorization. Treat model output as an untrusted proposal that must be parsed and validated by Next.js code.

## Agent workflow and tools

1. Authenticate the request using the Supabase session.
2. Retrieve only the current patient’s relevant profile, tasks, appointments, and reminders.
3. Send minimized context and tool descriptions to Gemini through the existing server client when useful.
4. Classify the request and treat Gemini’s result only as a proposed action.
5. Execute only a validated allow-listed tool.
6. Enforce ownership, status, timestamp, and input validation outside the model.
7. Persist the mutation through Supabase.
8. Return the persisted result and a truthful plain-language response.

Required tools/actions:

- `get_follow_up_status`
- `list_upcoming_appointments`
- `update_follow_up_status`
- `create_reminder`

Use the existing contracts in `lib/contracts.ts`. Preserve UUID string IDs, ISO 8601 UTC timestamps, and existing status names. The expected public shape is:

- `getFollowUpContext()` → `{ profile, tasks, appointments, reminders }` or typed error.
- `updateFollowUpStatus({ taskId, status })` → `{ task }`.
- `createReminder({ taskId?, remindAt })` → `{ reminder }`.
- `runAgent({ message })` → `{ response, actions, contextUpdated }`.

## Agent Panel and failure behavior

You own the sole Agent Panel implementation. Use the existing shadcn-compatible setup and `components.json`; do not add another UI library. Include a labeled message input, suggested prompt, response live region, submit/loading state, action confirmation, unsupported medical-request boundary, and error states.

If Gemini is missing, unavailable, returns malformed output, or the database fails, use a deterministic truthful fallback: show current stored context or an actionable error and never claim success. In-app reminder persistence must not be described as an external notification.

## Supabase and authorization

Use the existing `lib/supabase/server.ts` client and one shared Supabase project. Developer 2 owns only the Supabase reads/writes required by this module. Do not modify unrelated Patient Workspace data logic or create duplicate database access. Schema, migrations, RLS, shared database contracts, and authentication assumptions are coordinated files; coordinate before changing them.

Use `patient_profiles`, `follow_up_tasks`, `appointments`, and `reminders` with existing RLS. Derive the user from the server session; never trust a browser-supplied patient ID. Privileged operations must remain server-side. Never expose a service-role key to client code.

## Files and prohibited work

Expected areas: new server actions or functions under `lib/agent/` or `lib/actions/`, the Agent Panel under `components/`, and narrowly scoped docs/tests. Do not create a separate Express/Nest backend, mandatory service layer, duplicate Gemini client, duplicate Supabase project, or unnecessary dependency.

Do not silently change architecture, contracts, statuses, schema, RLS, or auth assumptions. Do not build coordinator views, external notifications, calendars, analytics, clinical records, or RBAC for this P0.

## Git and workflow

Work on `feature/follow-up-agent`; do not create permanent frontend/backend/staging branches. Follow this mandatory workflow:

READ DOCS → UNDERSTAND CURRENT STATE → IMPLEMENT → TEST → UPDATE DOCS IMMEDIATELY → UPDATE PROJECT STATUS/HANDOFF → REVIEW DIFF → COMMIT

If `docs/PROJECT_STATUS.md` or `docs/HANDOFF.md` does not yet exist, create the appropriate documentation there. A task is incomplete while relevant documentation is stale.

## Testing and definition of done

Test authenticated/unauthenticated requests, current-user ownership, invalid IDs/statuses/timestamps, each required tool, successful persistence, malformed Gemini output, missing/provider-failure fallback, unsupported medical requests, database failure, action-result shape, and Agent Panel accessibility. Run `npm run typecheck`, `npm run build`, and `git diff --check`.

Done means the missed-follow-up demo works against persisted Supabase state, Gemini is used only through the existing foundation, all actions are allow-listed and authorized outside the model, the Agent Panel is implemented once, documentation is current, tests pass, and the reviewed commit is mergeable.

## Priority

P0 only: context retrieval, the four required tools, persisted task/reminder changes, Gemini orchestration, Agent Panel, safety boundary, and truthful fallback. Keep implementation within the four-hour plan and preserve the final hour for integration, bug fixing, polish, and demo preparation.
