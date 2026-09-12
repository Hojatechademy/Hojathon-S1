/**
 * Concrete navigation and filling logic for the edistrict-kerala mock portal,
 * built against its actual DOM (verified live, not guessed). As of Vijay's
 * commit 487c4fd, the portal has its own `data-testid` hooks and direct
 * URL-param navigation to the form (`?site=edistrict&page=form`) — our
 * earlier `nav-apply-income` patch is obsolete and was dropped in favor of
 * his naming, so there is exactly one source of stable selectors, not two
 * competing ones. See docs/mock-portal-demo.md for the reconciliation notes.
 *
 * DELIBERATE OMISSION: there is no function here for Stage 3's
 * `data-testid="pay-submit"` button (`type="submit"`, "Pay Rs.15 & Generate
 * Acknowledgement"). That is the final-submission handler (writes to
 * localStorage, shows the acknowledgement screen) and this file must never
 * gain a way to click it, or `agree-terms`, — the guard is architectural,
 * not a runtime check. (Vijay's own separate tools.py Python/LangChain
 * script does click submit — that is his own standalone script in a
 * different language and process; it is not called by, or reachable from,
 * this application.)
 *
 * FAST_MODE: automated test runs set DEMO_FAST_MODE=1 (see config.ts),
 * which strips every bit of demo theater (hover, typing delay, step
 * pauses, the real file-picker dialog, document preview tabs) so
 * verification runs at raw Playwright speed. The slow, human-watchable
 * pacing is exclusively for the real demonstration a person watches.
 */
import type { Page, Locator } from "playwright";
import { MOCK_INCOME_CERT_FIELD_KEYS } from "../../shared/contracts";
import { FAST_MODE, DEMO_TYPING_DELAY_MS, DEMO_STEP_PAUSE_MS, DEMO_FILE_DIALOG_PAUSE_MS, DEMO_PREVIEW_PAUSE_MS } from "../config";

const SELECT_FIELD_KEYS = new Set(["gender", "relation", "district", "certLang", "purpose"]);
// <input type="date"> is a segmented native control — typing raw characters
// (including "-") via pressSequentially does not reliably set it the way it
// does a plain text input. fill() sets its value directly and is correct here.
const DATE_FIELD_KEYS = new Set(["dob"]);

// Our internal field key -> the portal's data-testid suffix. Identical for
// every field except one: the "Father/Mother/Spouse Name" input is keyed
// `fatherName` in our JSON/case model (matches the portal's own React state
// key) but Vijay's testid on that element is "f-guardian", not "f-fatherName".
const TESTID_OVERRIDES: Record<string, string> = { fatherName: "guardian" };

function fieldTestId(key: string): string {
  return `f-${TESTID_OVERRIDES[key] ?? key}`;
}

/** Waits for the form to be visible. Navigation itself happens via the URL (see config.ts MOCK_INCOME_CERT_FORM_URL). */
export async function waitForFormReady(page: Page): Promise<void> {
  await page.waitForSelector(`[data-testid="${fieldTestId("fullName")}"]`, { timeout: 15_000 });
}

/**
 * Fills Stage 1 in the field's natural on-screen order, skipping any key
 * with no supplied value.
 *
 * In demo mode, text/textarea fields are typed character-by-character
 * (`pressSequentially`) with a deliberate per-keystroke delay so a person
 * watching can actually see it happen, with a hover pause before every
 * interaction so the cursor visibly arrives before acting. In FAST_MODE
 * (tests), every field is set directly with no hover/pause/typing delay.
 */
export async function fillStage1(page: Page, fields: Record<string, string | undefined>): Promise<string[]> {
  const filledKeys: string[] = [];
  for (const key of MOCK_INCOME_CERT_FIELD_KEYS) {
    const value = fields[key];
    if (value === undefined || value === "") continue;

    const locator = page.getByTestId(fieldTestId(key));
    if ((await locator.count()) !== 1) {
      throw new Error(`Expected exactly one control for field "${key}" (testid "${fieldTestId(key)}"), found ${await locator.count()}.`);
    }

    if (SELECT_FIELD_KEYS.has(key)) {
      if (!FAST_MODE) {
        await locator.scrollIntoViewIfNeeded();
        await locator.hover();
        await page.waitForTimeout(DEMO_STEP_PAUSE_MS);
      }
      await locator.selectOption(value);
    } else if (DATE_FIELD_KEYS.has(key)) {
      if (!FAST_MODE) {
        await locator.scrollIntoViewIfNeeded();
        await locator.hover();
        await page.waitForTimeout(DEMO_STEP_PAUSE_MS);
      }
      await locator.fill(value);
    } else if (FAST_MODE) {
      await locator.fill(value);
    } else {
      await locator.scrollIntoViewIfNeeded();
      await locator.hover();
      await locator.click();
      await typeWithRetry(locator, value);
    }
    filledKeys.push(key);
  }
  return filledKeys;
}

/**
 * Types character-by-character and immediately verifies it actually landed,
 * retrying once (clear + retype) if not. This is resilience against a rare
 * dropped-keystroke race under load — not a correctness shortcut: if the
 * retry also fails to match, the mismatch still surfaces to the caller's own
 * readback later, and is reported as a real mismatch, not silently accepted.
 */
async function typeWithRetry(locator: Locator, value: string): Promise<void> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    await locator.fill(""); // start from empty so pressSequentially types the full intended value
    await locator.pressSequentially(value, { delay: DEMO_TYPING_DELAY_MS });
    if ((await locator.inputValue()) === value) return;
    if (attempt === 1) {
      await locator.click();
    }
  }
}

export async function goToStage2(page: Page): Promise<void> {
  const next = page.getByTestId("to-uploads");
  if (!FAST_MODE) {
    await next.hover();
    await page.waitForTimeout(DEMO_STEP_PAUSE_MS);
  }
  await next.click();
  await page.waitForSelector('[data-testid^="upload-"]', { timeout: 15_000 });
}

/**
 * Selects each attachment via its own file input. In demo mode this
 * actually triggers the browser's real, visible file-picker dialog
 * (Playwright's `filechooser` event fires when the input is clicked,
 * exactly like a human clicking "Choose File") rather than silently
 * injecting the path, holds it on screen briefly, then opens the selected
 * document in its own new tab (Chromium's built-in PDF/image viewer) and
 * leaves it open for inspection. In FAST_MODE, it's a single
 * `setInputFiles()` call with no dialog and no preview tab — selection
 * only either way, since this portal never uploads anywhere.
 */
export async function selectAttachments(page: Page, attachments: { fieldKey: string; absolutePath: string }[]): Promise<string[]> {
  const selectedKeys: string[] = [];
  for (const a of attachments) {
    const locator = page.getByTestId(`upload-${a.fieldKey}`);
    if ((await locator.count()) !== 1) {
      throw new Error(`Expected exactly one file input for "${a.fieldKey}" (testid "upload-${a.fieldKey}"), found ${await locator.count()}.`);
    }

    if (FAST_MODE) {
      await locator.setInputFiles(a.absolutePath);
    } else {
      await locator.scrollIntoViewIfNeeded();
      await locator.hover();
      const [fileChooser] = await Promise.all([page.waitForEvent("filechooser"), locator.click()]);
      await page.waitForTimeout(DEMO_FILE_DIALOG_PAUSE_MS); // let the real OS/browser dialog render before it's filled
      await fileChooser.setFiles(a.absolutePath);
      await page.waitForTimeout(DEMO_STEP_PAUSE_MS);
      await openPreviewTab(page, a.absolutePath);
    }
    selectedKeys.push(a.fieldKey);
  }
  return selectedKeys;
}

/** Opens the selected document in its own tab (Chromium's built-in viewer) and leaves it open. Demo mode only. */
async function openPreviewTab(mainPage: Page, absolutePath: string): Promise<void> {
  const fileUrl = "file:///" + absolutePath.replace(/\\/g, "/");
  const previewPage = await mainPage.context().newPage();
  await previewPage.goto(fileUrl, { waitUntil: "load", timeout: 15_000 }).catch(() => {
    // A preview failing to load is not fatal to the demonstration — the
    // attachment is still genuinely selected in the form either way.
  });
  await previewPage.waitForTimeout(DEMO_PREVIEW_PAUSE_MS);
  await mainPage.bringToFront(); // return focus to the form so automation continues on the right tab
}

export async function goToStage3(page: Page): Promise<void> {
  const next = page.getByTestId("to-payment");
  if (!FAST_MODE) {
    await next.hover();
    await page.waitForTimeout(DEMO_STEP_PAUSE_MS);
  }
  await next.click();
  // "paymode-UPI" (a Stage 3-only element) is a stable, unambiguous ready
  // signal — there is no wrapping testid around the whole review panel.
  await page.waitForSelector('[data-testid="paymode-UPI"]', { timeout: 15_000 });
}
