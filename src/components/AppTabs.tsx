"use client";

import { useRef, useState } from "react";

export interface AppTab {
  id: string;
  /** Short, verb-first label. Farmers scan for the action, not the noun. */
  label: string;
  /** Path data for a 24x24 icon. Decorative - the label carries the meaning. */
  iconPath: string;
  panel: React.ReactNode;
}

/**
 * Standard ARIA tabs pattern: arrow keys move between tabs, Home and End jump to
 * the ends, and only the selected tab is in the tab order so keyboard users
 * reach the panel in one Tab press.
 *
 * All panels stay mounted and inactive ones are hidden with the `hidden`
 * attribute, which removes them from the accessibility tree. Keeping them
 * mounted means a farmer does not lose a filled-in form by glancing at another
 * section.
 */
export function AppTabs({ tabs }: { tabs: AppTab[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function focusTab(id: string) {
    setActiveId(id);
    tabRefs.current[id]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const index = tabs.findIndex((tab) => tab.id === activeId);
    if (index === -1) return;

    let next: number | null = null;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;

    if (next !== null) {
      event.preventDefault();
      focusTab(tabs[next].id);
    }
  }

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="What do you need help with?"
        className="grid gap-3 sm:grid-cols-3"
      >
        {tabs.map((tab) => {
          const selected = tab.id === activeId;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[tab.id] = node;
              }}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(tab.id)}
              onKeyDown={handleKeyDown}
              className={`flex min-h-16 items-center justify-center gap-3 rounded-xl border-2 px-4 py-3 text-lg font-semibold ${
                selected
                  ? "border-brand bg-brand text-white"
                  : "border-control bg-surface text-foreground hover:bg-green-50"
              }`}
            >
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 24 24"
                className="size-7 shrink-0"
                fill="currentColor"
              >
                <path d={tab.iconPath} />
              </svg>
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          tabIndex={0}
          hidden={tab.id !== activeId}
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
