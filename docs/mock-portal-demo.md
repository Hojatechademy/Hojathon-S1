# Mock-portal income-certificate demonstration

Written for: Mohan, as the record of what this build actually does, exact
commands, and what's verified vs. not.

## What this is

A JSON-driven demonstration: load a fictional income-certificate application
(generated fixtures, or your own JSON), validate it against the mock
portal's actual rules, then watch a separate, visible, dedicated Chromium
browser open the mock portal, navigate to the income-certificate form, fill
it, select the attachment files, read every value back, reach the Stage 3
review screen, and stop — never touching payment mode, the terms checkbox,
or the final Submit button.

This targets **our own cloned mock portal** (`edistrict-kerala/`), run
locally. It is not connected to any real government system and must never be
described as one.

## Exact commands (Windows PowerShell)

```powershell
# One-time setup
npm install                          # desktop app dependencies (root package-lock.json)
npm run playwright:install           # downloads the Chromium build Playwright drives
npm run portal:install               # mock portal's own dependencies (its own package-lock.json)

# Every session: start the mock portal first, in its own terminal
npm run portal:dev                   # http://localhost:5175 — leave this running

# In a second terminal: regenerate fixtures (optional — already committed)
npm run fixtures:generate

# Run the desktop app (hot reload)
npm run dev

# OR: build + launch, auto-loading the sample and starting the run immediately
npm run demo:auto

# Tests (unit tests always run; the live-portal integration tests
# auto-skip with a clear message if the portal isn't reachable)
npm test

# Production build (does not launch)
npm run build

# Switch to a hosted (e.g. Vercel) deployment instead of localhost
$env:MOCK_PORTAL_URL = "https://your-deployment.vercel.app"
npm run dev
```

There is no existing hosted deployment (no `vercel.json`, no env config found
in the cloned repo) — `MOCK_PORTAL_URL` defaults to
`http://localhost:5175` (`src/main/config.ts`). A `localhost` pass does not
imply a Vercel pass; if/when a hosted URL exists, re-run the integration test
suite against it (`$env:MOCK_PORTAL_URL="https://..."; npm test`) and expect
to re-verify the origin allow-list and the `data-testid` patch survived
deployment (it must be built from the patched source, not the original repo).

## What was inspected, and the patch applied

`edistrict-kerala` is a plain React + Vite SPA (no TypeScript, no router —
`App.jsx` switches between `home`/`form`/`track` via `useState`). The
income-certificate form (`IncomeForm.jsx`) is a 3-stage wizard; full field
list, validation rules, and document requirements are in
`src/shared/contracts.ts` under `MOCK_*`, transcribed directly from the
source (see the comment there for the exact files/lines).

Two problems made "never guess selectors" impossible without a patch:
1. Two buttons share the exact accessible name "Apply for Income
   Certificate" (a real ambiguity, confirmed live, not assumed).
2. No `<label>` in the form uses `htmlFor`/`id`, so `getByLabel()` cannot
   resolve any field, and generic text-matching would be fragile across ~20
   near-identical inputs.

Per your explicit instruction to patch minimally rather than guess or use
`nth()`/`first()`, I added `data-testid` to: one top-bar nav button
(`nav-apply-income`), every Stage 1 field, every Stage 2 file input and its
status cell, both stage-advance buttons, and the Stage 3 summary panel.
**No visual or behavioral change** — verified live before and after. Diff is
confined to `edistrict-kerala/src/components/TopBar.jsx` and
`IncomeForm.jsx`. If/when this portal is deployed to Vercel, that deployment
must be built from this patched source or the automation will fail to find
its selectors (a manifest problem, not a silent wrong click).

## Where automation stops, and why

Stage 3's `<button type="submit">Pay Rs.15 & Generate Acknowledgement</button>`
calls `submit()`, which writes to `localStorage.edistrict_apps` and swaps in
the acknowledgement/certificate view — this is the actual final-submission
handler. It is entirely client-side; there is no network request to
intercept. The guard is architectural: `src/main/browser/portal-adapter.ts`
has no function that can reach this button, and `form-runner.ts` never calls
one. Stage 1→2 and 2→3 ("Save & Next") cause **no** storage write and **no**
network request at all — confirmed by reading `submit()` vs. `next()` in
`IncomeForm.jsx` — so nothing is transmitted or persisted anywhere until the
one action this software will never take.

File selection in Stage 2 is held only as an in-memory `File` object; even
after a real submit, only the filename string would be saved. So this
software reports **attachments selected**, never **uploaded** — that's not a
missing capability of this build, it's what the mock portal actually does.

## Test results (actually executed, this session)

```
npm test
```
24/24 passing:
- 12 pure-logic unit tests (URL/origin matching, manifest integrity, digest invalidation) — unrelated to this task, from the earlier Phase 1 milestone, still green.
- `tests/integration/mock-portal.test.ts`, run against the **actually running** mock portal on `localhost:5175`:
  - valid sample validates cleanly and produces a digest
  - invalid sample's missing required attachment (`landtax`) is caught by name
  - readback genuinely distinguishes a correct value from a deliberately wrong expectation (not a rubber stamp)
  - pause blocks progress, resume releases it, stop is observed — a real state-machine test, not simulated
  - **a full live run**: opens the mock portal, clicks into the form, fills all Stage 1 fields, selects all 6 Stage 2 attachments, reads every value back with zero mismatches, reaches Stage 3, cross-checks the portal's own "Verify Details" summary table, and confirms the Submit button is still present and was never clicked

This test suite requires no Electron process — case-loader, file-validator,
browser-manager, portal-adapter, readback, and form-runner are all
Electron-free (only `demo-controller.ts` touches `electron.app`, for
packaged-resource path resolution), so they run directly under `tsx` against
the real portal.

**Also run**: `npm run fixtures:generate` — regenerated all 6 documents,
each verified to actually decode right after generation (PDF: reloaded with
`pdf-lib` and page-counted; PNG: real PNG chunk parsing + `zlib.inflateSync`
on the IDAT stream, in `src/shared/file-checks.ts`).

**Attempted, not fully confirmed**: launching the packaged Electron app with
`AUTO_RUN_DEMO=1` in this sandbox (no real display). No JavaScript exception
was thrown, and a fresh `serviceready-playwright-<runId>` temp profile
directory was created during the run — solid evidence the app really did
read the config, load the sample, validate it, and launch a real browser
context through the full IPC → main-process path, not just via the
standalone test. What I could **not** confirm here: that the window renders
correctly, or that the run visually reaches Stage 3 inside the real GUI.
That needs your machine.

**To confirm yourself:**
```powershell
npm run portal:dev      # separate terminal, leave running
npm run demo:auto       # builds, launches, auto-loads sample, auto-starts
```
Expected: the Electron window opens, and within a few seconds a separate
Chromium window opens showing the mock portal, clicks into the income
certificate form, fills it, selects files, and lands on the payment/review
screen with the "Final verification result" panel in the Electron window
showing all fields verified and 6 attachments selected, ending with
"Demonstration complete — form prepared, not submitted."

## Packaged-build resource resolution

`case-loader`'s attachment paths are always resolved relative to the JSON
file's own directory (`path.dirname`), never `process.cwd()`. The bundled
sample (`demo-controller.ts:defaultSamplePath()`) resolves via
`app.isPackaged` to `process.resourcesPath/samples/...` in a packaged build
vs. the repo's `samples/` folder in dev — **not yet tested as an actual
installer**; only `npm run dev` / `npm run demo:auto` (development-mode
Electron) have been exercised. Packaging (`electron-builder`, Playwright
executable bundling for an installed build) is out of scope for this pass
and would need `extraResources` config to carry `samples/` and `manifests/`
into the packaged app — flagging this now rather than claiming it works.

## Target: production (Vercel), not localhost

`MOCK_PORTAL_URL` now **defaults to the deployed Vercel URL**
(`https://edistrict-kerala.vercel.app`), confirmed live and serving the same
`data-testid`-patched source we test against. The real demonstration run —
`npm run dev`, `npm run demo:auto`, or clicking Start in the app — always
targets this unless you explicitly override it:

```powershell
$env:MOCK_PORTAL_URL = "http://localhost:5175"   # only if you need local instead
```

## Two speeds: slow for demos, raw speed for tests

`npm test` and `npm run test:portal` set `DEMO_FAST_MODE=1`, which strips
every bit of demo theater — hover, typing delay, step pauses, `slowMo`, the
real file-picker dialog, and document preview tabs — to zero, so
verification runs at raw Playwright speed. The full live-portal run dropped
from ~110s (demo pacing) to ~6s (fast mode) with this change; total suite
time dropped from ~130s to ~21s. The slow, human-watchable pacing below only
ever applies when `DEMO_FAST_MODE` is unset — i.e., the actual demonstration
a person watches, never a test run.

## Demo pacing (so it's actually watchable)

Text/textarea fields are now typed character-by-character
(`locator.pressSequentially`) with a configurable delay between keystrokes,
plus a small pause around dropdowns and file selections, plus `slowMo` on
the browser itself — so the automation visibly happens instead of finishing
in one frame. `<input type="date">` (`dob`) is filled directly, not
typed — native date inputs don't accept raw typed characters the same way a
text input does (confirmed: typing broke it, `.fill()` doesn't). All tunable
via env vars if you want it faster/slower:

```powershell
$env:DEMO_TYPING_DELAY_MS = "200"   # per-keystroke delay, default 200
$env:DEMO_STEP_PAUSE_MS   = "400"   # pause around dropdowns/file selects, default 400
$env:DEMO_SLOW_MO_MS      = "150"   # Playwright's own slow-motion on every action, default 150
npm run demo:auto
```

With defaults, the full Stage 1→3 run takes roughly 100–120 seconds instead
of under 10 — that's the point, so a person watching can follow what's
happening.

**File selection** now triggers the browser's real, visible file-picker
dialog (Playwright's `filechooser` event, fired by actually clicking the
file input — same as a human clicking "Choose File") instead of silently
injecting the path with `setInputFiles()`. The dialog is held on screen for
`DEMO_FILE_DIALOG_PAUSE_MS` (default 900ms) before being auto-filled.

**Document preview**: right after each attachment is selected, it's opened
in its own new browser tab (Chromium's built-in PDF/image viewer), held
visible for `DEMO_PREVIEW_PAUSE_MS` (default 1.8s), and then **left open** —
by the end of a run there are 7 tabs total (the form + one per document),
all still there for inspection, nothing auto-closes.

**Browser window**: launches maximized (`--start-maximized` + no fixed
Playwright viewport) rather than a small fixed-size window, so it's visible
on a shared screen/projector. This is maximized browser chrome, not true
OS-level fullscreen/kiosk mode — the address bar and tabs stay visible,
which matters for a live demo (kiosk mode risks trapping the window with no
visible way out).

## Reconciliation with Vijay's commit 487c4fd (2026-09-12)

Vijay's push added his own `data-testid` hooks (superseding my earlier
patch — dropped, nothing to push back), direct URL-param navigation to the
form (`?site=edistrict&page=form` — automation now goes straight there
instead of clicking through the landing page), a Vercel deployment
(`https://edistrict-kerala.vercel.app`, not yet the default —
`MOCK_PORTAL_URL` still defaults to localhost until you say to switch it),
and his own standalone `tools.py` (Python/LangChain, targets the Vercel URL,
**does** click the final submit button). That script is his own separate
process in a different language — it is not called by, or reachable from,
this desktop app; our own `portal-adapter.ts` still has no path to
`data-testid="pay-submit"` or `"agree-terms"`.

Our field-key → testid mapping is `f-${key}` for everything except one:
`fatherName` (our/portal's internal state key) maps to testid `f-guardian`
(Vijay's naming) — see `TESTID_OVERRIDES` in `portal-adapter.ts` and
`readback.ts`. Stage 2 uploads are `upload-${key}`, stage transitions are
`to-uploads`/`to-payment`. There's no wrapper testid around the Stage 3
review table, so `readStage3Summary()` matches table rows by label text
page-wide — safe because this SPA renders only one stage's markup at a time.

While reconciling, a genuine (rare) typing race turned up: under load, a
keystroke from `pressSequentially` occasionally didn't land before the
field's value was checked. Fixed with `typeWithRetry()` — verify immediately
after typing, retry once (clear + retype) if it didn't match, and only then
report a real mismatch if it still doesn't match. Full suite re-run clean
(24/24) after the fix.

## Whenever Vijay pushes UI/workflow changes to edistrict-kerala

1. `git -C edistrict-kerala pull`
2. `npm run portal:install` (in case dependencies changed)
3. In one terminal: `npm run portal:dev`
4. In another: `npm run test:portal` — runs only the mock-portal integration
   suite (fills the real form, selects real files, reads everything back)
   against whatever is now running on `:5175`.

If Vijay's edit touched `TopBar.jsx` or `IncomeForm.jsx` and dropped one of
the `data-testid` attributes, `test:portal` fails loudly with "Expected
exactly one control for field X, found 0" — not a silent wrong click. Re-add
the missing `data-testid` (see the list in "What was inspected, and the
patch applied" above) and re-run. If he changed a dropdown's option text, a
`district`/`purpose`/`gender` mismatch will show up as a blocking validation
issue or a `selectOption` failure naming the field — update the mirrored
`MOCK_DISTRICTS`/`MOCK_PURPOSES`/etc. lists in `src/shared/contracts.ts` to
match his new source and re-run.

## Remaining blockers / not done

- No hosted mock-portal URL exists yet — only localhost verified.
- Packaged installer (electron-builder config, Playwright browser bundling for a distributed build) not built or tested.
- GUI visual confirmation of the Electron window itself (vs. the underlying automation, which is fully tested) needs your machine — no display in this environment.
- "members" (dynamic family-member rows in Stage 1) is explicitly out of Phase 1 scope — optional, unvalidated by the portal itself, not automated here.
