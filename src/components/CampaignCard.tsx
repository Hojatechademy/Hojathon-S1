"use client";

import React from "react";
import { Tag, Radio, CheckCircle2, MessageCircle } from "lucide-react";
import type { Campaign } from "@/lib/store";

interface Props {
  campaigns: Campaign[];
}

export default function CampaignCard({ campaigns }: Props) {
  if (campaigns.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
          <Tag className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Active Campaigns & Broadcasts</h3>
        </div>
        <div className="px-4 py-8 text-center">
          <Tag className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">No active campaigns yet.</p>
          <p className="text-xs text-zinc-600 mt-1">Create a promo to see it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
        <Tag className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-zinc-200">Active Campaigns & Broadcasts</h3>
        <span className="ml-auto text-xs text-zinc-500">{campaigns.length} active</span>
      </div>

      <div className="p-4 space-y-3">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="animate-fade-in rounded-lg border border-zinc-700/50 bg-zinc-800/50 overflow-hidden"
          >
            {/* WhatsApp-style header bar */}
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border-b border-emerald-500/20">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">
                {campaign.channel ? campaign.channel.toUpperCase() : "WhatsApp"} Promo
              </span>
              <span className="ml-auto status-badge-success text-[10px]">
                <CheckCircle2 className="w-2.5 h-2.5" />
                {campaign.broadcastedAt ? "Broadcast Dispatched" : campaign.status}
              </span>
            </div>

            {/* Card body */}
            <div className="px-3 py-3 space-y-2">
              {/* Product tag + discount */}
              <div className="flex items-center gap-2">
                <span className="status-badge-info">
                  <Tag className="w-2.5 h-2.5" />
                  {campaign.itemName}
                </span>
                {campaign.discount > 0 && (
                  <span className="text-xs font-bold text-emerald-400">
                    {campaign.discount}% OFF
                  </span>
                )}
              </div>

              {/* Message */}
              <p className="text-xs text-zinc-300 leading-relaxed">{campaign.message}</p>

              {/* Footer: promo code + audience */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-700/30">
                <div className="flex items-center gap-1.5">
                  {campaign.promoCode && (
                    <span className="px-2 py-0.5 bg-cyan-500/15 border border-cyan-500/30 rounded text-[10px] font-mono font-bold text-cyan-300 tracking-wider">
                      {campaign.promoCode}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                  <Radio className="w-2.5 h-2.5" />
                  {campaign.targetAudience}
                  {campaign.recipientCount && (
                    <span className="text-emerald-500 ml-1">
                      · {campaign.recipientCount} recipients
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

