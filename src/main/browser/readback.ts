/**
 * Reads the portal's actual DOM back after filling and compares it to what
 * we intended to fill — never assumes a fill/select/setInputFiles call
 * succeeded just because it didn't throw.
 */
import type { Page } from "playwright";
import path from "node:path";

// Kept in sync with portal-adapter.ts's TESTID_OVERRIDES — the "Father/
// Mother/Spouse Name" field is keyed `fatherName` in our model but the
// portal's testid on that element is "f-guardian".
const TESTID_OVERRIDES: Record<string, string> = { fatherName: "guardian" };
function fieldTestId(key: string): string {
  return `f-${TESTID_OVERRIDES[key] ?? key}`;
}

export interface FieldReadback {
  fieldKey: string;
  expected: string;
  observed: string;
  matched: boolean;
}

export async function readField(page: Page, fieldKey: string, expected: string): Promise<FieldReadback> {
  const observed = await page.getByTestId(fieldTestId(fieldKey)).inputValue();
  return { fieldKey, expected, observed, matched: observed === expected };
}

export interface AttachmentReadback {
  fieldKey: string;
  expectedFileName: string;
  observedFileName: string | null;
  selected: boolean;
  /**
   * This portal stores selected files only as in-memory File objects — no
   * network request and no localStorage write happens on selection, and even
   * on final submit (which this software never performs) only the filename
   * string is persisted. So "uploaded" is always false here — it is not a
   * capability this mock portal has, not a failure of this software.
   */
  uploaded: false;
}

export async function readAttachment(page: Page, fieldKey: string, expectedAbsolutePath: string): Promise<AttachmentReadback> {
  const observedFileName = await page.getByTestId(`upload-${fieldKey}`).evaluate((el) => {
    const input = el as HTMLInputElement;
    return input.files && input.files.length > 0 ? input.files[0].name : null;
  });
  const expectedFileName = path.basename(expectedAbsolutePath);
  return { fieldKey, expectedFileName, observedFileName, selected: observedFileName === expectedFileName, uploaded: false };
}

export interface Stage3Summary {
  name: string;
  districtLine: string;
  purpose: string;
  totalIncomeText: string;
  docsText: string;
}

/**
 * Scrapes the Stage 3 "Verify Details" review table. There is no wrapping
 * data-testid around this panel, so rows are matched page-wide by their
 * label text — safe here because this SPA conditionally renders only one
 * stage's markup at a time (Stage 1/2's rows never coexist in the DOM), so
 * "Name"/"District"/etc. are unambiguous whenever this runs.
 */
export async function readStage3Summary(page: Page): Promise<Stage3Summary> {
  const rowText = async (label: string): Promise<string> => {
    const cell = page.locator("tr", { hasText: label }).locator("td").first();
    return ((await cell.textContent()) ?? "").trim();
  };
  return {
    name: await rowText("Name"),
    districtLine: await rowText("District"),
    purpose: await rowText("Purpose"),
    totalIncomeText: await rowText("Total Income"),
    docsText: await rowText("Docs")
  };
}
