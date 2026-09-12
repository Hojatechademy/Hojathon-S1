import type { MarketResponse, MatchedBuyer } from "@/lib/types";

const BUYER_TYPE_LABELS: Record<MatchedBuyer["type"], string> = {
  wholesaler: "Wholesaler",
  processor: "Processor",
  exporter: "Exporter",
  cooperative: "Cooperative",
};

function rupees(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function ListingDraft({
  draft,
  onPost,
  onStartOver,
}: {
  draft: MarketResponse;
  onPost: () => void;
  onStartOver: () => void;
}) {
  const price = draft.priceGuidance;

  return (
    <div className="space-y-6">
      {draft.degraded ? (
        <p
          role="status"
          className="rounded-xl border-2 border-amber-700 bg-amber-50 p-4 text-amber-950"
        >
          Our writer could not be reached, so this listing was put together from
          your figures and the mandi rate on record. The numbers below are still
          accurate.
        </p>
      ) : null}

      <section
        aria-labelledby="listing-heading"
        className="space-y-4 rounded-2xl border-2 border-brand bg-surface p-5"
      >
        <p className="font-semibold uppercase tracking-wide text-brand-strong">
          Draft listing, not posted yet
        </p>
        <h2 id="listing-heading" className="text-2xl font-bold">
          {draft.listingTitle}
        </h2>
        <p className="text-lg">{draft.listingDescription}</p>

        {draft.listingHighlights.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {draft.listingHighlights.map((point) => (
              <li
                key={point}
                className="rounded-full border border-control px-4 py-1 font-semibold"
              >
                {point}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="space-y-2 rounded-xl border border-line bg-background p-4">
          <h3 className="text-lg font-bold">Why it is written this way</h3>
          <p>{draft.reasoning}</p>
        </div>
      </section>

      {price ? (
        <section
          aria-labelledby="price-heading"
          className="space-y-3 rounded-2xl border border-line bg-surface p-5"
        >
          <h2 id="price-heading" className="text-xl font-bold">
            What your lot is worth
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="data-tile rounded-xl border border-line p-4">
              <dt className="text-muted">Whole lot, at the mandi rate</dt>
              <dd className="mt-1 text-2xl font-bold">
                about {rupees(price.estimatedValue)}
              </dd>
            </div>
            <div className="data-tile rounded-xl border border-line p-4">
              <dt className="text-muted">Rate to quote, per quintal</dt>
              <dd className="mt-1 text-2xl font-bold">
                {rupees(price.suggestedAskMin)} to {rupees(price.suggestedAskMax)}
              </dd>
            </div>
          </dl>
          <p>{price.note}</p>
          <p className="text-muted">
            Based on {price.quantityQuintals} quintals at the {price.region}{" "}
            reference rate of {rupees(price.referencePricePerQuintal)} per quintal.
          </p>
        </section>
      ) : (
        <p className="rounded-2xl border border-line bg-surface p-5">
          We have no price on record for {draft.crop}, so no rate is suggested.
          Ask two or three buyers before agreeing to anything.
        </p>
      )}

      {draft.matchedBuyers.length > 0 ? (
        <section
          aria-labelledby="buyers-heading"
          className="space-y-3 rounded-2xl border border-line bg-surface p-5"
        >
          <h2 id="buyers-heading" className="text-xl font-bold">
            Buyers who take {draft.crop}
          </h2>
          <ul className="space-y-3">
            {draft.matchedBuyers.map((buyer) => (
              <li
                key={buyer.id}
                className={`rounded-xl border-2 p-4 ${
                  buyer.meetsMinimum ? "border-line" : "border-amber-700 bg-amber-50"
                }`}
              >
                <p className="text-lg font-semibold">{buyer.name}</p>
                <p>
                  {BUYER_TYPE_LABELS[buyer.type]} · {buyer.region}
                </p>
                <p className="text-muted">{buyer.contactLabel}</p>
                <p className="mt-1">{buyer.why}</p>
                <p className="text-muted">{buyer.notes}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="space-y-3">
        <button
          type="button"
          onClick={onPost}
          className="min-h-16 w-full rounded-xl bg-brand px-6 text-xl font-bold text-white hover:bg-brand-strong"
        >
          Post to marketplace
        </button>
        <p className="text-muted">
          This puts your listing on the board below inside this app. It is a demo,
          so nothing is sent to any outside website or buyer.
        </p>
        <button
          type="button"
          onClick={onStartOver}
          className="min-h-14 w-full rounded-xl border-2 border-brand px-6 text-lg font-bold text-brand-strong hover:bg-green-50"
        >
          Change what I am selling
        </button>
      </div>
    </div>
  );
}
