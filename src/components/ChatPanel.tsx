"use client";

import React, { useRef, useEffect } from "react";
import { Send, Zap, Bot, User, Loader2 } from "lucide-react";

export type AgentStatus =
  | "Idle"
  | "Analyzing intent..."
  | `Calling Tool: ${string}`
  | "Action Completed";

interface Message {
  role: "user" | "agent";
  content: string;
}

interface Props {
  messages: Message[];
  agentStatus: AgentStatus;
  isProcessing: boolean;
  onSendMessage: (message: string) => void;
}

const DEMO_CHIPS = [
  {
    label: "Add Inventory + Promo",
    prompt:
      "We just got 50kg Alphonso Mangoes at ₹120/kg. Add to inventory and run a 15% discount for orders above 3kg.",
  },
  {
    label: "Update Stock + Price",
    prompt:
      "Update stock: sold 15kg mangoes and set Basmati Rice price to ₹90/kg.",
  },
  {
    label: "WhatsApp Broadcast",
    prompt:
      "Draft and broadcast a WhatsApp alert to regular customers announcing a weekend flash sale on fresh fruits.",
  },
];

export default function ChatPanel({
  messages,
  agentStatus,
  isProcessing,
  onSendMessage,
}: Props) {
  const [input, setInput] = React.useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleChipClick = (prompt: string) => {
    if (!isProcessing) {
      onSendMessage(prompt);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">ShopAgent</h2>
            <p className="text-[10px] text-zinc-500">Autonomous Business Ops</p>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isProcessing
                ? "bg-emerald-400 animate-pulse-glow"
                : agentStatus === "Action Completed"
                  ? "bg-emerald-400"
                  : "bg-zinc-600"
            }`}
          />
          <span
            className={`text-xs font-mono transition-colors duration-300 ${
              isProcessing ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            {agentStatus}
          </span>
          {isProcessing && (
            <Loader2 className="w-3 h-3 text-emerald-400 animate-spin ml-auto" />
          )}
        </div>
      </div>

      {/* Quick Action Chips */}
      <div className="px-4 py-3 border-b border-zinc-800/30 space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium mb-2">
          Quick Actions
        </p>
        <div className="flex flex-col gap-1.5">
          {DEMO_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              className="chip flex items-start gap-2"
              onClick={() => handleChipClick(chip.prompt)}
              disabled={isProcessing}
            >
              <Zap className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
              <span>{chip.prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hidden">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
              <Bot className="w-6 h-6 text-emerald-500/50" />
            </div>
            <p className="text-sm text-zinc-500">
              Enter a command or click a quick action to get started.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 animate-fade-in ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "agent" && (
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-emerald-400" />
              </div>
            )}
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-emerald-600/20 border border-emerald-500/20 text-zinc-100"
                  : "bg-zinc-800/80 border border-zinc-700/50 text-zinc-200"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-md bg-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3 h-3 text-zinc-300" />
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50"
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a command for your ShopAgent..."
            disabled={isProcessing}
            className="flex-1 bg-zinc-800/80 border border-zinc-700/50 rounded-lg px-3 py-2
                       text-sm text-zinc-100 placeholder:text-zinc-600
                       focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20
                       disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500
                       text-white rounded-lg transition-all disabled:cursor-not-allowed
                       active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

