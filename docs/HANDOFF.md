# Handoff Document — Developer 1 to Developer 2

This document details the interface contracts, context shapes, and integration boundary prepared for Developer 2's **Follow-up AI Agent and Actions** module.

---

## 1. Shared Types & Contracts

All contracts reside in `lib/contracts.ts`:

- `PatientContext`:
  ```ts
  export interface PatientContext {
    profile: PatientProfile | null;
    tasks: FollowUpTask[];
    appointments: Appointment[];
    reminders: Reminder[];
  }
  ```
- `AgentPanelProps`:
  ```ts
  export interface AgentPanelProps {
    patientContext: PatientContext;
    onContextUpdated?: () => void | Promise<void>;
    isAgentAvailable?: boolean;
  }
  ```

---

## 2. Server Context Retrieval

Developer 1 has provided `getFollowUpContext()` in `lib/workspace/context.ts`:
- Returns `{ profile, tasks, appointments, reminders }` or `{ error: string }`.
- Derives the patient identity securely from `auth.uid()` via the Supabase server session.
- Safe for Server Actions or Server Components.

---

## 3. Agent Panel Integration Point

Developer 1 created `components/workspace/agent-slot.tsx` and mounted it inside `components/workspace/workspace-view.tsx`.

### How Developer 2 connects the Agent Panel:
1. Implement the Agent Panel component in `components/agent/agent-panel.tsx` (or similar) accepting `AgentPanelProps`.
2. Pass the component to `<AgentSlot>` or import it inside `agent-slot.tsx`.
3. When any tool mutation succeeds (e.g., `update_follow_up_status` or `create_reminder`), call `props.onContextUpdated()`.
4. `WorkspaceView` will immediately invoke `router.refresh()`, triggering a re-read of the live Supabase state and updating the dashboard lists without a full page reload.

---

## 4. Supabase RLS & Test Data

- The `signInAsDemoPatient` action in `app/auth/actions.ts` creates or logs into a test patient (`demo.patient@carefollowup.local`) with seed records:
  - 1 Missed Appointment ("Initial Cardiology Consultation")
  - 1 Scheduled Appointment ("Primary Care Wellness Follow-up")
  - 1 Pending Task ("Schedule Cardiology Post-Discharge Checkup")
  - 1 In-Progress Task ("Complete Fasting Lipid Panel Lab Work")
  - 1 Pending Reminder
- Developer 2 can test the missed-appointment resolution flow immediately using this demo profile.
