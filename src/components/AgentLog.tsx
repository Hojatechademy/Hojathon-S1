"use client";

import React, { useEffect, useRef } from "react";
import { Terminal, Brain, Wrench, CheckCircle, Info } from "lucide-react";
import type { LogEntry } from "@/lib/store";

interface Props {
  logs: LogEntry[];
}

const typeConfig: Record<
  LogEntry["type"],
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  THOUGHT: {
    label: "THOUGHT",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    icon: <Brain className="w-3 h-3" />,
  },
  TOOL_CALL: {
    label: "TOOL CALL",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    icon: <Wrench className="w-3 h-3" />,
  },
  TOOL_RESULT: {
    label: "TOOL RESULT",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  STATUS: {
    label: "STATUS",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    icon: <Info className="w-3 h-3" />,
  },
};

export default function AgentLog({ logs }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
        <Terminal className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-zinc-200">Agent Thought & Tool Execution Log</h3>
        <span className="ml-auto text-xs text-zinc-500">{logs.length} entries</span>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1.5 max-h-[300px] bg-zinc-950/50"
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-600">
            <Terminal className="w-6 h-6 mb-2" />
            <p className="text-xs">Waiting for agent activity...</p>
          </div>
        ) : (
          logs.map((log, idx) => {
            const config = typeConfig[log.type];
            return (
              <div
                key={idx}
                className={`animate-fade-in terminal-text flex items-start gap-2 px-2.5 py-1.5 rounded-md ${config.bg}`}
              >
                {/* Type badge */}
                <div className={`flex items-center gap-1 shrink-0 ${config.color}`}>
                  {config.icon}
                  <span className="font-bold text-[10px] uppercase tracking-wider">
                    [{config.label}]
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span className="text-zinc-300 break-words">{log.content}</span>
                  {log.toolName && (
                    <span className="ml-1.5 text-zinc-500 text-[10px]">
                      via <span className="text-cyan-500">{log.toolName}</span>
                    </span>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-zinc-600 shrink-0 tabular-nums">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

