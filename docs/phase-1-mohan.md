# Phase 1 — Mohan's build notes

Written for: Mohan (main developer), as the owner-facing record of what Phase 1
actually does, exactly how to run/test/build it, and what is verified vs. not.

## What Phase 1 actually does right now (Milestone M1 complete, M2/M3 not started)

- A desktop window (Electron + React/TypeScript) with: service title, portal
  status ("Portal mapping pending" until a verified manifest is loaded),
  temporary government-URL/jurisdiction settings, browser dependency
  diagnostics, manual case field editor (driven by manifest fields once one
  exists — otherwise shows nothing rather than inventing fields), free-text
  notes, file attachment with sha256/decode checks, a review/validate/approve
  panel, and an activity log fed by real events from the main process.
- An "Open Government Website" button that launches a **separate, dedicated,
  temporary, headed Chromium browser** via Playwright and navigates to the
  URL you configure. This is completely separate from the Electron window —
  government pages are never loaded inside the app's own renderer.
- Human login handoff: you log in / solve OTP / CAPTCHA yourself in that
  browser window. The app never asks you to type a password or OTP into it.
  "I've finished — check page" reads back the current URL/title only (no
  credentials, no form contents) as a diagnostic. Pause/Resume/Close controls
  exist and are wired, though with no fill run active yet in M1 there is
  nothing for Pause to interrupt besides marking state.
- Approval snapshotting (`approveCase`) exists and is enforced by revision
  number and a digest over fields + file hashes + manifest version + approved
  action ids — but there is currently no manifest with `automation:"allowed"`
  actions for any real portal, so approval only becomes practically usable
  once Vijay's manifest lands.
- **Field filling and readback do not exist yet.** `src/main/browser/runner.ts`
  and `verify.ts` are typed placeholders that throw "not implemented" and are
  **not wired into any IPC channel or UI button**. This is deliberate —
  Milestone M2, gated on your checkpoint confirmation of M1 and on Vijay
  producing an observed manifest.

## Exact commands (Windows, PowerShell or Git Bash)

```
npm install
npm run playwright:install   # downloads the Chromium build Playwright drives
npm run typecheck            # tsc --noEmit for both main and renderer configs
npm test                     # Node's built-in test runner via tsx
npm run dev                  # hot-reload dev mode — opens the actual app window
npm run build                # production build (vite + tsc)
npm start                    # build then launch the packaged app
```

## Browser dependency path (this machine, as of this build)

Playwright resolved to version 1.63.0 (satisfies the `^1.47.0` recorded in
`package.json`/`package-lock.json` — caret ranges allow this). Chromium was
already present locally at:

```
C:\Users\mohan\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe
```

If `chromiumInstalled` shows false in the Portal panel, run
`npm run playwright:install` and restart the app. The diagnostics check is
`src/main/browser/manager.ts:getDiagnostics()` — it checks
`chromium.executablePath()` actually exists on disk before reporting success.

## Tests run vs. tests requiring local GUI execution

**Actually run and passing in this environment** (`npm run typecheck`, then
`npm test`):

- `tsc -p tsconfig.main.json --noEmit` — clean.
- `tsc -p tsconfig.json --noEmit` — clean.
- `npm run build` (vite build + tsc) — clean, produced `dist-renderer/` and
  `dist-electron/` with the expected file layout.
- 18 Node test-runner cases, all passing:
  - `tests/contracts.test.ts` — URL-pattern matching is full-string not
    substring (an execution-boundary property the browser origin/page-match
    logic depends on), origin extraction, HTTPS-only enforcement, and
    manifest-integrity rejection (dangling `nextPageId`, empty locator on an
    "observed" field, missing `stopBoundary`, duplicate field key).
  - `tests/digest.test.ts` — the approval digest changes on any field edit,
    file addition, manifest version change, or action-scope change, and is
    stable/order-independent otherwise. This is the core "edit invalidates
    approval" guarantee.
- Electron boot check: launched `electron.exe .` directly in this automated
  shell. It exited only with Chromium GPU-process/disk-cache messages typical
  of a non-interactive/no-GPU session (`cache_util_win.cc: Access is denied`,
  `GPU process exited unexpectedly`) — **no JavaScript exception, no IPC
  registration error, no CSP/preload error was thrown.** This confirms the
  code path executes cleanly up to window creation, but it is **not** visual
  confirmation that the window renders correctly, that the Portal Settings
  form works, or that "Open Government Website" actually opens a visible,
  usable Chromium window — that needs a real interactive desktop session.

**Not yet run — needs you, at a real interactive desktop:**

- `npm run dev` and visually confirm: window opens, portal status shows
  "Portal mapping pending", you can type a URL into Portal Settings and save
  it, "Open Government Website" opens a separate visible Chromium window at
  that URL, you can log in there, "I've finished — check page" shows a
  sensible url/title, Pause/Resume/Close behave as expected, and closing the
  browser window manually is reflected in the app's state.
- Nothing has been tested against any actual government portal. No field or
  action from any real portal is "observed" yet, because no manifest exists.

## Government pages/fields actually verified

None. `manifests/income_certificate.kerala.sample.json` is a structural
placeholder — every field is `verification:"unverified"`, `status:"draft"` —
included only to show Vijay the exact JSON shape. The app will not fill
anything from it (the M2 runner isn't wired in yet regardless).

**Blocker:** we do not yet have the real government income-certificate portal
URL/jurisdiction. Provide it and I will not guess or substitute a lookalike
site — the Open Government Website button will keep refusing until a
validated `https://` URL is configured in Portal Settings.

## Shared manifest version consumed

`schemaVersion: "1.0.0"` (see `src/shared/contracts.ts:PROTOCOL_VERSION`). Any
change to the `Case`/`PortalManifest`/`BrowserEvent` shapes must bump this and
be agreed with Vijay before either side changes their code against it.

## Data deletion and profile cleanup behaviour

- Cases and their notes/fields live as plain JSON files under Electron's
  `userData/cases/` (per-OS path via `app.getPath('userData')`), written
  atomically (temp file + rename) with `0o600`/`0o700` permissions where the
  OS supports it. **Not encrypted** — do not describe it as encrypted.
- Attached files are copied into `userData/files/` with random ids; the
  original picked path is never stored or reused after import. Deleting a
  case's file via the Files panel removes both the case record and the
  on-disk copy (`file-store.ts:deleteStoredFile`).
- The Playwright browser always launches into a fresh temporary profile
  directory under the OS temp folder (`serviceready-playwright-<runId>`),
  never the user's real Chrome/Edge profile, and never with exported cookies.
  That directory is deleted on `close()` and on app quit
  (`before-quit` in `src/main/index.ts` closes any active run first).
- No credentials, OTPs, or session cookies are ever written into case JSON or
  into `BrowserEvent` log messages — only URLs/titles/status strings.

## Phase 2 hooks (interfaces only — not implemented)

`src/main/phase2-hooks.ts` declares `extractIntoCase()`, `validateCase()`, and
`askForClarification()` as ambient function signatures with input/output
types. Nothing calls them; there is no OpenAI integration in this build.

## Explicitly out of scope for this build (per the brief)

No voice input, no certificates beyond income certificate, no unrestricted
browsing agent, no OpenAI/LLM integration, no OCR. `sandbox:true`,
`contextIsolation:true`, `nodeIntegration:false` are set on the renderer;
government content is never loaded into it.

---

## Checkpoint M1 — status and open questions for Mohan

**Confirm on your machine** (this environment could not show you a real
window):
1. `npm run dev` opens the desktop window without errors.
2. Portal Settings accepts a URL, "Open Government Website" opens a real,
   separate Chromium window at that URL, and you can log in there manually.
3. "I've finished — check page", Pause, Resume, and Close behave sensibly.

**Needed from you/Vijay before M2 can start for real:**
- The actual government income-certificate portal URL and jurisdiction.
- Vijay's first observed field mapping in the `PortalManifest` shape
  (`manifests/*.json`), even partial — the app will validate it and tell you
  exactly what's wrong if it doesn't conform.

I have not started M2 (approved-snapshot field filling) or M3 (recovery/
integration tests) — waiting on your M1 confirmation per the brief.
