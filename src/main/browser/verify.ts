/**
 * M2 — NOT IMPLEMENTED YET, NOT WIRED INTO IPC.
 *
 * This file will hold field readback (did the value we filled actually land?)
 * and page-state checks (is the page we think we're on actually ready?) used
 * by runner.ts. Kept separate from runner.ts so "did the fill work" logic can
 * be unit-tested against fixture DOM independent of page-walking control flow.
 */
import type { Page, Locator } from "playwright";
import type { FieldMapping } from "../../shared/contracts";

export interface ReadbackResult {
  matched: boolean;
  observedValue: string;
}

export function readbackField(_page: Page, _locator: Locator, _field: FieldMapping, _expected: string): Promise<ReadbackResult> {
  throw new Error("Not implemented: readback verification is Milestone M2.");
}
