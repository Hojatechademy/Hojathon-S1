/**
 * Agent 1 - Onboarding + Advisory.
 *
 * Multi-step flow, not a single prompt:
 *   1. pull a real 16-day forecast plus 30 days of history from Open-Meteo
 *   2. reduce it to hard numbers against the crop's water/temperature needs
 *   3. look up the crop's mandi price trend
 *   4. hand only those figures to the model for a Plant / Caution / Don't Plant call
 *   5. match real vendor rows to the decision for the suggested purchase list
 *
 * Steps 1-3 and 5 are deterministic code. The model's job is judgement and
 * explanation, so every number the farmer sees is arithmetic we can stand behind.
 */

import {
  findCropRequirement,
  findPriceContext,
  lowerWaterCrops,
  suggestInputsForCrop,
} from "@/lib/data";
import { TEXT_MODEL, chatJson } from "@/lib/openrouter";
import { fetchForecast, summariseForecast } from "@/lib/weather";
import type {
  AdvisoryDecision,
  AdvisoryResponse,
  CropAlternative,
  CropRequirement,
  ForecastSummary,
  PriceContext,
} from "@/lib/types";

const DECISIONS: AdvisoryDecision[] = [
  "Plant",
  "Plant with Caution",
  "Don't Plant",
];

/** Below this share of the crop's water need we treat rainfall as short. */
const RAINFALL_SHORTFALL_PERCENT = 70;

const SYSTEM_PROMPT = `You are an agricultural advisory agent helping a smallholder farmer in India decide whether to plant a crop right now.

Rules you must follow:
- Use ONLY the data given to you in the user message. Never invent rainfall figures, prices, soil data, pest reports, or any other data source.
- Reference the actual numbers you were given in your reasoning. Say "rainfall over the next 14 days is 18mm against the 52mm this crop wants" rather than "rainfall is low".
- Write the reasoning in plain, everyday language a farmer can act on. 2 to 4 sentences. No jargon, no bullet points inside the reasoning.
- If the crop is irrigation-intensive AND forecast rainfall is short of what it needs, say so explicitly, and recommend a less water-hungry crop from the alternatives list you were given.
- riskFactors must be short phrases, at most 8 words each, and each one must be grounded in a number you were given. Return an empty array if there are genuinely no risks.
- Only fill suggestedAlternatives when you are advising caution or against planting. Otherwise return an empty array.

Respond with a single JSON object and nothing else, in this exact shape:
{
  "decision": "Plant" | "Plant with Caution" | "Don't Plant",
  "reasoning": "2-4 plain sentences citing the numbers",
  "riskFactors": ["short grounded phrase"],
  "suggestedAlternatives": [{ "crop": "name from the alternatives list", "why": "one short sentence" }]
}`;

interface ModelReply {
  decision?: string;
  reasoning?: string;
  riskFactors?: unknown;
  suggestedAlternatives?: unknown;
}

function buildUserPrompt(
  crop: string,
  forecast: ForecastSummary,
  requirement: CropRequirement | null,
  price: PriceContext | null,
  alternatives: CropRequirement[],
): string {
  const lines: string[] = [
    `CROP THE FARMER IS CONSIDERING: ${crop}`,
    `LOCATION: ${forecast.locationLabel} (timezone ${forecast.timezone})`,
    "",
    `WEATHER DATA (Open-Meteo, real forecast):`,
    `- Rainfall recorded over the past 30 days: ${forecast.rainfallPast30DaysMm}mm`,
    `- Rainfall forecast for the next ${forecast.forecastDays} days: ${forecast.rainfallNext14DaysMm}mm`,
    `- Average daytime high over that window: ${forecast.avgMaxTempC}C`,
    `- Average night-time low over that window: ${forecast.avgMinTempC}C`,
    `- Hottest forecast day: ${forecast.hottestDayC}C, coldest forecast night: ${forecast.coldestNightC}C`,
  ];

  if (requirement) {
    lines.push(
      "",
      `WHAT ${crop.toUpperCase()} NEEDS:`,
      `- Water need: ${requirement.waterNeed}`,
      `- Irrigation-intensive crop: ${requirement.irrigationIntensive ? "yes" : "no"}`,
      `- Ideal temperature range: ${requirement.idealTempMinC}C to ${requirement.idealTempMaxC}C`,
      `- Typical time to harvest: ${requirement.growingDurationDays} days`,
      `- Rainfall it would want across the next ${forecast.forecastDays} days: ${forecast.expectedRainfallForCropMm}mm`,
      "",
      `COMPARISON ALREADY CALCULATED FOR YOU:`,
      `- Forecast rainfall is ${forecast.rainfallVsNeedPercent}% of what this crop wants over the window`,
      `- Forecast days hotter than the crop's ideal maximum: ${forecast.daysAboveIdealTemp} of ${forecast.forecastDays}`,
      `- Forecast nights colder than the crop's ideal minimum: ${forecast.daysBelowIdealTemp} of ${forecast.forecastDays}`,
    );
  } else {
    lines.push(
      "",
      `WHAT ${crop.toUpperCase()} NEEDS: no reference data available for this crop.`,
      `Say plainly that you have no requirement data for it, and keep your confidence low.`,
    );
  }

  if (price) {
    lines.push(
      "",
      `MARKET DATA (mandi reference prices):`,
      `- ${price.crop} in ${price.region}: Rs ${price.pricePerQuintal} per quintal, price trend ${price.trend}`,
    );
  }

  if (alternatives.length > 0) {
    lines.push(
      "",
      `LESS WATER-HUNGRY ALTERNATIVES you may recommend (and nothing outside this list):`,
      ...alternatives.map(
        (alt) =>
          `- ${alt.crop}: water need ${alt.waterNeed}, wants about ${alt.seasonalRainfallMm}mm per season, ${alt.growingDurationDays} days to harvest`,
      ),
    );
  }

  return lines.join("\n");
}

function normaliseDecision(value: unknown): AdvisoryDecision {
  if (typeof value !== "string") return "Plant with Caution";
  const cleaned = value.trim().toLowerCase().replace(/[’']/g, "'");
  const match = DECISIONS.find((d) => d.toLowerCase() === cleaned);
  if (match) return match;
  if (cleaned.includes("don't") || cleaned.includes("dont")) return "Don't Plant";
  if (cleaned.includes("caution")) return "Plant with Caution";
  if (cleaned === "plant") return "Plant";
  return "Plant with Caution";
}

function toStringArray(value: unknown, limit = 4): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function toAlternatives(value: unknown, allowed: Set<string>): CropAlternative[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is { crop: string; why: string } =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as { crop?: unknown }).crop === "string",
    )
    .filter((item) => allowed.has(item.crop.trim().toLowerCase()))
    .map((item) => ({
      crop: item.crop.trim(),
      why: typeof item.why === "string" ? item.why.trim() : "",
    }))
    .slice(0, 3);
}

/**
 * Rule-based advice used when the model call fails. Keeps the demo alive and the
 * farmer informed rather than showing a dead end.
 */
function fallbackAdvice(
  crop: string,
  forecast: ForecastSummary,
  requirement: CropRequirement | null,
): { decision: AdvisoryDecision; reasoning: string; riskFactors: string[] } {
  if (!requirement) {
    return {
      decision: "Plant with Caution",
      reasoning: `We could not reach our advisor just now, and we have no water or temperature reference data for ${crop}. What we do know from the forecast: ${forecast.rainfallNext14DaysMm}mm of rain expected over the next ${forecast.forecastDays} days, with daytime highs averaging ${forecast.avgMaxTempC}C. Please check with your local krishi officer before sowing.`,
      riskFactors: ["No reference data for this crop"],
    };
  }

  const short = forecast.rainfallVsNeedPercent < RAINFALL_SHORTFALL_PERCENT;
  const hot = forecast.daysAboveIdealTemp > forecast.forecastDays / 2;

  const risks: string[] = [];
  if (short) {
    risks.push(
      `Rain only ${forecast.rainfallVsNeedPercent}% of the crop's need`,
    );
  }
  if (hot) {
    risks.push(`${forecast.daysAboveIdealTemp} days above ${requirement.idealTempMaxC}C`);
  }
  if (forecast.daysBelowIdealTemp > forecast.forecastDays / 2) {
    risks.push(`${forecast.daysBelowIdealTemp} nights below ${requirement.idealTempMinC}C`);
  }

  let decision: AdvisoryDecision = "Plant";
  if (short && requirement.irrigationIntensive) decision = "Don't Plant";
  else if (short || hot) decision = "Plant with Caution";

  return {
    decision,
    reasoning: `Our advisor is unreachable, so this is a straight comparison of the numbers. Rainfall over the next ${forecast.forecastDays} days is forecast at ${forecast.rainfallNext14DaysMm}mm, which is ${forecast.rainfallVsNeedPercent}% of the ${forecast.expectedRainfallForCropMm}mm ${crop} would want. Daytime highs average ${forecast.avgMaxTempC}C against an ideal ceiling of ${requirement.idealTempMaxC}C.`,
    riskFactors: risks,
  };
}

export interface AdvisoryRequest {
  lat: number;
  lon: number;
  crop: string;
  /** Optional label for the place, e.g. "Ludhiana, Punjab". */
  locationLabel?: string;
  /** Optional region used to pick the closest mandi price row. */
  region?: string;
}

export async function runAdvisoryAgent({
  lat,
  lon,
  crop,
  locationLabel,
  region,
}: AdvisoryRequest): Promise<AdvisoryResponse> {
  const requirement = findCropRequirement(crop);
  const label =
    locationLabel?.trim() || `${lat.toFixed(3)}, ${lon.toFixed(3)}`;

  // Step 1 + 2: real weather, reduced to figures we can defend.
  const raw = await fetchForecast(lat, lon);
  const forecast = summariseForecast(raw, label, requirement);

  // Step 3: market context.
  const priceContext = findPriceContext(crop, region);

  const alternatives = lowerWaterCrops(crop);
  const allowedAlternatives = new Set(
    alternatives.map((alt) => alt.crop.toLowerCase()),
  );

  // Step 4: judgement + explanation from the model.
  let decision: AdvisoryDecision;
  let reasoning: string;
  let riskFactors: string[];
  let suggestedAlternatives: CropAlternative[] = [];
  let degraded = false;

  try {
    const reply = await chatJson<ModelReply>({
      model: TEXT_MODEL,
      maxTokens: 700,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserPrompt(
            crop,
            forecast,
            requirement,
            priceContext,
            alternatives,
          ),
        },
      ],
    });

    decision = normaliseDecision(reply.decision);
    reasoning =
      typeof reply.reasoning === "string" && reply.reasoning.trim()
        ? reply.reasoning.trim()
        : fallbackAdvice(crop, forecast, requirement).reasoning;
    riskFactors = toStringArray(reply.riskFactors);
    suggestedAlternatives = toAlternatives(
      reply.suggestedAlternatives,
      allowedAlternatives,
    );
  } catch (error) {
    console.error("[advisory] model call failed, using rule-based fallback", error);
    const fallback = fallbackAdvice(crop, forecast, requirement);
    decision = fallback.decision;
    reasoning = fallback.reasoning;
    riskFactors = fallback.riskFactors;
    degraded = true;

    if (decision !== "Plant") {
      suggestedAlternatives = alternatives.slice(0, 2).map((alt) => ({
        crop: alt.crop,
        why: `Wants about ${alt.seasonalRainfallMm}mm a season, less than ${crop}.`,
      }));
    }
  }

  // Step 5: real vendor rows, chosen against the decision we just made.
  const needsIrrigation =
    forecast.rainfallVsNeedPercent > 0 &&
    forecast.rainfallVsNeedPercent < RAINFALL_SHORTFALL_PERCENT;

  const suggestedInputs =
    decision === "Don't Plant"
      ? []
      : suggestInputsForCrop(crop, { needsIrrigation });

  return {
    crop,
    decision,
    reasoning,
    riskFactors,
    forecastSummary: forecast,
    suggestedInputs,
    suggestedAlternatives,
    priceContext,
    cropRequirement: requirement,
    ...(degraded ? { degraded: true } : {}),
  };
}
