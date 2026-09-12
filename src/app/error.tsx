"use client";

import { useEffect } from "react";

/**
 * Last line of defence. If a component throws, the farmer sees this instead of a
 * blank screen or a stack trace. Next.js only passes a digest here in production,
 * never the original message, which is what we want.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled error", error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div
        role="alert"
        className="space-y-4 rounded-2xl border-2 border-red-800 bg-red-50 p-6 text-red-950"
      >
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-lg">
          Sorry, the app ran into a problem. Nothing you entered has been sent
          anywhere. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="min-h-14 w-full rounded-xl bg-red-900 px-6 text-lg font-bold text-white hover:bg-red-950 sm:w-auto"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
