/**
 * Gemini intake tests. The live-provider tests are clearly separated from
 * the pure/mocked ones and skip (with a clear message) if GEMINI_API_KEY
 * isn't configured — never silently treated as "passing".
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

import { sendMessage } from "../../src/main/ai/intake-orchestrator";
import { acceptUpdate, resetDraft, getDraft } from "../../src/main/ai/intake-state";

function hasLiveCredentials(): boolean {
  return !!process.env.GEMINI_API_KEY && !!process.env.GEMINI_MODEL;
}

// --- Pure, provider-independent tests -------------------------------------

test("acceptUpdate: rejects an unknown field key (mocked, no live call)", () => {
  const result = acceptUpdate({ fieldKey: "notARealField", value: "x", sourceMessageId: "m1", evidenceText: "x" });
  assert.equal(result.accepted, false);
  assert.match(result.reason ?? "", /Unknown field key/);
});

test("acceptUpdate: rejects an empty value (mocked, no live call)", () => {
  const result = acceptUpdate({ fieldKey: "fullName", value: "   ", sourceMessageId: "m1", evidenceText: "x" });
  assert.equal(result.accepted, false);
});

test("acceptUpdate: accepts a valid known field (mocked, no live call)", () => {
  const result = acceptUpdate({ fieldKey: "fullName", value: "Fictional Demo Applicant", sourceMessageId: "m1", evidenceText: "My name is Fictional Demo Applicant" });
  assert.equal(result.accepted, true);
});

// --- Live provider tests (real Gemini Live API calls) ----------------------

test("LIVE: extraction turn only captures stated facts, asks about the rest", async (t) => {
  if (!hasLiveCredentials()) {
    t.skip("GEMINI_API_KEY/GEMINI_MODEL not configured — live Gemini test skipped, not counted as passing.");
    return;
  }
  resetDraft();
  const result = await sendMessage(
    "My name is Fictional Demo Applicant. I live in Ernakulam. I need an income certificate for a bank loan in English. My salary is 180000 per year."
  );

  assert.equal(getDraft().fields.fullName.value, "Fictional Demo Applicant", "fullName should be extracted exactly as stated");
  assert.equal(getDraft().fields.district.value, "Ernakulam", "district should be extracted exactly as stated");
  assert.equal(getDraft().fields.purpose.value, "Bank Loan", "purpose should map to the allowed option");
  assert.equal(getDraft().fields.salary.value, "180000", "salary should be extracted exactly as stated");

  // Must NOT invent unstated identity/income facts.
  assert.equal(getDraft().fields.gender.value, null, "gender was never stated and must not be invented");
  assert.equal(getDraft().fields.dob.value, null, "dob was never stated and must not be invented");
  assert.equal(getDraft().fields.aadhaar.value, null, "aadhaar was never stated and must not be invented");
  assert.equal(getDraft().fields.land.value, null, "unstated income sources must not be silently defaulted to 0");

  assert.ok(result.reply.length > 0, "assistant should produce a readable reply");
});

test("LIVE: correction turn updates the value, preserves everything else, and bumps revision", async (t) => {
  if (!hasLiveCredentials()) {
    t.skip("GEMINI_API_KEY/GEMINI_MODEL not configured — live Gemini test skipped, not counted as passing.");
    return;
  }
  // Depends on the previous LIVE test having run in this same process (module-level singleton draft).
  const before = getDraft();
  if (!before.fields.salary.value) {
    t.skip("Prior extraction turn did not populate salary — skipping dependent correction test.");
    return;
  }
  const revisionBefore = before.revision;
  const fullNameBefore = before.fields.fullName.value;

  await sendMessage("Change my annual salary to 200000.");

  const after = getDraft();
  assert.equal(after.fields.salary.value, "200000", "salary should reflect the explicit correction");
  assert.equal(after.fields.fullName.value, fullNameBefore, "unrelated fields must be preserved across a correction");
  assert.ok(after.revision > revisionBefore, "revision must bump so any prior approval/digest is invalidated");
});

test("LIVE: ambiguous/missing-info turn leaves required fields unresolved", async (t) => {
  if (!hasLiveCredentials()) {
    t.skip("GEMINI_API_KEY/GEMINI_MODEL not configured — live Gemini test skipped, not counted as passing.");
    return;
  }
  resetDraft();
  await sendMessage("I need help with a certificate.");
  const draft = getDraft();
  const stillMissingRequired = !draft.fields.fullName.value || !draft.fields.mobile.value || !draft.fields.district.value;
  assert.ok(stillMissingRequired, "vague input must not fabricate required fields");
});
