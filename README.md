# ServiceReady Kerala — Phase 1

This repo now has two related but separate deliverables:

1. **Mock-portal income-certificate demonstration** (current, working) —
   JSON-driven, fills and reads back our own cloned `edistrict-kerala/` mock
   portal via a visible Playwright browser, stops before submission. See
   **[docs/mock-portal-demo.md](docs/mock-portal-demo.md)** for exact
   commands, what was inspected/patched, and test results.
2. **Real-government-portal track** (earlier milestone, on hold) — manual
   case entry against a not-yet-supplied real government URL, gated on
   Vijay's observed portal manifest. See
   [docs/phase-1-mohan.md](docs/phase-1-mohan.md).

Both share the same Electron + React/TypeScript + Playwright + zod app in
`src/`; the renderer (`src/renderer/App.tsx`) currently shows the mock-portal
demo UI. The dormant manual-entry components for track 2
(`CaseFieldsForm`, `FilesPanel`, `ReviewPanel`, `PortalPanel`) remain in
`src/renderer/components/` for when that track resumes.

## Ownership

- Mohan (main developer): `src/shared/contracts.ts`, `src/main/**`,
  `src/preload/**`, `src/renderer/**`, `tests/**`, `docs/`, `scripts/`, `samples/`.
- Vijay (portal research, track 2 only): `portal-research/`,
  `scripts/inspect-portal.*`, and manifest JSON files under `manifests/`.
- `edistrict-kerala/` is Vijay's cloned mock portal repo, with one minimal,
  documented `data-testid` patch applied (see docs/mock-portal-demo.md) — the
  app never fabricates or overwrites the rest of it.

## Quick start (mock-portal demo)

```powershell
npm install
npm run playwright:install
npm run portal:install
npm run portal:dev        # separate terminal, leave running on :5175
npm run demo:auto         # builds, launches, auto-loads sample, auto-runs
```

Full command reference, test results, and current limitations:
**[docs/mock-portal-demo.md](docs/mock-portal-demo.md)**

## Common commands

```
npm run dev              # hot-reload dev mode
npm run typecheck        # tsc --noEmit, main + preload + renderer
npm test                 # unit tests + live mock-portal integration tests
npm run build             # production build
npm run fixtures:generate # regenerate samples/ fixtures
```
