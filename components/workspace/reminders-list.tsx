import { Card as UICard, CardHeader as UICardHeader, CardTitle as UICardTitle, CardContent as UICardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, CheckCircle2, XCircle, Info, BellRing } from "lucide-react";
import type { Reminder, ReminderStatus, FollowUpTask } from "@/lib/contracts";

interface RemindersListProps {
  reminders: Reminder[];
  tasks?: FollowUpTask[];
}

export function RemindersList({ reminders, tasks = [] }: RemindersListProps) {
  const getStatusBadge = (status: ReminderStatus) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="success" className="gap-1 bg-emerald-50 text-emerald-800 border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Delivered</span>
          </Badge>
        );
      case "dismissed":
        return (
          <Badge variant="secondary" className="gap-1 text-slate-500 bg-slate-100">
            <XCircle className="h-3 w-3" />
            <span>Dismissed</span>
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge variant="warning" className="gap-1 bg-indigo-50 text-indigo-800 border-indigo-200">
            <Clock className="h-3 w-3" />
            <span>Scheduled</span>
          </Badge>
        );
    }
  };

  const formatRemindAt = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const getAssociatedTaskTitle = (taskId: string | null) => {
    if (!taskId) return null;
    const task = tasks.find((t) => t.id === taskId);
    return task?.title || null;
  };

  return (
    <UICard className="border-slate-200/90 shadow-xs overflow-hidden">
      <UICardHeader className="border-b border-slate-100 bg-slate-50/70 py-3.5 px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-400">
              <BellRing className="h-4 w-4" />
            </div>
            <UICardTitle className="text-sm font-bold text-slate-900 dark:text-white">
              In-App Reminders
            </UICardTitle>
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {reminders.length} {reminders.length === 1 ? "reminder" : "reminders"}
          </span>
        </div>
      </UICardHeader>
      <UICardContent className="p-4 sm:p-6">
        <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
          <Info className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
          <span>
            These automated notifications remind you of due follow-ups, upcoming lab visits, and administrative tasks.
          </span>
        </div>

        {reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 dark:text-slate-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-2 dark:bg-slate-800">
              <Bell className="h-6 w-6 text-slate-400 stroke-[1.5]" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No active reminders</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              You can ask the Follow-up Assistant to schedule reminders for any pending tasks.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const formattedTime = formatRemindAt(reminder.remind_at);
              const taskTitle = getAssociatedTaskTitle(reminder.task_id);

              return (
                <div
                  key={reminder.id}
                  className="flex flex-col justify-between gap-2.5 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-teal-300 hover:shadow-xs sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-teal-700"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {taskTitle ? `Reminder: ${taskTitle}` : "General Care Follow-up Reminder"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Trigger: {formattedTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {getStatusBadge(reminder.status)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </UICardContent>
    </UICard>
  );
}

