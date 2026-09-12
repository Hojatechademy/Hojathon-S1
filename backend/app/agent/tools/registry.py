from .actions import ActionInput, execute_sale_action
from .agmarknet import AgmarknetInput, get_agmarknet_prices
from .buyers import BuyerSearchInput, find_buyers
from .forecast import ForecastInput, forecast_market
from .gi import GIInput, verify_gi
from .logistics import LogisticsInput, optimize_route
from .notification import NotificationInput, send_notification
from .profit import ProfitInput, calculate_profit
from .quality import QualityInput, check_quality
from .weather import get_weather


TOOLS = {
    "calculate_profit": {
        "function": calculate_profit,
        "description": "Calculate revenue, costs, and net realization.",
        "input_model": ProfitInput,
    },
    "get_agmarknet_prices": {
        "function": get_agmarknet_prices,
        "description": "Get current mandi prices from AGMARKNET/data.gov.in.",
        "input_model": AgmarknetInput,
    },
    "get_weather": {
        "function": get_weather,
        "description": "Get current weather and short-term forecast.",
        "input_model": None,
    },
    "forecast_market": {
        "function": forecast_market,
        "description": "Estimate market price trend.",
        "input_model": ForecastInput,
    },
    "check_quality": {
        "function": check_quality,
        "description": "Assess produce quality and grade.",
        "input_model": QualityInput,
    },
    "verify_gi": {
        "function": verify_gi,
        "description": "Check a claimed GI product and region.",
        "input_model": GIInput,
    },
    "find_buyers": {
        "function": find_buyers,
        "description": "Find suitable direct buyers.",
        "input_model": BuyerSearchInput,
    },
    "optimize_route": {
        "function": optimize_route,
        "description": "Optimize delivery route using OR-Tools.",
        "input_model": LogisticsInput,
    },
    "send_notification": {
        "function": send_notification,
        "description": "Send a WhatsApp or SMS notification.",
        "input_model": NotificationInput,
    },
    "execute_sale_action": {
        "function": execute_sale_action,
        "description": "Execute a farmer-approved sale action and queue the buyer/notification workflow.",
        "input_model": ActionInput,
    },
}
