/**
 * Real integration test: runs the actual pipeline (case-loader ->
 * file-validator -> browser-manager -> portal-adapter -> readback ->
 * form-runner) against the mock portal ACTUALLY RUNNING at MOCK_PORTAL_URL
 * (config.ts's default, currently the deployed Vercel URL — override with
 * $env:MOCK_PORTAL_URL to point at localhost instead). If the portal isn't
 * reachable, these tests are skipped with a clear message rather than
 * failing noisily. Run via `npm test`/`npm run test:portal`, which set
 * DEMO_FAST_MODE=1 so this executes at raw speed, not demo pacing.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readApplicationFile, validateApplication } from "../../src/main/case-loader";
import * as browserManager from "../../src/main/browser/manager";
import { runDemo } from "../../src/main/browser/form-runner";
import * as portalAdapter from "../../src/main/browser/portal-adapter";
import * as readback from "../../src/main/browser/readback";
import { originOf } from "../../src/shared/contracts";
import { MOCK_PORTAL_URL, MOCK_INCOME_CERT_FORM_URL } from "../../src/main/config";
const SAMPLE_PATH = path.join(__dirname, "..", "..", "samples", "application.sample.json");
const INVALID_SAMPLE_PATH = path.join(__dirname, "..", "..", "samples", "application.invalid.json");

async function portalReachable(): Promise<boolean> {
  try {
    const res = await fetch(MOCK_PORTAL_URL, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

test("mock portal integration (skips if portal is not running)", async (t) => {
  if (!(await portalReachable())) {
    t.skip(`Mock portal not reachable at ${MOCK_PORTAL_URL} — run "npm run portal:dev" first.`);
    return;
  }

  await t.test("valid sample: validates cleanly with a digest", async () => {
    const loaded = readApplicationFile(SAMPLE_PATH);
    const result = await validateApplication(loaded);
    assert.equal(result.ok, true, `expected no blocking issues, got: ${JSON.stringify(result.issues)}`);
    assert.equal(result.resolvedAttachments.length, 6);
    assert.ok(result.digest);
  });

  await t.test("invalid sample: missing required attachment is caught", async () => {
    const loaded = readApplicationFile(INVALID_SAMPLE_PATH);
    const result = await validateApplication(loaded);
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((i) => i.code === "missing_required_attachment" && i.fieldKey === "landtax"));
  });

  await t.test("readback genuinely detects a deliberate mismatch, not just a rubber stamp", async () => {
    const { page } = await browserManager.openForAutomatedDemo(MOCK_INCOME_CERT_FORM_URL, null, [originOf(MOCK_PORTAL_URL)]);
    try {
      await portalAdapter.waitForFormReady(page);
      await portalAdapter.fillStage1(page, { fullName: "Real Value On Page" });

      const correct = await readback.readField(page, "fullName", "Real Value On Page");
      assert.equal(correct.matched, true);

      const deliberatelyWrong = await readback.readField(page, "fullName", "A Value We Never Filled");
      assert.equal(deliberatelyWrong.matched, false);
      assert.equal(deliberatelyWrong.observed, "Real Value On Page");
    } finally {
      await browserManager.close();
    }
  });

  await t.test("pause/resume/stop state machine behaves as expected", async () => {
    await browserManager.openForAutomatedDemo(MOCK_INCOME_CERT_FORM_URL, null, [originOf(MOCK_PORTAL_URL)]);
    try {
      assert.equal(browserManager.currentState(), "open");

      browserManager.pause();
      assert.equal(browserManager.currentState(), "paused");
      let resolved = false;
      const waitPromise = browserManager.waitWhileNotRunnable().then((r) => { resolved = true; return r; });
      await new Promise((r) => setTimeout(r, 300));
      assert.equal(resolved, false, "waitWhileNotRunnable should still be blocked while paused");

      browserManager.resume();
      assert.equal(browserManager.currentState(), "open");
      const result = await waitPromise;
      assert.equal(result, "ready");

      browserManager.requestStop();
      assert.equal(browserManager.isStopRequested(), true);
      assert.equal(await browserManager.waitWhileNotRunnable(), "stopped");
    } finally {
      await browserManager.close();
    }
  });

  await t.test("full run against the live mock portal: fills, uploads, reads back, stops before submit", async () => {
    const loaded = readApplicationFile(SAMPLE_PATH);
    const validation = await validateApplication(loaded);
    assert.equal(validation.ok, true);

    const { page } = await browserManager.openForAutomatedDemo(MOCK_INCOME_CERT_FORM_URL, null, [originOf(MOCK_PORTAL_URL)]);
    try {
      const summary = await runDemo(page, {
        application: loaded.application,
        resolvedAttachments: validation.resolvedAttachments.map((a) => ({ fieldKey: a.fieldKey, absolutePath: a.absolutePath }))
      });

      assert.equal(summary.stoppedEarly, false);
      assert.equal(summary.fieldsMismatched, 0, `unexpected field mismatches: ${JSON.stringify(summary.unresolvedIssues)}`);
      assert.equal(summary.attachmentsMissing, 0);
      assert.equal(summary.attachmentsSelected, 6);
      assert.ok(summary.fieldsVerified > 0);
      assert.equal(summary.uploadsAcknowledged, 0, "this mock portal never uploads — only selects files client-side");
      assert.equal(summary.finalMessage, "Demonstration complete — form prepared, not submitted.");

      // Confirm we really are sitting on Stage 3, never having touched Submit.
      const url = page.url();
      assert.ok(url.startsWith(MOCK_PORTAL_URL));
      const submitButtonCount = await page.getByTestId("pay-submit").count();
      assert.equal(submitButtonCount, 1, "submit button should still be present and unclicked");
      assert.equal(await page.getByTestId("ack-number").count(), 0, "acknowledgement screen should never have been reached");
    } finally {
      await browserManager.close();
    }
  });
});
