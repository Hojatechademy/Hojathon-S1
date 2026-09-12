from typing import Any
from pydantic import BaseModel, Field


class AgentState(BaseModel):
    goal: str
    farmer_id: str | None = None

    context: dict[str, Any] = Field(default_factory=dict)
    plan: list[str] = Field(default_factory=list)

    tool_results: dict[str, Any] = Field(default_factory=dict)

    recommendation: str | None = None

    requires_approval: bool = False
    completed: bool = False
