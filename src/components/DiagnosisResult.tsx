import Image from "next/image";
import type { Confidence, DiagnosisResponse } from "@/lib/types";

/**
 * Confidence is shown as a word plus a plain explanation of what it means for
 * the farmer, not as a percentage. A number would imply precision the model does
 * not have.
 */
const CONFIDENCE_COPY: Record<Confidence, { label: string; meaning: string }> = {
  high: {
    label: "Fairly sure",
    meaning: "The signs in your photo are clear.",
  },
  medium: {
    label: "Not fully sure",
    meaning: "The signs fit, but other problems can look similar.",
  },
  low: {
    label: "Only a guess",
    meaning:
      "Please show this plant to your local krishi officer before spending money on treatment.",
  },
};

export function DiagnosisResult({
  result,
  imageDataUrl,
  onStartOver,
}: {
  result: DiagnosisResponse;
  imageDataUrl: string;
  onStartOver: () => void;
}) {
  const confidence = CONFIDENCE_COPY[result.confidence];

  const tone = !result.isPlant
    ? "border-line bg-surface text-foreground"
    : result.isHealthy
      ? "border-green-800 bg-green-50 text-green-950"
      : "border-amber-700 bg-amber-50 text-amber-950";

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="diagnosis-heading"
        className={`decision-card space-y-4 rounded-2xl border-2 p-5 ${tone}`}
      >
        <div className="space-y-4 sm:flex sm:items-start sm:gap-5 sm:space-y-0">
          {/*
            Unoptimised because this is an in-memory data URL from the farmer's
            own camera, not a served asset. The alt text says what the picture is
            for; the diagnosis itself is in the text below, so nothing is lost if
            the image cannot be seen.
          */}
          <Image
            src={imageDataUrl}
            alt="The plant photo you sent for checking"
            width={160}
            height={160}
            unoptimized
            className="h-40 w-40 shrink-0 rounded-xl border border-line object-cover"
          />

          <div className="space-y-2">
            <h2 id="diagnosis-heading" className="text-2xl font-bold">
              {result.diagnosis}
            </h2>
            <p className="text-lg font-semibold">
              {confidence.label}
              <span className="font-normal"> — {confidence.meaning}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold">What we saw</h3>
          <p className="text-lg">{result.reasoning}</p>
        </div>

        {result.imageQualityNote ? (
          <div className="space-y-1 rounded-xl border border-current/30 bg-white/60 p-4">
            <h3 className="font-bold">About your photo</h3>
            <p>{result.imageQualityNote}</p>
            <p className="text-muted">
              A closer, brighter photo of the affected leaf would give a better
              answer.
            </p>
          </div>
        ) : null}
      </section>

      {result.treatment.length > 0 ? (
        <section
          aria-labelledby="treatment-heading"
          className="space-y-3 rounded-2xl border border-line bg-surface p-5"
        >
          <h2 id="treatment-heading" className="text-xl font-bold">
            What to do
          </h2>
          <ol className="space-y-3">
            {result.treatment.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-white"
                >
                  {index + 1}
                </span>
                <span className="pt-1 text-lg">
                  <span className="sr-only">Step {index + 1}. </span>
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {result.isHealthy ? (
        <p className="rounded-2xl border border-line bg-surface p-5 text-lg">
          Nothing to treat. Keep watching the crop, and photograph it again if you
          see new spots or curling leaves.
        </p>
      ) : null}

      <button
        type="button"
        onClick={onStartOver}
        className="min-h-14 w-full rounded-xl border-2 border-brand px-6 text-lg font-bold text-brand-strong hover:bg-green-50"
      >
        Check another plant
      </button>
    </div>
  );
}
