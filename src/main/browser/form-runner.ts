/**
 * Orchestrates one end-to-end demonstration run: open the mock portal,
 * navigate to the income-certificate form, fill Stage 1, select Stage 2
 * attachments, read everything back, reach the Stage 3 review panel, and
 * stop — never touching payment mode, the terms checkbox, or Submit.
 *
 * Pause/stop are checked between every step via
 * browserManager.waitWhileNotRunnable(); a stop mid-run leaves the browser
 * open (per the brief) and reports which steps did/did not complete. Pause
 * cannot undo an already-sent action — for this portal specifically, that
 * only ever means "a field already got filled" or "a file was already
 * selected", since Stage 1/2 "Save & Next" cause no network or storage
 * write at all (verified by reading the source: only Stage 3's Submit
 * writes anything, and this runner never reaches that button).
 */
import type { Page } from "playwright";
import { DemoApplication, DemoRunSummary, MOCK_DOC_SPECS } from "../../shared/contracts";
import * as browserManager from "./manager";
import * as portalAdapter from "./portal-adapter";
import * as readback from "./readback";

export interface ResolvedAttachment {
  fieldKey: string;
  absolutePath: string;
}

export interface RunInputs {
  application: DemoApplication;
  resolvedAttachments: ResolvedAttachment[];
}

async function runnableOrStop(): Promise<boolean> {
  const status = await browserManager.waitWhileNotRunnable();
  if (status === "stopped") {
    browserManager.emitProgress({ type: "paused", message: "Run stopped; browser left open for inspection." });
    return false;
  }
  return true;
}

export async function runDemo(page: Page, inputs: RunInputs): Promise<DemoRunSummary> {
  const fieldResults: readback.FieldReadback[] = [];
  const attachmentResults: readback.AttachmentReadback[] = [];
  let stoppedEarly = false;
  let summaryMismatches: string[] = [];

  try {
    browserManager.emitProgress({ type: "page_ready", message: "Navigating to application." });
    if (!(await runnableOrStop())) { stoppedEarly = true; return finish(); }
    await portalAdapter.waitForFormReady(page);

    browserManager.emitProgress({ type: "field_filled", message: "Filling information." });
    if (!(await runnableOrStop())) { stoppedEarly = true; return finish(); }
    const filledKeys = await portalAdapter.fillStage1(page, inputs.application.fields);

    browserManager.emitProgress({ type: "field_verified", message: "Checking entered values (Stage 1)." });
    for (const key of filledKeys) {
      if (!(await runnableOrStop())) { stoppedEarly = true; return finish(); }
      const result = await readback.readField(page, key, inputs.application.fields[key] as string);
      fieldResults.push(result);
      if (!result.matched) {
        browserManager.emitProgress({ type: "blocked", fieldKey: key, message: `Readback mismatch on "${key}": expected "${result.expected}", observed "${result.observed}".`, errorCode: "readback_mismatch" });
      }
    }

    if (!(await runnableOrStop())) { stoppedEarly = true; return finish(); }
    await portalAdapter.goToStage2(page);

    browserManager.emitProgress({ type: "field_filled", message: "Selecting/uploading documents." });
    if (!(await runnableOrStop())) { stoppedEarly = true; return finish(); }
    await portalAdapter.selectAttachments(page, inputs.resolvedAttachments);

    for (const a of inputs.resolvedAttachments) {
      if (!(await runnableOrStop())) { stoppedEarly = true; return finish(); }
      const result = await readback.readAttachment(page, a.fieldKey, a.absolutePath);
      attachmentResults.push(result);
      if (!result.selected) {
        browserManager.emitProgress({ type: "blocked", fieldKey: a.fieldKey, message: `Attachment mismatch on "${a.fieldKey}": expected "${result.expectedFileName}", observed "${result.observedFileName ?? "(none)"}".`, errorCode: "attachment_mismatch" });
      }
    }

    if (!(await runnableOrStop())) { stoppedEarly = true; return finish(); }
    await portalAdapter.goToStage3(page);

    browserManager.emitProgress({ type: "page_ready", message: "Ready for final review." });
    const summaryPanel = await readback.readStage3Summary(page);
    summaryMismatches = stage3MismatchMessages(summaryPanel, inputs);
    for (const message of summaryMismatches) {
      browserManager.emitProgress({ type: "blocked", message, errorCode: "summary_mismatch" });
    }
  } catch (err) {
    browserManager.emitProgress({ type: "failed", message: `Run failed: ${(err as Error).message}`, errorCode: "run_exception" });
    stoppedEarly = true;
  }

  function finish(): DemoRunSummary {
    const missingRequiredDocs = MOCK_DOC_SPECS.filter(
      (d) => d.required && !attachmentResults.some((a) => a.fieldKey === d.key && a.selected)
    );
    const unresolvedIssues = [
      ...fieldResults.filter((f) => !f.matched).map((f) => `Field "${f.fieldKey}" readback mismatch.`),
      ...attachmentResults.filter((a) => !a.selected).map((a) => `Attachment "${a.fieldKey}" selection mismatch.`),
      ...missingRequiredDocs.map((d) => `Required attachment "${d.key}" was never selected.`),
      ...summaryMismatches
    ];
    const allMatched = unresolvedIssues.length === 0;
    const summary: DemoRunSummary = {
      fieldsVerified: fieldResults.filter((f) => f.matched).length,
      fieldsMismatched: fieldResults.filter((f) => !f.matched).length,
      attachmentsSelected: attachmentResults.filter((a) => a.selected).length,
      attachmentsMissing: attachmentResults.filter((a) => !a.selected).length,
      uploadsAcknowledged: 0,
      unresolvedIssues,
      stoppedEarly,
      finalMessage: stoppedEarly
        ? "Run stopped before completion — see activity log for the last completed step."
        : allMatched
          ? "Demonstration complete — form prepared, not submitted."
          : "Demonstration reached the review screen, but verification found unresolved issues — not a clean pass."
    };
    browserManager.emitProgress({ type: "finished", message: summary.finalMessage, summary });
    return summary;
  }

  return finish();
}

/**
 * Pure (no page, no side effects) so it's directly unit-testable with a
 * stub Stage3Summary — no live browser/portal needed to prove this path.
 * Phase 1 audit finding: these mismatches used to be logged but never
 * affected the final verdict. They now feed into unresolvedIssues (see
 * runDemo's `finish()`), so a mismatch here correctly prevents a clean pass.
 */
export function stage3MismatchMessages(panel: readback.Stage3Summary, inputs: RunInputs): string[] {
  const messages: string[] = [];
  const expectedName = inputs.application.fields.fullName ?? "";
  if (expectedName && !panel.name.includes(expectedName)) {
    messages.push(`Stage 3 summary name "${panel.name}" does not include expected "${expectedName}".`);
  }
  const expectedDistrict = inputs.application.fields.district ?? "";
  if (expectedDistrict && !panel.districtLine.includes(expectedDistrict)) {
    messages.push(`Stage 3 summary district line "${panel.districtLine}" does not include expected "${expectedDistrict}".`);
  }
  const expectedPurpose = inputs.application.fields.purpose ?? "";
  if (expectedPurpose && panel.purpose !== expectedPurpose) {
    messages.push(`Stage 3 summary purpose "${panel.purpose}" does not match expected "${expectedPurpose}".`);
  }
  return messages;
}
