/**
 * Sample agent responses used by the dev-only preview page at /dev/preview.
 *
 * These exist so every result state can be rendered and reviewed without waiting
 * on a live model call, including the states that are awkward to trigger on
 * demand: a degraded fallback, a healthy plant, an unclear photo, a crop with no
 * price on record. Shapes are typed, so they break the build if an agent contract
 * changes.
 */

import type {
  AdvisoryResponse,
  DiagnosisResponse,
  MarketResponse,
} from "./types";

const forecast: AdvisoryResponse["forecastSummary"] = {
  locationLabel: "Ludhiana, Punjab",
  timezone: "Asia/Kolkata",
  forecastDays: 14,
  rainfallNext14DaysMm: 8.6,
  rainfallPast30DaysMm: 71.4,
  avgMaxTempC: 34.1,
  avgMinTempC: 25.2,
  hottestDayC: 35.6,
  coldestNightC: 22.6,
  daysAboveIdealTemp: 5,
  daysBelowIdealTemp: 0,
  expectedRainfallForCropMm: 129.2,
  rainfallVsNeedPercent: 7,
};

export const advisoryPlant: AdvisoryResponse = {
  crop: "Bajra",
  decision: "Plant",
  reasoning:
    "Bajra suits your weather right now. Daytime highs average 34.1C, inside the 22C to 38C range this crop likes, and none of the next 14 days go above its limit. Rainfall of 40.2mm covers most of the 57.6mm it wants, and bajra handles a small shortfall well.",
  riskFactors: [],
  forecastSummary: { ...forecast, rainfallNext14DaysMm: 40.2, expectedRainfallForCropMm: 57.6, rainfallVsNeedPercent: 70, daysAboveIdealTemp: 0 },
  suggestedInputs: [
    {
      vendorId: "v19",
      vendorName: "Rajasthan Beej Kendra",
      category: "seeds",
      product: "Bajra hybrid HHB-67 seeds",
      priceLabel: "₹210 per kg",
      location: "Jaipur, Rajasthan",
      why: "Certified seed for Bajra.",
    },
    {
      vendorId: "v7",
      vendorName: "Nutrifarm Agro",
      category: "fertilizer",
      product: "DAP 18-46-0 (50 kg bag)",
      priceLabel: "₹1,350 per bag",
      location: "Nashik, Maharashtra",
      why: "Base fertilizer to apply at sowing time.",
    },
    {
      vendorId: "v11",
      vendorName: "Sharma Farm Equipment",
      category: "equipment",
      product: "Seed drill (9-row, tractor mounted) - rental per day",
      priceLabel: "₹1,200 per day",
      location: "Karnal, Haryana",
      why: "Useful for preparing the field before sowing.",
    },
  ],
  suggestedAlternatives: [],
  priceContext: {
    crop: "Bajra",
    region: "Rajasthan",
    pricePerQuintal: 2340,
    trend: "up",
  },
  cropRequirement: {
    crop: "Bajra",
    waterNeed: "low",
    seasonalRainfallMm: 350,
    idealTempMinC: 22,
    idealTempMaxC: 38,
    growingDurationDays: 85,
    irrigationIntensive: false,
  },
};

export const advisoryDontPlant: AdvisoryResponse = {
  crop: "Rice",
  decision: "Don't Plant",
  reasoning:
    "Rice needs 129.2mm of rainfall over the next 14 days but the forecast shows only 8.6mm, which is just 7% of what the crop requires. Rice is irrigation-intensive and with 5 days forecast to exceed 35C, water stress will be severe.",
  riskFactors: [
    "Forecast rainfall 8.6mm vs 129.2mm needed",
    "Only 7% of required water from rain",
    "5 days will exceed 35C maximum temperature",
  ],
  forecastSummary: forecast,
  suggestedInputs: [],
  suggestedAlternatives: [
    {
      crop: "Bajra",
      why: "Needs only 350mm per season and matures in just 85 days.",
    },
    {
      crop: "Mustard",
      why: "Low water need at 300mm per season.",
    },
  ],
  priceContext: {
    crop: "Rice",
    region: "Punjab",
    pricePerQuintal: 2100,
    trend: "stable",
  },
  cropRequirement: {
    crop: "Rice",
    waterNeed: "high",
    seasonalRainfallMm: 1200,
    idealTempMinC: 20,
    idealTempMaxC: 35,
    growingDurationDays: 130,
    irrigationIntensive: true,
  },
};

/** Caution decision, unknown crop, and the degraded fallback banner, all at once. */
export const advisoryDegraded: AdvisoryResponse = {
  crop: "Dragon fruit",
  decision: "Plant with Caution",
  reasoning:
    "We could not reach our advisor just now, and we have no water or temperature reference data for Dragon fruit. What we do know from the forecast: 8.6mm of rain expected over the next 14 days, with daytime highs averaging 34.1C. Please check with your local krishi officer before sowing.",
  riskFactors: ["No reference data for this crop"],
  forecastSummary: forecast,
  suggestedInputs: [],
  suggestedAlternatives: [],
  priceContext: null,
  cropRequirement: null,
  degraded: true,
};

export const diagnosisDiseased: DiagnosisResponse = {
  isPlant: true,
  isHealthy: false,
  diagnosis: "Early Blight",
  confidence: "high",
  reasoning:
    "The leaves show dark brown spots with concentric rings, which is a classic bullseye pattern for Early Blight. The affected leaves are also turning yellow and drying out, especially at the edges.",
  imageQualityNote: "",
  treatment: [
    "Remove and destroy all infected leaves. Do not compost them.",
    "Improve air circulation by spacing plants and pruning lower leaves.",
    "Mix 20 grams of copper oxychloride per 10 litres of water and spray every 7 to 10 days, especially after rain.",
    "Water at the base in the morning so leaves dry quickly.",
  ],
};

export const diagnosisHealthy: DiagnosisResponse = {
  isPlant: true,
  isHealthy: true,
  diagnosis: "This plant looks healthy",
  confidence: "medium",
  reasoning:
    "The leaves are an even green with no spots, holes or curling. The edges are intact and the veins look normal. There is no sign of insect damage or fungal growth.",
  imageQualityNote: "",
  treatment: [],
};

export const diagnosisUnclear: DiagnosisResponse = {
  isPlant: true,
  isHealthy: false,
  diagnosis: "Possible leaf spot disease",
  confidence: "low",
  reasoning:
    "There are a few dark circular marks on the leaf with lighter rings around them. This pattern fits several leaf spot diseases, but the marks are small and hard to make out clearly.",
  imageQualityNote:
    "The photo is taken from too far away and the leaf is slightly out of focus, so the edges of the marks cannot be seen properly.",
  treatment: [
    "Take a closer photo of one affected leaf in daylight and check again.",
    "Remove the worst affected leaves in the meantime and do not compost them.",
  ],
};

export const diagnosisNotAPlant: DiagnosisResponse = {
  isPlant: false,
  isHealthy: false,
  diagnosis: "This does not look like a plant",
  confidence: "high",
  reasoning:
    "The photo shows an indoor wall and part of a table. There is no leaf, stem or crop visible anywhere in the frame.",
  imageQualityNote: "",
  treatment: [],
};

export const marketPriced: MarketResponse = {
  crop: "Wheat",
  quantityQuintals: 40,
  region: "Punjab",
  listingTitle: "40 Quintals Wheat Available in Punjab",
  listingDescription:
    "40 quintals of wheat available for immediate sale in Punjab. Current reference rate is Rs 2,275 per quintal with a rising price trend. Suitable for wholesalers and cooperatives accepting smaller lots. Total lot value approximately Rs 91,000.",
  listingHighlights: [
    "40 quintals available now",
    "Punjab location",
    "Rising price trend",
  ],
  reasoning:
    "Framed as a straightforward wholesale listing leading with quantity and location. Quoted the calculated range of Rs 2,207 to Rs 2,343 per quintal based on the reference rate of Rs 2,275.",
  priceGuidance: {
    referencePricePerQuintal: 2275,
    region: "Punjab",
    trend: "up",
    quantityQuintals: 40,
    estimatedValue: 91000,
    suggestedAskMin: 2207,
    suggestedAskMax: 2343,
    note: "At the Punjab rate of Rs 2,275 per quintal, 40 quintals is worth about Rs 91,000. Prices are rising, so quoting at the upper end is reasonable.",
  },
  matchedBuyers: [
    {
      id: "b1",
      name: "Doaba Grain Traders",
      type: "wholesaler",
      buysCrops: ["Wheat", "Rice", "Maize"],
      region: "Punjab",
      minQuantityQuintals: 20,
      contactLabel: "Ludhiana grain market, stall 14",
      notes: "Pays within 3 days of weighing.",
      why: "In your state, buys Wheat as a wholesaler, and takes lots from 20 quintals.",
      meetsMinimum: true,
    },
    {
      id: "b2",
      name: "Sutlej Flour Mills",
      type: "processor",
      buysCrops: ["Wheat", "Maize"],
      region: "Punjab",
      minQuantityQuintals: 50,
      contactLabel: "Mill gate purchase, Khanna",
      notes: "Premium for low moisture grain.",
      why: "Buys Wheat, but wants at least 50 quintals and you have 40. Worth approaching with a bigger lot.",
      meetsMinimum: false,
    },
  ],
};

export const marketUnpriced: MarketResponse = {
  crop: "Dragon fruit",
  quantityQuintals: 12,
  region: "Maharashtra",
  listingTitle: "12 Quintals Dragon Fruit Available, Maharashtra",
  listingDescription:
    "Fresh dragon fruit available for immediate dispatch from Maharashtra. Total quantity 12 quintals suitable for wholesale, processing or export channels. Rate is open to discussion based on quality inspection and buyer requirements.",
  listingHighlights: ["12 quintals available", "Maharashtra location", "Rate negotiable"],
  reasoning:
    "We have no reference price for this crop, so the listing invites offers instead of quoting a rate.",
  priceGuidance: null,
  matchedBuyers: [],
  degraded: true,
};
