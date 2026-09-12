import { runDiagnosisAgent } from "@/lib/agents/diagnose";
import type { ApiError, DiagnosisResponse } from "@/lib/types";

/** Formats the vision model accepts and a browser can produce from a camera. */
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

/** Decoded ceiling. The client downscales first, so this is a backstop. */
const MAX_BYTES = 5 * 1024 * 1024;

const MESSAGES = {
  missing: "Please choose a photo of your plant first.",
  format: "That file type is not supported. Please use a JPG, PNG or WebP photo.",
  tooBig: "That photo is too large. Please take a new one or pick a smaller file.",
  unknown:
    "We could not look at your photo just now. Please check your internet and try again in a moment.",
};

function fail(error: string, message: string, status: number) {
  return Response.json({ error, message } satisfies ApiError, { status });
}

/**
 * Pulls the mime type and payload out of a `data:` URL and sanity checks both.
 * Returns null when the string is not a usable image data URL.
 */
function parseImageDataUrl(
  value: string,
): { mime: string; bytes: number } | null {
  const match = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(
    value,
  );
  if (!match) return null;

  const [, mime, base64] = match;
  // Base64 encodes 3 bytes as 4 characters; subtract the padding.
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const bytes = Math.floor((base64.length * 3) / 4) - padding;

  return { mime: mime.toLowerCase(), bytes };
}

export async function POST(request: Request) {
  let body: { imageBase64?: unknown };
  try {
    body = (await request.json()) as { imageBase64?: unknown };
  } catch {
    return fail("invalid_json", MESSAGES.missing, 400);
  }

  const { imageBase64 } = body;
  if (typeof imageBase64 !== "string" || imageBase64.length === 0) {
    return fail("missing_image", MESSAGES.missing, 400);
  }

  const parsed = parseImageDataUrl(imageBase64);
  if (!parsed) {
    return fail("invalid_image", MESSAGES.format, 400);
  }
  if (!ALLOWED_MIME.includes(parsed.mime)) {
    return fail("unsupported_type", MESSAGES.format, 415);
  }
  if (parsed.bytes > MAX_BYTES) {
    return fail("image_too_large", MESSAGES.tooBig, 413);
  }

  try {
    const result: DiagnosisResponse = await runDiagnosisAgent(imageBase64);
    return Response.json(result);
  } catch (error) {
    // Deliberately log only the failure, never the image payload.
    console.error("[api/diagnose] failed", error);
    return fail("diagnosis_failed", MESSAGES.unknown, 502);
  }
}
