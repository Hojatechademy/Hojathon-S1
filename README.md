# Farmer Assistant

Three cooperating AI agents that help a smallholder farmer decide **what to plant**,
**diagnose a sick crop from a photo**, and **sell the harvest**.

Built as a 4-hour hackathon MVP. The point it sets out to prove is that agents can
reason over real data and take multi-step action, rather than being a single-prompt
chatbot wearing a costume.

---

## Running it

```bash
npm install
cp .env.example .env.local        # then paste your OpenRouter key
npm run verify                    # pre-flight: weather API, model slugs, live LLM calls
npm run dev                       # http://localhost:3000
```

You need an [OpenRouter](https://openrouter.ai/keys) key. Open-Meteo needs no key.

`npm run verify` is worth running first. It checks the weather API responds, that the
configured model slugs actually exist on OpenRouter, and that both a text and a vision
call succeed. It tells you which of those failed rather than leaving you to guess.

---

## The three agents

Each one follows the same shape on purpose: **deterministic code gathers and computes,
the model judges and explains.** Numbers shown to the farmer are always arithmetic, so
the reasoning can never drift away from the data.

### 1. Advisory — `POST /api/advisory`

`{ lat, lon, crop }` → `{ decision, reasoning, riskFactors, forecastSummary, suggestedInputs, suggestedAlternatives, priceContext }`

1. Pulls a real 16-day forecast **and** 30 days of history from Open-Meteo
2. Reduces it in code to figures compared against the crop's water and temperature needs
3. Looks up the crop's mandi price trend
4. Hands only those figures to the model for a **Plant / Plant with Caution / Don't Plant** call
5. Matches real vendor rows to the decision for the suggested purchase list

Rainfall is pro-rated: a crop's full-season need is scaled down to the 14-day window
being judged, which is what makes "7% of what this crop wants" a meaningful statement.

An irrigation-intensive crop facing short rainfall is flagged explicitly, and the model
may only recommend alternatives from a list of lower-water crops it is given — it cannot
invent one.

### 2. Disease Detection — `POST /api/diagnose`

`{ imageBase64 }` → `{ isPlant, isHealthy, diagnosis, confidence, reasoning, imageQualityNote, treatment[] }`

The browser downscales the photo to a 1024px edge before upload, which keeps a 6MB phone
photo off a patchy rural connection and speeds up the model call. The image lives in
memory for the request only. Nothing is written to disk, and the error logger never
touches the payload.

Three behaviours matter as much as getting a diagnosis right:

- A healthy plant is reported as healthy. Treatment steps are stripped server-side when
  `isHealthy` is true, so nothing can suggest spraying a healthy crop.
- A poor photo produces an `imageQualityNote` and lower confidence instead of a confident
  guess.
- An unreadable confidence value from the model defaults to `low`, not `medium`. A farmer
  may spend money spraying based on this, so doubt is the safe direction.

Treatment steps carry a product, a rate and a frequency, because the system prompt names
"apply fungicide" as an unacceptable answer.

### 3. Market — `POST /api/market`

`{ crop, quantity, region }` → `{ listingTitle, listingDescription, listingHighlights, reasoning, priceGuidance, matchedBuyers }`

Pricing is arithmetic on the mandi reference rate. The model writes sales copy and is
never asked for a price. With no price on record for a crop, no rate is quoted at all.

Buyers who can actually take the farmer's lot rank first. A buyer whose minimum exceeds
the lot is shown flagged rather than hidden, so a farmer with 5 quintals can see the mill
that wants 100 and know to come back with more.

---

## Explainability

Every agent response carries a `reasoning` field that cites the specific numbers or
visible signs it was based on, and the UI renders them. The advisory screen also shows a
"the numbers we used" panel: the actual rainfall, temperature and price figures behind
the decision.

The smoke tests assert this rather than trusting it — `smoke:advisory` fails if the
reasoning contains no digits, and `smoke:market` fails if a rupee figure appears for a
crop with no price on record.

---

## Accessibility

The farmer this is for may be reading a phone in bright sun, may have limited literacy,
and may be older. Targeting WCAG 2.2 AA:

- Root font size is `112.5%`, a percentage rather than a fixed px value, so it scales up
  from the user's own browser setting instead of overriding it. Controls are 56px tall,
  primary buttons 64px.
- Contrast was computed for every colour pair, text and non-text. Control boundaries use
  a separate darker token from decorative card edges specifically to clear the 3:1
  non-text requirement.
- No decision relies on colour alone. Heading text, icon shape and a word all carry the
  same verdict.
- `fieldset` / `legend` grouping, a label on every control, `aria-live` regions for async
  updates, `role="alert"` errors that take focus, and focus moved to results on arrival.
- Proper ARIA tablist with arrow key, Home and End navigation. Inactive panels leave the
  accessibility tree but stay mounted, so a half-filled form survives a tab switch.
- Skip link, `prefers-reduced-motion` and `forced-colors` support, and pinch zoom left at
  5x rather than capped.
- Confidence is shown as words with a plain explanation, not a percentage, which would
  imply precision the model does not have.

Not verified: real screen reader testing with NVDA or VoiceOver. That needs manual
testing with assistive technology and review by someone with accessibility expertise.

---

## Testing

The dev server must be running for the smoke tests.

```bash
npm run verify           # API keys, model slugs, live text + vision calls
npm run smoke            # all three agents end to end
npm run smoke:advisory   # or one at a time
npm run smoke:diagnose
npm run smoke:market
npm run build            # production build + typecheck
npm run lint
```

`smoke:diagnose` sends every photo in `test-images/` through the agent and prints what
came back. Drop your own in there — see `test-images/README.md`, which suggests including
a blurry photo and a non-plant photo, since "I am not sure" and "that is not a plant" are
paths worth testing too.

### Result state gallery

`http://localhost:3000/dev/preview` renders every result state from fixtures: each
advisory decision, a healthy plant, an unclear photo, a non-plant, a degraded fallback, a
crop with no price. Development only; the route 404s in a production build.

This exists because result screens are otherwise only reachable after a live model call,
and several states are awkward to trigger on demand.

---

## Failure behaviour

LLM calls fail. The demo does not.

- **Advisory** falls back to a rule-based decision computed from the same weather figures,
  and marks itself `degraded` so the UI says so.
- **Market** falls back to a template listing built from the crop, quantity and mandi rate.
- **Diagnose** has no fallback, because you cannot diagnose a leaf without looking at it.
  It returns a plain-language failure instead.
- **Open-Meteo** calls retry up to three times with short backoff. A 4xx or an empty
  payload throws immediately, since neither fixes itself on a retry.
- Route handlers never return a raw exception. Every error path has farmer-facing copy,
  and `src/app/error.tsx` catches anything that escapes a component.

---

## Layout

```
data/                     mock datasets: mandi prices, vendors, buyers, crop requirements
scripts/                  verify + smoke test runners
src/app/api/{advisory,diagnose,market}/route.ts    validation and error mapping
src/app/dev/preview/      dev-only result state gallery
src/lib/agents/           the three agents: prompts and orchestration
src/lib/{data,weather,openrouter,image,districts}.ts
src/components/           UI, one file per screen or shared piece
test-images/              your local test photos (git-ignored)
```

Route handlers only validate input and map errors to farmer-facing messages. Agent logic
lives in `src/lib/agents/`, which keeps prompts reviewable in one place.

---

## What is real and what is mocked

| Real                                            | Mocked                                    |
| ----------------------------------------------- | ----------------------------------------- |
| Weather forecast and history (Open-Meteo)       | Mandi prices (`data/mandi_prices.json`)   |
| LLM reasoning and vision (OpenRouter)           | Vendors (`data/vendors.json`)             |
| Browser geolocation                             | Buyers (`data/buyers.json`)               |
| All arithmetic, matching and validation         | Crop requirements reference data          |

No database. Session state lives in React memory, so a refresh clears posted listings.
That is deliberate for an MVP.

"Propose order" and "Post to marketplace" both simulate a human-in-the-loop approval step.
Neither takes a payment nor contacts anything outside the app, and both say so on screen.

---

## Deliberately out of scope

Payments and checkout, posting to real external marketplaces, growth tracking over time,
ML model training, authentication, database persistence, voice interface, government
scheme lookup, SMS or offline fallback, and multi-language support.

Multi-language is the one that would matter most for real users and is the obvious first
roadmap item after this.
