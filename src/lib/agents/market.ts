/**
 * Agent 3 - Market / Sell.
 *
 *   1. look up the mandi reference price for the crop and region
 *   2. work out lot value and a sensible asking range from that price
 *   3. match real buyer rows who take this crop, nearest region first
 *   4. hand those figures to the model to draft a wholesale listing
 *
 * Pricing is arithmetic, buyers come from the dataset, and the model writes the
 * sales copy. It is never asked to invent a price.
 */

import { findBuyers, findPriceContext } from "@/lib/data";
import { TEXT_MODEL, chatJson } from "@/lib/openrouter";
import type {
  MarketResponse,
  MatchedBuyer,
  PriceGuidance,
} from "@/lib/types";

/** How far either side of the reference price we suggest quoting. */
const ASK_SPREAD = 0.03;

const TREND_WORDS = {
  up: "rising",
  down: "falling",
  stable: "steady",
} as const;

const SYSTEM_PROMPT = `You are a produce marketing agent. You write short wholesale listings that help a smallholder farmer in India sell a lot of produce to bulk buyers: traders, processors, exporters and cooperatives.

Rules you must follow:
- Use ONLY the crop, quantity, region, price figures and buyer details given to you. Never invent a grade, a certification, a moisture reading, a harvest date, or an organic claim. A false claim loses the farmer the sale at the weighbridge.
- Never state a price the farmer should accept beyond the range you were given.
- The title must be under 70 characters and read like a trade listing: crop, quantity, location.
- The description is for a buyer deciding whether to make a phone call. 2 to 4 sentences. Factual, not flowery. No emoji, no exclamation marks.
- listingHighlights are 3 to 4 very short scannable points, at most 6 words each, drawn from the data you were given.
- reasoning is for the farmer, not the buyer: explain in 1 to 2 plain sentences how you framed the listing and why, citing the price figures you used.

Respond with a single JSON object and nothing else, in this exact shape:
{
  "listingTitle": "trade-style title under 70 characters",
  "listingDescription": "2-4 factual sentences aimed at a bulk buyer",
  "listingHighlights": ["short point", "short point", "short point"],
  "reasoning": "1-2 plain sentences for the farmer about how this was framed"
}`;

interface ModelReply {
  listingTitle?: unknown;
  listingDescription?: unknown;
  listingHighlights?: unknown;
  reasoning?: unknown;
}

function rupees(value: number): string {
  return `Rs ${Math.round(value).toLocaleString("en-IN")}`;
}

function buildPriceGuidance(
  crop: string,
  region: string,
  quantityQuintals: number,
): PriceGuidance | null {
  const price = findPriceContext(crop, region);
  if (!price) return null;

  const estimatedValue = price.pricePerQuintal * quantityQuintals;
  const suggestedAskMin = Math.round(price.pricePerQuintal * (1 - ASK_SPREAD));
  const suggestedAskMax = Math.round(price.pricePerQuintal * (1 + ASK_SPREAD));

  const trendAdvice =
    price.trend === "up"
      ? "Prices are rising, so quoting at the upper end is reasonable."
      : price.trend === "down"
        ? "Prices are falling, so selling sooner rather than holding may be safer."
        : "Prices are steady, so there is no rush either way.";

  return {
    referencePricePerQuintal: price.pricePerQuintal,
    region: price.region,
    trend: price.trend,
    quantityQuintals,
    estimatedValue,
    suggestedAskMin,
    suggestedAskMax,
    note: `At the ${price.region} rate of ${rupees(price.pricePerQuintal)} per quintal, ${quantityQuintals} quintals is worth about ${rupees(estimatedValue)}. ${trendAdvice}`,
  };
}

function buildUserPrompt(
  crop: string,
  quantityQuintals: number,
  region: string,
  guidance: PriceGuidance | null,
  matchedBuyers: MatchedBuyer[],
): string {
  const lines = [
    `WHAT THE FARMER HAS TO SELL:`,
    `- Crop: ${crop}`,
    `- Quantity: ${quantityQuintals} quintals`,
    `- Location: ${region}`,
  ];

  if (guidance) {
    lines.push(
      "",
      `PRICE DATA (mandi reference, already calculated):`,
      `- Reference rate in ${guidance.region}: ${rupees(guidance.referencePricePerQuintal)} per quintal`,
      `- Price trend: ${TREND_WORDS[guidance.trend]}`,
      `- Whole lot is worth about ${rupees(guidance.estimatedValue)}`,
      `- Range the farmer may quote: ${rupees(guidance.suggestedAskMin)} to ${rupees(guidance.suggestedAskMax)} per quintal`,
    );
  } else {
    lines.push(
      "",
      `PRICE DATA: none on record for ${crop}. Do not state or imply any price.`,
      `Say in the description that the rate is open to discussion.`,
    );
  }

  if (matchedBuyers.length > 0) {
    lines.push(
      "",
      `BUYERS ALREADY MATCHED (for context on who will read this):`,
      ...matchedBuyers.map(
        (buyer) =>
          `- ${buyer.name}, a ${buyer.type} in ${buyer.region}, takes lots from ${buyer.minQuantityQuintals} quintals. ${buyer.notes}`,
      ),
    );
  }

  return lines.join("\n");
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asHighlights(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

/** Plain template used when the model is unreachable, so the farmer still gets a listing. */
function fallbackListing(
  crop: string,
  quantityQuintals: number,
  region: string,
  guidance: PriceGuidance | null,
) {
  return {
    listingTitle: `${quantityQuintals} quintals ${crop} for sale, ${region}`,
    listingDescription: guidance
      ? `${quantityQuintals} quintals of ${crop} available in ${region}. Going by the ${guidance.region} mandi rate of ${rupees(guidance.referencePricePerQuintal)} per quintal, the lot is worth about ${rupees(guidance.estimatedValue)}. Buyers are welcome to inspect before lifting.`
      : `${quantityQuintals} quintals of ${crop} available in ${region}. Rate open to discussion. Buyers are welcome to inspect before lifting.`,
    listingHighlights: [
      `${quantityQuintals} quintals available`,
      `Located in ${region}`,
      guidance ? `Rate ${TREND_WORDS[guidance.trend]}` : "Rate negotiable",
    ],
    reasoning:
      "Our writer could not be reached, so this listing was put together from your crop, quantity and the mandi rate on record. You can edit the wording before sharing it.",
  };
}

export interface MarketRequest {
  crop: string;
  quantityQuintals: number;
  region: string;
}

export async function runMarketAgent({
  crop,
  quantityQuintals,
  region,
}: MarketRequest): Promise<MarketResponse> {
  const priceGuidance = buildPriceGuidance(crop, region, quantityQuintals);
  const matchedBuyers = findBuyers(crop, region, quantityQuintals);

  let draft: ReturnType<typeof fallbackListing>;
  let degraded = false;

  try {
    const reply = await chatJson<ModelReply>({
      model: TEXT_MODEL,
      maxTokens: 700,
      temperature: 0.4, // A little more room than the advisory agent; this is sales copy.
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserPrompt(
            crop,
            quantityQuintals,
            region,
            priceGuidance,
            matchedBuyers,
          ),
        },
      ],
    });

    const fallback = fallbackListing(crop, quantityQuintals, region, priceGuidance);
    const highlights = asHighlights(reply.listingHighlights);

    draft = {
      listingTitle: asString(reply.listingTitle, fallback.listingTitle).slice(0, 90),
      listingDescription: asString(
        reply.listingDescription,
        fallback.listingDescription,
      ),
      listingHighlights:
        highlights.length > 0 ? highlights : fallback.listingHighlights,
      reasoning: asString(reply.reasoning, fallback.reasoning),
    };
  } catch (error) {
    console.error("[market] model call failed, using template listing", error);
    draft = fallbackListing(crop, quantityQuintals, region, priceGuidance);
    degraded = true;
  }

  return {
    crop,
    quantityQuintals,
    region,
    ...draft,
    priceGuidance,
    matchedBuyers,
    ...(degraded ? { degraded: true } : {}),
  };
}
