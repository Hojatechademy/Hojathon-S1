"use client";

import { Card as UICard, CardHeader as UICardHeader, CardTitle as UICardTitle, CardContent as UICardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, XCircle, ListTodo, Calendar, Check, RotateCcw } from "lucide-react";
import type { FollowUpTask, FollowUpStatus } from "@/lib/contracts";
import { useState, useTransition } from "react";
import { updateTaskStatus } from "@/app/workspace/actions";

interface TasksListProps {
  tasks: FollowUpTask[];
}

export function TasksList({ tasks }: TasksListProps) {
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggleComplete = (task: FollowUpTask) => {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    setPendingTaskId(task.id);
    startTransition(async () => {
      await updateTaskStatus(task.id, nextStatus);
      setPendingTaskId(null);
    });
  };

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
      <UICardHeader className="border-b border-slate-100 p-4 sm:p-6 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-400">
              <ListTodo className="h-4 w-4" />
            </div>
            <UICardTitle className="text-sm font-bold text-slate-900 dark:text-white">
              Follow-up Care Actions
            </UICardTitle>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>
      </UICardHeader>
      <UICardContent className="p-4 sm:p-6">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 dark:text-slate-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-2 dark:bg-slate-800">
              <ListTodo className="h-6 w-6 text-slate-400 stroke-[1.5]" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No follow-up tasks</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              You are all caught up on your post-care follow-up actions and orders.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const dueInfo = formatDueDate(task.due_at);
              const isCompleted = task.status === "completed";
              const isUpdating = isPending && pendingTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className={`group relative flex flex-col justify-between gap-3 rounded-xl border p-4 transition-all sm:flex-row sm:items-center ${
                    isCompleted
                      ? "border-slate-100 bg-slate-50/40 opacity-80 dark:border-slate-800/60 dark:bg-slate-900/40"
                      : "border-slate-200 bg-white hover:border-teal-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-teal-700"
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-semibold transition-colors ${
                        isCompleted ? "line-through text-slate-500 dark:text-slate-500" : "text-slate-900 dark:text-slate-100 group-hover:text-teal-900 dark:group-hover:text-teal-300"
                      }`}>
                        {task.title}
                      </h4>
                    </div>

                    {task.description && (
                      <p className={`text-xs line-clamp-2 leading-relaxed ${isCompleted ? "text-slate-400 dark:text-slate-500" : "text-slate-600 dark:text-slate-400"}`}>
                        {task.description}
                      </p>
                    )}

                    {dueInfo && (
                      <div className="flex items-center gap-2 pt-1">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                            dueInfo.isPast && !isCompleted
                              ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          <Calendar className="h-3 w-3" />
                          <span>{dueInfo.isPast && !isCompleted ? "Overdue: " : "Due: "}{dueInfo.formatted}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-center">
                    {getStatusBadge(task.status)}
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      disabled={isUpdating}
                      title={isCompleted ? "Mark as pending" : "Mark as completed"}
                      className={`flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold transition-all ${
                        isCompleted
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          : "bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100"
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <RotateCcw className="h-3 w-3" />
                          <span className="hidden sm:inline">Reopen</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3" />
                          <span>{isUpdating ? "Saving..." : "Complete"}</span>
                        </>
                      )}
                    </button>
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


