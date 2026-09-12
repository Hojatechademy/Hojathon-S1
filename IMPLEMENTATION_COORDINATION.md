# Implementation coordination

The authoritative copy-paste-ready instructions are:

- [DEVELOPER_1_PROMPT.md](DEVELOPER_1_PROMPT.md) — `feature/patient-workspace`
- [DEVELOPER_2_PROMPT.md](DEVELOPER_2_PROMPT.md) — `feature/follow-up-agent`

## Ownership boundary

- Developer 1 owns Patient Workspace, authentication/session handling, patient dashboard, patient-facing data reads, and the dashboard integration point only.
- Developer 2 owns Follow-up AI Agent orchestration, the four tools/actions, validation, authorization, module Supabase operations, and the sole Agent Panel UI.

This is complete-module ownership, not a frontend/backend split. Developer 1 must not duplicate the Agent Panel. Developer 2 must not redesign the dashboard.

## Shared coordination

Both developers use one Supabase project, database, Auth configuration, and RLS policy set. Coordinate before changing `lib/contracts.ts`, `supabase/migrations/001_foundation.sql`, authentication assumptions, `.env.example`, `package.json`, lock files, or shared API/data contracts. Keep Supabase access module-focused and server-side.

## Integration order

1. Confirm foundation and shared contracts.
2. Developer 1 builds auth and dashboard context reads.
3. Developer 2 builds Gemini orchestration and validated tools in parallel using typed context mocks.
4. Connect Developer 2’s Agent Panel through Developer 1’s integration point.
5. Run missed-follow-up → approved action → persisted state → dashboard refresh.
6. Test RLS, failures, responsive behavior, accessibility, and demo setup.

## Time box

0:00–0:20 shared setup; 0:20–1:50 parallel modules; 1:50–3:10 Agent Panel and dashboard integration; 3:10–4:00 complete core flow; 4:00–5:00 integration testing, bug fixes, polish, and demo preparation.

## Required workflow

READ DOCS → UNDERSTAND CURRENT STATE → IMPLEMENT → TEST → UPDATE DOCS IMMEDIATELY → UPDATE PROJECT STATUS/HANDOFF → REVIEW DIFF → COMMIT.
