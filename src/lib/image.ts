/**
 * Browser-side image preparation. Runs before upload so a 6MB phone photo does
 * not travel over a patchy rural connection, and so the vision model gets a
 * predictable payload.
 *
 * The image never leaves memory here - no object URLs are retained, and nothing
 * is stored.
 */

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Longest edge after downscaling. Plenty for spotting leaf lesions. */
const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.85;

/** Rejects obviously wrong files early, before we spend time decoding. */
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

export class ImageError extends Error {}

async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch (cause) {
    throw new ImageError("We could not read that photo. Please try another one.", {
      cause,
    });
  }
}

/**
 * Validates, downscales and re-encodes a picked file to a JPEG data URL.
 * Throws ImageError with a farmer-facing message on anything unusable.
 */
export async function fileToDataUrl(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new ImageError(
      "That file type is not supported. Please use a JPG, PNG or WebP photo.",
    );
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageError(
      "That photo is too large. Please take a new one or pick a smaller file.",
    );
  }

  const bitmap = await decode(file);

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new ImageError("This browser cannot prepare the photo for upload.");
    }

    context.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    bitmap.close();
  }
}
