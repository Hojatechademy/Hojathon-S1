/**
 * Orchestrates the "Load Sample / Select JSON -> review -> Start Demonstration"
 * flow: holds the last loaded+validated application in memory, and re-validates
 * fresh from disk immediately before every run so a stale review can never
 * drive the browser (files or JSON edited after review are caught here).
 */
import path from "node:path";
import { app } from "electron";
import { DemoApplication, DemoValidationResult, originOf } from "../shared/contracts";
import { readApplicationFile, validateApplication, LoadedApplication } from "./case-loader";
import { MOCK_PORTAL_URL, MOCK_INCOME_CERT_FORM_URL } from "./config";
import * as browserManager from "./browser/manager";
import { runDemo } from "./browser/form-runner";

export interface DemoReviewState {
  jsonFilePath: string;
  application: DemoApplication;
  validation: DemoValidationResult;
}

let lastLoaded: LoadedApplication | null = null;
let lastValidation: DemoValidationResult | null = null;

export async function loadAndValidate(jsonFilePath: string): Promise<DemoReviewState> {
  const loaded = readApplicationFile(jsonFilePath);
  const validation = await validateApplication(loaded);
  lastLoaded = loaded;
  lastValidation = validation;
  return { jsonFilePath: loaded.jsonFilePath, application: loaded.application, validation };
}

export function getCurrentReview(): DemoReviewState | null {
  if (!lastLoaded || !lastValidation) return null;
  return { jsonFilePath: lastLoaded.jsonFilePath, application: lastLoaded.application, validation: lastValidation };
}

/**
 * Re-validates fresh from disk and compares the digest to what the caller
 * last reviewed. Refuses to start if anything changed, or if nothing has
 * been loaded/approved yet.
 */
export async function startDemo(expectedDigest: string): Promise<{ runId: string }> {
  if (!lastLoaded) {
    throw new Error("No application loaded. Load the sample or select a JSON file first.");
  }
  const fresh = await validateApplication(lastLoaded);
  lastValidation = fresh;
  if (!fresh.ok || fresh.digest === null) {
    throw new Error("The reviewed application no longer validates — reload and review it again.");
  }
  if (fresh.digest !== expectedDigest) {
    throw new Error("The application or an attachment changed since you reviewed it. Reload and review again before starting.");
  }

  const allowedOrigins = [originOf(MOCK_PORTAL_URL)];
  const { runId, page } = await browserManager.openForAutomatedDemo(MOCK_INCOME_CERT_FORM_URL, lastLoaded.jsonFilePath, allowedOrigins);

  const resolvedAttachments = fresh.resolvedAttachments.map((a) => ({ fieldKey: a.fieldKey, absolutePath: a.absolutePath }));

  // Runs in the background; progress streams as BrowserEvents. The caller
  // gets the runId immediately rather than waiting for the whole flow.
  void runDemo(page, { application: lastLoaded.application, resolvedAttachments }).catch(() => {
    // runDemo already emits a 'failed' BrowserEvent on any internal error.
  });

  return { runId };
}

export function defaultSamplePath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "samples", "application.sample.json");
  }
  return path.join(__dirname, "..", "..", "..", "samples", "application.sample.json");
}
