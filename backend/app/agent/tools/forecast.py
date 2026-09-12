from pydantic import BaseModel, Field


class ForecastInput(BaseModel):
    crop: str
    current_price: float = Field(ge=0)
    previous_prices: list[float] = Field(default_factory=list)


def forecast_market(data: ForecastInput) -> dict:
    """
    Lightweight market trend estimator for the MVP.

    Uses recent prices to estimate whether the market is
    trending upward, downward, or remaining stable.
    """

    prices = data.previous_prices + [data.current_price]

    if len(prices) < 2:
        return {
            "crop": data.crop,
            "trend": "stable",
            "predicted_price": round(data.current_price, 2),
            "confidence": 0.50,
            "source": "Kisan Mitra MVP Forecast",
        }

    previous_average = sum(prices[:-1]) / len(prices[:-1])
    change = data.current_price - previous_average

    if previous_average == 0:
        percentage_change = 0
    else:
        percentage_change = (change / previous_average) * 100

    if percentage_change > 5:
        trend = "rising"
        predicted_price = data.current_price * 1.05
    elif percentage_change < -5:
        trend = "falling"
        predicted_price = data.current_price * 0.95
    else:
        trend = "stable"
        predicted_price = data.current_price

    return {
        "crop": data.crop,
        "trend": trend,
        "current_price": round(data.current_price, 2),
        "predicted_price": round(predicted_price, 2),
        "percentage_change": round(percentage_change, 2),
        "confidence": 0.70,
        "source": "Kisan Mitra MVP Forecast",
    }
