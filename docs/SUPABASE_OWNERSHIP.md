# Supabase Ownership Boundaries

## Shared Database & Configuration

Both Developer 1 and Developer 2 share a single Supabase project instance.

- **Schema Migration**: `supabase/migrations/001_foundation.sql` defines:
  - `patient_profiles` (RLS: `auth.uid() = id`)
  - `follow_up_tasks` (RLS: `auth.uid() = patient_id`)
  - `appointments` (RLS: `auth.uid() = patient_id`)
  - `reminders` (RLS: `auth.uid() = patient_id`)

## Developer 1 Ownership
- Supabase Auth (Sign in, sign up, sign out, session tokens).
- Patient Workspace reads: `getFollowUpContext()` in `lib/workspace/context.ts`.
- Profile creation / bootstrap on first sign-in.

## Developer 2 Ownership
- Follow-up Agent tool executions / mutations:
  - `update_follow_up_status`: updates `follow_up_tasks`
  - `create_reminder`: inserts into `reminders`
  - Context retrieval for Gemini prompt construction outside client boundaries.
