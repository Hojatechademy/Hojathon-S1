# Hojathon

## Team Information

Fill this in as soon as your team is formed.

**Team Name:ROOT CREW**

**Team Members:**

1. MOHAMMED NASIF T K
2. MOHAMMED SHAMIL M

**Project Name:**

Kisan Mitra

---

## Project Documentation

### Project Name

Kisan Mitra

### Team

To be completed by the team.

### Problem Statement

Small and marginal farmers often need to make selling decisions using fragmented information about mandi prices, weather, produce quality, buyers, profit, and transportation. Kisan Mitra helps bring these signals together into one practical recommendation. This calls for an agent because the recommendation requires a multi-step workflow: collecting live or fallback data, calling several decision tools, comparing selling options, estimating net realization, and producing an explanation with risks.

### Proposed Solution

Kisan Mitra is an agriculture and local-economy AI agent. A farmer submits a natural-language goal, such as asking how to sell a quantity of tomatoes in Kerala. The agent creates a plan, gathers market and weather evidence, evaluates quality and geographic indication information, searches direct buyers, calculates profit, optimizes logistics, and asks a local Ollama model to turn the evidence into one practical recommendation. A farmer can then approve a recommended sale, which creates a demo order and queues a notification payload.

### Key Features

- Natural-language farmer goal analysis through an agent workflow.
- Mandi price lookup through AGMARKNET/data.gov.in with a safe demo fallback when no API key is configured or the live request fails.
- Current weather and three-day forecast data from Open-Meteo.
- Market trend forecasting, produce quality grading, GI-region verification, direct buyer matching, profit calculation, and vehicle-route optimization.
- Evidence-based recommendation generated with a locally hosted Ollama model.
- Farmer-approved sale action with estimated order value and queued WhatsApp/SMS notification data.

### Technology Stack

Describe whatever stack you chose. None of the categories below are required — leave out or add rows as needed.

| Category | Technology                                                                      |
| -------- | ------------------------------------------------------------------------------- |
| Frontend | HTML, CSS, and vanilla JavaScript                                               |
| Backend  | Python, FastAPI, and Uvicorn                                                    |
| Database | None; the MVP uses in-memory request state and tool results                     |
| AI/ML    | Ollama with the `llama3.2:3b` model through the OpenAI-compatible API           |
| APIs     | AGMARKNET/data.gov.in and Open-Meteo                                            |
| Other    | Pydantic, OpenAI Python client, Requests, and OR-Tools-based route optimization |

### How It Works

1. The frontend sends a farmer goal and optional farmer ID to `POST /agent/test`.
2. The FastAPI backend creates an `AgentState` and the Kisan Mitra orchestrator validates the goal.
3. The orchestrator executes the decision workflow: AGMARKNET prices, Open-Meteo weather, market forecast, quality assessment, GI verification, direct buyer search, profit calculation, and logistics optimization.
4. Tool results are serialized as evidence and provided to Ollama. The model is instructed to use only that evidence, identify demo fallbacks, and report the selling option, expected price, costs, net realization, quality, trend, and risks.
5. The API returns the plan, requested tools, tool results, and recommendation. The frontend displays the main metrics and recommendation.
6. An approved sale can be submitted to `POST /action/approve`, which returns a demo order ID and a queued notification payload. No real payment, order fulfillment, or message is sent by this MVP.

### Setup & Installation

#### Prerequisites

- Python 3.10 or newer
- Ollama installed and running locally
- The Ollama `llama3.2:3b` model downloaded
- Internet access for Open-Meteo and optional AGMARKNET requests

From the project root, create and activate a virtual environment, then install the dependencies:

```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate
pip install -r requirements.txt
```

Start Ollama and download the model:

```bash
ollama serve
ollama pull llama3.2:3b
```

Optional configuration can be placed in a root `.env` file. `AGMARKNET_API_KEY` enables live mandi data from data.gov.in; without it, the project uses clearly labeled demo data. `OPENAI_API_KEY` is retained for compatibility, but the agent currently connects to Ollama at `http://localhost:11434/v1` with the local `ollama` key.

```env
AGMARKNET_API_KEY=your_data_gov_in_key
OPENAI_API_KEY=
```

The project does not require a database or migrations.

### Running the Project

Start the backend from the `backend` directory:

```bash
cd backend
uvicorn main:app --reload
```

Open `frontend/index.html` in a browser. Enter a farmer goal or use the example already shown, then select **Ask Kisan Mitra**. The frontend calls `http://127.0.0.1:8000/agent/test` and displays mandi, weather, forecast, quality, buyer, profit, and recommendation results. The backend API is also available at `http://127.0.0.1:8000/docs`.

The health check is available at `GET /health`. The sale approval endpoint expects a JSON body containing `farmer_id`, `buyer_id`, `buyer_name`, `crop`, `quantity_kg`, `price_per_kg`, and `phone_number`.

---
