# Hojathon Final Submission

## Team Information

**Team ID:** 77

**Team Name:** Mohammed Nihal

**Members:**

* Mohammed Nihal

## Project Information

**Project Name:** Symptom-to-Care Navigator

### Problem Statement

Figuring out how urgently a symptom needs care — and getting that context in front of a clinician efficiently — is a triage problem, not a form-filling problem. A static symptom-checker asks the same fixed questions to everyone and can't reason about which follow-up would actually rule a serious cause in or out. This calls for an agent that reads what's already been said, decides what to ask next, and checks answers against a real clinical decision table.

### Solution

An agent takes a patient's free-text symptom description and runs a loop with a clear division of labor: Gemini decides what single follow-up question is most useful to ask next (prioritizing red flags), a deterministic rules engine — not the LLM — checks accumulated facts against a red-flag table to decide the urgency tier, and once a tier is reached the agent acts: for Emergency/Urgent cases it looks up the nearest appropriate hospital, asks for confirmation, and simulates notifying the ED and scheduling a callback. Every reasoning step prints live, and the agent declines gracefully if the complaint is outside its current scope (headache/neurological).

### Key Features

* Dynamic, LLM-driven follow-up questioning (not a fixed form) that stops immediately once an emergency is confirmed
* Deterministic red-flag rules engine as the actual "tool" that decides urgency — not LLM judgment
* Hospital routing: selects the nearest appropriate real local hospital, asks for confirmation, then simulates ED notification and callback scheduling
* Doctor-ready structured pre-visit summary at the end of every run
* Scope check that declines out-of-scope complaints instead of forcing mismatched questions
* Terminal CLI and optional Streamlit web UI sharing one unmodified core, plus a `--mock` mode for testing with zero API calls

### Technology Stack

Python 3.10+ (no framework), Google Gemini (`gemini-3.5-flash-lite`) via `google-genai`, Streamlit (optional web UI), `python-dotenv`. No database.

### Demo

Run locally — see [Running the Project](../README.md#running-the-project) in the README (`python src/main.py` or `streamlit run src/app.py`). No hosted demo URL.

### Demo Video

_Add a link here if you record one before the deadline._

### Special Instructions for Judges

Requires a `GEMINI_API_KEY` in `.env` (see `.env.example` and `docs/SETUP.md`). The free tier has a tight daily quota — if you hit a `429` error, use `--mock` (CLI) or the "Use mock agent" sidebar checkbox (web UI) to run the full flow with canned responses instead. Hospital ED notification/callback are intentionally simulated, not a real integration.

---

## Submission Checklist

* [ ] Team information is complete
* [ ] Project information is complete
* [ ] Source code is included
* [ ] README is complete
* [ ] Setup instructions are included
* [ ] Running instructions are included
* [ ] Demo link is included
* [ ] Demo video is included
* [ ] No secrets/API keys/passwords are committed
* [ ] Project has been tested
* [ ] Final code has been pushed
