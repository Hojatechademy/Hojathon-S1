import json
import re

from openai import OpenAI

from .state import AgentState
from .tools.registry import TOOLS


class KisanMitraAgent:

    def __init__(self):
        self.client = OpenAI(
            base_url="http://localhost:11434/v1",
            api_key="ollama",
        )

    def create_initial_state(
        self,
        goal: str,
        farmer_id: str | None = None,
    ) -> AgentState:
        return AgentState(
            goal=goal,
            farmer_id=farmer_id,
        )

    def _extract_quantity(self, goal: str) -> float:
        match = re.search(
            r"(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)",
            goal.lower(),
        )
        return float(match.group(1)) if match else 1000.0

    def _extract_price(self, goal: str) -> float:
        match = re.search(
            r"(?:₹|rs\.?\s*)?(\d+(?:\.\d+)?)\s*(?:per\s*kg|/kg)",
            goal.lower(),
        )
        return float(match.group(1)) if match else 0.0

    def _run_tools(self, state: AgentState) -> dict:
        goal = state.goal.lower()

        quantity = self._extract_quantity(goal)
        stated_price = self._extract_price(goal)

        results = {}

        # -------------------------
        # MARKET / AGMARKNET
        # -------------------------
        results["get_agmarknet_prices"] = TOOLS[
            "get_agmarknet_prices"
        ]["function"](
            state="Keralam",
            commodity="Tomato",
            limit=5,
        )

        # -------------------------
        # WEATHER
        # -------------------------
        results["get_weather"] = TOOLS[
            "get_weather"
        ]["function"](
            latitude=8.5241,
            longitude=76.9366,
        )

        # -------------------------
        # MARKET FORECAST
        # -------------------------
        market_records = results[
            "get_agmarknet_prices"
        ].get("records", [])

        prices = [
            float(record["modal_price"])
            for record in market_records
            if record.get("modal_price") is not None
        ]

        current_price = (
            prices[0]
            if prices
            else stated_price or 31.0
        )

        forecast_input = TOOLS[
            "forecast_market"
        ]["input_model"](
            crop="Tomato",
            current_price=current_price,
            previous_prices=prices[1:],
        )

        results["forecast_market"] = TOOLS[
            "forecast_market"
        ]["function"](forecast_input)

        # -------------------------
        # QUALITY
        # -------------------------
        quality_input = TOOLS[
            "check_quality"
        ]["input_model"](
            crop="Tomato",
            grade="A",
            visual_score=0.85,
        )

        results["check_quality"] = TOOLS[
            "check_quality"
        ]["function"](quality_input)

        # -------------------------
        # GI
        # -------------------------
        gi_input = TOOLS[
            "verify_gi"
        ]["input_model"](
            crop="Tomato",
            claimed_region="Kerala",
        )

        results["verify_gi"] = TOOLS[
            "verify_gi"
        ]["function"](gi_input)

        # -------------------------
        # DIRECT BUYERS
        # -------------------------
        buyer_input = TOOLS[
            "find_buyers"
        ]["input_model"](
            crop="Tomato",
            quantity_kg=quantity,
            location="Kerala",
        )

        results["find_buyers"] = TOOLS[
            "find_buyers"
        ]["function"](buyer_input)

        buyers = results[
            "find_buyers"
        ].get("buyers", [])

        best_buyer_price = (
            buyers[0]["price_per_kg"]
            if buyers
            else current_price
        )

        # -------------------------
        # PROFIT
        # -------------------------
        selling_price = (
            stated_price
            if stated_price > 0
            else best_buyer_price
        )

        profit_input = TOOLS[
            "calculate_profit"
        ]["input_model"](
            quantity_kg=quantity,
            selling_price_per_kg=selling_price,
            transport_cost=3000,
            handling_cost=500,
            other_costs=500,
        )

        results["calculate_profit"] = TOOLS[
            "calculate_profit"
        ]["function"](profit_input)

        # -------------------------
        # LOGISTICS / OR-TOOLS
        # -------------------------
        logistics_input = TOOLS[
            "optimize_route"
        ]["input_model"](
            distances=[
                [0, 10, 20],
                [10, 0, 12],
                [20, 12, 0],
            ],
            demands=[0, 500, 500],
            vehicle_count=1,
            vehicle_capacity=1000,
        )

        results["optimize_route"] = TOOLS[
            "optimize_route"
        ]["function"](logistics_input)

        return results

    def run(self, state: AgentState) -> AgentState:

        if not state.goal.strip():
            raise ValueError("Agent goal cannot be empty.")

        # -------------------------
        # AGENT PLAN
        # -------------------------
        state.plan = [
            "understand_farmer_goal",
            "collect_market_data",
            "check_weather",
            "forecast_market",
            "check_quality",
            "verify_gi",
            "find_direct_buyers",
            "calculate_profit",
            "optimize_logistics",
            "generate_recommendation",
        ]

        # -------------------------
        # EXECUTE TOOLS
        # -------------------------
        results = self._run_tools(state)

        state.tool_results = results

        state.context["agent_mode"] = "agriculture_decision"
        state.context["tool_call_requested"] = True
        state.context["requested_tools"] = list(
            results.keys()
        )

        # -------------------------
        # PREPARE EVIDENCE
        # -------------------------
        evidence = json.dumps(
            results,
            indent=2,
            default=str,
        )

        messages = [
            {
                "role": "system",
                "content": (
                    "You are Kisan Mitra, an agriculture AI agent. "
                    "Use the provided tool results as the ONLY source "
                    "of factual data. Never invent prices, weather, "
                    "buyers, quality, GI status, profit, or logistics. "
                    "All monetary values are in Indian Rupees (₹). "
                    "Prices are per kilogram unless explicitly stated "
                    "otherwise. Revenue, cost, and profit are amounts "
                    "of money, never kilograms. "
                    "Never claim GI authentication when the GI status "
                    "is verification_pending. "
                    "Clearly say when data comes from a demo fallback. "
                    "Give one practical recommendation containing: "
                    "best selling option, reason, expected selling price, "
                    "estimated cost, expected net realization, "
                    "quality result, market trend, and important risks."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Farmer goal:\n{state.goal}\n\n"
                    f"Tool evidence:\n{evidence}\n\n"
                    "Analyze the evidence and provide the best "
                    "practical recommendation."
                ),
            },
        ]

        # -------------------------
        # FINAL AI REASONING
        # -------------------------
        response = self.client.chat.completions.create(
            model="llama3.2:3b",
            messages=messages,
        )

        state.recommendation = (
            response.choices[0].message.content
        )

        state.completed = True

        return state
