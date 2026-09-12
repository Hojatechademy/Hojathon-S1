/**
 * Local case storage: cases and their revision/approval lifecycle.
 *
 * TEMPORARY IMPLEMENTATION (Phase 1): plain JSON files under Electron's
 * userData directory, one file per case, written atomically (write to a
 * temp file then rename) so a crash mid-write can't corrupt a case. This is
 * NOT encrypted — do not claim otherwise. No personal data ships in this
 * repo; case JSON lives only under the user's local userData directory,
 * which is gitignored implicitly by never being inside the project folder.
 *
 * SQLite was considered per the brief's preference, but Node 24 has no
 * built-in SQLite binding usable from Electron's main process without a
 * native module (better-sqlite3), which risks node-gyp/prebuild friction on
 * a 3-hour clock. This JSON approach is the documented fallback; swapping in
 * SQLite later only touches this file, not its callers.
 */
import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Case, CaseField, CaseFieldStatus, ValidationIssue, PortalManifest, CaseFile } from "../../shared/contracts";
import { computeDigest } from "./digest";

function dataDir(): string {
  const dir = path.join(app.getPath("userData"), "cases");
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}

function casePath(id: string): string {
  return path.join(dataDir(), `${id}.json`);
}

function nowIso(): string {
  return new Date().toISOString();
}

function readCase(id: string): Case {
  const raw = fs.readFileSync(casePath(id), "utf-8");
  return Case.parse(JSON.parse(raw));
}

function writeCaseAtomic(c: Case): void {
  const target = casePath(c.id);
  const tmp = `${target}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(c, null, 2), { encoding: "utf-8", mode: 0o600 });
  fs.renameSync(tmp, target);
}

export function createCase(jurisdiction: string): Case {
  const id = crypto.randomUUID();
  const ts = nowIso();
  const c: Case = {
    id,
    schemaVersion: "1.0.0",
    revision: 0,
    serviceId: "income_certificate",
    jurisdiction,
    createdAt: ts,
    updatedAt: ts,
    fields: {},
    files: [],
    notes: [],
    validationIssues: [],
    approval: null,
    lifecycle: "draft"
  };
  writeCaseAtomic(c);
  return c;
}

export function getCase(id: string): Case | null {
  try {
    return readCase(id);
  } catch {
    return null;
  }
}

export function listCases(): Case[] {
  const dir = dataDir();
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => Case.parse(JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"))))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Every user change bumps revision and clears any prior approval. */
function bumpAndClearApproval(c: Case): void {
  c.revision += 1;
  c.updatedAt = nowIso();
  c.approval = null;
  if (c.lifecycle === "approved" || c.lifecycle === "prepared") {
    c.lifecycle = "draft";
  }
}

export function setField(caseId: string, fieldKey: string, value: string | null, status: CaseFieldStatus): Case {
  const c = readCase(caseId);
  const field: CaseField = {
    value,
    status,
    sourceRefs: c.fields[fieldKey]?.sourceRefs ?? ["user_manual_entry"]
  };
  c.fields[fieldKey] = field;
  bumpAndClearApproval(c);
  writeCaseAtomic(c);
  return c;
}

export function addNote(caseId: string, text: string): Case {
  const c = readCase(caseId);
  c.notes.push({ id: crypto.randomUUID(), text, author: "user", createdAt: nowIso() });
  bumpAndClearApproval(c);
  writeCaseAtomic(c);
  return c;
}

export function addFile(caseId: string, file: CaseFile): Case {
  const c = readCase(caseId);
  c.files.push(file);
  bumpAndClearApproval(c);
  writeCaseAtomic(c);
  return c;
}

export function removeFileRecord(caseId: string, fileId: string): { case: Case; removed: CaseFile | null } {
  const c = readCase(caseId);
  const removed = c.files.find((f) => f.id === fileId) ?? null;
  c.files = c.files.filter((f) => f.id !== fileId);
  bumpAndClearApproval(c);
  writeCaseAtomic(c);
  return { case: c, removed };
}

/**
 * Phase 1 validation is deliberately simple and deterministic: required
 * fields (from the manifest's observed field list) must be present AND
 * user-confirmed, not merely non-empty. No AI-based conflict detection —
 * that is a Phase 2 hook (see validateCase() interface note in docs).
 */
export function validateCase(caseId: string, manifest: PortalManifest | null): Case {
  const c = readCase(caseId);
  const issues: ValidationIssue[] = [];

  if (manifest) {
    const requiredKeys = new Set(
      manifest.pages.flatMap((p) => p.fields).filter((f) => f.required === true).map((f) => f.key)
    );
    for (const key of requiredKeys) {
      const field = c.fields[key];
      if (!field || field.value === null || field.value.trim() === "") {
        issues.push({ code: "missing_required_field", fieldKey: key, message: `"${key}" is required and has no value.`, blocking: true });
      } else if (field.status !== "confirmed") {
        issues.push({ code: "unconfirmed_required_field", fieldKey: key, message: `"${key}" has a value but is not confirmed by the user.`, blocking: true });
      }
    }
  } else {
    issues.push({ code: "manifest_pending", message: "No verified portal manifest yet — readiness cannot be fully determined.", blocking: false });
  }

  for (const [key, field] of Object.entries(c.fields)) {
    if (field.status === "conflicting") {
      issues.push({ code: "conflicting_field", fieldKey: key, message: `"${key}" has conflicting values that must be resolved.`, blocking: true });
    }
  }

  c.validationIssues = issues;
  c.lifecycle = issues.some((i) => i.blocking) ? "draft" : "ready_for_review";
  c.updatedAt = nowIso();
  writeCaseAtomic(c);
  return c;
}

export function approveCase(
  caseId: string,
  expectedRevision: number,
  manifest: PortalManifest,
  approvedActionIds: string[]
): Case {
  const c = readCase(caseId);
  if (c.revision !== expectedRevision) {
    throw new Error(`Case has changed since you last reviewed it (revision ${c.revision} != expected ${expectedRevision}). Re-review before approving.`);
  }
  if (c.validationIssues.some((i) => i.blocking)) {
    throw new Error("Cannot approve a case with blocking validation issues.");
  }
  const unknownActionIds = approvedActionIds.filter(
    (id) => !manifest.pages.flatMap((p) => p.actions).some((a) => a.id === id && a.automation === "allowed")
  );
  if (unknownActionIds.length > 0) {
    throw new Error(`Cannot approve unknown or non-allowed action ids: ${unknownActionIds.join(", ")}`);
  }
  const digest = computeDigest(c, manifest.manifestVersion, approvedActionIds);
  c.approval = { revision: c.revision, digest, approvedActionIds, approvedAt: nowIso() };
  c.lifecycle = "approved";
  c.updatedAt = nowIso();
  writeCaseAtomic(c);
  return c;
}

export function setLifecycle(caseId: string, lifecycle: Case["lifecycle"]): Case {
  const c = readCase(caseId);
  c.lifecycle = lifecycle;
  c.updatedAt = nowIso();
  writeCaseAtomic(c);
  return c;
}
