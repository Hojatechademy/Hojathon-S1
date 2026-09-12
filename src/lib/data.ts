/**
 * Access layer over the static mock datasets in /data.
 *
 * Everything here is synchronous and in-memory. No database, by design - this is
 * a hackathon MVP and the datasets are small reference tables.
 */

import mandiPricesJson from "@data/mandi_prices.json";
import vendorsJson from "@data/vendors.json";
import cropRequirementsJson from "@data/crop_requirements.json";
import buyersJson from "@data/buyers.json";
import type {
  Buyer,
  CropRequirement,
  MandiPrice,
  MatchedBuyer,
  PriceContext,
  SuggestedInput,
  Vendor,
} from "./types";

export const mandiPrices = mandiPricesJson as MandiPrice[];
export const vendors = vendorsJson as Vendor[];
export const cropRequirements = cropRequirementsJson as CropRequirement[];
export const buyers = buyersJson as Buyer[];

/** Crops we hold reference data for, alphabetical, for the onboarding dropdown. */
export const knownCrops: string[] = cropRequirements
  .map((c) => c.crop)
  .sort((a, b) => a.localeCompare(b));

export const regions: string[] = Array.from(
  new Set(mandiPrices.map((p) => p.region)),
).sort((a, b) => a.localeCompare(b));

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

export function findCropRequirement(crop: string): CropRequirement | null {
  const target = normalise(crop);
  return cropRequirements.find((c) => normalise(c.crop) === target) ?? null;
}

/**
 * Best available price row for a crop. Prefers the farmer's own region when we
 * know it, otherwise falls back to the highest-priced region on record so the
 * farmer at least sees a realistic benchmark.
 */
export function findPriceContext(
  crop: string,
  region?: string,
): PriceContext | null {
  const target = normalise(crop);
  const rows = mandiPrices.filter((p) => normalise(p.crop) === target);
  if (rows.length === 0) return null;

  if (region) {
    const regional = rows.find((p) => normalise(p.region) === normalise(region));
    if (regional) return regional;
  }

  return rows.reduce((best, row) =>
    row.pricePerQuintal > best.pricePerQuintal ? row : best,
  );
}

/** Crops that want less water than the given one - used to offer alternatives. */
export function lowerWaterCrops(crop: string): CropRequirement[] {
  const requirement = findCropRequirement(crop);
  if (!requirement) return [];
  return cropRequirements.filter(
    (c) =>
      c.crop !== requirement.crop &&
      c.seasonalRainfallMm < requirement.seasonalRainfallMm,
  );
}

const PRICE_LABELS: Array<[keyof Vendor, string]> = [
  ["pricePerKg", "per kg"],
  ["pricePerBag", "per bag"],
  ["pricePerCan", "per can"],
  ["pricePerPacket", "per packet"],
  ["pricePerDay", "per day"],
  ["pricePerUnit", "each"],
];

/** Turns whichever price key a vendor row uses into one readable string. */
export function formatVendorPrice(vendor: Vendor): string {
  for (const [key, suffix] of PRICE_LABELS) {
    const value = vendor[key];
    if (typeof value === "number") {
      return `₹${value.toLocaleString("en-IN")} ${suffix}`;
    }
  }
  return "Price on request";
}

/**
 * Picks 2-3 inputs a farmer would actually need for this crop: the crop's own
 * seed first, then a general fertilizer, then equipment. Chosen in code rather
 * than by the model so the suggestions always point at real vendor rows.
 */
export function suggestInputsForCrop(
  crop: string,
  options: { needsIrrigation?: boolean } = {},
): SuggestedInput[] {
  const target = normalise(crop);
  const picked: SuggestedInput[] = [];

  const toSuggestion = (vendor: Vendor, why: string): SuggestedInput => ({
    vendorId: vendor.id,
    vendorName: vendor.name,
    category: vendor.category,
    product: vendor.product,
    priceLabel: formatVendorPrice(vendor),
    location: vendor.location,
    why,
  });

  const seed = vendors.find(
    (v) => v.category === "seeds" && normalise(v.crop) === target,
  );
  if (seed) {
    picked.push(toSuggestion(seed, `Certified seed for ${crop}.`));
  }

  const fertilizer = vendors.find(
    (v) => v.category === "fertilizer" && v.product.includes("DAP"),
  );
  if (fertilizer) {
    picked.push(
      toSuggestion(fertilizer, "Base fertilizer to apply at sowing time."),
    );
  }

  // Under low rainfall, irrigation gear is the more useful third suggestion.
  const equipment = options.needsIrrigation
    ? vendors.find((v) => v.product.toLowerCase().includes("drip irrigation"))
    : vendors.find((v) => v.category === "equipment");
  if (equipment) {
    picked.push(
      toSuggestion(
        equipment,
        options.needsIrrigation
          ? "Rainfall looks short, so irrigation would protect this crop."
          : "Useful for preparing the field before sowing.",
      ),
    );
  }

  return picked.slice(0, 3);
}

const BUYER_TYPE_WORDS: Record<Buyer["type"], string> = {
  wholesaler: "wholesaler",
  processor: "processor",
  exporter: "exporter",
  cooperative: "farmer cooperative",
};

/**
 * Buyers who take this crop, nearest region first. A buyer whose minimum lot is
 * larger than the farmer's is still shown, flagged rather than hidden, so the
 * farmer can see who to approach once they have more to sell.
 */
export function findBuyers(
  crop: string,
  region: string,
  quantityQuintals: number,
  limit = 3,
): MatchedBuyer[] {
  const target = normalise(crop);

  const candidates = buyers.filter((buyer) =>
    buyer.buysCrops.some((c) => normalise(c) === target),
  );

  const sameRegion = (buyer: Buyer) => normalise(buyer.region) === normalise(region);
  const takesThisLot = (buyer: Buyer) =>
    quantityQuintals >= buyer.minQuantityQuintals;

  const ranked = [...candidates].sort((a, b) => {
    // Buyers who will actually take this lot come first - a nearby buyer who
    // wants twice as much is less use than a further one who will buy today.
    if (takesThisLot(a) !== takesThisLot(b)) return takesThisLot(a) ? -1 : 1;
    // Then same region, then whoever accepts the smaller lot.
    if (sameRegion(a) !== sameRegion(b)) return sameRegion(a) ? -1 : 1;
    return a.minQuantityQuintals - b.minQuantityQuintals;
  });

  return ranked.slice(0, limit).map((buyer) => {
    const meetsMinimum = quantityQuintals >= buyer.minQuantityQuintals;
    const local = sameRegion(buyer);

    const why = meetsMinimum
      ? `${local ? "In your state" : `Based in ${buyer.region}`}, buys ${crop} as a ${BUYER_TYPE_WORDS[buyer.type]}, and takes lots from ${buyer.minQuantityQuintals} quintals.`
      : `Buys ${crop}, but wants at least ${buyer.minQuantityQuintals} quintals and you have ${quantityQuintals}. Worth approaching with a bigger lot.`;

    return { ...buyer, why, meetsMinimum };
  });
}
