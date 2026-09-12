"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { DiagnosisResult } from "./DiagnosisResult";
import { ErrorNotice } from "./ErrorNotice";
import { Spinner } from "./Spinner";
import { ACCEPTED_TYPES, ImageError, fileToDataUrl } from "@/lib/image";
import type { ApiError, DiagnosisResponse } from "@/lib/types";

type Phase =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "ready"; image: string }
  | { kind: "checking"; image: string }
  | { kind: "result"; image: string; result: DiagnosisResponse }
  | { kind: "error"; message: string; image?: string };

const GENERIC_ERROR =
  "We could not check your photo just now. Please check your internet and try again.";

export function DiagnoseFlow() {
  const ids = { file: useId(), hint: useId(), status: useId() };
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const image =
    "image" in phase && typeof phase.image === "string" ? phase.image : null;

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhase({ kind: "reading" });
    try {
      const dataUrl = await fileToDataUrl(file);
      setPhase({ kind: "ready", image: dataUrl });
    } catch (error) {
      setPhase({
        kind: "error",
        message:
          error instanceof ImageError
            ? error.message
            : "We could not read that photo. Please try another one.",
      });
    }
  }

  async function check(dataUrl: string) {
    setPhase({ kind: "checking", image: dataUrl });

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ApiError | null;
        setPhase({
          kind: "error",
          message: body?.message ?? GENERIC_ERROR,
          image: dataUrl,
        });
        return;
      }

      const result = (await response.json()) as DiagnosisResponse;
      setPhase({ kind: "result", image: dataUrl, result });
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch {
      setPhase({ kind: "error", message: GENERIC_ERROR, image: dataUrl });
    }
  }

  function reset() {
    if (inputRef.current) inputRef.current.value = "";
    setPhase({ kind: "idle" });
  }

  const busy = phase.kind === "reading" || phase.kind === "checking";

  return (
    <div className="space-y-6">
      <p aria-live="polite" className="sr-only">
        {phase.kind === "reading"
          ? "Preparing your photo."
          : phase.kind === "ready"
            ? "Photo ready. Now choose to check this plant."
            : phase.kind === "checking"
              ? "Looking at your photo. This takes a few seconds."
              : phase.kind === "result"
                ? `Result ready: ${phase.result.diagnosis}`
                : ""}
      </p>

      {phase.kind === "result" ? (
        <div ref={resultRef} tabIndex={-1}>
          <DiagnosisResult
            result={phase.result}
            imageDataUrl={phase.image}
            onStartOver={reset}
          />
        </div>
      ) : (
        <>
          <div className="space-y-4 rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-xl font-bold">Photograph the sick plant</h2>
            <p>
              Get close to the leaf that has the problem. Daylight works best. One
              leaf fills the frame better than the whole field.
            </p>

            <label
              htmlFor={ids.file}
              className="block text-lg font-semibold"
            >
              Choose or take a photo
            </label>
            <p id={ids.hint} className="text-muted">
              JPG, PNG or WebP. Your photo is used for this check only. We do not
              save it.
            </p>
            <input
              id={ids.file}
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              /*
                No `capture` attribute on purpose. On several Android browsers it
                forces the camera and blocks the gallery, which would shut out a
                farmer who already has the photo saved.
              */
              disabled={busy}
              aria-describedby={ids.hint}
              onChange={handleFile}
              className="block min-h-14 w-full cursor-pointer rounded-xl border-2 border-control bg-surface px-4 py-3 text-lg file:mr-4 file:min-h-10 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:font-semibold file:text-white"
            />
          </div>

          {image ? (
            <div className="space-y-4 rounded-2xl border border-line bg-surface p-5">
              <h2 className="text-xl font-bold">Your photo</h2>
              <Image
                src={image}
                alt="The plant photo you have chosen, not yet checked"
                width={288}
                height={288}
                unoptimized
                className="h-72 w-72 rounded-xl border border-line object-cover"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => check(image)}
                className="flex min-h-16 w-full items-center justify-center gap-3 rounded-xl bg-brand px-6 text-xl font-bold text-white hover:bg-brand-strong disabled:opacity-60"
              >
                {phase.kind === "checking" ? <Spinner /> : null}
                {phase.kind === "checking"
                  ? "Looking at your plant…"
                  : "Check this plant"}
              </button>
            </div>
          ) : null}

          {phase.kind === "reading" ? (
            <p className="flex items-center gap-3 text-lg">
              <Spinner className="text-brand" />
              Preparing your photo…
            </p>
          ) : null}

          {phase.kind === "error" ? (
            <ErrorNotice
              message={phase.message}
              retryLabel={phase.image ? "Try again" : "Choose another photo"}
              onRetry={() => {
                if (phase.image) void check(phase.image);
                else reset();
              }}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
