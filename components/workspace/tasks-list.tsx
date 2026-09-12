import { Card as UICard, CardHeader as UICardHeader, CardTitle as UICardTitle, CardContent as UICardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, XCircle, ListTodo, Calendar, AlertCircle } from "lucide-react";
import type { FollowUpTask, FollowUpStatus } from "@/lib/contracts";

interface TasksListProps {
  tasks: FollowUpTask[];
}

export function TasksList({ tasks }: TasksListProps) {
  const getStatusBadge = (status: FollowUpStatus) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="success" className="gap-1 font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="default" className="gap-1 font-medium bg-teal-50 text-teal-700 border-teal-200">
            <Clock className="h-3 w-3" />
            <span>In Progress</span>
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="gap-1 text-slate-500 bg-slate-100">
            <XCircle className="h-3 w-3" />
            <span>Cancelled</span>
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge variant="warning" className="gap-1 font-medium bg-amber-50 text-amber-800 border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        );
    }
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      const isPast = date.getTime() < Date.now();
      const formatted = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
      return { formatted, isPast };
    } catch {
      return { formatted: dateStr, isPast: false };
    }
  };

  return (
    <UICard className="border-slate-200/90 shadow-xs overflow-hidden">
      <UICardHeader className="border-b border-slate-100 bg-slate-50/70 py-3.5 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
              <ListTodo className="h-4 w-4" />
            </div>
            <UICardTitle className="text-sm font-bold text-slate-900">
              Follow-up Care Actions
            </UICardTitle>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>
      </UICardHeader>
      <UICardContent className="p-4 sm:p-6">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-2">
              <ListTodo className="h-6 w-6 text-slate-400 stroke-[1.5]" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No follow-up tasks</p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              You are all caught up on your post-care follow-up actions and orders.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const dueInfo = formatDueDate(task.due_at);
              const isPending = task.status === "pending";

              return (
                <div
                  key={task.id}
                  className={`group relative flex flex-col justify-between gap-3 rounded-xl border p-4 transition-all sm:flex-row sm:items-center ${
                    isPending
                      ? "border-slate-200 bg-white hover:border-teal-300 hover:shadow-xs"
                      : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-teal-900 transition-colors">
                        {task.title}
                      </h4>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {dueInfo && (
                      <div className="flex items-center gap-2 pt-1">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                            dueInfo.isPast && isPending
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Calendar className="h-3 w-3" />
                          <span>{dueInfo.isPast && isPending ? "Overdue: " : "Due: "}{dueInfo.formatted}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {getStatusBadge(task.status)}
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

