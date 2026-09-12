"use client";

import { useId, useRef, useState } from "react";
import { Spinner } from "./Spinner";
import {
  type District,
  districts,
  findDistrict,
  nearestDistrict,
} from "@/lib/districts";

export interface AdvisoryFormValues {
  lat: number;
  lon: number;
  crop: string;
  /** Omitted when the fix is outside Kerala, so no district is claimed for it. */
  locationLabel?: string;
  region?: string;
}

interface OnboardingFormProps {
  crops: string[];
  busy: boolean;
  onSubmit: (values: AdvisoryFormValues) => void;
}

type LocationState =
  | { kind: "none" }
  | { kind: "locating" }
  | {
      kind: "gps";
      lat: number;
      lon: number;
      /** Null when the fix is too far from any listed district to name one. */
      district: District | null;
      distanceKm: number;
    }
  | { kind: "denied"; reason: string };

const OTHER_CROP = "__other__";

export function OnboardingForm({ crops, busy, onSubmit }: OnboardingFormProps) {
  const ids = {
    district: useId(),
    crop: useId(),
    otherCrop: useId(),
    locationStatus: useId(),
    cropHint: useId(),
    formError: useId(),
  };

  const [location, setLocation] = useState<LocationState>({ kind: "none" });
  const [districtId, setDistrictId] = useState("");
  const [cropChoice, setCropChoice] = useState("");
  const [otherCrop, setOtherCrop] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const districtRef = useRef<HTMLSelectElement>(null);
  const cropRef = useRef<HTMLSelectElement>(null);
  const otherCropRef = useRef<HTMLInputElement>(null);

  const usingOtherCrop = cropChoice === OTHER_CROP;

  function requestGps() {
    if (!("geolocation" in navigator)) {
      setLocation({
        kind: "denied",
        reason:
          "This phone or browser cannot share your location. Please choose your district from the list below.",
      });
      districtRef.current?.focus();
      return;
    }

    setLocation({ kind: "locating" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const near = nearestDistrict(latitude, longitude);
        setLocation({
          kind: "gps",
          lat: latitude,
          lon: longitude,
          // Outside Kerala we keep the real coordinates but name no district,
          // rather than snapping the farmer to one hundreds of km away.
          district: near.withinCoverage ? near.district : null,
          distanceKm: near.distanceKm,
        });
        setDistrictId("");
      },
      (error) => {
        // The three failure causes need different advice, so they get different
        // messages. "Try again" is useless if the farmer denied permission.
        const reason =
          error.code === error.PERMISSION_DENIED
            ? "You did not allow location access. No problem, please choose your district from the list below."
            : error.code === error.TIMEOUT
              ? "Finding your location took too long. Try again outdoors, or choose your district from the list below."
              : "Your location could not be found, which often happens indoors. Please choose your district from the list below.";

        setLocation({ kind: "denied", reason });
        districtRef.current?.focus();
      },
      { timeout: 10_000, maximumAge: 300_000 },
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const district = districtId ? findDistrict(districtId) : undefined;
    const place: Omit<AdvisoryFormValues, "crop"> | null =
      location.kind === "gps"
        ? {
            lat: location.lat,
            lon: location.lon,
            // Both left undefined outside Kerala. The forecast still works from
            // the coordinates; the server then labels it with those instead.
            locationLabel: location.district
              ? `${location.district.name}, ${location.district.state}`
              : undefined,
            region: location.district?.state,
          }
        : district
          ? {
              lat: district.lat,
              lon: district.lon,
              locationLabel: `${district.name}, ${district.state}`,
              region: district.state,
            }
          : null;

    if (!place) {
      setFormError(
        "First tell us where your farm is. Either share your location or choose your district.",
      );
      districtRef.current?.focus();
      return;
    }

    const crop = usingOtherCrop ? otherCrop.trim() : cropChoice;
    if (!crop) {
      setFormError(
        usingOtherCrop
          ? "Please type the name of the crop you want advice about."
          : "Please choose the crop you want advice about.",
      );
      (usingOtherCrop ? otherCropRef : cropRef).current?.focus();
      return;
    }

    setFormError(null);
    onSubmit({ ...place, crop });
  }

  const locationStatusText =
    location.kind === "locating"
      ? "Finding your location, please wait."
      : location.kind === "gps"
        ? location.district
          ? `Location found, near ${location.district.name}. We will use the forecast for your exact spot.`
          : `Location found, but it is about ${location.distanceKm} km outside Kerala, so we cannot match it to a district. We will still use the forecast for your exact spot.`
        : location.kind === "denied"
          ? location.reason
          : "";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {formError ? (
        <p
          id={ids.formError}
          role="alert"
          className="rounded-xl border-2 border-red-800 bg-red-50 p-4 font-semibold text-red-950"
        >
          {formError}
        </p>
      ) : null}

      <fieldset className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <legend className="px-1 text-xl font-bold">1. Where is your farm?</legend>

        <button
          type="button"
          onClick={requestGps}
          disabled={busy || location.kind === "locating"}
          aria-describedby={ids.locationStatus}
          className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-brand px-5 py-3 text-lg font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {location.kind === "locating" ? (
            <Spinner />
          ) : (
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 24 24"
              className="size-6"
              fill="currentColor"
            >
              <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
            </svg>
          )}
          Use my current location
        </button>

        {/*
          Live region so the outcome of the GPS request is announced. It stays in
          the DOM at all times, otherwise screen readers can miss the update.
        */}
        <p
          id={ids.locationStatus}
          aria-live="polite"
          className={
            location.kind === "denied" ||
            (location.kind === "gps" && !location.district)
              ? "font-semibold text-red-900"
              : "text-muted"
          }
        >
          {locationStatusText}
        </p>

        {/*
          Left readable by assistive tech on purpose. A screen reader user needs
          to know the district list is an alternative, not an extra step.
        */}
        <p className="text-muted">or</p>

        <div className="space-y-2">
          <label htmlFor={ids.district} className="block text-lg font-semibold">
            Choose your district in Kerala
          </label>
          <select
            id={ids.district}
            ref={districtRef}
            value={districtId}
            disabled={busy}
            onChange={(event) => {
              setDistrictId(event.target.value);
              if (event.target.value) setLocation({ kind: "none" });
            }}
            className="min-h-14 w-full rounded-xl border-2 border-control bg-surface px-4 text-lg"
          >
            <option value="">Not selected</option>
            {/* State omitted from each option: all 14 are Kerala, so repeating
                it 14 times is just more for the farmer to read past. */}
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <legend className="px-1 text-xl font-bold">
          2. Which crop are you thinking about?
        </legend>

        <div className="space-y-2">
          <label htmlFor={ids.crop} className="block text-lg font-semibold">
            Crop
          </label>
          <p id={ids.cropHint} className="text-muted">
            Pick from the list, or choose the last option to type any other crop.
          </p>
          <select
            id={ids.crop}
            ref={cropRef}
            value={cropChoice}
            disabled={busy}
            aria-describedby={ids.cropHint}
            onChange={(event) => setCropChoice(event.target.value)}
            className="min-h-14 w-full rounded-xl border-2 border-control bg-surface px-4 text-lg"
          >
            <option value="">Not selected</option>
            {crops.map((crop) => (
              <option key={crop} value={crop}>
                {crop}
              </option>
            ))}
            <option value={OTHER_CROP}>Another crop (type it myself)</option>
          </select>
        </div>

        {usingOtherCrop ? (
          <div className="space-y-2">
            <label
              htmlFor={ids.otherCrop}
              className="block text-lg font-semibold"
            >
              Crop name
            </label>
            <input
              id={ids.otherCrop}
              ref={otherCropRef}
              type="text"
              value={otherCrop}
              disabled={busy}
              maxLength={60}
              autoComplete="off"
              onChange={(event) => setOtherCrop(event.target.value)}
              className="min-h-14 w-full rounded-xl border-2 border-control bg-surface px-4 text-lg"
            />
            <p className="text-muted">
              We may not have water and temperature records for every crop. If we
              do not, we will say so instead of guessing.
            </p>
          </div>
        ) : null}
      </fieldset>

      <button
        type="submit"
        disabled={busy}
        className="flex min-h-16 w-full items-center justify-center gap-3 rounded-xl bg-brand px-6 text-xl font-bold text-white hover:bg-brand-strong disabled:opacity-60"
      >
        {busy ? <Spinner /> : null}
        {busy ? "Checking for you…" : "Get my planting advice"}
      </button>
    </form>
  );
}
