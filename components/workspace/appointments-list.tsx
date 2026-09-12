import { Card as UICard, CardHeader as UICardHeader, CardTitle as UICardTitle, CardContent as UICardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle2, RefreshCw, XCircle, Stethoscope, ArrowRight } from "lucide-react";
import type { Appointment, AppointmentStatus } from "@/lib/contracts";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AppointmentsListProps {
  appointments: Appointment[];
}

export function AppointmentsList({ appointments }: AppointmentsListProps) {
  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "missed":
        return (
          <Badge variant="destructive" className="gap-1 font-semibold bg-rose-100 text-rose-800 border-rose-200">
            <AlertCircle className="h-3 w-3" />
            <span>Missed Visit</span>
          </Badge>
        );
      case "scheduled":
        return (
          <Badge variant="default" className="gap-1 font-semibold bg-teal-50 text-teal-800 border-teal-200">
            <Calendar className="h-3 w-3" />
            <span>Scheduled</span>
          </Badge>
        );
      case "rescheduled":
        return (
          <Badge variant="warning" className="gap-1 font-semibold bg-amber-50 text-amber-800 border-amber-200">
            <RefreshCw className="h-3 w-3" />
            <span>Rescheduled</span>
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="success" className="gap-1 font-semibold bg-emerald-50 text-emerald-800 border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </Badge>
        );
      case "cancelled":
      default:
        return (
          <Badge variant="secondary" className="gap-1 text-slate-500 bg-slate-100">
            <XCircle className="h-3 w-3" />
            <span>Cancelled</span>
          </Badge>
        );
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const monthStr = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
      const dayStr = new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(date);
      const weekdayStr = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
      const yearStr = new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(date);
      const timeFormatted = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
      return { monthStr, dayStr, weekdayStr, yearStr, timeFormatted };
    } catch {
      return { monthStr: "---", dayStr: "--", weekdayStr: "", yearStr: "", timeFormatted: dateStr };
    }
  };

  return (
    <UICard className="border-slate-200/90 shadow-xs overflow-hidden">
      <UICardHeader className="border-b border-slate-100 bg-slate-50/70 py-3.5 px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-400">
              <Calendar className="h-4 w-4" />
            </div>
            <UICardTitle className="text-sm font-bold text-slate-900 dark:text-white">
              Appointments & Visits
            </UICardTitle>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {appointments.length}
            </span>
          </div>

          <Link href="/doctors" prefetch={true}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-teal-800 bg-teal-50/60 border-teal-200 hover:bg-teal-100/70 h-8 px-3 shadow-2xs font-semibold w-full sm:w-auto dark:bg-teal-950/60 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-900/60"
            >
              <Stethoscope className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
              <span>Available Doctors & Timings</span>
              <ArrowRight className="h-3 w-3 ml-0.5" />
            </Button>
          </Link>
        </div>
      </UICardHeader>
      <UICardContent className="p-4 sm:p-6">
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 dark:text-slate-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-2 dark:bg-slate-800">
              <Calendar className="h-6 w-6 text-slate-400 stroke-[1.5]" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No appointments recorded</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              You currently have no scheduled or past clinic visits in this workspace.
            </p>
            <Link href="/doctors" prefetch={true} className="mt-4">
              <Button size="sm" className="gap-1.5 text-xs bg-teal-700 hover:bg-teal-800 text-white dark:bg-teal-600 dark:hover:bg-teal-700">
                <Stethoscope className="h-3.5 w-3.5" />
                <span>Browse Hospital Doctors</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => {
              const { monthStr, dayStr, weekdayStr, yearStr, timeFormatted } = formatDateTime(apt.starts_at);
              const isMissed = apt.status === "missed";

              return (
                <div
                  key={apt.id}
                  className={`group flex flex-col justify-between gap-3 rounded-xl border p-4 transition-all sm:flex-row sm:items-center ${
                    isMissed
                      ? "border-rose-200 bg-gradient-to-r from-rose-50/70 via-white to-white hover:border-rose-300 dark:border-rose-900/60 dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-900 dark:hover:border-rose-700"
                      : "border-slate-200 bg-white hover:border-teal-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-teal-700"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Date Ticket Chip */}
                    <div className={`flex flex-col items-center justify-center rounded-xl p-2.5 w-14 text-center border ${
                      isMissed
                        ? "border-rose-200 bg-rose-100/60 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300"
                        : "border-teal-100 bg-teal-50/80 text-teal-900 dark:border-teal-900/60 dark:bg-teal-950/60 dark:text-teal-300"
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{monthStr}</span>
                      <span className="text-lg font-extrabold leading-none">{dayStr}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-950 transition-colors">
                          {apt.title}
                        </h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1 font-medium">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{weekdayStr}, {timeFormatted} ({yearStr})</span>
                        </div>
                        {apt.location && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span>{apt.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center pl-16 sm:pl-0">
                    {getStatusBadge(apt.status)}
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

