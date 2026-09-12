"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    setNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("#") &&
        !target.hasAttribute("download") &&
        target.getAttribute("target") !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        const currentPath = window.location.pathname + window.location.search;
        if (href !== currentPath) {
          setNavigating(true);
        }
      }
    };

    document.addEventListener("click", handleAnchorClick, true);
    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
    };
  }, []);

  if (!navigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-teal-100/60 overflow-hidden pointer-events-none">
      <div className="h-full w-full bg-gradient-to-r from-teal-700 via-teal-500 to-emerald-400 animate-top-loader shadow-[0_0_8px_rgba(13,148,136,0.6)]" />
    </div>
  );
}
