/**
 * Open-Meteo client. No API key required.
 * Docs: https://open-meteo.com/en/docs
 */

import type { CropRequirement, ForecastSummary } from "./types";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

/** Days of history we pull to give the model recent rainfall context. */
const PAST_DAYS = 30;
/** Days ahead we ask for. Open-Meteo serves up to 16 on the free tier. */
const FORECAST_DAYS = 16;
/** Window the advice is actually reasoned over. */
const DECISION_WINDOW_DAYS = 14;

interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_sum: (number | null)[];
}

interface OpenMeteoResponse {
  timezone: string;
  daily: OpenMeteoDaily;
}

export class WeatherError extends Error {}

function sum(values: (number | null)[]): number {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

function average(values: (number | null)[]): number {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return 0;
  return sum(present) / present.length;
}

function round(value: number, places = 1): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/** Total attempts, including the first. Connect timeouts on rural links are common. */
const ATTEMPTS = 3;

function buildUrl(lat: number, lon: number): URL {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum",
  );
  url.searchParams.set("past_days", String(PAST_DAYS));
  url.searchParams.set("forecast_days", String(FORECAST_DAYS));
  url.searchParams.set("timezone", "auto");
  return url;
}

/** Thrown for problems a retry cannot fix, e.g. a rejected request. */
class FatalWeatherError extends WeatherError {}

async function attemptForecast(url: URL): Promise<OpenMeteoResponse> {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });

  if (!response.ok) {
    const message = `Weather service returned HTTP ${response.status}`;
    // 4xx means our request is wrong, so stop. 5xx is worth another go.
    throw response.status < 500
      ? new FatalWeatherError(message)
      : new WeatherError(message);
  }

  const data = (await response.json()) as OpenMeteoResponse;
  if (!data?.daily?.time?.length) {
    throw new FatalWeatherError("Weather service returned no daily data");
  }
  return data;
}

export async function fetchForecast(
  lat: number,
  lon: number,
): Promise<OpenMeteoResponse> {
  const url = buildUrl(lat, lon);
  let lastError: unknown;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      return await attemptForecast(url);
    } catch (cause) {
      if (cause instanceof FatalWeatherError) throw cause;
      lastError = cause;
    }

    if (attempt < ATTEMPTS) {
      // Short linear backoff. The farmer is watching a spinner, so keep it brief.
      await new Promise((resolve) => setTimeout(resolve, attempt * 400));
    }
  }

  throw new WeatherError("Could not reach the weather service", {
    cause: lastError,
  });
}

/**
 * Reduces the raw Open-Meteo arrays to the handful of figures the advisory
 * decision hangs on. Computed here in code, not by the model, so the numbers
 * shown to the farmer are always arithmetic rather than generated text.
 */
export function summariseForecast(
  data: OpenMeteoResponse,
  locationLabel: string,
  requirement: CropRequirement | null,
): ForecastSummary {
  const { daily } = data;

  // Open-Meteo returns history first, then today onward.
  const historyEnd = Math.min(PAST_DAYS, daily.time.length);
  const pastRain = daily.precipitation_sum.slice(0, historyEnd);

  const futureStart = historyEnd;
  const futureEnd = Math.min(
    futureStart + DECISION_WINDOW_DAYS,
    daily.time.length,
  );

  const maxTemps = daily.temperature_2m_max.slice(futureStart, futureEnd);
  const minTemps = daily.temperature_2m_min.slice(futureStart, futureEnd);
  const futureRain = daily.precipitation_sum.slice(futureStart, futureEnd);

  const presentMax = maxTemps.filter((v): v is number => v !== null);
  const presentMin = minTemps.filter((v): v is number => v !== null);

  const rainfallNext14DaysMm = round(sum(futureRain));

  // Pro-rate the crop's full-season rainfall need down to the same window.
  const expectedRainfallForCropMm = requirement
    ? round(
        (requirement.seasonalRainfallMm / requirement.growingDurationDays) *
          (futureEnd - futureStart),
      )
    : 0;

  const rainfallVsNeedPercent =
    expectedRainfallForCropMm > 0
      ? Math.round((rainfallNext14DaysMm / expectedRainfallForCropMm) * 100)
      : 0;

  return {
    locationLabel,
    timezone: data.timezone,
    forecastDays: futureEnd - futureStart,
    rainfallNext14DaysMm,
    rainfallPast30DaysMm: round(sum(pastRain)),
    avgMaxTempC: round(average(maxTemps)),
    avgMinTempC: round(average(minTemps)),
    hottestDayC: presentMax.length ? round(Math.max(...presentMax)) : 0,
    coldestNightC: presentMin.length ? round(Math.min(...presentMin)) : 0,
    daysAboveIdealTemp: requirement
      ? presentMax.filter((t) => t > requirement.idealTempMaxC).length
      : 0,
    daysBelowIdealTemp: requirement
      ? presentMin.filter((t) => t < requirement.idealTempMinC).length
      : 0,
    expectedRainfallForCropMm,
    rainfallVsNeedPercent,
  };
}
