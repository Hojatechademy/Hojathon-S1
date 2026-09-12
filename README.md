# StudyPilot

StudyPilot is an agentic AI study coach for students preparing for an exam or learning a technical or academic subject. A student provides a goal, and the planned workflow creates an initial study plan, uses a diagnostic quiz to assess knowledge, identifies weak topics, adapts the plan, generates targeted practice, and tracks progress.

This is a focused 6-hour hackathon MVP. It uses one primary agent with a small number of planned tools, with decisions and tool use visible in the demo. The architecture intentionally stays simple: no multi-agent system, database, authentication, complex RAG, MCP, or unnecessary external integrations.

## Repository

- React + Vite frontend in `frontend/`
- Python + FastAPI backend in `backend/`
- Backend health check at `GET /health`

## Planned MVP

**Goal -> initial plan -> diagnostic quiz -> evaluate performance -> identify weak topics -> adapt plan -> targeted practice -> update progress**

The agent is planned to use tools for topic content, quiz generation, answer evaluation, progress retrieval and updates, and study-plan updates. These features are documented as the product direction and are not implemented yet.

## Run the Foundation

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Health Check

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{"status":"ok"}
```

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

## Run the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Health check

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{"status":"ok"}
```
