/**
 * Electron-free file-decodability checks, shared by scripts/generate-fixtures.ts
 * (verify right after generation) and src/main/file-validator.ts (verify any
 * user-provided attachment before it's ever handed to the browser).
 */
import zlib from "node:zlib";
import { PDFDocument } from "pdf-lib";

export interface DecodeResult {
  ok: boolean;
  detail: string;
}

export async function decodesPdf(buf: Buffer): Promise<DecodeResult & { pageCount?: number }> {
  try {
    const doc = await PDFDocument.load(buf);
    const pageCount = doc.getPageCount();
    if (pageCount < 1) return { ok: false, detail: "PDF has zero pages" };
    return { ok: true, detail: `PDF decodes with ${pageCount} page(s)`, pageCount };
  } catch (err) {
    return { ok: false, detail: `PDF failed to decode: ${(err as Error).message}` };
  }
}

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/** Parses real PNG chunk structure (IHDR + IDAT inflate) — no image-decoding dependency needed. */
export function decodesPng(buf: Buffer): DecodeResult & { width?: number; height?: number } {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { ok: false, detail: "missing PNG signature" };
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let sawIend = false;
  const idatParts: Buffer[] = [];

  try {
    while (offset < buf.length) {
      const length = buf.readUInt32BE(offset);
      const type = buf.toString("ascii", offset + 4, offset + 8);
      const dataStart = offset + 8;
      const data = buf.subarray(dataStart, dataStart + length);
      if (type === "IHDR") {
        width = data.readUInt32BE(0);
        height = data.readUInt32BE(4);
      } else if (type === "IDAT") {
        idatParts.push(data);
      } else if (type === "IEND") {
        sawIend = true;
      }
      offset = dataStart + length + 4;
    }
  } catch (err) {
    return { ok: false, detail: `chunk parse error: ${(err as Error).message}` };
  }

  if (width <= 0 || height <= 0) return { ok: false, detail: "IHDR reports zero dimensions" };
  if (!sawIend) return { ok: false, detail: "missing IEND chunk" };
  if (idatParts.length === 0) return { ok: false, detail: "no IDAT chunks found" };

  try {
    const inflated = zlib.inflateSync(Buffer.concat(idatParts));
    if (inflated.length === 0) return { ok: false, detail: "IDAT inflated to zero bytes" };
  } catch (err) {
    return { ok: false, detail: `IDAT inflate failed: ${(err as Error).message}` };
  }

  return { ok: true, detail: `PNG decodes, ${width}x${height}`, width, height };
}

const JPEG_SOI = Buffer.from([0xff, 0xd8]);
const JPEG_EOI = Buffer.from([0xff, 0xd9]);

export function decodesJpeg(buf: Buffer): DecodeResult {
  if (buf.length < 4) return { ok: false, detail: "file too small to be a JPEG" };
  if (!buf.subarray(0, 2).equals(JPEG_SOI)) return { ok: false, detail: "missing JPEG SOI marker" };
  if (!buf.subarray(buf.length - 2).equals(JPEG_EOI)) return { ok: false, detail: "missing JPEG EOI marker" };
  return { ok: true, detail: "JPEG has valid SOI/EOI markers" };
}

export function decodeByExtension(fileNameLower: string, buf: Buffer): Promise<DecodeResult> | DecodeResult {
  if (fileNameLower.endsWith(".pdf")) return decodesPdf(buf);
  if (fileNameLower.endsWith(".png")) return decodesPng(buf);
  if (fileNameLower.endsWith(".jpg") || fileNameLower.endsWith(".jpeg")) return decodesJpeg(buf);
  return { ok: false, detail: "unsupported file extension" };
}
