import os
from pathlib import Path

import requests
from dotenv import load_dotenv
from pydantic import BaseModel, Field


PROJECT_ROOT = Path(__file__).resolve().parents[4]
load_dotenv(PROJECT_ROOT / ".env")


AGMARKNET_API_URL = (
    "https://api.data.gov.in/resource/"
    "9ef84268-d588-465a-a308-a864a43d0070"
)


class AgmarknetInput(BaseModel):
    state: str | None = None
    district: str | None = None
    market: str | None = None
    commodity: str | None = None
    variety: str | None = None
    grade: str | None = None
    limit: int = Field(default=10, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


DEMO_RECORDS = [
    {
        "state": "Keralam",
        "district": "Kozhikode(Calicut)",
        "market": "Mukkom Market",
        "commodity": "Tomato",
        "variety": "Tomato",
        "grade": "FAQ",
        "arrival_date": "12/09/2026",
        "min_price": 2800,
        "max_price": 3400,
        "modal_price": 3100,
    }
]


def _demo_data(state: str | None, commodity: str | None) -> dict:
    records = DEMO_RECORDS.copy()

    if state:
        records = [
            r for r in records
            if state.lower() in r["state"].lower()
        ]

    if commodity:
        records = [
            r for r in records
            if commodity.lower() == r["commodity"].lower()
        ]

    return {
        "source": "DEMO_FALLBACK",
        "total": len(records),
        "count": len(records),
        "records": records,
    }


def get_agmarknet_prices(
    state: str | None = None,
    district: str | None = None,
    market: str | None = None,
    commodity: str | None = None,
    variety: str | None = None,
    grade: str | None = None,
    limit: int = 10,
    offset: int = 0,
) -> dict:

    api_key = os.getenv("AGMARKNET_API_KEY")

    if not api_key:
        return _demo_data(state, commodity)

    params = {
        "api-key": api_key,
        "format": "json",
        "limit": limit,
        "offset": offset,
    }

    filters = {
        "filters[state.keyword]": state,
        "filters[district]": district,
        "filters[market]": market,
        "filters[commodity]": commodity,
        "filters[variety]": variety,
        "filters[grade]": grade,
    }

    for key, value in filters.items():
        if value:
            params[key] = value

    try:
        response = requests.get(
            AGMARKNET_API_URL,
            params=params,
            timeout=10,
        )

        response.raise_for_status()

        data = response.json()

        return {
            "source": "AGMARKNET / data.gov.in",
            "total": data.get("total", 0),
            "count": data.get("count", 0),
            "records": data.get("records", []),
        }

    except requests.RequestException as exc:
        fallback = _demo_data(state, commodity)
        fallback["live_api_error"] = str(exc)
        return fallback
