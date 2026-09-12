"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Cpu } from "lucide-react";
import ChatPanel, { type AgentStatus } from "@/components/ChatPanel";
import Dashboard from "@/components/Dashboard";
import type { InventoryItem, Campaign, LogEntry } from "@/lib/store";

interface Message {
  role: "user" | "agent";
  content: string;
}

export default function Home() {
  /* ---------- State ---------- */
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("Idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentMode, setAgentMode] = useState<"gemini" | "fallback">("fallback");

  /* ---------- Initial State Hydration ---------- */
  useEffect(() => {
    async function hydrate() {
      try {
        const res = await fetch("/api/agent");
        const data = await res.json();
        if (data.state) {
          setInventory(data.state.inventory || []);
          setCampaigns(data.state.campaigns || []);
          setLogs(data.state.logs || []);
        }
        if (data.meta?.agentMode) {
          setAgentMode(data.meta.agentMode);
        }
      } catch (error) {
        console.error("Failed to hydrate state:", error);
      }
    }
    hydrate();
  }, []);

  /* ---------- Send Message to Agent ---------- */
  const handleSendMessage = useCallback(
    async (message: string) => {
      // Add user message
      setMessages((prev) => [...prev, { role: "user", content: message }]);
      setIsProcessing(true);
      setAgentStatus("Analyzing intent...");

      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();

        // Update status through tool calls
        if (data.toolCalls && data.toolCalls.length > 0) {
          for (const tc of data.toolCalls) {
            setAgentStatus(`Calling Tool: ${tc.tool}`);
            // Brief visual delay to show each tool call
            await new Promise((r) => setTimeout(r, 400));
          }
        }

        setAgentStatus("Action Completed");

        // Update all state from response
        if (data.state) {
          setInventory(data.state.inventory || []);
          setCampaigns(data.state.campaigns || []);
          setLogs(data.state.logs || []);
        }

        if (data.meta?.agentMode) {
          setAgentMode(data.meta.agentMode);
        }

        // Add agent response
        setMessages((prev) => [
          ...prev,
          { role: "agent", content: data.agentResponse || "Action completed." },
        ]);
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "agent",
            content:
              "Sorry, something went wrong processing your request. Please try again.",
          },
        ]);
        setAgentStatus("Idle");
      } finally {
        setIsProcessing(false);
        // Reset to idle after showing "Action Completed" briefly
        setTimeout(() => setAgentStatus("Idle"), 2500);
      }
    },
    []
  );

  /* ---------- Render ---------- */
  return (
    <main className="flex-1 flex flex-col">
      {/* Top Bar */}
      <header className="px-6 py-3 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-100">
              Shop<span className="text-emerald-400">Agent</span>
            </h1>
            <p className="text-[10px] text-zinc-500">
              Autonomous Local Business Ops Agent
            </p>
          </div>
        </div>

        {/* Agent Mode Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50">
            <Cpu className="w-3 h-3 text-zinc-400" />
            <span className="text-[10px] font-medium text-zinc-400">
              {agentMode === "gemini" ? "Gemini AI" : "Local Agent"}
            </span>
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                agentMode === "gemini" ? "bg-blue-400" : "bg-amber-400"
              }`}
            />
          </div>
        </div>
      </header>

      {/* Dual Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — Chat & Control */}
        <div className="w-full lg:w-[420px] xl:w-[480px] border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0">
          <ChatPanel
            messages={messages}
            agentStatus={agentStatus}
            isProcessing={isProcessing}
            onSendMessage={handleSendMessage}
          />
        </div>

        {/* Right Panel — Dashboard */}
        <div className="hidden lg:flex flex-1 bg-zinc-950/80 flex-col min-w-0">
          <Dashboard
            inventory={inventory}
            campaigns={campaigns}
            logs={logs}
          />
        </div>
      </div>
    </main>
  );
}

