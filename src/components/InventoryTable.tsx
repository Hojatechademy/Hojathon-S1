"use client";

import React from "react";
import { Package, AlertTriangle, CheckCircle } from "lucide-react";
import type { InventoryItem } from "@/lib/store";

interface Props {
  inventory: InventoryItem[];
}

export default function InventoryTable({ inventory }: Props) {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
        <Package className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-zinc-200">Live Inventory</h3>
        <span className="ml-auto text-xs text-zinc-500">{inventory.length} items</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800/50">
              <th className="text-left px-4 py-2.5 font-medium">Item</th>
              <th className="text-left px-4 py-2.5 font-medium">Category</th>
              <th className="text-right px-4 py-2.5 font-medium">Stock</th>
              <th className="text-right px-4 py-2.5 font-medium">Price</th>
              <th className="text-center px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, idx) => {
              const isLow = item.stock <= 5;
              return (
                <tr
                  key={item.id}
                  className={`border-b border-zinc-800/30 transition-colors hover:bg-zinc-800/30 animate-fade-in ${
                    idx % 2 === 0 ? "bg-zinc-900/30" : ""
                  }`}
                >
                  <td className="px-4 py-2.5 font-medium text-zinc-100">{item.name}</td>
                  <td className="px-4 py-2.5 text-zinc-400">{item.category}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-300">
                    {item.stock} <span className="text-zinc-500">{item.unit}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-zinc-300">₹{item.price}</td>
                  <td className="px-4 py-2.5 text-center">
                    {isLow ? (
                      <span className="status-badge-warning">
                        <AlertTriangle className="w-3 h-3" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="status-badge-success">
                        <CheckCircle className="w-3 h-3" />
                        In Stock
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

