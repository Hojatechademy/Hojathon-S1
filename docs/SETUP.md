# Setup Guide

Setup and run instructions for **AgriPilot**.

If you only want the fastest path: install Node 22, `npm install`, put an OpenRouter key in
`.env.local`, run `npm run verify`, then `npm run dev`. The rest of this document explains
each step and how to tell what went wrong if something does not work.

---

## Prerequisites

* **Node.js 22 or newer** — check with `node --version`. The scripts use `--env-file`, which
  needs Node 20+, and were developed on 22.17.0.
* **npm 10 or newer** — ships with Node 22.
* **Internet access** — the project calls two external APIs at runtime and cannot work
  offline.
* **An OpenRouter API key** — free to create, see below.

No database, no Docker, no global installs.

## Required software & versions

| Software | Version                      |
| -------- | ---------------------------- |
| Node.js  | 22.x (developed on 22.17.0)  |
| npm      | 10+ (developed on 11.19.1)   |

Everything else is a project dependency and installs with `npm install`. For reference,
the main ones are Next.js 16.3.5, React 19.2.8 and Tailwind CSS v4.

## Installation

```bash
git clone https://github.com/almas-cp/Hojathon-S1.git
cd Hojathon-S1
npm install
```

## Environment variables

Copy the example file and fill in the one value that has no default:

```bash
cp .env.example .env.local
```

`.env.local` is git-ignored and must never be committed.

| Variable                  | Required | Description                                                     |
| ------------------------- | -------- | --------------------------------------------------------------- |
| `OPENROUTER_API_KEY`      | **Yes**  | Your OpenRouter key. Nothing model-driven works without it.     |
| `OPENROUTER_TEXT_MODEL`   | No       | Reasoning model. Defaults to `anthropic/claude-sonnet-4.5`.      |
| `OPENROUTER_VISION_MODEL` | No       | Vision model, must accept image input. Defaults to `google/gemini-2.5-flash`. |
| `OPENROUTER_SITE_URL`     | No       | Sent as an attribution header to OpenRouter.                     |
| `OPENROUTER_SITE_NAME`    | No       | Sent as an attribution header to OpenRouter.                     |

### One gotcha worth knowing

A shell environment variable **overrides** `.env.local`, even when it is empty. If
`npm run verify` reports the key as missing while it is clearly present in the file, check
for a stray shell variable:

```bash
# PowerShell
Remove-Item Env:OPENROUTER_API_KEY

# bash / zsh
unset OPENROUTER_API_KEY
```

The verifier prints this hint when the key looks absent, because it is easy to lose time to.

## API keys and configuration

| Service        | Key needed | How to get one                                                    |
| -------------- | ---------- | ----------------------------------------------------------------- |
| **OpenRouter** | Yes        | Sign up at <https://openrouter.ai>, create a key at <https://openrouter.ai/keys>. A small credit balance is enough; a full run of the test suite costs a few cents. |
| **Open-Meteo** | No         | Free and keyless for non-commercial use. Nothing to configure.     |

Both configured model slugs were verified against OpenRouter's live model list. If you
prefer different models, override them in `.env.local` — `npm run verify` will confirm the
slugs exist and that the vision model genuinely accepts images before you rely on them.

## Database setup

None. There is no database.

Reference data lives in static JSON under `data/`, and per-session state lives in React
memory, so a page refresh clears posted listings. This is a deliberate MVP choice.

## Verifying the setup

Run this before starting the app. It is the fastest way to find a configuration problem:

```bash
npm run verify
```

Six checks, each pass or fail independently so a failure points at one thing:

```
PASS  Open-Meteo forecast
PASS  Text model slug "anthropic/claude-sonnet-4.5"
PASS  Vision model slug "google/gemini-2.5-flash"
PASS  OPENROUTER_API_KEY present
PASS  OpenRouter text call
PASS  OpenRouter vision call
6/6 checks passed
```

The vision check sends a small generated green image and confirms the model reports the
colour, so it proves the model actually reads pixels rather than merely accepting the
request.

## Running the project

```bash
npm run dev
```

Open <http://localhost:3000>. There are three tabs, one per agent.

### Suggested run-through

**1. Should I plant?**

Allow the location prompt, or pick one of Kerala's 14 districts from the dropdown if you
would rather not share it — the dropdown is a full alternative, not a degraded path.
Choose **Rice** and submit.

Expect the rainfall shortfall quantified against what rice needs, temperatures compared to
its ideal band, and a purchase list with a working *Propose order* step. Then run a
low-water crop such as **Chickpea** at the same district for a contrasting decision.

The verdict depends on the live forecast and so changes day to day. If a run comes back
*Don't Plant*, the purchase suggestions should disappear and lower-water alternatives should
appear in their place — that branch is the agent acting on its own decision.

If your GPS fix is outside Kerala, the app keeps your real coordinates and fetches the
forecast for them, but says plainly that it cannot match you to a district rather than
snapping you to the nearest one hundreds of kilometres away.

**2. My plant looks sick**

Upload a photo of a diseased leaf. Expect a named diagnosis, the visible signs behind it,
and numbered treatment steps with products and rates.

Worth also trying: a blurry photo, a healthy leaf, and something that is not a plant. The
agent is built to say "I am not sure", "this looks healthy" and "this is not a plant"
rather than inventing a disease.

**3. I want to sell**

Wheat, 40 quintals, Punjab. Expect a wholesale listing, a lot valuation of about ₹91,000
computed from the mandi rate, matched buyers, and a posting step that adds it to an
in-memory feed.

Model calls take roughly 5 to 10 seconds. Every call shows a loading state.

### Result state gallery

```
http://localhost:3000/dev/preview
```

Renders every result state from fixtures: each advisory decision, a healthy plant, an
unclear photo, a non-plant, both degraded fallbacks, and a crop with no price on record.

Useful because those states are otherwise only reachable after a live model call, and
several are awkward to trigger deliberately. The route returns 404 in a production build.

## Testing

The dev server must be running for the smoke tests, since they exercise the real routes.

```bash
npm run verify            # setup and connectivity, 6 checks
npm run smoke             # all three agents end to end, 23 checks
npm run smoke:advisory    # or one agent at a time
npm run smoke:diagnose
npm run smoke:market
npm run build             # production build, includes a typecheck
npm run lint
```

The smoke tests assert behaviour rather than just status codes. Among the checks:

* the advisory `reasoning` must contain at least one digit, so it cites real figures
* market price guidance must be **exact arithmetic** on the mandi rate, not the model's
  numbers
* a crop with no price on record must produce **no rupee figure anywhere** in the generated
  copy
* a plant reported healthy must come back with **zero** treatment steps
* responses must not be the local fallback — without this, a missing API key silently
  passes every other check

To try your own photos, drop them into `test-images/` and run `npm run smoke:diagnose`. It
sends each one through the agent and prints the diagnosis. See
[`test-images/README.md`](../test-images/README.md) for suggestions on what makes a useful
test set. Those files are git-ignored.

## Troubleshooting

| Symptom                                          | Cause and fix                                                                                   |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `verify` says the key is missing but it is in `.env.local` | A shell variable is shadowing the file. See the gotcha above.                          |
| Advisory result shows a "could not reach our advisor" banner | The model call failed but the app degraded gracefully. Run `npm run verify` to find out why.  |
| "We could not get the weather forecast"          | Open-Meteo was unreachable. It already retries three times; check your connection and retry.     |
| Diagnose returns an error for every photo        | Almost always the API key or credit balance. `npm run verify` isolates it.                       |
| Smoke tests cannot connect                       | The dev server is not running, or is on a different port. Set `SMOKE_BASE_URL` to override.      |
