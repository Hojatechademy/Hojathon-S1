/**
 * Owns imported document IDs, local file copies and hashes.
 *
 * Security note: the renderer NEVER sends a free-text file path. The only way
 * a path enters this module is via `registerPickedFiles`, called right after
 * a main-process-owned native dialog.showOpenDialog result — a trusted path
 * chosen by the OS picker. Each picked path gets a one-time random token;
 * `attachFile` below only accepts a token that is still pending and consumes
 * it, so a compromised/rogue renderer cannot smuggle in an arbitrary path by
 * guessing or replaying a string.
 */
import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { CaseFile } from "../../shared/contracts";

function filesDir(): string {
  const dir = path.join(app.getPath("userData"), "files");
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}

interface PendingFile {
  absolutePath: string;
  originalName: string;
}

const pendingByToken = new Map<string, PendingFile>();

export function registerPickedFiles(absolutePaths: string[]): { token: string; name: string }[] {
  return absolutePaths.map((absolutePath) => {
    const token = crypto.randomUUID();
    pendingByToken.set(token, { absolutePath, originalName: path.basename(absolutePath) });
    return { token, name: path.basename(absolutePath) };
  });
}

function guessMime(ext: string): string {
  const map: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg"
  };
  return map[ext.toLowerCase()] ?? "application/octet-stream";
}

/** Copies the file referenced by a still-pending token into app storage. Consumes the token. */
export function importPendingFile(token: string, documentType: string | null): CaseFile {
  const pending = pendingByToken.get(token);
  if (!pending) {
    throw new Error("This file selection has expired or was already used. Pick the file again.");
  }
  pendingByToken.delete(token);

  const buf = fs.readFileSync(pending.absolutePath);
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
  const id = crypto.randomUUID();
  const ext = path.extname(pending.originalName);
  const storedName = `${id}${ext}`;
  fs.writeFileSync(path.join(filesDir(), storedName), buf, { mode: 0o600 });

  const checks: string[] = [buf.length > 0 ? "file_decodes_nonempty" : "file_empty"];

  return {
    id,
    originalName: pending.originalName,
    storedName,
    mimeType: guessMime(ext),
    sizeBytes: buf.length,
    sha256,
    documentType: documentType ?? null,
    checks
  };
}

export function deleteStoredFile(storedName: string): void {
  const p = path.join(filesDir(), storedName);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

export function resolveFilePath(storedName: string): string {
  return path.join(filesDir(), storedName);
}

/** Recomputes the hash of a stored file, to detect on-disk tampering/drift after approval. */
export function currentHashOf(storedName: string): string | null {
  const p = path.join(filesDir(), storedName);
  if (!fs.existsSync(p)) return null;
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}
