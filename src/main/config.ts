/**
 * MOCK_PORTAL_URL now defaults to the deployed Vercel production URL, not
 * localhost — per explicit instruction, the real demonstration run always
 * targets the hosted deployment. Override via env var if you ever need to
 * point at a local dev server instead (e.g. while Vijay is mid-change and
 * hasn't deployed yet): $env:MOCK_PORTAL_URL = "http://localhost:5175"
 */
export const MOCK_PORTAL_URL = process.env.MOCK_PORTAL_URL ?? "https://edistrict-kerala.vercel.app";

/**
 * The portal supports direct URL-param navigation to the income certificate
 * form (`?site=edistrict&page=form`), so automation goes straight there
 * instead of clicking through the landing page.
 */
export const MOCK_INCOME_CERT_FORM_URL = `${MOCK_PORTAL_URL}/?site=edistrict&page=form`;

/** When set (npm run demo:auto), the renderer loads the sample and starts the run automatically on launch. */
export const AUTO_RUN_DEMO = process.env.AUTO_RUN_DEMO === "1";

/**
 * Set for automated test runs (wired into package.json's test scripts via
 * cross-env) to strip out every bit of demo theater — hover, typing delay,
 * step pauses, slowMo, the real file-picker dialog, and document preview
 * tabs — so verification runs at raw Playwright speed with zero added
 * delay. The slow, human-watchable pacing below is exclusively for the real
 * demonstration run a person watches; it must never affect how fast
 * automated checks execute.
 */
export const FAST_MODE = process.env.DEMO_FAST_MODE === "1";

/**
 * Demo pacing, so a person watching the real run can actually see each
 * action happen instead of the whole form filling in a single frame.
 * Purely cosmetic — has no effect on what gets filled, verified, or
 * guarded. Forced to 0 under FAST_MODE regardless of env overrides.
 */
export const DEMO_TYPING_DELAY_MS = FAST_MODE ? 0 : Number(process.env.DEMO_TYPING_DELAY_MS ?? 200);
export const DEMO_STEP_PAUSE_MS = FAST_MODE ? 0 : Number(process.env.DEMO_STEP_PAUSE_MS ?? 400);
export const DEMO_SLOW_MO_MS = FAST_MODE ? 0 : Number(process.env.DEMO_SLOW_MO_MS ?? 150);
/** How long the real file-picker dialog stays visible on screen before it's auto-filled. */
export const DEMO_FILE_DIALOG_PAUSE_MS = FAST_MODE ? 0 : Number(process.env.DEMO_FILE_DIALOG_PAUSE_MS ?? 900);
/** How long each opened document-preview tab is given before automation moves on. */
export const DEMO_PREVIEW_PAUSE_MS = FAST_MODE ? 0 : Number(process.env.DEMO_PREVIEW_PAUSE_MS ?? 1800);
