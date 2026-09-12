"use client";

import { useId, useRef, useState } from "react";
import { ErrorNotice } from "./ErrorNotice";
import { ListingDraft } from "./ListingDraft";
import { Spinner } from "./Spinner";
import type { ApiError, MarketResponse, PostedListing } from "@/lib/types";

type Phase =
  | { kind: "form" }
  | { kind: "loading" }
  | { kind: "draft"; draft: MarketResponse }
  | { kind: "error"; message: string };

const GENERIC_ERROR =
  "We could not write your listing just now. Please check your internet and try again.";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function MarketFlow({
  crops,
  regions,
}: {
  crops: string[];
  regions: string[];
}) {
  const ids = {
    crop: useId(),
    quantity: useId(),
    quantityHint: useId(),
    region: useId(),
    feed: useId(),
  };

  const [phase, setPhase] = useState<Phase>({ kind: "form" });
  const [crop, setCrop] = useState("");
  const [quantity, setQuantity] = useState("");
  const [region, setRegion] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // The "posted" feed. In browser memory only - nothing is persisted anywhere,
  // and a refresh clears it. That is deliberate for this MVP.
  const [listings, setListings] = useState<PostedListing[]>([]);
  const [justPostedId, setJustPostedId] = useState<string | null>(null);

  const cropRef = useRef<HTMLSelectElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const regionRef = useRef<HTMLSelectElement>(null);
  const draftRef = useRef<HTMLDivElement>(null);

  async function draftListing() {
    if (!crop) {
      setFormError("Please choose which crop you want to sell.");
      cropRef.current?.focus();
      return;
    }

    const amount = Number(quantity);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError(
        "Please enter how many quintals you have to sell, as a number above zero.",
      );
      quantityRef.current?.focus();
      return;
    }

    if (!region) {
      setFormError("Please choose where you are selling from.");
      regionRef.current?.focus();
      return;
    }

    setFormError(null);
    setPhase({ kind: "loading" });

    try {
      const response = await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crop, quantity: amount, region }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ApiError | null;
        setPhase({ kind: "error", message: body?.message ?? GENERIC_ERROR });
        return;
      }

      const draft = (await response.json()) as MarketResponse;
      setPhase({ kind: "draft", draft });
      requestAnimationFrame(() => draftRef.current?.focus());
    } catch {
      setPhase({ kind: "error", message: GENERIC_ERROR });
    }
  }

  function post(draft: MarketResponse) {
    const listing: PostedListing = {
      ...draft,
      id: `listing-${Date.now()}`,
      postedAt: new Date().toISOString(),
    };
    setListings((current) => [listing, ...current]);
    setJustPostedId(listing.id);
    setPhase({ kind: "form" });
  }

  return (
    <div className="space-y-8">
      <p aria-live="polite" className="sr-only">
        {phase.kind === "loading"
          ? "Writing your listing. This takes a few seconds."
          : phase.kind === "draft"
            ? "Your draft listing is ready."
            : justPostedId
              ? "Listing posted to the board below."
              : ""}
      </p>

      {phase.kind === "form" || phase.kind === "loading" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void draftListing();
          }}
          noValidate
          className="space-y-6"
        >
          {formError ? (
            <p
              role="alert"
              className="rounded-xl border-2 border-red-800 bg-red-50 p-4 font-semibold text-red-950"
            >
              {formError}
            </p>
          ) : null}

          <fieldset className="space-y-5 rounded-2xl border border-line bg-surface p-5">
            <legend className="px-1 text-xl font-bold">
              What do you have to sell?
            </legend>

            <div className="space-y-2">
              <label htmlFor={ids.crop} className="block text-lg font-semibold">
                Crop
              </label>
              <select
                id={ids.crop}
                ref={cropRef}
                value={crop}
                disabled={phase.kind === "loading"}
                onChange={(event) => setCrop(event.target.value)}
                className="min-h-14 w-full rounded-xl border-2 border-control bg-surface px-4 text-lg"
              >
                <option value="">Not selected</option>
                {crops.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor={ids.quantity}
                className="block text-lg font-semibold"
              >
                How much, in quintals
              </label>
              <p id={ids.quantityHint} className="text-muted">
                One quintal is 100 kilograms. Ten bags of 50 kg is about 5
                quintals.
              </p>
              <input
                id={ids.quantity}
                ref={quantityRef}
                type="number"
                // inputMode brings up the number pad on a phone rather than the
                // full keyboard, which is fewer taps and fewer mistakes.
                inputMode="decimal"
                min={0.1}
                step={0.5}
                value={quantity}
                disabled={phase.kind === "loading"}
                aria-describedby={ids.quantityHint}
                onChange={(event) => setQuantity(event.target.value)}
                className="min-h-14 w-full rounded-xl border-2 border-control bg-surface px-4 text-lg"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor={ids.region} className="block text-lg font-semibold">
                Where are you selling from
              </label>
              <select
                id={ids.region}
                ref={regionRef}
                value={region}
                disabled={phase.kind === "loading"}
                onChange={(event) => setRegion(event.target.value)}
                className="min-h-14 w-full rounded-xl border-2 border-control bg-surface px-4 text-lg"
              >
                <option value="">Not selected</option>
                {regions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={phase.kind === "loading"}
            className="flex min-h-16 w-full items-center justify-center gap-3 rounded-xl bg-brand px-6 text-xl font-bold text-white hover:bg-brand-strong disabled:opacity-60"
          >
            {phase.kind === "loading" ? <Spinner /> : null}
            {phase.kind === "loading"
              ? "Writing your listing…"
              : "Write my listing"}
          </button>
        </form>
      ) : null}

      {phase.kind === "error" ? (
        <ErrorNotice message={phase.message} onRetry={() => void draftListing()} />
      ) : null}

      {phase.kind === "draft" ? (
        <div ref={draftRef} tabIndex={-1}>
          <ListingDraft
            draft={phase.draft}
            onPost={() => post(phase.draft)}
            onStartOver={() => setPhase({ kind: "form" })}
          />
        </div>
      ) : null}

      <section aria-labelledby={ids.feed} className="space-y-4">
        <h2 id={ids.feed} className="text-xl font-bold">
          Your posted listings
          {listings.length > 0 ? ` (${listings.length})` : ""}
        </h2>

        {listings.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-5 text-muted">
            Nothing posted yet. Write a listing above and post it, and it will show
            up here.
          </p>
        ) : (
          <ul className="space-y-4">
            {listings.map((listing) => (
              <li
                key={listing.id}
                className={`space-y-2 rounded-2xl border-2 p-5 ${
                  listing.id === justPostedId
                    ? "border-brand bg-green-50"
                    : "border-line bg-surface"
                }`}
              >
                {listing.id === justPostedId ? (
                  <p className="font-semibold text-brand-strong">Just posted</p>
                ) : null}
                <h3 className="text-lg font-bold">{listing.listingTitle}</h3>
                <p>{listing.listingDescription}</p>
                <p className="text-muted">
                  {listing.quantityQuintals} quintals of {listing.crop} ·{" "}
                  {listing.region}
                  {listing.priceGuidance
                    ? ` · about ₹${Math.round(listing.priceGuidance.estimatedValue).toLocaleString("en-IN")}`
                    : ""}
                </p>
                <p className="text-muted">
                  Posted {formatTime(listing.postedAt)} ·{" "}
                  {listing.matchedBuyers.length} matched{" "}
                  {listing.matchedBuyers.length === 1 ? "buyer" : "buyers"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
