export type FollowUpStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type AppointmentStatus = "scheduled" | "missed" | "rescheduled" | "completed" | "cancelled";
export type ReminderStatus = "pending" | "sent" | "dismissed";
export type AgentAction = "get_follow_up_status" | "list_upcoming_appointments" | "update_follow_up_status" | "create_reminder";

export interface PatientProfile {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface FollowUpTask {
  id: string;
  patient_id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  status: FollowUpStatus;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  title: string;
  starts_at: string;
  location: string | null;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  patient_id: string;
  task_id: string | null;
  remind_at: string;
  status: ReminderStatus;
  created_at: string;
}

export interface PatientContext {
  profile: PatientProfile | null;
  tasks: FollowUpTask[];
  appointments: Appointment[];
  reminders: Reminder[];
}

export interface AgentPanelProps {
  patientContext: PatientContext;
  onContextUpdated?: () => void | Promise<void>;
  isAgentAvailable?: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department: string;
  location: string;
  experience: string;
  availableDays: string[];
  timing: string;
  availableSlots: string[];
  status: "available" | "in_consultation" | "off_duty";
  avatarInitials: string;
}
