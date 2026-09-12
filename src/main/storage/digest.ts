/**
 * Pure approval-digest logic, deliberately kept free of any Electron import
 * so it can be unit-tested directly under plain Node (tests/digest.test.ts).
 */
import crypto from "node:crypto";
import { Case } from "../../shared/contracts";

/** Digest covers exact field values, selected file hashes, manifest version and approved action scope. */
export function computeDigest(c: Case, manifestVersion: string, approvedActionIds: string[]): string {
  const canonical = JSON.stringify({
    fields: Object.entries(c.fields).sort(([a], [b]) => a.localeCompare(b)),
    fileHashes: c.files.map((f) => f.sha256).sort(),
    manifestVersion,
    approvedActionIds: [...approvedActionIds].sort()
  });
  return crypto.createHash("sha256").update(canonical).digest("hex");
}
