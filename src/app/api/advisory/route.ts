import { runAdvisoryAgent } from "@/lib/agents/advisory";
import { WeatherError } from "@/lib/weather";
import type { ApiError, AdvisoryResponse } from "@/lib/types";

/** Farmer-facing copy. Raw exception text never reaches the browser. */
const MESSAGES = {
  badRequest:
    "We need your location and a crop before we can advise you. Please pick both and try again.",
  weather:
    "We could not get the weather forecast for your location just now. Please check your internet and try again in a moment.",
  unknown: "Something went wrong on our side. Please try again in a moment.",
};

interface AdvisoryBody {
  lat?: unknown;
  lon?: unknown;
  crop?: unknown;
  locationLabel?: unknown;
  region?: unknown;
}

function fail(error: string, message: string, status: number) {
  return Response.json({ error, message } satisfies ApiError, { status });
}

function isValidLatitude(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 90
  );
}

function isValidLongitude(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 180
  );
}

export async function POST(request: Request) {
  let body: AdvisoryBody;
  try {
    body = (await request.json()) as AdvisoryBody;
  } catch {
    return fail("invalid_json", MESSAGES.badRequest, 400);
  }

  const { lat, lon, crop, locationLabel, region } = body;

  if (
    !isValidLatitude(lat) ||
    !isValidLongitude(lon) ||
    typeof crop !== "string" ||
    crop.trim().length === 0
  ) {
    return fail("invalid_input", MESSAGES.badRequest, 400);
  }

  try {
    const result: AdvisoryResponse = await runAdvisoryAgent({
      lat,
      lon,
      crop: crop.trim().slice(0, 60),
      locationLabel:
        typeof locationLabel === "string"
          ? locationLabel.slice(0, 80)
          : undefined,
      region: typeof region === "string" ? region.slice(0, 80) : undefined,
    });
    return Response.json(result);
  } catch (error) {
    console.error("[api/advisory] failed", error);

    if (error instanceof WeatherError) {
      return fail("weather_unavailable", MESSAGES.weather, 502);
    }
    return fail("advisory_failed", MESSAGES.unknown, 500);
  }
}
