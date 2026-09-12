/**
 * Validates one attachment file before it is ever handed to the browser:
 * exists, extension accepted by the actual portal, and genuinely decodes
 * (not just "has a plausible extension"). Electron-free — usable from tests.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { MOCK_ACCEPTED_FILE_EXTENSIONS } from "../shared/contracts";
import { decodeByExtension } from "../shared/file-checks";

export interface FileValidationResult {
  fieldKey: string;
  absolutePath: string;
  exists: boolean;
  extensionAllowed: boolean;
  decodes: boolean;
  decodeDetail: string;
  sha256: string | null;
  sizeBytes: number | null;
}

export async function validateAttachment(absolutePath: string, fieldKey: string): Promise<FileValidationResult> {
  if (!fs.existsSync(absolutePath)) {
    return { fieldKey, absolutePath, exists: false, extensionAllowed: false, decodes: false, decodeDetail: "file not found", sha256: null, sizeBytes: null };
  }
  const ext = path.extname(absolutePath).toLowerCase();
  const extensionAllowed = MOCK_ACCEPTED_FILE_EXTENSIONS.includes(ext);
  const buf = fs.readFileSync(absolutePath);
  const decodeResult = extensionAllowed
    ? await decodeByExtension(absolutePath.toLowerCase(), buf)
    : { ok: false, detail: `extension "${ext}" is not one the portal accepts (${MOCK_ACCEPTED_FILE_EXTENSIONS.join(", ")})` };

  return {
    fieldKey,
    absolutePath,
    exists: true,
    extensionAllowed,
    decodes: decodeResult.ok,
    decodeDetail: decodeResult.detail,
    sha256: crypto.createHash("sha256").update(buf).digest("hex"),
    sizeBytes: buf.length
  };
}
