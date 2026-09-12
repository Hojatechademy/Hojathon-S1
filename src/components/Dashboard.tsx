"use client";

import React from "react";
import { LayoutDashboard } from "lucide-react";
import InventoryTable from "./InventoryTable";
import CampaignCard from "./CampaignCard";
import AgentLog from "./AgentLog";
import type { InventoryItem, Campaign, LogEntry } from "@/lib/store";

interface Props {
  inventory: InventoryItem[];
  campaigns: Campaign[];
  logs: LogEntry[];
}

export default function Dashboard({ inventory, campaigns, logs }: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Live Ops Dashboard</h2>
            <p className="text-[10px] text-zinc-500">Real-time business state</p>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hidden">
        {/* Section A: Inventory */}
        <InventoryTable inventory={inventory} />

        {/* Section B: Campaigns */}
        <CampaignCard campaigns={campaigns} />

        {/* Section C: Agent Log */}
        <AgentLog logs={logs} />
      </div>
    </div>
  );
}

