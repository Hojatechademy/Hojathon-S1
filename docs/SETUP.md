# Setup Guide

Judges should be able to follow these instructions and run the project without needing to guess how it works.

---

## Prerequisites

* Python 3.10 or later
* pip
* Git
* Internet access (the agent calls the Google Gemini API)
* A free Google Gemini API key (see [API Keys / Configuration](#api-keys--configuration) below)

## Required Software & Versions

| Software | Version |
| -------- | ------- |
| Python   | 3.10+   |

No database or other services are required.

## Dependencies

All dependencies are listed in [`requirements.txt`](../requirements.txt):

```bash
pip install -r requirements.txt
```

This installs `google-genai` (Gemini SDK), `python-dotenv` (loads the API key from `.env`), and `streamlit` (only needed for the optional web UI).

## Environment Variables

| Variable | Description |
| -------- | ----------- |
| `GEMINI_API_KEY` | API key for the Google Gemini API, used to interpret free-text symptoms and decide follow-up questions. |

An [`.env.example`](../.env.example) file is provided at the repo root (no real secret values). Copy it to `.env` and fill in your own key — `.env` is already listed in `.gitignore` and must never be committed.

## API Keys / Configuration

This project uses the **Google Gemini API** (`google-genai` SDK) as its only external service. Get a free key from [Google AI Studio](https://aistudio.google.com/apikey) and place it in `.env` as `GEMINI_API_KEY=your_key_here`.

The free tier has a limited daily request quota per model. If you hit a `429 RESOURCE_EXHAUSTED` error while testing, run with `--mock` (CLI) or the "Use mock agent" checkbox (web UI) instead — this exercises the entire conversation loop, red-flag rules engine, and hospital routing with canned responses and zero API calls, which is how this project's own development and testing was done to conserve quota. `src/gemini_agent.py` currently targets `gemini-3.5-flash-lite`; if that model becomes unavailable, check `client.models.list()` for the current equivalent on your key.

Hospital ED notification and callback scheduling (`src/hospital_routing.py`) are **simulated** — no real hospital API is called. This is called out explicitly in the app's own summary output and code comments.

## Installation

```bash
git clone https://github.com/<your-username>/<your-fork>.git
cd Hojathon-S1
pip install -r requirements.txt
cp .env.example .env   # then add your GEMINI_API_KEY
```

## Running the Project

**CLI (terminal):**

```bash
python src/main.py
```

Describe your symptoms when prompted (try: *"I've had a headache since yesterday and I feel a bit dizzy."*), then answer each follow-up question as it's asked. The agent prints its reasoning live (facts extracted, each red-flag check, the question it decides to ask next) before producing a final summary. For an Emergency scenario that also exercises hospital routing, try: *"This is the worst headache of my life, it started suddenly and I feel dizzy."*

**Web UI (browser):**

```bash
streamlit run src/app.py
```

Opens a local page (usually `http://localhost:8501`) with the same flow: a text box for the initial description, one follow-up question at a time, the same reasoning trace rendered on the page, and Yes/No buttons instead of typed confirmation for hospital notification.

**Quota-free testing:** add `--mock` to the CLI command, or check "Use mock agent (no API calls)" in the web UI sidebar before starting, to run the full flow with canned LLM responses instead of real Gemini calls.

## Testing

There is no automated test suite. The project was verified manually and with ad-hoc scripts during development:

* The red-flag rules engine (`rules_engine.py`) was unit-tested directly (e.g. confirming a sudden+severe headache resolves to Emergency, a mild+gradual one to Self-care).
* The full conversation loop, scope check, and hospital routing (including both the "yes" and "no" confirmation branches) were run end-to-end in `--mock` mode, which requires no API key usage.
* The Streamlit UI was tested headlessly with Streamlit's `AppTest` utility, simulating the same interactions a judge would perform in a browser (typing the initial description, answering follow-ups, clicking Yes/No), for both mock and real Gemini responses.
* The full Emergency scenario (worst headache of life → hospital found → confirmed → ED notified → callback scheduled) was confirmed against the real Gemini API in both the CLI and the web UI.
