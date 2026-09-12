# Developer 1 — Patient Workspace Implementation Prompt

You are Developer 1 for the Care Follow-up Agent in the team’s canonical Hojathon repository. The foundation is already complete. Do not recreate or redesign the project. Read the repository and its documentation, inspect the existing code, and implement only the Patient Workspace module.

## Read first

Read `README.md`, `docs/PROJECT_PLAN.md`, `docs/SETUP.md`, `docs/SUPABASE_OWNERSHIP.md`, `docs/SUBMISSION.md`, `package.json`, `components.json`, `app/`, `lib/contracts.ts`, `lib/supabase/server.ts`, `lib/gemini/server.ts`, and `supabase/migrations/001_foundation.sql`. The current foundation uses Next.js App Router, React, TypeScript, Tailwind/shadcn conventions, Supabase SSR/Auth/Postgres/RLS, and a server-only Gemini client.

## Product context and MVP

Patients lose track of healthcare follow-up actions, appointments, reminders, and next steps. The MVP is a stateful administrative assistant, not a generic chatbot. A patient should be able to authenticate, see current follow-up state, ask what to do next, and receive a persisted administrative update.

The agent must never diagnose, prescribe, change medication, interpret clinical results, invent clinical information, or make unsupported medical decisions.

## Your ownership

Own the complete Patient Workspace module end-to-end:

- Authentication/session handling.
- Protected patient dashboard.
- Patient context reads for profile, follow-up tasks, appointments, and reminders.
- Task, appointment, and reminder presentation.
- Loading, empty, error, unauthorized, and responsive states.
- The dashboard integration point for Developer 2’s agent.

Developer 2 owns the actual Follow-up Agent, all agent tools/actions, and the Agent Panel UI. Do not implement or duplicate the Agent Panel. You may provide its dashboard slot, typed props, refresh callback, and integration boundary only.

## User flow

1. Unauthenticated user is shown a clear sign-in experience or protected-route response.
2. Authenticated patient reaches a patient workspace.
3. Workspace reads only the current patient’s state.
4. Patient sees pending/missed follow-up tasks, appointments, and reminders.
5. Workspace renders Developer 2’s Agent Panel through a stable integration point.
6. After `contextUpdated: true`, refresh the dashboard from persisted state.

## UI requirements

Use the existing shadcn-compatible setup and `components.json`; do not add another UI library. Build only what P0 needs:

- Sign-in/session UI.
- Dashboard header and patient context.
- “Needs attention” summary.
- Follow-up task list with status and due date.
- Appointment list with scheduled/missed state.
- Reminder list with in-app reminder wording.
- Agent integration slot, not the Agent Panel itself.
- Skeleton, empty, error, and unavailable states.

Use semantic headings, accessible labels, keyboard focus, non-color status cues, and mobile-first responsive layout.

## Next.js and Supabase responsibilities

Use App Router Server Components and Server Actions where appropriate. Use the existing `lib/supabase/server.ts` server client and the shared Supabase project. Keep data access module-focused and simple; do not create Express/Nest, a second backend, or a controller/service/repository stack.

Supabase operations owned by this module are authenticated patient reads and any dashboard-local session operations. Use the existing `patient_profiles`, `follow_up_tasks`, `appointments`, and `reminders` schema and RLS policies. Never trust a browser-supplied patient ID. Never expose a service-role key. Coordinate before changing schema, migrations, RLS, authentication assumptions, or shared database contracts.

## Shared contracts and agent integration

Use the existing status/action names in `lib/contracts.ts`. Do not silently rename IDs, statuses, timestamps, or response fields. Consume the agreed shapes:

- `getFollowUpContext()` → `{ profile, tasks, appointments, reminders }` or a typed error.
- `runAgent({ message })` → `{ response, actions, contextUpdated }`.

Until Developer 2 is ready, a typed mock adapter is acceptable, but it must have the same eventual shape and must not claim real persistence. Do not import or call Gemini from the dashboard; the server-side agent module owns that integration.

## Files and coordination

Expected areas: `app/`, new patient components under `components/`, and narrowly scoped shared documentation. Coordinate before changing `package.json`, `package-lock.json`, `components.json`, `lib/contracts.ts`, `lib/supabase/server.ts`, `.env.example`, `supabase/migrations/001_foundation.sql`, or shared docs.

Do not modify unrelated agent logic, create duplicate Supabase access, add unnecessary dependencies, create a separate backend, or build P1/P2 features such as coordinator views, external notifications, calendars, analytics, clinical records, or RBAC.

## Git and workflow

Work on `feature/patient-workspace`; do not create permanent frontend/backend/staging branches. Follow this mandatory workflow:

READ DOCS → UNDERSTAND CURRENT STATE → IMPLEMENT → TEST → UPDATE DOCS IMMEDIATELY → UPDATE PROJECT STATUS/HANDOFF → REVIEW DIFF → COMMIT

If `docs/PROJECT_STATUS.md` or `docs/HANDOFF.md` does not yet exist, create the appropriate documentation there. A task is incomplete while relevant documentation is stale.

## Testing and definition of done

Test sign-in/session behavior, protected access, current-user-only reads, loading/empty/error states, task/appointment/reminder rendering, responsive layout, keyboard accessibility, and dashboard refresh after an agent action. Run `npm run typecheck`, `npm run build`, and `git diff --check`.

Done means the authenticated Patient Workspace works against the existing foundation, integrates with Developer 2 without owning the Agent Panel, has no unrelated architecture changes, is documented, tested, and has a reviewed commit.

## Priority

P0 only: auth/session, protected dashboard, real current-patient context, required UI states, and agent integration point. Keep implementation within the four-hour plan and preserve the final hour for integration, bug fixing, polish, and demo preparation.
