# src/

Plain Python, no web framework in the core logic. A minimal Streamlit UI
(`app.py`) is available as an optional presentation layer on top of the same
core modules -- the CLI (`main.py`) is untouched and remains the working
fallback.

- `main.py` -- CLI entry point; runs the conversation loop and prints the
  agent's reasoning live.
- `app.py` -- Streamlit UI entry point; same conversation flow as `main.py`,
  rendered as a web page instead of the terminal. Does not change any core
  logic -- it calls the exact same functions as the CLI.
- `conversation.py` -- conversation manager: tracks known facts and Q&A
  history across turns.
- `gemini_agent.py` -- LLM layer: calls Gemini to extract facts from free
  text and to decide the next follow-up question.
- `mock_agent.py` -- canned stand-in for `gemini_agent.py` (same function
  signatures, no API calls), used with `--mock`.
- `scope_check.py` -- keyword-based check run right after the initial facts
  are extracted: stops gracefully if the complaint isn't headache/neurological,
  since the rules engine only covers that scope.
- `rules_engine.py` -- deterministic red-flag rules table (the agent's
  "tool"): maps patient facts to an urgency tier.
- `hospital_routing.py` -- for Urgent/Emergency tiers only: picks a nearby
  hospital and simulates notifying its ED and scheduling a callback (no LLM
  calls; local logic against a hardcoded hospital directory).
- `summary.py` -- formats the final doctor-ready pre-visit summary.

## Run

```bash
pip install -r ../requirements.txt
cp ../.env.example ../.env   # then add your GEMINI_API_KEY
python main.py
```

Use `python main.py --mock` to exercise the conversation loop, rules engine,
and hospital routing with canned responses instead of real Gemini calls (no
API quota used).

## Run the web UI

```bash
pip install -r ../requirements.txt
cp ../.env.example ../.env   # then add your GEMINI_API_KEY
streamlit run app.py
```

The sidebar has a "Use mock agent" checkbox (equivalent to the CLI's
`--mock`) for testing the UI without spending API quota; it locks once a
conversation has started.
