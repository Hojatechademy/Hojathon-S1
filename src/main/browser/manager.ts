/**
 * Headed browser lifecycle: launch, pause/resume, human-login handoff, close.
 * Exactly one active run is allowed at a time. Uses a dedicated, temporary
 * Playwright profile directory per run — never the user's everyday browser
 * profile, never exported cookies/session state. The profile directory is
 * deleted when the run closes.
 *
 * M1 scope: open the configured official URL for manual login, let the user
 * signal "I've finished — check page", and pause/close. No field filling and
 * no page walking here — that is runner.ts, wired in at M2 after checkpoint.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { chromium, BrowserContext, Page } from "playwright";
import {
  BrowserDiagnostics,
  BrowserEvent,
  BrowserRunState,
  PageCheckResult,
  isHttpsUrl,
  isAllowedMockOrigin,
  originOf
} from "../../shared/contracts";
import { DEMO_SLOW_MO_MS } from "../config";

export type EmitFn = (evt: Omit<BrowserEvent, "timestamp">) => void;

let emit: EmitFn = () => {};
export function setEventEmitter(fn: EmitFn): void {
  emit = fn;
}

interface ActiveRun {
  runId: string;
  caseId: string | null;
  context: BrowserContext;
  page: Page;
  profileDir: string;
  state: BrowserRunState;
  allowedOrigins: Set<string>;
  stopRequested: boolean;
}

let active: ActiveRun | null = null;

function fire(partial: Omit<BrowserEvent, "timestamp" | "runId" | "caseId">, run: ActiveRun | null): void {
  emit({
    runId: run?.runId ?? "none",
    caseId: run?.caseId ?? null,
    ...partial
  });
}

export function getDiagnostics(): BrowserDiagnostics {
  let executablePath: string | null = null;
  try {
    executablePath = chromium.executablePath();
  } catch {
    executablePath = null;
  }
  const installed = !!executablePath && fs.existsSync(executablePath);
  return {
    chromiumInstalled: installed,
    executablePath: installed ? executablePath : null,
    installCommand: "npm run playwright:install"
  };
}

export function currentState(): BrowserRunState {
  return active?.state ?? "closed";
}

export function isActive(): boolean {
  return active !== null;
}

/** Shared launch path: dedicated temp profile, origin guard wiring, initial navigation. */
async function launchAndNavigate(
  url: string,
  caseId: string | null,
  allowedOrigins: string[],
  urlAllowed: (u: string) => boolean,
  rejectionMessage: string
): Promise<{ runId: string }> {
  if (active) {
    throw new Error("A browser run is already active. Close it before opening a new one.");
  }
  if (!urlAllowed(url)) {
    throw new Error(rejectionMessage);
  }

  const diagnostics = getDiagnostics();
  if (!diagnostics.chromiumInstalled) {
    throw new Error(`Chromium is not installed for Playwright. Run: ${diagnostics.installCommand}`);
  }

  const runId = crypto.randomUUID();
  const profileDir = path.join(os.tmpdir(), `serviceready-playwright-${runId}`);
  const allowed = new Set(allowedOrigins.length > 0 ? allowedOrigins : [originOf(url)]);

  fire({ type: "browser_opened", message: "Launching a dedicated, temporary local browser profile." }, null);

  // viewport: null + --start-maximized lets Chromium fill the real screen
  // instead of Playwright's default fixed-size viewport window — genuine
  // maximized browser chrome (not a kiosk/true-fullscreen mode, which would
  // hide the address bar and risk trapping the window during a live demo).
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    slowMo: DEMO_SLOW_MO_MS,
    viewport: null,
    args: ["--start-maximized"]
  });
  const page = context.pages()[0] ?? (await context.newPage());

  active = { runId, caseId, context, page, profileDir, state: "opening", allowedOrigins: allowed, stopRequested: false };

  context.on("close", () => {
    if (active?.runId === runId) {
      fire({ type: "closed", message: "Browser window was closed." }, active);
      void cleanupProfile(profileDir);
      active = null;
    }
  });

  page.on("framenavigated", (frame) => {
    if (frame !== page.mainFrame() || !active || active.runId !== runId) return;
    const origin = originOf(frame.url());
    if (!active.allowedOrigins.has(origin)) {
      fire(
        { type: "blocked", message: `Navigation to unapproved origin "${origin}" was observed and is outside the configured allow-list.`, errorCode: "unapproved_origin_observed" },
        active
      );
    }
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  } catch (err) {
    fire({ type: "failed", message: `Could not reach the configured site: ${(err as Error).message}`, errorCode: "navigation_failed" }, active);
    throw err;
  }

  active.state = "open";
  return { runId };
}

/**
 * Opens the government site for manual, human login. `allowedOrigins` bounds
 * where this run is permitted to navigate (the configured URL's own origin
 * at minimum, plus any known authentication origins from a loaded manifest).
 * HTTPS-only — this is the real-government-portal path.
 */
export async function openForLogin(url: string, caseId: string | null, allowedOrigins: string[]): Promise<{ runId: string }> {
  const result = await launchAndNavigate(url, caseId, allowedOrigins, isHttpsUrl, "Refusing to open a non-HTTPS URL.");
  fire({ type: "awaiting_user", message: "Page loaded. Complete login/OTP/CAPTCHA yourself, then use \"I've finished — check page\"." }, active);
  return result;
}

/**
 * Opens the configured MOCK portal for an automated demonstration run.
 * Allows plain http only for localhost/127.0.0.1 (the mock's own dev
 * server) — never for an arbitrary or real-looking government domain.
 */
export async function openForAutomatedDemo(url: string, caseId: string | null, allowedOrigins: string[]): Promise<{ runId: string; page: Page }> {
  const result = await launchAndNavigate(
    url,
    caseId,
    allowedOrigins,
    isAllowedMockOrigin,
    "Refusing to open this URL: only https, or http on localhost/127.0.0.1 (the mock portal's own dev server), is allowed for automated demonstration."
  );
  fire({ type: "page_ready", message: "Mock portal landing page loaded." }, active);
  return { ...result, page: active!.page };
}

/** Requests the active run stop scheduling further actions. Does not undo an already-sent request. */
export function requestStop(): void {
  if (active) active.stopRequested = true;
}

export function isStopRequested(): boolean {
  return active?.stopRequested ?? false;
}

/** Resolves once the run is no longer paused, or immediately if stop was requested / run ended. */
export async function waitWhileNotRunnable(): Promise<"ready" | "stopped"> {
  while (true) {
    if (!active || active.stopRequested) return "stopped";
    if (active.state !== "paused") return "ready";
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

/** Emits a progress event tagged with the currently active run's runId/caseId, if any. */
export function emitProgress(evt: Omit<BrowserEvent, "timestamp" | "runId" | "caseId">): void {
  fire(evt, active);
}

export async function checkPage(): Promise<PageCheckResult> {
  if (!active) throw new Error("No browser is open.");
  const result: PageCheckResult = {
    url: active.page.url(),
    title: await active.page.title().catch(() => ""),
    checkedAt: new Date().toISOString()
  };
  fire({ type: "page_ready", message: `Current page checked: ${result.title || "(no title)"}` }, active);
  return result;
}

export function pause(): void {
  if (!active) throw new Error("No browser is open.");
  active.state = "paused";
  fire({ type: "paused", message: "Paused. No further automated actions will be scheduled." }, active);
}

export function resume(): void {
  if (!active) throw new Error("No browser is open.");
  active.state = "open";
  fire({ type: "resumed", message: "Resumed." }, active);
}

export async function close(): Promise<void> {
  if (!active) return;
  const run = active;
  run.state = "closing";
  try {
    await run.context.close();
  } finally {
    await cleanupProfile(run.profileDir);
    if (active?.runId === run.runId) active = null;
    fire({ type: "closed", message: "Browser closed and temporary profile removed." }, run);
  }
}

async function cleanupProfile(profileDir: string): Promise<void> {
  try {
    await fs.promises.rm(profileDir, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup; a leftover temp profile dir contains no case data.
  }
}

export function getActivePage(): Page | null {
  return active?.page ?? null;
}

export function getActiveRunId(): string | null {
  return active?.runId ?? null;
}
