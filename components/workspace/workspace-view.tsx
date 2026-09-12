"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PatientHeader } from "./patient-header";
import { AttentionSummary } from "./attention-summary";
import { TasksList } from "./tasks-list";
import { AppointmentsList } from "./appointments-list";
import { RemindersList } from "./reminders-list";
import { AgentSlot } from "./agent-slot";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  ListChecks,
  Calendar,
  Bell,
  AlertOctagon,
  Clock,
  CalendarCheck2,
  BellRing,
  Sparkles,
} from "lucide-react";
import type { PatientContext } from "@/lib/contracts";

interface WorkspaceViewProps {
  initialContext: PatientContext;
  userEmail?: string;
}

export function WorkspaceView({ initialContext, userEmail }: WorkspaceViewProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"all" | "tasks" | "appointments" | "reminders">("all");

  const handleRefresh = async () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const displayName = initialContext.profile?.display_name || userEmail?.split("@")[0] || "Patient";

  const pendingTasks = initialContext.tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const missedAppointments = initialContext.appointments.filter((a) => a.status === "missed");
  const scheduledAppointments = initialContext.appointments.filter((a) => a.status === "scheduled" || a.status === "rescheduled");
  const activeReminders = initialContext.reminders.filter((r) => r.status === "pending");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50/80 to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
      {/* Patient Header */}
      <PatientHeader displayName={displayName} email={userEmail} />

      {/* Main Workspace Body */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Welcome & Top Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Welcome back, {displayName}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Here is the current state of your post-discharge follow-up care and clinic visits.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  startTransition(async () => {
                    const { seedSamplePatientData } = await import("@/app/workspace/actions");
                    await seedSamplePatientData();
                    router.refresh();
                  });
                }}
                disabled={isRefreshing}
                className="gap-1.5 text-xs text-teal-800 bg-teal-50/70 hover:bg-teal-100 border-teal-200 shadow-2xs h-9 px-3 transition-all dark:bg-teal-950/60 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-900/60"
                title="Load sample follow-up tasks and visits for demonstration"
              >
                <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>{isRefreshing ? "Syncing..." : "Seed Demo Records"}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-1.5 text-xs text-slate-700 bg-white hover:text-teal-700 hover:border-teal-300 shadow-xs h-9 px-3.5 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:border-teal-700 dark:hover:text-teal-400"
                aria-label="Refresh workspace data"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-teal-600 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"}`} />
                <span>{isRefreshing ? "Syncing..." : "Sync Records"}</span>
              </Button>
            </div>
          </div>

          {/* Quick Metric Stat Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            {/* Missed Appointments */}
            <button
              type="button"
              onClick={() => setActiveTab("appointments")}
              className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
                missedAppointments.length > 0
                  ? "border-rose-200 bg-gradient-to-br from-rose-50/90 to-white hover:border-rose-300 hover:shadow-xs dark:border-rose-900/60 dark:from-rose-950/30 dark:to-slate-900 dark:hover:border-rose-700"
                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Missed Visits</span>
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${missedAppointments.length > 0 ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                  <AlertOctagon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-2xl font-bold tracking-tight ${missedAppointments.length > 0 ? "text-rose-700 dark:text-rose-400" : "text-slate-800 dark:text-white"}`}>
                  {missedAppointments.length}
                </span>
                {missedAppointments.length > 0 && (
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-100/80 px-1.5 py-0.5 rounded dark:bg-rose-950/80 dark:text-rose-300">Action required</span>
                )}
              </div>
            </button>

            {/* Pending Tasks */}
            <button
              type="button"
              onClick={() => setActiveTab("tasks")}
              className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 text-left transition-all hover:border-teal-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Actions</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
                  {pendingTasks.length}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">in care plan</span>
              </div>
            </button>

            {/* Scheduled Appointments */}
            <button
              type="button"
              onClick={() => setActiveTab("appointments")}
              className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 text-left transition-all hover:border-teal-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Upcoming Visits</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
                  <CalendarCheck2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-teal-900 dark:text-teal-300">
                  {scheduledAppointments.length}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">confirmed</span>
              </div>
            </button>

            {/* Active Reminders */}
            <button
              type="button"
              onClick={() => setActiveTab("reminders")}
              className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 text-left transition-all hover:border-teal-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Reminders</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <BellRing className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
                  {activeReminders.length}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">scheduled</span>
              </div>
            </button>
          </div>

          {/* Attention banner */}
          <AttentionSummary context={initialContext} />

          {/* Grid Layout: Patient workspace lists on the left, Agent Integration Slot on the right */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Patient Workspace Items */}
            <div className="space-y-6 lg:col-span-7 xl:col-span-8">
              {/* Tab Navigation Controls */}
              <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-3 dark:border-slate-800">
                <Button
                  variant={activeTab === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("all")}
                  className={`text-xs h-8 px-3 rounded-lg ${activeTab === "all" ? "bg-teal-700 hover:bg-teal-800 text-white shadow-xs dark:bg-teal-600 dark:hover:bg-teal-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"}`}
                >
                  All Items
                </Button>
                <Button
                  variant={activeTab === "tasks" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("tasks")}
                  className={`gap-1.5 text-xs h-8 px-3 rounded-lg ${activeTab === "tasks" ? "bg-teal-700 hover:bg-teal-800 text-white shadow-xs dark:bg-teal-600 dark:hover:bg-teal-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"}`}
                >
                  <ListChecks className="h-3.5 w-3.5" />
                  <span>Tasks</span>
                  {pendingTasks.length > 0 && (
                    <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${activeTab === "tasks" ? "bg-white/20 text-white" : "bg-teal-100 text-teal-800"}`}>
                      {pendingTasks.length}
                    </span>
                  )}
                </Button>
                <Button
                  variant={activeTab === "appointments" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("appointments")}
                  className={`gap-1.5 text-xs h-8 px-3 rounded-lg ${activeTab === "appointments" ? "bg-teal-700 hover:bg-teal-800 text-white shadow-xs dark:bg-teal-600 dark:hover:bg-teal-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"}`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Appointments</span>
                  {missedAppointments.length > 0 && (
                    <span className="ml-1 rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] font-semibold text-white">
                      {missedAppointments.length}
                    </span>
                  )}
                </Button>
                <Button
                  variant={activeTab === "reminders" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("reminders")}
                  className={`gap-1.5 text-xs h-8 px-3 rounded-lg ${activeTab === "reminders" ? "bg-teal-700 hover:bg-teal-800 text-white shadow-xs dark:bg-teal-600 dark:hover:bg-teal-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"}`}
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span>Reminders</span>
                  {activeReminders.length > 0 && (
                    <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${activeTab === "reminders" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"}`}>
                      {activeReminders.length}
                    </span>
                  )}
                </Button>
              </div>

              {/* Views based on active tab filter */}
              {(activeTab === "all" || activeTab === "tasks") && (
                <TasksList tasks={initialContext.tasks} />
              )}

              {(activeTab === "all" || activeTab === "appointments") && (
                <AppointmentsList appointments={initialContext.appointments} />
              )}

              {(activeTab === "all" || activeTab === "reminders") && (
                <RemindersList
                  reminders={initialContext.reminders}
                  tasks={initialContext.tasks}
                />
              )}
            </div>

            {/* Right Column: AI Follow-up Assistant Slot */}
            <div className="space-y-6 lg:col-span-5 xl:col-span-4">
              <div className="sticky top-24">
                <AgentSlot
                  patientContext={initialContext}
                  onContextUpdated={handleRefresh}
                  isAgentAvailable={true}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

