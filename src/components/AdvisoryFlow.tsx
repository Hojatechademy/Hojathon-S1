"use client";

import { useRef, useState } from "react";
import { AdvisoryResult } from "./AdvisoryResult";
import { ErrorNotice } from "./ErrorNotice";
import { OnboardingForm, type AdvisoryFormValues } from "./OnboardingForm";
import { Spinner } from "./Spinner";
import type { AdvisoryResponse, ApiError } from "@/lib/types";

type Phase =
  | { kind: "form" }
  | { kind: "loading"; crop: string }
  | { kind: "result"; result: AdvisoryResponse }
  | { kind: "error"; message: string };

const GENERIC_ERROR =
  "We could not get advice just now. Please check your internet and try again.";

export function AdvisoryFlow({ crops }: { crops: string[] }) {
  const [phase, setPhase] = useState<Phase>({ kind: "form" });
  const lastValues = useRef<AdvisoryFormValues | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  async function run(values: AdvisoryFormValues) {
    lastValues.current = values;
    setPhase({ kind: "loading", crop: values.crop });

    try {
      const response = await fetch("/api/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ApiError | null;
        setPhase({ kind: "error", message: body?.message ?? GENERIC_ERROR });
        return;
      }

      const result = (await response.json()) as AdvisoryResponse;
      setPhase({ kind: "result", result });
      // Move focus to the result so keyboard and screen reader users land on it
      // instead of being left at the top of a changed page.
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch {
      setPhase({ kind: "error", message: GENERIC_ERROR });
    }
  }

  return (
    <div className="space-y-8">
      {/*
        Single polite live region for the whole flow. Kept mounted so updates are
        reliably announced rather than being missed on mount.
      */}
      <p aria-live="polite" className="sr-only">
        {phase.kind === "loading"
          ? `Checking the weather and market data for ${phase.crop}. This takes a few seconds.`
          : phase.kind === "result"
            ? `Advice ready for ${phase.result.crop}.`
            : ""}
      </p>

      {phase.kind === "form" || phase.kind === "loading" ? (
        <OnboardingForm
          crops={crops}
          busy={phase.kind === "loading"}
          onSubmit={run}
        />
      ) : null}

      {phase.kind === "loading" ? (
        <div className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-5">
          <Spinner className="mt-1 text-brand" />
          <div>
            <p className="text-lg font-semibold">
              Checking things for your {phase.crop}…
            </p>
            <ul className="mt-2 list-inside list-disc text-muted">
              <li>Reading the 16 day weather forecast for your location</li>
              <li>Comparing it against what this crop needs</li>
              <li>Looking up the mandi price trend</li>
            </ul>
          </div>
        </div>
      ) : null}

      {phase.kind === "error" ? (
        <ErrorNotice
          message={phase.message}
          onRetry={() => {
            const previous = lastValues.current;
            if (previous) void run(previous);
            else setPhase({ kind: "form" });
          }}
        />
      ) : null}

      {phase.kind === "result" ? (
        <div ref={resultRef} tabIndex={-1}>
          <AdvisoryResult
            result={phase.result}
            onStartOver={() => setPhase({ kind: "form" })}
          />
        </div>
      ) : null}
    </div>
  );
}
