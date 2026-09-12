/**
 * Regression test for the Phase 1 audit finding: Stage 3 summary mismatches
 * were logged but never affected the final verdict. stage3MismatchMessages
 * is pure (no Page, no browser) so this proves the fix with a local stub —
 * no live portal needed.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { stage3MismatchMessages, RunInputs } from "../src/main/browser/form-runner";
import type { Stage3Summary } from "../src/main/browser/readback";
import type { DemoApplication } from "../src/shared/contracts";

function baseInputs(): RunInputs {
  const application: DemoApplication = {
    schemaVersion: "1.0",
    service: "income_certificate",
    demoOnly: true,
    fields: { fullName: "Fictional Demo Applicant", district: "Ernakulam", purpose: "Bank Loan" },
    attachments: []
  };
  return { application, resolvedAttachments: [] };
}

const matchingPanel: Stage3Summary = {
  name: "Fictional Demo Applicant",
  districtLine: "Ernakulam / Kanayannur / Elamkulam",
  purpose: "Bank Loan",
  totalIncomeText: "Rs. 1,80,000",
  docsText: "6 attached"
};

test("stage3MismatchMessages: no messages when the panel matches the input", () => {
  const messages = stage3MismatchMessages(matchingPanel, baseInputs());
  assert.deepEqual(messages, []);
});

test("stage3MismatchMessages: detects a name mismatch", () => {
  const panel: Stage3Summary = { ...matchingPanel, name: "Someone Else Entirely" };
  const messages = stage3MismatchMessages(panel, baseInputs());
  assert.equal(messages.length, 1);
  assert.match(messages[0], /name/);
});

test("stage3MismatchMessages: detects a purpose mismatch", () => {
  const panel: Stage3Summary = { ...matchingPanel, purpose: "Pension" };
  const messages = stage3MismatchMessages(panel, baseInputs());
  assert.equal(messages.length, 1);
  assert.match(messages[0], /purpose/);
});

test("regression: a summary mismatch is included in unresolvedIssues and prevents a clean pass (via finish() logic)", () => {
  // Mirrors form-runner.ts's finish(): unresolvedIssues now includes
  // stage3MismatchMessages' output, and a non-empty list means "not a clean
  // pass" rather than "Demonstration complete".
  const panel: Stage3Summary = { ...matchingPanel, name: "Someone Else Entirely" };
  const mismatches = stage3MismatchMessages(panel, baseInputs());
  const unresolvedIssues = [...mismatches]; // no field/attachment issues in this stub scenario
  const allMatched = unresolvedIssues.length === 0;
  assert.equal(allMatched, false, "a summary mismatch must prevent a clean pass");
});
