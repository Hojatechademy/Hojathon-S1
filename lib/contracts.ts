export type FollowUpStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type AppointmentStatus = "scheduled" | "missed" | "rescheduled" | "completed" | "cancelled";
export type ReminderStatus = "pending" | "sent" | "dismissed";
export type AgentAction = "get_follow_up_status" | "list_upcoming_appointments" | "update_follow_up_status" | "create_reminder";
