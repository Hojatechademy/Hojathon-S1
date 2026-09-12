# AgriPilot

Three cooperating AI agents that help a smallholder farmer decide **what to plant**,
**diagnose a sick crop from a photo**, and **sell the harvest**.

Submitted to **Hojathon**, an agentic AI hackathon. Built in a 4-hour window.

---

## Team Information

**Team ID:** 12

**Team Name:** Agri-Corp

**Team Members:**

1. Almas CP

**Project Name:** AgriPilot

---

## Project Documentation

### Project Name

AgriPilot

### Team

Team 12, Agri-Corp. See [Team Information](#team-information) above.

### Problem Statement

A smallholder farmer in India makes three decisions that determine whether a season is
profitable, and has poor information for all three:

1. **What to sow, and whether to sow now.** Sowing a water-hungry crop into a dry
   fortnight is a season lost. Weather data exists, but it arrives as raw millimetres and
   degrees, not as an answer.
2. **What is wrong with a sick plant.** Misdiagnosis means spraying the wrong chemical:
   money spent, crop still failing.
3. **What the harvest is worth, and who will buy it.** Without a price reference, the
   farmer negotiates blind against a trader who knows the rate exactly.

**Why this needs an agent, not a script or a plain UI.** None of these are lookups. Each
one requires gathering data from several places, computing a comparison the farmer cannot
do in their head, forming a judgement, and then *acting on that judgement* by choosing
what to do next. A static dashboard could show "18mm of rain forecast". It cannot decide
that 18mm is only 7% of what rice needs over that window, conclude that this makes rice
the wrong crop right now, pick lower-water alternatives from what will actually grow
there, and then skip the seed-purchase suggestions because it just advised against
planting. Each of those steps depends on the outcome of the one before it. That chain is
the agent.

Equally, it is not a chatbot. A single prompt asking an LLM "should I plant rice in
Palakkad?" gets a plausible-sounding answer built on nothing. Every number this system
shows a farmer is computed from a real API response.

### Proposed Solution

Three agents, each following the same discipline:

> **Deterministic code gathers and computes. The model judges and explains.**

The model never produces a number that reaches the farmer. Rainfall totals, temperature
comparisons, lot valuations and vendor matches are all arithmetic over real API responses
and reference datasets. The model's job is the part code is bad at: weighing tradeoffs and
explaining a decision in language a farmer can act on.

That split is what makes the output trustworthy. A hallucinated rainfall figure would be
invisible to the farmer and potentially expensive. A hallucinated *opinion* is at least
checkable against the figures shown next to it.

### Key Features

* **Multi-step agentic reasoning.** Each agent runs a chain of dependent steps: fetch,
  compute, judge, then act on the judgement. The advisory agent's decision changes which
  vendors it suggests, and suppresses them entirely when it advises against planting.
* **Real data, not mocked weather.** A live 16-day forecast plus 30 days of history from
  Open-Meteo, pro-rated against each crop's water needs for the window being judged.
* **Vision-based crop diagnosis** from a photo, with treatment steps that carry a product,
  a rate and a frequency.
* **Calibrated honesty.** A healthy plant is reported healthy rather than given an invented
  disease. A blurry photo produces lower confidence and a note about the photo. An
  unreadable confidence value defaults to *low*, never *medium*, because a farmer may spend
  money spraying on this advice.
* **Explainability everywhere.** Every agent response carries a `reasoning` field citing
  the specific figures or visible signs behind it, and the UI renders them beside a panel
  showing the raw numbers used.
* **Human-in-the-loop by design.** "Propose order" and "Post to marketplace" both produce a
  summary for the farmer to act on. Neither takes a payment nor contacts anything outside
  the app, and both say so on screen.
* **Graceful degradation.** When the model is unreachable, the advisory and market agents
  fall back to rule-based output computed from the same real data, and label themselves as
  degraded rather than failing silently.
* **Accessibility as a requirement, not a polish step.** Targeting WCAG 2.2 AA for a user
  who may be reading a phone in bright sunlight, may have limited literacy, and may be
  older. Details below.

### Technology Stack

| Category | Technology                                                                     |
| -------- | ------------------------------------------------------------------------------ |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript                  |
| Backend  | Next.js Route Handlers (same project, no separate server)                        |
| Database | None by design. Reference data is static JSON; session state is React memory     |
| AI/ML    | OpenRouter — `anthropic/claude-sonnet-4.5` for reasoning, `google/gemini-2.5-flash` for vision |
| APIs     | Open-Meteo forecast API (no key required), browser Geolocation API               |
| Other    | Node.js 22, ESLint, custom Node scripts for pre-flight and end-to-end checks     |

Both model slugs were verified against OpenRouter's live model list rather than assumed,
and both are overridable by environment variable.

### How It Works

Three agents behind three API routes. Route handlers only validate input and map failures
to farmer-facing messages; the agent logic and prompts live in `src/lib/agents/` so they
are reviewable in one place.

#### Agent 1 — Advisory · `POST /api/advisory`

`{ lat, lon, crop }` → `{ decision, reasoning, riskFactors, forecastSummary, suggestedInputs, suggestedAlternatives, priceContext }`

```
location + crop
      ↓
[1] Open-Meteo: 16-day forecast + 30 days history          ← real external API
      ↓
[2] compute in code: rainfall vs the crop's pro-rated       ← arithmetic, not the model
    need, days outside its ideal temperature band
      ↓
[3] look up mandi price + trend for the crop                ← dataset
      ↓
[4] model judges: Plant / Plant with Caution / Don't Plant   ← the only model step
    and explains it, citing the figures it was given
      ↓
[5] act on the decision: match real vendor rows for seed,    ← branches on step 4
    fertilizer and equipment — and suggest nothing at all
    if the answer was Don't Plant
```

The crop's full-season rainfall requirement is scaled down to the 14-day decision window,
which is what makes *"8.6mm forecast against the 129.2mm rice wants, so 7% of its need"* a
meaningful statement rather than a vague one.

An irrigation-intensive crop facing short rainfall is flagged explicitly, and the model may
only recommend alternatives from a list of lower-water crops passed to it — it cannot
invent one that will not grow there.

**Real output**, rice in Palakkad, September 2026 — a live forecast, so the figures move
day to day:

> Rice is irrigation-intensive and the forecast rainfall of 81.8mm is only 63% of the
> 129.2mm this crop wants over the next 14 days, leaving a 47.4mm shortfall. The
> temperatures are perfect, staying between 22.1C and 32.4C which fits rice's 20-35C
> range, and market prices are trending upward at Rs 2160 per quintal. You will need
> reliable irrigation to bridge the rainfall gap throughout the 130-day growing season.

Verdict: *Plant with Caution*. Note what it did **not** do — it did not reject rice over a
37% shortfall, because temperatures were ideal and the crop is viable with irrigation. On a
drier fortnight the same figures push it to *Don't Plant*, and the purchase suggestions
disappear with it.

#### Agent 2 — Disease Detection · `POST /api/diagnose`

`{ imageBase64 }` → `{ isPlant, isHealthy, diagnosis, confidence, reasoning, imageQualityNote, treatment[] }`

The browser downscales the photo to a 1024px edge before upload, which keeps a 6MB phone
photo off a patchy rural connection and speeds up the call. The image is held in memory
for the request only — nothing is written to disk, there is no storage bucket, and the
error logger never touches the payload.

Three behaviours matter as much as being right:

* Treatment steps are stripped server-side when the plant is healthy, so nothing can
  suggest spraying a healthy crop.
* A poor photo yields an `imageQualityNote` and lower confidence instead of a confident
  guess.
* Confidence is shown to the farmer as words with a plain explanation, never a percentage,
  which would imply precision the model does not have.

**Real output** across six test photos: Early Blight, Late Blight, Apple Scab, Blossom End
Rot, Corn Ear Rot, and *incomplete kernel filling from poor pollination* — the last one
notable because it is a physiological problem, not a pathogen, and the agent did not force
a disease onto it.

#### Agent 3 — Market · `POST /api/market`

`{ crop, quantity, region }` → `{ listingTitle, listingDescription, listingHighlights, reasoning, priceGuidance, matchedBuyers }`

Pricing is arithmetic on the mandi reference rate; the model writes the sales copy and is
never asked for a price. With no price on record for a crop, no rate is quoted at all and
the listing invites offers instead.

Buyers who can actually take the farmer's lot rank first. A buyer whose minimum exceeds the
lot is shown flagged rather than hidden, so a farmer with 5 quintals can see the mill that
wants 100 and know to come back with more.

Posting adds the listing to an in-memory feed. Nothing leaves the app.

#### Accessibility

The intended user may be reading a phone in bright sun, may have limited literacy, and may
be older. Targeting WCAG 2.2 AA:

* Root font size is `112.5%` — a percentage, not a fixed pixel value, so it scales up from
  the user's own browser setting instead of overriding it. Controls are 56px tall, primary
  buttons 64px.
* Contrast was computed for every colour pair, text and non-text. Control boundaries use a
  separate, darker token from decorative card edges specifically to clear the 3:1 non-text
  contrast requirement.
* No decision relies on colour alone — heading text, icon shape and a word all carry the
  same verdict.
* `fieldset`/`legend` grouping, a label on every control, `aria-live` regions for async
  updates, `role="alert"` errors that take focus, and focus moved to results on arrival.
* Proper ARIA tablist with arrow key, Home and End navigation. Inactive panels leave the
  accessibility tree but stay mounted, so a half-filled form survives a tab switch.
* Skip link, `prefers-reduced-motion` and `forced-colors` support, and pinch zoom left at
  5x rather than capped.

Not verified: testing with a real screen reader. That needs manual testing with assistive
technology and review by someone with accessibility expertise.

#### Failure behaviour

LLM and network calls fail. The demo does not.

* **Advisory** falls back to a rule-based decision computed from the same weather figures,
  flagged `degraded` so the UI tells the farmer.
* **Market** falls back to a template listing built from the crop, quantity and mandi rate.
* **Diagnose** has no fallback, because you cannot diagnose a leaf without looking at it.
  It returns a plain-language failure instead.
* **Open-Meteo** calls retry up to three times with short backoff. A 4xx or an empty payload
  throws immediately, since neither fixes itself on a retry.
* Route handlers never return a raw exception, and `src/app/error.tsx` catches anything that
  escapes a component.

#### What is real and what is mocked

| Real                                      | Mocked                                    |
| ----------------------------------------- | ----------------------------------------- |
| Weather forecast and history (Open-Meteo) | Mandi prices (`data/mandi_prices.json`)   |
| LLM reasoning and vision (OpenRouter)     | Input vendors (`data/vendors.json`)       |
| Browser geolocation                       | Produce buyers (`data/buyers.json`)       |
| All arithmetic, matching and validation   | Crop requirements reference data          |

There is no database. Session state lives in React memory, so a refresh clears posted
listings. That is a deliberate MVP choice, not an oversight.

#### Repository layout

```
data/                    reference datasets: mandi prices, vendors, buyers, crop requirements
docs/                    setup, team and submission docs
scripts/                 pre-flight verifier and end-to-end smoke tests
src/app/api/{advisory,diagnose,market}/route.ts   input validation and error mapping
src/app/dev/preview/     dev-only gallery of every result state
src/lib/agents/          the three agents: prompts and orchestration
src/lib/                 data access, weather, OpenRouter client, image prep, districts
src/components/          UI, one file per screen or shared piece
test-images/             local test photos (git-ignored)
```

### Setup & Installation

Full detail is in [`docs/SETUP.md`](docs/SETUP.md). The short version:

```bash
git clone https://github.com/almas-cp/Hojathon-S1.git
cd Hojathon-S1
npm install
cp .env.example .env.local
```

Then open `.env.local` and paste an OpenRouter API key. Get one free at
<https://openrouter.ai/keys>. Open-Meteo needs no key.

```bash
npm run verify     # confirms the key, model slugs and both APIs actually work
```

Run this before anything else. It checks that Open-Meteo responds, that the configured
model slugs exist on OpenRouter, and that a text call and a vision call both succeed —
and tells you which of those failed rather than leaving you guessing.

### Running the Project

```bash
npm run dev        # http://localhost:3000
```

Three tabs, each one agent. A suggested run-through:

1. **Should I plant?** — allow location, or pick any of Kerala's 14 districts from the
   dropdown. Choose **Rice** and submit. Expect the rainfall shortfall quantified against
   what rice needs, and a purchase list with a working *Propose order* step. Then try a
   low-water crop such as **Chickpea** at the same district to see the decision and the
   suggested inputs change. The verdict depends on the live forecast, so it moves day to
   day — what stays constant is that the numbers behind it are shown to you.
2. **My plant looks sick** — upload a photo of a diseased leaf. Expect a named diagnosis,
   the visible signs it was based on, and numbered treatment steps with rates. Try a
   blurry or non-plant photo to see it decline to guess.
3. **I want to sell** — Wheat, 40 quintals, Punjab. Expect a wholesale listing, a lot
   valuation of about ₹91,000, and matched buyers. Post it to see the feed.

Model calls take roughly 5 to 10 seconds; every call shows a loading state.

**Testing** (dev server must be running):

```bash
npm run verify           # API keys, model slugs, live text + vision calls
npm run smoke            # all three agents end to end, 23 checks
npm run build            # production build + typecheck
npm run lint
```

`npm run smoke:diagnose` sends every photo in `test-images/` through the vision agent and
prints the results, so judges can try their own photos in bulk.

There is also a development-only gallery at `http://localhost:3000/dev/preview` rendering
every result state from fixtures — each advisory decision, a healthy plant, an unclear
photo, a non-plant, both degraded fallbacks, a crop with no price. It 404s in a production
build. It exists because those states are otherwise only reachable after a live model call
and several are awkward to trigger on demand.

---
---

# About Hojathon

*The sections below are from the Hojathon starter template and are kept for reference.*

Build agents that don't just respond — they act.

Hojathon is an agentic AI hackathon. Teams build systems that can reason, plan, call tools
or APIs, and carry out multi-step tasks on their own — not just chatbots that answer a
single prompt. The [official repository](https://github.com/Hojatechademy/Hojathon-S1) is
the starter and submission template: fork it, build your project inside your fork, and
submit your final work back through a Pull Request.

## Participant Rules

* Teams must contain **1–3 members**.
* Teams may use **any technology stack**.
* Teams should commit their work regularly.
* Do **not** commit passwords, API keys, tokens, or other secrets.
* The final state of the repository at the submission deadline will be considered for judging.
* The final Pull Request must be submitted before the official deadline.
* Participants are responsible for ensuring their project can be evaluated.

## GitHub Workflow

```
Official Hojathon Repository
        ↓
      Fork
        ↓
   Team's Fork
        ↓
  Build Project
        ↓
  Commit & Push
        ↓
 Complete README
        ↓
   Final PR
        ↓
   Organizers
        ↓
    Judges
```

Don't open a Pull Request for every change. Work normally inside your own fork, committing
and pushing as often as you like — only open a Pull Request to the official repository
when you're ready to make your **final submission**.

## Final Pull Request

When your project is ready, open a Pull Request from your fork's default branch into the
official Hojathon repository.

**PR title format:**

```
[TEAM-ID] Project Name
```

**The PR description must contain:** Team ID, team name, team members, project name,
problem statement, solution, technology stack, demo URL, demo video, and special
instructions for judges.

See [`docs/SUBMISSION.md`](docs/SUBMISSION.md) for the full submission checklist, and use
the [Pull Request template](.github/PULL_REQUEST_TEMPLATE.md) when you open your final PR.
