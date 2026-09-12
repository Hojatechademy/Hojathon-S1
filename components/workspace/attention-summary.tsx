import { AlertCircle, CalendarX, CheckCircle2, Clock, PhoneCall, ArrowRight } from "lucide-react";
import type { PatientContext } from "@/lib/contracts";
import Link from "next/link";

interface AttentionSummaryProps {
  context: PatientContext;
}

export function AttentionSummary({ context }: AttentionSummaryProps) {
  const missedAppointments = context.appointments.filter((a) => a.status === "missed");
  const pendingTasks = context.tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const pendingReminders = context.reminders.filter((r) => r.status === "pending");

  const hasNeedsAttention = missedAppointments.length > 0 || pendingTasks.length > 0;

  if (!hasNeedsAttention) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50 via-white to-teal-50/40 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-emerald-950">
                Care Follow-up Up to Date
              </h3>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                Current
              </span>
            </div>
            <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
              No missed visits or urgent pending tasks detected. Your post-discharge follow-up timeline is on schedule.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Urgent Missed Appointment Alert */}
      {missedAppointments.length > 0 && (
        <div className="relative overflow-hidden rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 via-white to-rose-50/50 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
              <CalendarX className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-rose-950">
                    Action Required: Missed Care Visit
                  </h3>
                  <span className="rounded-full bg-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                    {missedAppointments.length} {missedAppointments.length === 1 ? "Visit" : "Visits"}
                  </span>
                </div>
                <Link
                  href="/doctors"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 hover:underline"
                >
                  <span>Reschedule with a Doctor</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <p className="mt-1 text-xs text-rose-900/90 leading-relaxed">
                You have missed your scheduled <strong className="font-semibold">{missedAppointments[0].title}</strong>
                {missedAppointments[0].location ? ` at ${missedAppointments[0].location}` : ""}.
                Promptly reschedule to ensure continuous clinical care monitoring.
              </p>

              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-rose-700/90">
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Need immediate support? Contact your clinic triage line or use the Follow-up Assistant on the right.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Follow-up Actions Notice */}
      {pendingTasks.length > 0 && (
        <div className="relative overflow-hidden rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 via-white to-amber-50/40 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-amber-950">
                    Pending Administrative Actions
                  </h3>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    {pendingTasks.length} Active
                  </span>
                </div>
              </div>
              <p className="mt-1 text-xs text-amber-900/80 leading-relaxed">
                You have {pendingTasks.length} required care action{pendingTasks.length === 1 ? "" : "s"} awaiting completion.
                {pendingReminders.length > 0 && ` You also have ${pendingReminders.length} scheduled reminder notification.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

