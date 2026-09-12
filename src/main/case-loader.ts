/**
 * Loads and validates the JSON-driven demo application: schema shape, known
 * field keys only, the portal's actual required/conditional/dropdown rules,
 * and every attachment (resolved relative to the JSON file's own directory,
 * never the process cwd). Produces a digest over the reviewed data so a
 * later edit or file change can be detected before the browser ever opens.
 *
 * Electron-free (only fs/path/crypto) so it can run under plain Node in tests.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  DemoApplication,
  MOCK_INCOME_CERT_FIELD_KEYS,
  MOCK_DOC_SPECS,
  DemoValidationResult,
  ValidationIssue,
  validateMockIncomeCertFields
} from "../shared/contracts";
import { validateAttachment } from "./file-validator";

const KNOWN_FIELD_KEYS = new Set<string>(MOCK_INCOME_CERT_FIELD_KEYS);

export interface LoadedApplication {
  application: DemoApplication;
  jsonFilePath: string;
}

export function readApplicationFile(jsonFilePath: string): LoadedApplication {
  const raw = fs.readFileSync(jsonFilePath, "utf-8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`"${jsonFilePath}" is not valid JSON: ${(err as Error).message}`);
  }
  const result = DemoApplication.safeParse(parsed);
  if (!result.success) {
    const detail = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`"${jsonFilePath}" does not match the expected application schema: ${detail}`);
  }
  return { application: result.data, jsonFilePath };
}

export async function validateApplication(loaded: LoadedApplication): Promise<DemoValidationResult> {
  const { application, jsonFilePath } = loaded;
  const issues: ValidationIssue[] = [];
  const jsonDir = path.dirname(jsonFilePath);

  for (const key of Object.keys(application.fields)) {
    if (!KNOWN_FIELD_KEYS.has(key)) {
      issues.push({ code: "unknown_field_key", fieldKey: key, message: `"${key}" is not a field this portal implements.`, blocking: true });
    }
  }

  issues.push(...validateMockIncomeCertFields(application.fields));

  const resolvedAttachments: DemoValidationResult["resolvedAttachments"] = [];
  const attachmentByKey = new Map(application.attachments.map((a) => [a.fieldKey, a]));

  for (const doc of MOCK_DOC_SPECS) {
    const attachment = attachmentByKey.get(doc.key);
    if (!attachment) {
      if (doc.required) {
        issues.push({ code: "missing_required_attachment", fieldKey: doc.key, message: `Required attachment "${doc.key}" (${doc.label}) is missing.`, blocking: true });
      }
      continue;
    }
    const absolutePath = path.resolve(jsonDir, attachment.path);
    const fileResult = await validateAttachment(absolutePath, doc.key);
    if (!fileResult.exists) {
      issues.push({ code: "attachment_not_found", fieldKey: doc.key, message: `Attachment for "${doc.key}" not found at "${absolutePath}".`, blocking: true });
      continue;
    }
    if (!fileResult.extensionAllowed) {
      issues.push({ code: "attachment_extension_rejected", fieldKey: doc.key, message: `Attachment for "${doc.key}": ${fileResult.decodeDetail}`, blocking: true });
      continue;
    }
    if (!fileResult.decodes) {
      issues.push({ code: "attachment_does_not_decode", fieldKey: doc.key, message: `Attachment for "${doc.key}" does not decode: ${fileResult.decodeDetail}`, blocking: true });
      continue;
    }
    resolvedAttachments.push({ fieldKey: doc.key, absolutePath, sha256: fileResult.sha256 as string, sizeBytes: fileResult.sizeBytes as number });
  }

  for (const key of attachmentByKey.keys()) {
    if (!MOCK_DOC_SPECS.some((d) => d.key === key)) {
      issues.push({ code: "unknown_attachment_field_key", fieldKey: key, message: `"${key}" is not an attachment slot this portal implements.`, blocking: true });
    }
  }

  const ok = issues.every((i) => !i.blocking);
  const digest = ok ? computeDemoDigest(application.fields, resolvedAttachments) : null;

  return { ok, issues, resolvedAttachments, digest };
}

/** Digest over exact field values + attachment hashes — any change invalidates a prior review. */
export function computeDemoDigest(
  fields: Record<string, string>,
  resolvedAttachments: { fieldKey: string; sha256: string }[]
): string {
  const canonical = JSON.stringify({
    fields: Object.entries(fields).sort(([a], [b]) => a.localeCompare(b)),
    attachments: [...resolvedAttachments].sort((a, b) => a.fieldKey.localeCompare(b.fieldKey)).map((a) => [a.fieldKey, a.sha256])
  });
  return crypto.createHash("sha256").update(canonical).digest("hex");
}
