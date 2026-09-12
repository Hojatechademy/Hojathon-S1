# Project: AI Farmer Assistant — Agentic AI Hackathon (4-Hour Build)

## Overview

Build a web app called **"Farmer Assistant"** — an agentic AI system that helps farmers decide what to plant, diagnose crop diseases from photos, and get help selling their produce. This is a hackathon MVP: prioritize a working end-to-end demo over completeness. Mock any data source that isn't essential to demonstrate agentic reasoning.

The core theme to demonstrate: **agents that reason over real data and take multi-step action**, not a single-prompt chatbot. There are three cooperating agents, each with a clear input → reasoning → output flow.

---

## Tech Stack

- **Framework**: Next.js (App Router), React, Tailwind CSS — single project, frontend + API routes together
- **LLM Provider**: OpenRouter (use `OPENROUTER_API_KEY` from `.env.local`)
  - Text reasoning model: pick a fast, capable model available on OpenRouter (e.g. `anthropic/claude-sonnet-4.5` or similar — confirm exact model slug from OpenRouter's model list before hardcoding)
  - Vision model: MUST support image input — confirm the chosen model slug supports vision on OpenRouter before using it for the Disease Detection Agent
- **Weather API**: Open-Meteo (`https://api.open-meteo.com/v1/forecast`) — no API key required
- **Geolocation**: Browser's `navigator.geolocation.getCurrentPosition()`, with a manual district/lat-long dropdown fallback if permission is denied
- **Data storage**: No database. Use static JSON files in `/data` for mock datasets, and in-memory React state for session data. Do not persist anything server-side.
- **Image handling**: Client-side file input → convert to base64 → POST to API route → forward to OpenRouter vision model. Do not use any storage bucket; keep images in memory only for the request lifecycle.
- **Hosting**: Local dev only (`localhost:3000`). No deployment needed unless explicitly requested later.

---

## Mock Data Files (create these first, before any agent logic)

### `/data/mandi_prices.json`
Sample structure — populate with ~8-10 crops, plausible INR prices per quintal, 2-3 regions each:
```json
[
  { "crop": "Wheat", "region": "Punjab", "pricePerQuintal": 2250, "trend": "up" },
  { "crop": "Rice", "region": "Punjab", "pricePerQuintal": 2100, "trend": "stable" }
]
```

### `/data/vendors.json`
Sample structure — populate with ~10-15 entries across seeds, fertilizer, and equipment categories:
```json
[
  { "id": "v1", "name": "AgroSeed Co.", "category": "seeds", "product": "Wheat HD-3086 seeds", "pricePerKg": 45, "location": "Ludhiana" },
  { "id": "v2", "name": "GreenGrow Fertilizers", "category": "fertilizer", "product": "Urea 46%", "pricePerBag": 280, "location": "Ludhiana" }
]
```

### `/data/crop_requirements.json`
Basic reference data used by the Advisory Agent to reason about a crop's needs — include ~10 common crops with rough water requirement, ideal temp range, and typical growing duration in days:
```json
[
  { "crop": "Wheat", "waterNeed": "medium", "idealTempMinC": 10, "idealTempMaxC": 25, "growingDurationDays": 120 },
  { "crop": "Rice", "waterNeed": "high", "idealTempMinC": 20, "idealTempMaxC": 35, "growingDurationDays": 130 }
]
```

---

## Agent 1: Onboarding + Advisory Agent

### Flow
1. User enters/grants location (lat/long) and selects their main crop(s) from a dropdown, or types a new crop of interest
2. Backend fetches weather forecast (and if available, recent historical data) from Open-Meteo for that lat/long
3. Backend loads the crop's water/temp requirements from `crop_requirements.json`
4. Backend sends a structured prompt to the LLM combining: forecast data + crop requirements + (optionally) mock mandi price trend for that crop
5. LLM returns a structured decision: **Plant / Don't Plant / Plant with Caution**, plus a clear plain-language explanation citing the specific data points used (e.g. "Rainfall forecast is 40% below the crop's water needs for the next 30 days")
6. If recommending a crop, also suggest 2-3 relevant inputs (seeds, fertilizer, equipment) by matching against `vendors.json`, and display them as a "Suggested Purchase" list with a **"Propose Order" button** (do NOT actually process any payment — clicking it just shows a confirmation summary card, simulating a human-in-the-loop approval step)

### API Route
`POST /api/advisory`
- Input: `{ lat, lon, crop }`
- Output: `{ decision, reasoning, forecastSummary, suggestedInputs: [...] }`

### System Prompt Guidance (build this into the API route)
The LLM should be instructed to act as an agricultural advisory agent that:
- Only uses the data explicitly provided to it (forecast + crop requirements) — do not hallucinate additional data sources
- Always explains its reasoning in plain, farmer-friendly language, 2-4 sentences
- Returns a structured JSON response (decision, reasoning, riskFactors) that the frontend can render — use OpenRouter's JSON mode or explicit "respond only in JSON" instruction
- Flags explicitly if the crop is irrigation-intensive and rainfall forecast is low, recommending the farmer consider a less water-intensive alternative from `crop_requirements.json`

---

## Agent 2: Disease Detection Agent

### Flow
1. User uploads a photo of a plant/leaf via file input
2. Frontend converts image to base64, sends to backend
3. Backend sends the image + a diagnostic prompt to the vision-capable LLM via OpenRouter
4. LLM returns: likely disease/issue name, confidence level (qualitative: low/medium/high), and a short suggested treatment/action plan
5. Frontend displays this as a card with the image, diagnosis, and treatment steps

### API Route
`POST /api/diagnose`
- Input: `{ imageBase64 }`
- Output: `{ diagnosis, confidence, treatment, isHealthy }`

### System Prompt Guidance
Instruct the model to:
- Act as a plant pathology assistant analyzing crop leaf/plant images
- If the plant appears healthy, clearly state that rather than forcing a diagnosis
- Give a specific, actionable treatment suggestion (e.g. "Apply neem oil spray every 5 days" rather than vague advice)
- Note if the image quality/framing makes diagnosis uncertain, rather than guessing confidently

---

## Agent 3: Market / Sell Agent

### Flow
1. User indicates they have produce ready to sell (crop + approximate quantity)
2. Backend looks up current price data for that crop from `mandi_prices.json`
3. Backend sends this to the LLM to draft a short, appealing marketplace listing (title + description) suited for a B2B/wholesale audience
4. Frontend displays the drafted listing in a card with a **"Post to Marketplace" button** — clicking it does NOT call any real external API; it just adds the listing to an in-memory "Posted Listings" feed shown elsewhere in the UI, simulating the post
5. Optionally show 1-2 "matched vendor/buyer" suggestions from `vendors.json` or a similarly structured mock buyers file, to reinforce the "connects to buyers" concept

### API Route
`POST /api/market`
- Input: `{ crop, quantity, region }`
- Output: `{ listingTitle, listingDescription, priceGuidance, matchedBuyers: [...] }`

---

## Explainability (apply across ALL agents)

Every agent response must include a clear, human-readable "why" — this is a cheap addition that significantly increases perceived intelligence. Do not skip this even under time pressure. Each API response's `reasoning` field should reference the actual input data used (specific numbers, not generic statements).

---

## UI Structure

Single-page app with a simple tab or step-based flow:

1. **Onboarding screen** — location + crop selection → triggers Advisory Agent
2. **Advisory result screen** — decision card + reasoning + suggested inputs + "Propose Order" button
3. **Disease Detection screen** — photo upload + diagnosis result card
4. **Market screen** — crop/quantity input → drafted listing card + "Post to Marketplace" button → shows a running feed of "posted" listings below

Keep styling clean and minimal (Tailwind defaults are fine) — prioritize functional flow over visual polish given the time constraint. Use loading spinners/states on every API call since LLM responses take a few seconds.

---

## Explicitly OUT OF SCOPE for this build (do not implement, do not attempt)

- Real payment processing or checkout
- Real posting to external marketplaces or social media APIs
- Growth tracking over time / progress percentage (requires multiple sessions over time — not demoable in one sitting)
- ML model training or retraining of any kind
- User authentication / login system
- Database persistence
- Voice interface
- Government scheme/subsidy lookup
- SMS/offline fallback
- Multi-language support

If asked to build any of the above, politely decline and note it's out of scope for this MVP — suggest it as a "roadmap" item instead.

---

## Build Order (follow this sequence)

1. Scaffold Next.js app with Tailwind
2. Create the three JSON mock data files
3. Set up `.env.local` with `OPENROUTER_API_KEY`, verify one test call to OpenRouter succeeds
4. Verify one test call to Open-Meteo succeeds for a sample lat/long
5. Build Advisory Agent (API route + UI) end-to-end, test it fully
6. Build Disease Detection Agent (API route + UI) end-to-end, test it fully
7. Build Market Agent (API route + UI) end-to-end, test it fully
8. Wire all three into a single cohesive flow/navigation
9. Polish loading states and error handling (LLM calls can fail — always show a graceful fallback message, never a raw error to the user)
10. Do a full run-through as if demoing to judges before considering it done