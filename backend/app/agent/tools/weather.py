import requests


OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def get_weather(
    latitude: float,
    longitude: float,
) -> dict:
    """
    Get current weather and short-term forecast
    using Open-Meteo.
    """

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
        "hourly": "temperature_2m,precipitation_probability,precipitation",
        "forecast_days": 3,
        "timezone": "auto",
    }

    response = requests.get(
        OPEN_METEO_URL,
        params=params,
        timeout=10,
    )

    response.raise_for_status()

    data = response.json()

    return {
        "source": "Open-Meteo",
        "latitude": latitude,
        "longitude": longitude,
        "current": data.get("current", {}),
        "hourly": data.get("hourly", {}),
    }
