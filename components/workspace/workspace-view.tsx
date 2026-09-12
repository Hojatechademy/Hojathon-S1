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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50/80 to-teal-50/20">
      {/* Patient Header */}
      <PatientHeader displayName={displayName} email={userEmail} />

      {/* Main Workspace Body */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Welcome & Top Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Welcome back, {displayName}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Here is the current state of your post-discharge follow-up care and clinic visits.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-1.5 text-xs text-slate-700 bg-white hover:text-teal-700 hover:border-teal-300 shadow-xs h-9 px-3.5 transition-all"
                aria-label="Refresh workspace data"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-teal-600" : "text-slate-500"}`} />
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
                  ? "border-rose-200 bg-gradient-to-br from-rose-50/90 to-white hover:border-rose-300 hover:shadow-xs"
                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Missed Visits</span>
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${missedAppointments.length > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
                  <AlertOctagon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-2xl font-bold tracking-tight ${missedAppointments.length > 0 ? "text-rose-700" : "text-slate-800"}`}>
                  {missedAppointments.length}
                </span>
                {missedAppointments.length > 0 && (
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-100/80 px-1.5 py-0.5 rounded">Action required</span>
                )}
              </div>
            </button>

            {/* Pending Tasks */}
            <button
              type="button"
              onClick={() => setActiveTab("tasks")}
              className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 text-left transition-all hover:border-teal-300 hover:shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending Actions</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-800">
                  {pendingTasks.length}
                </span>
                <span className="text-[10px] text-slate-500">in care plan</span>
              </div>
            </button>

            {/* Scheduled Appointments */}
            <button
              type="button"
              onClick={() => setActiveTab("appointments")}
              className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 text-left transition-all hover:border-teal-300 hover:shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Upcoming Visits</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <CalendarCheck2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-teal-900">
                  {scheduledAppointments.length}
                </span>
                <span className="text-[10px] text-slate-500">confirmed</span>
              </div>
            </button>

            {/* Active Reminders */}
            <button
              type="button"
              onClick={() => setActiveTab("reminders")}
              className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 text-left transition-all hover:border-teal-300 hover:shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Active Reminders</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <BellRing className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-800">
                  {activeReminders.length}
                </span>
                <span className="text-[10px] text-slate-500">scheduled</span>
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
              <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-3">
                <Button
                  variant={activeTab === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("all")}
                  className={`text-xs h-8 px-3 rounded-lg ${activeTab === "all" ? "bg-teal-700 hover:bg-teal-800 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
                >
                  All Items
                </Button>
                <Button
                  variant={activeTab === "tasks" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("tasks")}
                  className={`gap-1.5 text-xs h-8 px-3 rounded-lg ${activeTab === "tasks" ? "bg-teal-700 hover:bg-teal-800 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
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
                  className={`gap-1.5 text-xs h-8 px-3 rounded-lg ${activeTab === "appointments" ? "bg-teal-700 hover:bg-teal-800 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
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
                  className={`gap-1.5 text-xs h-8 px-3 rounded-lg ${activeTab === "reminders" ? "bg-teal-700 hover:bg-teal-800 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span>Reminders</span>
                  {activeReminders.length > 0 && (
                    <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${activeTab === "reminders" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
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

