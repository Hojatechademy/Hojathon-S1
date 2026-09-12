import json
import os
from typing import Any


DEFAULT_OPENAI_MODEL = "gpt-4o-mini"


class LLMService:
    """Small, optional Responses API adapter with a safe deterministic fallback."""

    def __init__(self, client: Any = None, model: str | None = None):
        self.model = model or os.getenv("OPENAI_MODEL") or DEFAULT_OPENAI_MODEL
        self._client = client
        self.last_error: str | None = None

    @property
    def available(self) -> bool:
        return bool(os.getenv("OPENAI_API_KEY")) or self._client is not None

    def _client_or_create(self) -> Any:
        if self._client is not None:
            return self._client
        from openai import OpenAI

        self._client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        return self._client

    def generate_json(self, instruction: str, schema_name: str, schema: dict[str, Any]) -> dict[str, Any] | None:
        if not self.available:
            return None
        try:
            response = self._client_or_create().responses.create(
                model=self.model,
                input=[
                    {
                        "role": "system",
                        "content": "You are the StudyPilot educational planning layer. Return only the requested JSON. Be concise, practical, and subject-specific. Never reveal hidden reasoning.",
                    },
                    {"role": "user", "content": instruction},
                ],
                text={
                    "format": {
                        "type": "json_schema",
                        "name": schema_name,
                        "strict": True,
                        "schema": schema,
                    }
                },
            )
            return json.loads(response.output_text)
        except Exception as error:  # Provider failures must not take down the study workflow.
            self.last_error = type(error).__name__
            return None


llm_service = LLMService()