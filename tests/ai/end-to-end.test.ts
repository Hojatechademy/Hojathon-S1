/**
 * End-to-end proving test: real Gemini extraction -> the same JSON shape
 * draft-to-application.ts produces -> EXISTING case-loader/validation ->
 * EXISTING browser pipeline against the actual Vercel deployment. No
 * parallel runner — this exercises the exact same downstream functions the
 * real app uses for "Review & Fill Application".
 *
 * draft-to-application.ts itself imports `electron` (for app.getPath /
 * app.isPackaged) purely to choose a userData directory and the bundled
 * demo-documents path — mocking electron's module resolution under tsx's
 * ESM loader is unreliable, so this test replicates that handful of lines
 * directly against a real temp directory and the real samples/documents/
 * path instead. Everything downstream of that (case-loader, browser
 * manager, portal adapter, readback, form-runner) is exercised for real,
 * unmocked, against the real Vercel deployment.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

function hasLiveCredentials(): boolean {
  return !!process.env.GEMINI_API_KEY && !!process.env.GEMINI_MODEL;
}

test("END-TO-END: live Gemini draft -> existing validation -> existing browser pipeline (Vercel)", async (t) => {
  if (!hasLiveCredentials()) {
    t.skip("GEMINI_API_KEY/GEMINI_MODEL not configured — end-to-end test skipped, not counted as passing.");
    return;
  }

  const { sendMessage } = await import("../../src/main/ai/intake-orchestrator");
  const { resetDraft, getDraft } = await import("../../src/main/ai/intake-state");
  const { MOCK_INCOME_CERT_FIELD_KEYS, MOCK_DOC_SPECS, originOf } = await import("../../src/shared/contracts");
  const { readApplicationFile, validateApplication } = await import("../../src/main/case-loader");
  const browserManager = await import("../../src/main/browser/manager");
  const { runDemo } = await import("../../src/main/browser/form-runner");

  resetDraft();
  await sendMessage(
    "My name is Fictional Demo Applicant, female. I live in Ernakulam, address 12 Demo Test Lane, Sample Nagar. My mobile is 9999999999. I need an income certificate for a bank loan in English. My salary is 180000 per year."
  );

  const draft = getDraft();
  const fields: Record<string, string> = {};
  for (const key of MOCK_INCOME_CERT_FIELD_KEYS) {
    const value = draft.fields[key]?.value;
    if (value) fields[key] = value;
  }

  const documentsDir = path.join(__dirname, "..", "..", "samples", "documents");
  const demoFiles: Record<string, string> = {
    ration: "ration-card.pdf", income: "income-proof.pdf", landtax: "land-tax-receipt.pdf",
    basictax: "basic-tax-receipt.pdf", idproof: "id-proof.png", affidavit: "affidavit.pdf"
  };
  const attachments = MOCK_DOC_SPECS.map((d) => ({ fieldKey: d.key, path: path.join(documentsDir, demoFiles[d.key]) }));

  const application = { schemaVersion: "1.0" as const, service: "income_certificate" as const, demoOnly: true as const, fields, attachments };
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hojathon-e2e-"));
  const jsonPath = path.join(tmpDir, "ai-reviewed-application.json");
  fs.writeFileSync(jsonPath, JSON.stringify(application, null, 2), "utf-8");

  const loaded = readApplicationFile(jsonPath);
  const validation = await validateApplication(loaded);
  assert.equal(validation.ok, true, `expected clean validation, got issues: ${JSON.stringify(validation.issues)}`);
  assert.ok(validation.digest);

  const { MOCK_INCOME_CERT_FORM_URL, MOCK_PORTAL_URL } = await import("../../src/main/config");
  const { page } = await browserManager.openForAutomatedDemo(MOCK_INCOME_CERT_FORM_URL, jsonPath, [originOf(MOCK_PORTAL_URL)]);
  try {
    const summary = await runDemo(page, {
      application: loaded.application,
      resolvedAttachments: validation.resolvedAttachments.map((a) => ({ fieldKey: a.fieldKey, absolutePath: a.absolutePath }))
    });
    assert.equal(summary.stoppedEarly, false);
    assert.equal(summary.fieldsMismatched, 0, `readback mismatches: ${JSON.stringify(summary.unresolvedIssues)}`);
    assert.equal(summary.attachmentsSelected, 6);
    assert.equal(summary.finalMessage, "Demonstration complete — form prepared, not submitted.");
  } finally {
    await browserManager.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
