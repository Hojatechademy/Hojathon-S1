# Submission Instructions

This document explains how to prepare and submit your final Hojathon project.

---

## Before Submission

Verify all of the following before opening your final Pull Request:

* [x] All source code is pushed
* [x] README is complete
* [x] Team information is complete
* [x] Problem statement is included
* [x] Solution is explained
* [x] Technology stack is documented
* [x] Setup instructions are included
* [x] Running instructions are included
* [ ] Demo link is included if applicable
* [ ] Demo video is included if applicable
* [ ] Screenshots are included if applicable
* [x] No API keys/passwords/secrets are committed
* [x] Project has been tested

---

## Final Submission

Once everything above is checked off, submit your project by opening a Pull Request from your team's fork into the official Hojathon repository.

**Steps:**

1. Push all final changes to your fork.
2. Open a new Pull Request targeting the official Hojathon repository's default branch.
3. Use the following PR title format:

   ```
   [TEAM-ID] Project Name
   ```

4. Fill in the PR description using the template below (also available as the default [Pull Request template](../.github/PULL_REQUEST_TEMPLATE.md) when you open a PR).

**Required PR description contents:**

```
Team ID: 12
Team Name: Agri Corp
Team Members: ALMAS CP
Project Name: Agri Pilot

Problem Statement:

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


Solution:
Proposed Solution

Three agents, each following the same discipline:

> **Deterministic code gathers and computes. The model judges and explains.**

The model never produces a number that reaches the farmer. Rainfall totals, temperature
comparisons, lot valuations and vendor matches are all arithmetic over real API responses
and reference datasets. The model's job is the part code is bad at: weighing tradeoffs and
explaining a decision in language a farmer can act on.

That split is what makes the output trustworthy. A hallucinated rainfall figure would be
invisible to the farmer and potentially expensive. A hallucinated *opinion* is at least
checkable against the figures shown next to it.

Technology Stack:
| Category | Technology                                                                     |
| -------- | ------------------------------------------------------------------------------ |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript                  |
| Backend  | Next.js Route Handlers (same project, no separate server)                        |
| Database | None by design. Reference data is static JSON; session state is React memory     |
| AI/ML    | OpenRouter — `anthropic/claude-sonnet-4.5` for reasoning, `google/gemini-2.5-flash` for vision |
| APIs     | Open-Meteo forecast API (no key required), browser Geolocation API               |
| Other    | Node.js 22, ESLint, custom Node scripts for pre-flight and end-to-end checks     |
Demo URL:

Demo Video:

Special Instructions for Judges:
```

---

**The final Pull Request must be submitted before the official submission deadline.**
