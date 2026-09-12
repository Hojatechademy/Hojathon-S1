"use client";

import { useEffect, useRef } from "react";

interface ErrorNoticeProps {
  /** Farmer-facing message. Never pass raw exception text here. */
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Error banner that announces itself and takes focus, so a screen reader or
 * keyboard user is told what happened instead of being left on a dead page.
 */
export function ErrorNotice({
  message,
  onRetry,
  retryLabel = "Try again",
}: ErrorNoticeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [message]);

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="rounded-xl border-2 border-red-800 bg-red-50 p-5 text-red-950"
    >
      <div className="flex items-start gap-3">
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          className="mt-1 size-7 shrink-0"
          fill="currentColor"
        >
          <path d="M12 2 1 21h22L12 2Zm0 6 1 7h-2l1-7Zm0 9.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" />
        </svg>
        <div className="space-y-3">
          <p className="text-lg font-semibold">Something did not work</p>
          <p>{message}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="min-h-12 rounded-lg bg-red-900 px-5 py-2 font-semibold text-white hover:bg-red-950"
            >
              {retryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
