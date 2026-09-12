"use client";

import { Card as UICard, CardHeader as UICardHeader, CardTitle as UICardTitle, CardContent as UICardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, ShieldCheck, MessageSquare, ArrowUpRight } from "lucide-react";
import type { PatientContext } from "@/lib/contracts";
import React from "react";

interface AgentSlotProps {
  patientContext: PatientContext;
  onContextUpdated: () => void | Promise<void>;
  isAgentAvailable?: boolean;
  children?: React.ReactNode;
}

export function AgentSlot({
  patientContext,
  onContextUpdated,
  isAgentAvailable = true,
  children,
}: AgentSlotProps) {
  // If Developer 2's Agent Panel child is provided, render it directly
  if (children) {
    return <div className="w-full">{children}</div>;
  }

  const samplePrompts = [
    "What should I do about my missed care visit?",
    "When is my next lab follow-up due?",
    "Set an in-app reminder for my medication pickup",
  ];

  // Developer 1 Integration Boundary & High-Fidelity Assistant Card
  return (
    <UICard className="border-teal-200/90 bg-white shadow-xs overflow-hidden ring-1 ring-teal-500/10 dark:border-slate-800 dark:bg-slate-900 dark:ring-teal-900/20">
      <UICardHeader className="border-b border-teal-100 bg-gradient-to-r from-teal-50 via-teal-50/50 to-white py-4 px-5 dark:border-slate-800 dark:from-teal-950/40 dark:via-slate-900 dark:to-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-800 to-teal-600 text-white shadow-xs">
              <Bot className="h-5 w-5" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
              </span>
            </div>
            <div>
              <UICardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Follow-up AI Assistant
              </UICardTitle>
              <p className="text-[11px] text-teal-800 dark:text-teal-400 font-medium">Stateful Care Coordinator</p>
            </div>
          </div>
          <Badge variant="default" className="text-[10px] px-2 py-0.5 bg-teal-100 text-teal-800 font-semibold border-teal-200 dark:bg-teal-950/80 dark:text-teal-300 dark:border-teal-800">
            Agent Connected
          </Badge>
        </div>
      </UICardHeader>

      <UICardContent className="p-4 sm:p-5 space-y-4">
        {/* Boundary & Compliance Box */}
        <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200/80 text-xs text-slate-600 space-y-1.5 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
            <ShieldCheck className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            <span>Administrative Scope Boundary</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            The assistant can explain next steps for follow-ups, clarify visit details, and record reminders.
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Strict safety guardrails active: No clinical diagnosis, prescription changes, or triage advice.
          </p>
        </div>

        {/* Live Context Sync Indicators */}
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-3 text-xs space-y-2 dark:border-teal-900/60 dark:bg-teal-950/30">
          <div className="flex items-center justify-between text-[11px] font-semibold text-teal-900 dark:text-teal-300">
            <span>Live Workspace Sync</span>
            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Active
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px]">
            <div className="rounded-lg bg-white/80 p-1.5 border border-teal-100 dark:bg-slate-900 dark:border-slate-800">
              <div className="font-bold text-slate-800 dark:text-white">{patientContext.tasks.length}</div>
              <div className="text-slate-500 dark:text-slate-400 text-[9px]">Tasks</div>
            </div>
            <div className="rounded-lg bg-white/80 p-1.5 border border-teal-100 dark:bg-slate-900 dark:border-slate-800">
              <div className="font-bold text-slate-800 dark:text-white">{patientContext.appointments.length}</div>
              <div className="text-slate-500 dark:text-slate-400 text-[9px]">Visits</div>
            </div>
            <div className="rounded-lg bg-white/80 p-1.5 border border-teal-100 dark:bg-slate-900 dark:border-slate-800">
              <div className="font-bold text-slate-800 dark:text-white">{patientContext.reminders.length}</div>
              <div className="text-slate-500 dark:text-slate-400 text-[9px]">Reminders</div>
            </div>
          </div>
        </div>

        {/* Conversational Quick Prompts */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <MessageSquare className="h-3 w-3 text-teal-600 dark:text-teal-400" />
            <span>Suggested Inquiries:</span>
          </p>
          <div className="space-y-1.5">
            {samplePrompts.map((prompt) => (
              <div
                key={prompt}
                className="group flex items-center justify-between rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs text-slate-700 transition-all hover:border-teal-300 hover:bg-teal-50/30 cursor-pointer shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-700 dark:hover:bg-slate-800"
              >
                <span className="text-[11px]">{prompt}</span>
                <ArrowUpRight className="h-3 w-3 text-slate-400 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </UICardContent>
    </UICard>
  );
}

