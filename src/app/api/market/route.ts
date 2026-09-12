import { runMarketAgent } from "@/lib/agents/market";
import type { ApiError, MarketResponse } from "@/lib/types";

/** Sanity bounds on the lot size. Above this it is not a smallholder sale. */
const MAX_QUINTALS = 100_000;

const MESSAGES = {
  badRequest:
    "We need the crop, how much you have, and where you are. Please fill all three and try again.",
  quantity:
    "Please enter how many quintals you have to sell, as a number above zero.",
  unknown:
    "We could not write your listing just now. Please check your internet and try again in a moment.",
};

interface MarketBody {
  crop?: unknown;
  quantity?: unknown;
  region?: unknown;
}

function fail(error: string, message: string, status: number) {
  return Response.json({ error, message } satisfies ApiError, { status });
}

export async function POST(request: Request) {
  let body: MarketBody;
  try {
    body = (await request.json()) as MarketBody;
  } catch {
    return fail("invalid_json", MESSAGES.badRequest, 400);
  }

  const { crop, quantity, region } = body;

  if (
    typeof crop !== "string" ||
    crop.trim().length === 0 ||
    typeof region !== "string" ||
    region.trim().length === 0
  ) {
    return fail("invalid_input", MESSAGES.badRequest, 400);
  }

  // Accept a numeric string too, since the UI reads it from a text-ish input.
  const quantityQuintals =
    typeof quantity === "number"
      ? quantity
      : typeof quantity === "string"
        ? Number(quantity.trim())
        : Number.NaN;

  if (
    !Number.isFinite(quantityQuintals) ||
    quantityQuintals <= 0 ||
    quantityQuintals > MAX_QUINTALS
  ) {
    return fail("invalid_quantity", MESSAGES.quantity, 400);
  }

  try {
    const result: MarketResponse = await runMarketAgent({
      crop: crop.trim().slice(0, 60),
      region: region.trim().slice(0, 80),
      // Round to a sensible market precision rather than carrying float noise.
      quantityQuintals: Math.round(quantityQuintals * 100) / 100,
    });
    return Response.json(result);
  } catch (error) {
    console.error("[api/market] failed", error);
    return fail("market_failed", MESSAGES.unknown, 502);
  }
}
