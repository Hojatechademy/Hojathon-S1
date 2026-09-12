from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.agent.orchestrator import KisanMitraAgent
from app.agent.tools.actions import ActionInput, execute_sale_action


app = FastAPI(
    title="Kisan Mitra",
    description="AI Agent for Agriculture & Local Economy",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


agent = KisanMitraAgent()


class AgentRequest(BaseModel):
    goal: str
    farmer_id: str | None = None


@app.get("/")
def root():
    return {
        "project": "Kisan Mitra",
        "status": "running",
        "message": "AI Agent backend is online",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }


@app.post("/agent/test")
def test_agent(request: AgentRequest):
    try:
        state = agent.create_initial_state(
            goal=request.goal,
            farmer_id=request.farmer_id,
        )

        state = agent.run(state)

        return {
            "goal": state.goal,
            "farmer_id": state.farmer_id,
            "plan": state.plan,
            "tool_call_requested": state.context.get(
                "tool_call_requested",
                False,
            ),
            "requested_tools": state.context.get(
                "requested_tools",
                [],
            ),
            "tool_results": state.tool_results,
            "recommendation": state.recommendation,
            "completed": state.completed,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@app.post("/action/approve")
def approve_sale(request: ActionInput):
    return execute_sale_action(request)
