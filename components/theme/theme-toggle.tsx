"use client";

import { useTheme } from "./theme-provider";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid layout shift before hydration
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 ${className}`}
        disabled
      >
        <span className="h-4 w-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`group relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 text-slate-700 shadow-2xs backdrop-blur-xs transition-all hover:border-teal-300 hover:bg-slate-50 hover:text-teal-700 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:border-teal-700 dark:hover:bg-slate-800 dark:hover:text-teal-400 ${className}`}
    >
      <Sun
        className={`h-4 w-4 transition-transform duration-300 ${
          isDark
            ? "rotate-90 scale-0 opacity-0 absolute"
            : "rotate-0 scale-100 opacity-100 text-amber-500"
        }`}
      />
      <Moon
        className={`h-4 w-4 transition-transform duration-300 ${
          isDark
            ? "rotate-0 scale-100 opacity-100 text-teal-400"
            : "-rotate-90 scale-0 opacity-0 absolute"
        }`}
      />
      <span className="sr-only">Toggle Theme</span>
    </button>
  );
}
