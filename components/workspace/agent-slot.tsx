"use client";

import {
  Card as UICard,
  CardHeader as UICardHeader,
  CardTitle as UICardTitle,
  CardContent as UICardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Sparkles,
  ShieldCheck,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  X,
  Minus,
  MessageSquare,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Stethoscope,
} from "lucide-react";
import type { PatientContext } from "@/lib/contracts";
import type { ToolExecutionResult } from "@/lib/agent/tools";
import { sendAgentMessage } from "@/app/agent/actions";
import Link from "next/link";
import React, { useState, useRef, useEffect, useTransition } from "react";

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: ToolExecutionResult[];
  timestamp: string;
}

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
  if (children) {
    return <div className="w-full">{children}</div>;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! I'm your CareFlow Follow-up Coordinator powered by Gemini. I can help explain your post-care next steps, check your upcoming appointments, or set in-app reminders for your follow-up actions. How can I assist you today?`,
      timestamp: "Just now",
    },
  ]);
  const [showBoundaries, setShowBoundaries] = useState(false);
  const [isPending, startTransition] = useTransition();
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    "I missed my follow-up appointment. What should I do next?",
    "When is my next scheduled visit?",
    "Remind me tomorrow at 9 AM to pick up my prescription",
    "What tasks are currently pending on my follow-up plan?",
  ];

  const missedVisits = patientContext.appointments.filter((a) => a.status === "missed");

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isPending, isOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isPending) return;

    // Ensure chat window is open when sending a prompt
    if (!isOpen) {
      setIsOpen(true);
    }

    const userMessage: MessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");

    startTransition(async () => {
      // Build history for Gemini
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: (m.role === "user" ? "user" : "model") as "user" | "model",
          content: m.content,
        }));

      const res = await sendAgentMessage({
        message: query,
        history,
      });

      const assistantMessage: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: res.response,
        actions: res.actions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (res.contextUpdated) {
        // Trigger live refresh of parent dashboard context
        await onContextUpdated();
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: `Chat session cleared. How can I help with your follow-up care or next appointments?`,
        timestamp: "Just now",
      },
    ]);
  };

  return (
    <>
      {/* 1. Dashboard Companion Card (renders inline on the page) */}
      <UICard className="border-teal-200/90 bg-white shadow-xs overflow-hidden ring-1 ring-teal-500/10 rounded-2xl dark:border-slate-800 dark:bg-slate-900 dark:ring-teal-900/20">
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
                <div className="flex items-center gap-1.5 text-[11px] text-teal-800 dark:text-teal-400 font-medium">
                  <Sparkles className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                  <span>Gemini 3.6 Flash Online</span>
                </div>
              </div>
            </div>
            <Badge
              variant="default"
              className="text-[10px] px-2 py-0.5 bg-teal-100 text-teal-800 font-semibold border-teal-200 dark:bg-teal-950/80 dark:text-teal-300 dark:border-teal-800"
            >
              Active
            </Badge>
          </div>
        </UICardHeader>

        <UICardContent className="p-4 sm:p-5 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Need guidance on next steps or missed visits? Open your care coordinator chat below or use the floating assistant icon in the bottom-right corner.
          </p>

          <Button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-full h-10 gap-2 bg-gradient-to-r from-teal-800 to-teal-600 hover:from-teal-900 hover:to-teal-700 text-white font-semibold rounded-xl shadow-xs"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Open AI Chat Assistant</span>
          </Button>

          {/* Suggested Prompts with quick launch */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Quick Inquiries:
            </span>
            <div className="space-y-1.5">
              {samplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="group flex w-full items-center justify-between rounded-xl border border-slate-200/90 bg-slate-100/90 p-2.5 text-left text-xs text-slate-800 transition-all hover:border-teal-400 hover:bg-teal-50/70 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-teal-500 dark:hover:bg-slate-700"
                >
                  <span className="text-[11px] font-medium leading-relaxed line-clamp-1">{prompt}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-700 dark:text-slate-400 dark:group-hover:text-teal-300 transition-colors shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Doctor Link */}
          <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3 text-xs flex items-center justify-between dark:border-teal-900/60 dark:bg-teal-950/30">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-teal-700 dark:text-teal-400" />
              <div>
                <div className="font-semibold text-teal-950 dark:text-teal-200 text-[11px]">Need a Doctor Visit?</div>
                <div className="text-[10px] text-teal-700 dark:text-teal-400">Check hospital physicians & slots</div>
              </div>
            </div>
            <Link href="/doctors">
              <Button size="sm" variant="outline" className="h-7 px-2.5 text-[10px] font-semibold border-teal-300 dark:border-teal-700">
                View Doctors
              </Button>
            </Link>
          </div>
        </UICardContent>
      </UICard>

      {/* 2. Floating Bottom-Right Launcher Icon (When chat is closed) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 rounded-full bg-gradient-to-r from-teal-800 via-teal-700 to-teal-600 px-4 py-3 sm:px-5 sm:py-3.5 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 ring-4 ring-teal-500/20 dark:ring-teal-400/20"
            aria-label="Open Follow-up AI Assistant"
            title="Open Follow-up AI Assistant"
          >
            <div className="relative flex h-7 w-7 items-center justify-center">
              <Bot className="h-6 w-6 text-white group-hover:rotate-6 transition-transform" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-teal-800"></span>
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-tight flex items-center gap-1">
                AI Assistant
                <Sparkles className="h-3 w-3 text-teal-200" />
              </span>
              <span className="text-[10px] text-teal-200 font-medium">Follow-up Care</span>
            </div>
            {missedVisits.length > 0 && (
              <span className="ml-0.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs animate-pulse">
                {missedVisits.length} Alert
              </span>
            )}
          </button>
        </div>
      )}

      {/* 3. Floating Bottom-Right Chat Window (When chat is open) */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[430px] h-[580px] max-h-[calc(100vh-5rem)] rounded-2xl shadow-2xl border border-teal-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200 ring-1 ring-black/10 dark:ring-white/10">
          {/* Header */}
          <div className="border-b border-teal-100 bg-gradient-to-r from-teal-50 via-teal-50/50 to-white py-3.5 px-4 dark:border-slate-800 dark:from-teal-950/50 dark:via-slate-900 dark:to-slate-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-800 to-teal-600 text-white shadow-xs">
                <Bot className="h-4 w-4" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900"></span>
                </span>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
                  Follow-up AI Assistant
                </div>
                <div className="flex items-center gap-1 text-[10px] text-teal-800 dark:text-teal-400 font-medium">
                  <Sparkles className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400" />
                  <span>Gemini 3.6 Flash Coordinator</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResetChat}
                title="Reset Conversation"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize Chat"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-3.5 space-y-3 flex-1 flex flex-col overflow-hidden">
            {/* Safety Boundary Toggle / Callout */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-850 p-2 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setShowBoundaries(!showBoundaries)}
                className="flex w-full items-center justify-between font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                <span className="flex items-center gap-1.5 text-[10px]">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  Administrative Scope Guardrails Active
                </span>
                {showBoundaries ? (
                  <ChevronUp className="h-3 w-3 text-slate-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                )}
              </button>
              {showBoundaries && (
                <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800 pt-1.5">
                  The assistant assists with administrative follow-ups, visit logistics, task updates, and reminders. It cannot diagnose conditions, prescribe medications, or replace emergency care.
                </p>
              )}
            </div>

            {/* Chat Messages Thread */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs scrollbar-thin"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                      msg.role === "user"
                        ? "bg-teal-700 text-white rounded-br-xs dark:bg-teal-600"
                        : "bg-slate-100/90 text-slate-800 rounded-bl-xs border border-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Tool Action Badges */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2 space-y-1 border-t border-slate-200/60 dark:border-slate-700 pt-1.5">
                        {msg.actions.map((act, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start gap-1 rounded-md p-1.5 text-[10px] font-medium ${
                              act.success
                                ? "bg-emerald-50/90 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                : "bg-rose-50/90 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                            }`}
                          >
                            {act.success ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                            )}
                            <span>{act.summary}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {isPending && (
                <div className="flex items-start gap-2">
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-600 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600 dark:text-teal-400" />
                    <span className="text-[10px] font-medium">Analyzing records with careflowAI...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex flex-wrap gap-1">
                {samplePrompts.slice(0, 2).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    disabled={isPending}
                    className="rounded-lg border border-slate-200 bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-700 transition-all hover:border-teal-300 hover:bg-teal-50/50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300 dark:hover:border-teal-700 dark:hover:bg-slate-800 truncate max-w-full"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <div className="flex items-center gap-2 pt-1 shrink-0">
              <Input
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about next steps, missed visits, reminders..."
                disabled={isPending}
                className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900"
              />
              <Button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isPending || !inputQuery.trim()}
                size="sm"
                className="h-9 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700 text-white shadow-xs shrink-0"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
