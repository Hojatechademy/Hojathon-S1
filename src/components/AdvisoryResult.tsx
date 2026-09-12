import type { AdvisoryDecision, AdvisoryResponse } from "@/lib/types";
import { SuggestedInputsList } from "./SuggestedInputsList";

/**
 * Each decision gets a colour, an icon and its own wording. The colour is never
 * the only signal - the heading text and the icon shape carry the same meaning,
 * so the card still reads correctly in greyscale or to a screen reader.
 */
const DECISION_STYLES: Record<
  AdvisoryDecision,
  { box: string; heading: string; icon: React.ReactNode; verdict: string }
> = {
  Plant: {
    box: "border-green-800 bg-green-50 text-green-950",
    heading: "Good time to plant",
    verdict: "Yes",
    icon: (
      <path d="M9.6 17.6 4 12l1.4-1.4 4.2 4.2 9-9L20 7.2 9.6 17.6Z" />
    ),
  },
  "Plant with Caution": {
    box: "border-amber-700 bg-amber-50 text-amber-950",
    heading: "You can plant, but be careful",
    verdict: "Maybe",
    icon: <path d="M12 2 1 21h22L12 2Zm1 6-.5 8h-1L11 8h2Zm-1 10.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" />,
  },
  "Don't Plant": {
    box: "border-red-800 bg-red-50 text-red-950",
    heading: "Better not to plant right now",
    verdict: "No",
    icon: (
      <path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3 1.4 1.4Z" />
    ),
  },
};

function DataTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="data-tile rounded-xl border border-line bg-surface p-4">
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-bold">{value}</dd>
      {note ? <p className="mt-1 text-muted">{note}</p> : null}
    </div>
  );
}

const TREND_WORDS = {
  up: "going up",
  down: "coming down",
  stable: "holding steady",
} as const;

export function AdvisoryResult({
  result,
  onStartOver,
}: {
  result: AdvisoryResponse;
  onStartOver: () => void;
}) {
  const style = DECISION_STYLES[result.decision];
  const forecast = result.forecastSummary;

  return (
    <div className="space-y-6">
      {result.degraded ? (
        <p
          role="status"
          className="rounded-xl border-2 border-amber-700 bg-amber-50 p-4 text-amber-950"
        >
          Our advisor could not be reached, so this advice comes from a direct
          comparison of the weather figures against what your crop needs. The
          numbers below are still accurate.
        </p>
      ) : null}

      <section
        aria-labelledby="decision-heading"
        className={`decision-card space-y-4 rounded-2xl border-2 p-5 ${style.box}`}
      >
        <div className="flex items-start gap-4">
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 24 24"
            className="mt-1 size-10 shrink-0"
            fill="currentColor"
          >
            {style.icon}
          </svg>
          <div>
            <p className="text-lg font-semibold uppercase tracking-wide">
              {result.crop} · {style.verdict}
            </p>
            <h2 id="decision-heading" className="text-3xl font-bold">
              {style.heading}
            </h2>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold">Why we say this</h3>
          <p className="text-lg">{result.reasoning}</p>
        </div>

        {result.riskFactors.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Watch out for</h3>
            <ul className="list-inside list-disc space-y-1 text-lg">
              {result.riskFactors.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section
        aria-labelledby="numbers-heading"
        className="space-y-4 rounded-2xl border border-line bg-background p-5"
      >
        <div>
          <h2 id="numbers-heading" className="text-xl font-bold">
            The numbers we used
          </h2>
          <p className="text-muted">
            Real forecast for {forecast.locationLabel}, next{" "}
            {forecast.forecastDays} days.
          </p>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <DataTile
            label="Rain expected"
            value={`${forecast.rainfallNext14DaysMm} mm`}
            note={
              result.cropRequirement
                ? `${result.crop} would want about ${forecast.expectedRainfallForCropMm} mm. That is ${forecast.rainfallVsNeedPercent}% of its need.`
                : undefined
            }
          />
          <DataTile
            label="Rain in the last 30 days"
            value={`${forecast.rainfallPast30DaysMm} mm`}
            note="Tells you how much moisture is already in the soil."
          />
          <DataTile
            label="Daytime heat"
            value={`${forecast.avgMaxTempC} °C on average`}
            note={
              result.cropRequirement
                ? `Hottest day ${forecast.hottestDayC} °C. ${forecast.daysAboveIdealTemp} of ${forecast.forecastDays} days are hotter than this crop likes.`
                : `Hottest day ${forecast.hottestDayC} °C.`
            }
          />
          <DataTile
            label="Night-time cool"
            value={`${forecast.avgMinTempC} °C on average`}
            note={
              result.cropRequirement
                ? `Coldest night ${forecast.coldestNightC} °C. ${forecast.daysBelowIdealTemp} of ${forecast.forecastDays} nights are colder than this crop likes.`
                : `Coldest night ${forecast.coldestNightC} °C.`
            }
          />
          {result.priceContext ? (
            <DataTile
              label={`Mandi price, ${result.priceContext.region}`}
              value={`₹${result.priceContext.pricePerQuintal.toLocaleString("en-IN")} per quintal`}
              note={`Price is ${TREND_WORDS[result.priceContext.trend]}.`}
            />
          ) : null}
          {result.cropRequirement ? (
            <DataTile
              label="Time to harvest"
              value={`about ${result.cropRequirement.growingDurationDays} days`}
              note={`Water need: ${result.cropRequirement.waterNeed}. Likes ${result.cropRequirement.idealTempMinC} °C to ${result.cropRequirement.idealTempMaxC} °C.`}
            />
          ) : null}
        </dl>
      </section>

      {result.suggestedAlternatives.length > 0 ? (
        <section
          aria-labelledby="alternatives-heading"
          className="space-y-3 rounded-2xl border border-line bg-surface p-5"
        >
          <h2 id="alternatives-heading" className="text-xl font-bold">
            Crops that would suit your weather better
          </h2>
          <ul className="space-y-3">
            {result.suggestedAlternatives.map((alt) => (
              <li key={alt.crop} className="rounded-xl border border-line p-4">
                <p className="text-lg font-semibold">{alt.crop}</p>
                <p className="text-muted">{alt.why}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <SuggestedInputsList items={result.suggestedInputs} />

      <button
        type="button"
        onClick={onStartOver}
        className="min-h-14 w-full rounded-xl border-2 border-brand px-6 text-lg font-bold text-brand-strong hover:bg-green-50"
      >
        Ask about another crop
      </button>
    </div>
  );
}
