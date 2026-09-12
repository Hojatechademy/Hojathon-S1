import { SchemaType, type FunctionDeclaration } from "@google/generative-ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FollowUpStatus } from "@/lib/contracts";

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  result: any;
  summary: string;
  mutatedData?: boolean;
}

export const agentFunctionDeclarations: FunctionDeclaration[] = [
  {
    name: "get_follow_up_status",
    description: "Retrieve current patient follow-up status, including pending tasks, overdue actions, upcoming appointments, missed visits, and pending reminders.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_upcoming_appointments",
    description: "List all scheduled appointments with dates, times, locations, and doctor/clinic names for the patient.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "update_follow_up_status",
    description: "Update the status of a specific follow-up task (e.g. mark as in_progress, completed, or cancelled).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskId: {
          type: SchemaType.STRING,
          description: "The UUID of the follow-up task to update.",
        },
        status: {
          type: SchemaType.STRING,
          description: "The new status. Must be one of: 'pending', 'in_progress', 'completed', 'cancelled'.",
        },
      },
      required: ["taskId", "status"],
    },
  },
  {
    name: "create_reminder",
    description: "Schedule an in-app follow-up reminder at a designated time. Note: This creates an in-app reminder in the patient workspace.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        remindAt: {
          type: SchemaType.STRING,
          description: "ISO 8601 UTC timestamp for the reminder (e.g. 2026-09-13T09:00:00Z).",
        },
        taskId: {
          type: SchemaType.STRING,
          description: "Optional UUID of an existing follow-up task this reminder belongs to.",
        },
        note: {
          type: SchemaType.STRING,
          description: "Optional brief note or title for the reminder if not tied to an existing task.",
        },
      },
      required: ["remindAt"],
    },
  },
  {
    name: "create_follow_up_task",
    description: "Create a new administrative or care follow-up task for the patient (e.g. Schedule lab blood draw, Pick up prescription, Call cardiology clinic).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description: "Title of the follow-up action (1 to 160 characters).",
        },
        description: {
          type: SchemaType.STRING,
          description: "Optional detailed instructions or context.",
        },
        dueAt: {
          type: SchemaType.STRING,
          description: "Optional ISO 8601 UTC due date string.",
        },
      },
      required: ["title"],
    },
  },
];

export async function executeAgentTool(
  supabase: SupabaseClient,
  userId: string,
  toolName: string,
  args: Record<string, any>
): Promise<ToolExecutionResult> {
  try {
    switch (toolName) {
      case "get_follow_up_status": {
        const [tasksRes, apptsRes, remsRes] = await Promise.all([
          supabase.from("follow_up_tasks").select("*").eq("patient_id", userId),
          supabase.from("appointments").select("*").eq("patient_id", userId),
          supabase.from("reminders").select("*").eq("patient_id", userId),
        ]);

        const tasks = tasksRes.data || [];
        const appts = apptsRes.data || [];
        const rems = remsRes.data || [];

        const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
        const missedVisits = appts.filter((a) => a.status === "missed");
        const upcomingVisits = appts.filter((a) => a.status === "scheduled");

        return {
          toolName,
          success: true,
          mutatedData: false,
          summary: `Retrieved follow-up status: ${pendingTasks.length} pending tasks, ${upcomingVisits.length} upcoming visits, ${missedVisits.length} missed visits.`,
          result: {
            tasks,
            pendingTasksCount: pendingTasks.length,
            upcomingAppointments: upcomingVisits,
            missedAppointments: missedVisits,
            activeReminders: rems.filter((r) => r.status === "pending"),
          },
        };
      }

      case "list_upcoming_appointments": {
        const { data, error } = await supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", userId)
          .eq("status", "scheduled")
          .order("starts_at", { ascending: true });

        if (error) throw new Error(error.message);

        return {
          toolName,
          success: true,
          mutatedData: false,
          summary: `Found ${(data || []).length} scheduled appointments.`,
          result: data || [],
        };
      }

      case "update_follow_up_status": {
        const { taskId, status } = args;
        const validStatuses: FollowUpStatus[] = ["pending", "in_progress", "completed", "cancelled"];
        if (!validStatuses.includes(status as FollowUpStatus)) {
          return {
            toolName,
            success: false,
            mutatedData: false,
            summary: `Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`,
            result: { error: `Invalid status: ${status}` },
          };
        }

        const { data, error } = await supabase
          .from("follow_up_tasks")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", taskId)
          .eq("patient_id", userId)
          .select()
          .single();

        if (error) throw new Error(error.message);

        return {
          toolName,
          success: true,
          mutatedData: true,
          summary: `Task "${data.title}" status updated to ${status}.`,
          result: data,
        };
      }

      case "create_reminder": {
        const { remindAt, taskId, note } = args;

        // Verify valid date
        const parsedDate = new Date(remindAt);
        if (isNaN(parsedDate.getTime())) {
          return {
            toolName,
            success: false,
            mutatedData: false,
            summary: `Invalid date format for remindAt: ${remindAt}`,
            result: { error: "Invalid date format" },
          };
        }

        let assignedTaskId = taskId || null;

        // If note is provided and no taskId, create a corresponding follow-up task
        if (note && !assignedTaskId) {
          const { data: newTask } = await supabase
            .from("follow_up_tasks")
            .insert({
              patient_id: userId,
              title: note.slice(0, 160),
              status: "pending",
              due_at: parsedDate.toISOString(),
            })
            .select()
            .single();

          if (newTask) {
            assignedTaskId = newTask.id;
          }
        }

        const { data, error } = await supabase
          .from("reminders")
          .insert({
            patient_id: userId,
            task_id: assignedTaskId,
            remind_at: parsedDate.toISOString(),
            status: "pending",
          })
          .select()
          .single();

        if (error) throw new Error(error.message);

        const formattedTime = parsedDate.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        return {
          toolName,
          success: true,
          mutatedData: true,
          summary: `Created in-app reminder scheduled for ${formattedTime}.`,
          result: data,
        };
      }

      case "create_follow_up_task": {
        const { title, description, dueAt } = args;
        if (!title) {
          return {
            toolName,
            success: false,
            mutatedData: false,
            summary: "Task title is required.",
            result: { error: "Task title is required" },
          };
        }

        let isoDue: string | null = null;
        if (dueAt) {
          const parsed = new Date(dueAt);
          if (!isNaN(parsed.getTime())) {
            isoDue = parsed.toISOString();
          }
        }

        const { data, error } = await supabase
          .from("follow_up_tasks")
          .insert({
            patient_id: userId,
            title: title.slice(0, 160),
            description: description || null,
            due_at: isoDue,
            status: "pending",
          })
          .select()
          .single();

        if (error) throw new Error(error.message);

        return {
          toolName,
          success: true,
          mutatedData: true,
          summary: `Created follow-up task "${data.title}".`,
          result: data,
        };
      }

      default:
        return {
          toolName,
          success: false,
          mutatedData: false,
          summary: `Unknown tool: ${toolName}`,
          result: { error: `Tool ${toolName} not supported.` },
        };
    }
  } catch (err: any) {
    return {
      toolName,
      success: false,
      mutatedData: false,
      summary: `Error executing ${toolName}: ${err.message}`,
      result: { error: err.message },
    };
  }
}
