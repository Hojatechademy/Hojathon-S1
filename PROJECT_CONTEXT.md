# StudyPilot Project Context

StudyPilot is an agentic AI study coach for students working toward a specific learning goal. The repository is the foundation for a 6-hour hackathon implementation.

## Current Repository

- `frontend/`: React + Vite application written in JavaScript.
- `backend/`: Python + FastAPI + Uvicorn service.
- `backend/main.py`: currently exposes the health endpoint `GET /health` -> `{"status":"ok"}`.
- `frontend/`: currently provides the frontend scaffold only.

## Selected Problem

Students often use static material and generic practice that cannot respond to their actual performance. StudyPilot should adapt preparation to the student's goal, answers, weak topics, available time, and progress.

## Planned Agent Workflow

1. Understand the student's study goal and identify missing information.
2. Create an initial study plan and identify relevant topics.
3. Generate and present a diagnostic quiz.
4. Evaluate the student's answers.
5. Identify weak topics and adapt the study plan.
6. Generate targeted practice for weak areas.
7. Persist relevant progress and recommend the next learning action.

## Planned Tools

- `get_topic_content`
- `generate_quiz`
- `evaluate_answer`
- `update_progress`
- `get_progress`
- `update_study_plan`

These are planned tools only. They are not implemented in the current documentation update.

## MVP Scope

Goal -> initial plan -> diagnostic quiz -> performance evaluation -> weak-topic identification -> adaptive plan -> targeted practice -> progress update. The demo must make the agent's decisions and tool use visible.

## Constraints and Explicit Non-Goals

- Keep the architecture simple for the 6-hour hackathon.
- Use one primary agent and a small number of reliable, deterministic tools.
- No database, authentication, multi-agent system, complex RAG, large external datasets, unnecessary integrations, or unnecessary external APIs.
- No MCP unless a concrete reason emerges later.
- No RAG unless it materially improves the MVP.
- No implementation of the agent, LLM integration, database, RAG, tools, or UI functionality in this documentation phase.
