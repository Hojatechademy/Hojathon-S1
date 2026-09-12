/**
 * Agent 2 - Disease Detection.
 *
 * Sends the farmer's photo to a vision model and turns the reply into a
 * structured diagnosis. The image is held in memory for the life of the request
 * only: nothing is written to disk and there is no storage bucket.
 */

import { VISION_MODEL, chatJson } from "@/lib/openrouter";
import type { Confidence, DiagnosisResponse } from "@/lib/types";

const CONFIDENCE_VALUES: Confidence[] = ["low", "medium", "high"];

const SYSTEM_PROMPT = `You are a plant pathology assistant. A smallholder farmer in India has photographed a crop plant or leaf and wants to know what is wrong with it.

Rules you must follow:
- Judge only what is visible in this photograph. Never assume a crop, a region, a season, or a spraying history you cannot see.
- If the plant looks healthy, say so plainly and set isHealthy to true. Do not invent a disease to seem useful.
- If the photo does not show a plant at all, set isPlant to false, and say what you can actually see.
- If focus, lighting, distance or framing limits what you can judge, put that in imageQualityNote and lower your confidence. Guessing confidently from a poor photo is worse than admitting doubt.
- Treatment steps must be specific and actionable, with a product or method, a rate or quantity where it matters, and a frequency. "Spray neem oil at 5ml per litre of water, every 5 days, early morning, for three rounds" is useful. "Apply fungicide" is not.
- Prefer remedies a smallholder can actually buy or make locally.
- reasoning must describe the visible signs that led you to this conclusion: colour, shape, position and spread of the marks on the plant.
- Write for someone with no training. Short sentences, everyday words.

Respond with a single JSON object and nothing else, in this exact shape:
{
  "isPlant": true,
  "isHealthy": false,
  "diagnosis": "short name of the problem, or a plain statement that the plant looks healthy",
  "confidence": "low" | "medium" | "high",
  "reasoning": "2-4 sentences on the visible signs you based this on",
  "imageQualityNote": "what limits your judgement, or an empty string if the photo is clear",
  "treatment": ["specific step", "specific step"]
}`;

interface ModelReply {
  isPlant?: unknown;
  isHealthy?: unknown;
  diagnosis?: unknown;
  confidence?: unknown;
  reasoning?: unknown;
  imageQualityNote?: unknown;
  treatment?: unknown;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asConfidence(value: unknown): Confidence {
  if (typeof value === "string") {
    const cleaned = value.trim().toLowerCase();
    const match = CONFIDENCE_VALUES.find((c) => c === cleaned);
    if (match) return match;
    if (cleaned.includes("high")) return "high";
    if (cleaned.includes("med")) return "medium";
  }
  // Anything we cannot read becomes "low" on purpose. Erring towards doubt is
  // the safe direction when the farmer may spray based on this.
  return "low";
}

function asSteps(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 6);
  }
  // Some models return a paragraph instead of an array.
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n+|(?<=\.)\s+(?=[A-Z])/)
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 6);
  }
  return [];
}

export async function runDiagnosisAgent(
  imageDataUrl: string,
): Promise<DiagnosisResponse> {
  const reply = await chatJson<ModelReply>({
    model: VISION_MODEL,
    maxTokens: 800,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Here is my plant. What is wrong with it, and what should I do?",
          },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
  });

  const isPlant = asBoolean(reply.isPlant, true);
  const isHealthy = isPlant ? asBoolean(reply.isHealthy, false) : false;

  return {
    isPlant,
    isHealthy,
    diagnosis: asString(
      reply.diagnosis,
      isPlant ? "Could not identify the problem" : "This does not look like a plant",
    ),
    confidence: asConfidence(reply.confidence),
    reasoning: asString(
      reply.reasoning,
      "The assistant did not explain what it saw, so treat this result with caution.",
    ),
    imageQualityNote: asString(reply.imageQualityNote),
    // A healthy plant needs no treatment, so drop any steps the model added.
    treatment: isHealthy || !isPlant ? [] : asSteps(reply.treatment),
  };
}
