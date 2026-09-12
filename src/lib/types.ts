/** Shared shapes for the mock datasets and the agent API contracts. */

export type PriceTrend = "up" | "down" | "stable";

export interface MandiPrice {
  crop: string;
  region: string;
  pricePerQuintal: number;
  trend: PriceTrend;
}

export type VendorCategory = "seeds" | "fertilizer" | "equipment";

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  product: string;
  /** Crop this input is specific to, or "any" for general-purpose inputs. */
  crop: string;
  location: string;
  pricePerKg?: number;
  pricePerBag?: number;
  pricePerCan?: number;
  pricePerDay?: number;
  pricePerUnit?: number;
  pricePerPacket?: number;
}

export interface CropRequirement {
  crop: string;
  waterNeed: "low" | "medium" | "high" | "very high";
  /** Rough rainfall the crop wants across a full season, in millimetres. */
  seasonalRainfallMm: number;
  idealTempMinC: number;
  idealTempMaxC: number;
  growingDurationDays: number;
  irrigationIntensive: boolean;
}

/**
 * Deterministic numbers derived from the Open-Meteo response. These are computed
 * in code, never by the model, so the UI can show the farmer exactly which
 * figures the recommendation was based on.
 */
export interface ForecastSummary {
  locationLabel: string;
  timezone: string;
  forecastDays: number;
  rainfallNext14DaysMm: number;
  rainfallPast30DaysMm: number;
  avgMaxTempC: number;
  avgMinTempC: number;
  hottestDayC: number;
  coldestNightC: number;
  /** Forecast days where the daytime high sits above the crop's ideal range. */
  daysAboveIdealTemp: number;
  /** Forecast days where the night-time low sits below the crop's ideal range. */
  daysBelowIdealTemp: number;
  /** Rain the crop would want over the same 14-day window, pro-rated. */
  expectedRainfallForCropMm: number;
  /** Forecast rain as a percentage of what the crop wants. 100 = on target. */
  rainfallVsNeedPercent: number;
}

export type AdvisoryDecision = "Plant" | "Plant with Caution" | "Don't Plant";

export interface SuggestedInput {
  vendorId: string;
  vendorName: string;
  category: VendorCategory;
  product: string;
  priceLabel: string;
  location: string;
  /** Plain-language note on why this input was suggested. */
  why: string;
}

export interface CropAlternative {
  crop: string;
  why: string;
}

export interface PriceContext {
  crop: string;
  region: string;
  pricePerQuintal: number;
  trend: PriceTrend;
}

export interface AdvisoryResponse {
  crop: string;
  decision: AdvisoryDecision;
  reasoning: string;
  riskFactors: string[];
  forecastSummary: ForecastSummary;
  suggestedInputs: SuggestedInput[];
  suggestedAlternatives: CropAlternative[];
  priceContext: PriceContext | null;
  cropRequirement: CropRequirement | null;
  /** Set when the advice came from the local fallback instead of the model. */
  degraded?: boolean;
}

export interface ApiError {
  error: string;
  /** Farmer-facing message. Never a raw exception string. */
  message: string;
}

/* ---------- Agent 2: Disease Detection ---------- */

export type Confidence = "low" | "medium" | "high";

export interface DiagnosisResponse {
  /** False when the photo does not appear to show a plant at all. */
  isPlant: boolean;
  /** True when the plant looks healthy and no treatment is needed. */
  isHealthy: boolean;
  /** Disease or problem name, or a clear statement that the plant looks healthy. */
  diagnosis: string;
  confidence: Confidence;
  /** What in the image led to this call - the explainability requirement. */
  reasoning: string;
  /** Set when framing, focus or lighting limits how sure the agent can be. */
  imageQualityNote: string;
  /** Ordered, specific actions. Empty when the plant looks healthy. */
  treatment: string[];
}

/* ---------- Agent 3: Market / Sell ---------- */

export type BuyerType = "wholesaler" | "processor" | "exporter" | "cooperative";

export interface Buyer {
  id: string;
  name: string;
  type: BuyerType;
  buysCrops: string[];
  region: string;
  minQuantityQuintals: number;
  contactLabel: string;
  notes: string;
}

export interface MatchedBuyer extends Buyer {
  /** Plain-language note on why this buyer was matched to the farmer's lot. */
  why: string;
  /** False when the lot is below this buyer's minimum, shown as a warning. */
  meetsMinimum: boolean;
}

/** All figures here are arithmetic on the mandi reference price, not generated. */
export interface PriceGuidance {
  referencePricePerQuintal: number;
  region: string;
  trend: PriceTrend;
  quantityQuintals: number;
  estimatedValue: number;
  suggestedAskMin: number;
  suggestedAskMax: number;
  note: string;
}

export interface MarketResponse {
  crop: string;
  quantityQuintals: number;
  region: string;
  listingTitle: string;
  listingDescription: string;
  /** Short bullets a wholesale buyer scans for. */
  listingHighlights: string[];
  /** Why the agent drafted the listing and pricing this way. */
  reasoning: string;
  priceGuidance: PriceGuidance | null;
  matchedBuyers: MatchedBuyer[];
  degraded?: boolean;
}

/** A listing the farmer has "posted". Held in browser memory only. */
export interface PostedListing extends MarketResponse {
  id: string;
  postedAt: string;
}
