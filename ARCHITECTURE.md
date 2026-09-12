# StudyPilot Architecture

## Planned Flow

```text
Student
	↓
React Frontend
	↓
FastAPI Backend
	↓
Agent
	↓
Decision
	↓
Tool call
	↓
Tool result / observation
	↓
Agent evaluates result
	↓
Next decision
	↓
Progress memory
	↓
Response / next action
```

The student provides a learning goal, such as an exam topic and available study time. The frontend sends the request to the FastAPI backend. The primary agent interprets the goal, chooses the next decision, and may call a planned tool. It observes the result, evaluates it, and either makes another bounded decision or returns the next study action to the frontend.

## Existing Foundation

- Frontend: React application served by Vite.
- Backend: Python service using FastAPI and Uvicorn.
- Current backend behavior: a minimal health endpoint for service validation.

## Planned Tools

The primary agent may use `get_topic_content`, `generate_quiz`, `evaluate_answer`, `update_progress`, `get_progress`, and `update_study_plan`. These interfaces are planned and are not implemented yet.

## Agent Loop Boundaries

The agent loop must be explicitly bounded. Each request should have a maximum number of decisions or tool calls, and each tool call should have a clear input and output. When the bound is reached, the system should return the best available plan or next action with a clear status rather than continue indefinitely.

The design uses one primary agent. It does not require a multi-agent system, orchestration framework, MCP, or complex RAG for the MVP.

## Memory

Progress memory should retain only the relevant study plan, quiz results, weak topics, and recommended next action needed to continue the workflow. The exact persistence mechanism is intentionally deferred; the MVP should not introduce a database unless it becomes necessary.
