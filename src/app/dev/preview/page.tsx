"use client";

import { AdvisoryResult } from "@/components/AdvisoryResult";
import { DiagnosisResult } from "@/components/DiagnosisResult";
import { ErrorNotice } from "@/components/ErrorNotice";
import { ListingDraft } from "@/components/ListingDraft";
import { notFound } from "next/navigation";
import * as fixtures from "@/lib/fixtures";

/**
 * Dev-only gallery of every result state, rendered from fixtures.
 *
 * Why this exists: the three result screens are only reachable after a live model
 * call, and some states are awkward to trigger on demand - a healthy plant, an
 * unclear photo, a degraded fallback, a crop with no price. This page renders them
 * all at once so they can be reviewed, and so a rendering bug shows up without
 * spending model calls hunting for it.
 *
 * In a production build the NODE_ENV check is inlined as a constant, so this route
 * answers with a 404 and never reaches a real user.
 */

/** A 1x1 transparent PNG. Stands in for the farmer's photo in the preview. */
const PLACEHOLDER_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhQGAWApLpwAAAABJRU5ErkJggg==";

function Case({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t-4 border-dashed border-control pt-8">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted">{note}</p>
      </div>
      {children}
    </section>
  );
}

export default function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const noop = () => {};

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Result state gallery</h1>
        <p className="text-muted">
          Development only. Every agent result state, rendered from fixtures in{" "}
          <code>src/lib/fixtures.ts</code>. Buttons here do nothing.
        </p>
      </header>

      <Case
        title="Advisory: Plant"
        note="Green decision, no risks, three suggested purchases with the propose-order step."
      >
        <AdvisoryResult result={fixtures.advisoryPlant} onStartOver={noop} />
      </Case>

      <Case
        title="Advisory: Don't Plant"
        note="Red decision, risk list, purchases suppressed, alternative crops offered."
      >
        <AdvisoryResult result={fixtures.advisoryDontPlant} onStartOver={noop} />
      </Case>

      <Case
        title="Advisory: Caution, degraded, unknown crop"
        note="Amber decision with the fallback banner and no crop reference data, so the comparison tiles drop their notes."
      >
        <AdvisoryResult result={fixtures.advisoryDegraded} onStartOver={noop} />
      </Case>

      <Case
        title="Diagnosis: diseased, high confidence"
        note="Numbered treatment steps with rates and frequencies."
      >
        <DiagnosisResult
          result={fixtures.diagnosisDiseased}
          imageDataUrl={PLACEHOLDER_IMAGE}
          onStartOver={noop}
        />
      </Case>

      <Case
        title="Diagnosis: healthy plant"
        note="No treatment steps at all, plus the keep-watching note."
      >
        <DiagnosisResult
          result={fixtures.diagnosisHealthy}
          imageDataUrl={PLACEHOLDER_IMAGE}
          onStartOver={noop}
        />
      </Case>

      <Case
        title="Diagnosis: low confidence, poor photo"
        note="Shows the photo-quality note and the 'only a guess' wording that points the farmer to a krishi officer."
      >
        <DiagnosisResult
          result={fixtures.diagnosisUnclear}
          imageDataUrl={PLACEHOLDER_IMAGE}
          onStartOver={noop}
        />
      </Case>

      <Case
        title="Diagnosis: not a plant"
        note="Neutral styling, no diagnosis forced, no treatment."
      >
        <DiagnosisResult
          result={fixtures.diagnosisNotAPlant}
          imageDataUrl={PLACEHOLDER_IMAGE}
          onStartOver={noop}
        />
      </Case>

      <Case
        title="Market: priced lot"
        note="Price tiles, one buyer who takes the lot and one flagged as wanting more."
      >
        <ListingDraft draft={fixtures.marketPriced} onPost={noop} onStartOver={noop} />
      </Case>

      <Case
        title="Market: no price on record"
        note="No rate suggested, no buyers matched, degraded banner shown."
      >
        <ListingDraft
          draft={fixtures.marketUnpriced}
          onPost={noop}
          onStartOver={noop}
        />
      </Case>

      <Case title="Error notice" note="Shared failure banner used by all three flows.">
        <ErrorNotice
          message="We could not get the weather forecast for your location just now. Please check your internet and try again in a moment."
          onRetry={noop}
        />
      </Case>
    </main>
  );
}
