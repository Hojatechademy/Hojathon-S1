"use client";

import { useId, useState } from "react";
import type { SuggestedInput } from "@/lib/types";

const CATEGORY_LABELS: Record<SuggestedInput["category"], string> = {
  seeds: "Seeds",
  fertilizer: "Fertilizer",
  equipment: "Equipment",
};

/**
 * Suggested purchases with a human-in-the-loop step. "Propose order" deliberately
 * does not pay for or order anything - it produces a summary the farmer would
 * confirm with the vendor. Payment is out of scope for this build.
 */
export function SuggestedInputsList({ items }: { items: SuggestedInput[] }) {
  const headingId = useId();
  const [selected, setSelected] = useState<string[]>(() =>
    items.map((item) => item.vendorId),
  );
  const [proposed, setProposed] = useState<SuggestedInput[] | null>(null);

  if (items.length === 0) return null;

  const chosen = items.filter((item) => selected.includes(item.vendorId));

  function toggle(vendorId: string) {
    setSelected((current) =>
      current.includes(vendorId)
        ? current.filter((id) => id !== vendorId)
        : [...current, vendorId],
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-4 rounded-2xl border border-line bg-surface p-5"
    >
      <h2 id={headingId} className="text-xl font-bold">
        What you may need to buy
      </h2>
      <p className="text-muted">
        Tick what you want, then propose an order. Nothing is bought and no money
        moves — you get a summary to confirm with the shop yourself.
      </p>

      <ul className="space-y-3">
        {items.map((item) => {
          const checked = selected.includes(item.vendorId);
          return (
            <li key={item.vendorId}>
              {/*
                The whole row is the label, so tapping anywhere on it toggles the
                checkbox. Helps on small screens and with unsteady hands.
              */}
              <label
                className={`flex min-h-16 cursor-pointer items-start gap-4 rounded-xl border-2 p-4 ${
                  checked ? "border-brand bg-green-50" : "border-control"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(item.vendorId)}
                  className="mt-1 size-6 shrink-0 accent-[var(--brand)]"
                />
                <span className="space-y-1">
                  <span className="block text-lg font-semibold">
                    {item.product}
                  </span>
                  <span className="block">
                    {CATEGORY_LABELS[item.category]} · {item.priceLabel}
                  </span>
                  <span className="block text-muted">
                    {item.vendorName}, {item.location}
                  </span>
                  <span className="block text-muted">{item.why}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        disabled={chosen.length === 0}
        onClick={() => setProposed(chosen)}
        className="min-h-14 w-full rounded-xl bg-brand px-6 text-lg font-bold text-white hover:bg-brand-strong disabled:opacity-60"
      >
        Propose order
        {chosen.length > 0 ? ` (${chosen.length} item${chosen.length > 1 ? "s" : ""})` : ""}
      </button>

      {/* Announced when it appears, so the confirmation is not silent. */}
      <div aria-live="polite">
        {proposed ? (
          <div className="space-y-3 rounded-xl border-2 border-brand bg-green-50 p-4">
            <h3 className="text-lg font-bold">Order proposed, not placed</h3>
            <p>
              Take this list to your vendor. No payment has been made and nothing
              has been ordered on your behalf.
            </p>
            <ul className="list-inside list-disc space-y-1">
              {proposed.map((item) => (
                <li key={item.vendorId}>
                  {item.product} — {item.priceLabel} — {item.vendorName},{" "}
                  {item.location}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setProposed(null)}
              className="min-h-12 rounded-lg border-2 border-brand px-5 font-semibold text-brand-strong hover:bg-green-100"
            >
              Change my selection
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
