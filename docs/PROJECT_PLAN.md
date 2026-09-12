# Care Follow-up Agent — Project Plan

## Architecture & MVP Overview

A patient-facing workspace paired with an administrative AI assistant that helps patients organize and complete post-care tasks, reschedule missed appointments, and set in-app reminders.

## Module Breakdown

### Module 1: Patient Workspace (Developer 1) — COMPLETED
- Protected authentication flow with Supabase Auth.
- Context data fetching (`getFollowUpContext`) adhering to RLS.
- Patient dashboard with tasks, appointments, and in-app reminders.
- "Needs Attention" overview surfacing missed visits and urgent tasks.
- Developer 2 Agent Panel integration slot with auto-revalidation.

### Module 2: Follow-up AI Agent & Actions (Developer 2)
- Gemini orchestration using `@google/generative-ai`.
- Tool execution: `get_follow_up_status`, `list_upcoming_appointments`, `update_follow_up_status`, `create_reminder`.
- Agent Panel UI plugged into Developer 1's `AgentSlot`.
- Plain-language non-clinical responses with truthful fallback behavior.

## Timeline & Coordination
- 0:00 - 0:20: Shared setup and schema contracts.
- 0:20 - 1:50: Parallel development (Developer 1: Workspace; Developer 2: Agent Tools).
- 1:50 - 3:10: Agent Panel and Dashboard integration.
- 3:10 - 4:00: End-to-end demo flow testing.
- 4:00 - 5:00: Polish, responsive testing, and documentation finalize.
