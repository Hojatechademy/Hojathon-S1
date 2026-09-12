from datetime import datetime

from pydantic import BaseModel


class ActionInput(BaseModel):
    farmer_id: str
    buyer_id: str
    buyer_name: str
    crop: str
    quantity_kg: float
    price_per_kg: float
    phone_number: str


def execute_sale_action(data: ActionInput) -> dict:
    order_id = f"KM-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    total_value = data.quantity_kg * data.price_per_kg

    message = (
        f"Kisan Mitra: Your {data.quantity_kg:.0f} kg of {data.crop} "
        f"has been matched with {data.buyer_name} at "
        f"₹{data.price_per_kg:.2f}/kg. "
        f"Estimated order value: ₹{total_value:,.2f}. "
        f"Order ID: {order_id}."
    )

    return {
        "status": "approved_and_queued",
        "order_id": order_id,
        "farmer_id": data.farmer_id,
        "buyer_id": data.buyer_id,
        "buyer_name": data.buyer_name,
        "crop": data.crop,
        "quantity_kg": data.quantity_kg,
        "price_per_kg": data.price_per_kg,
        "estimated_order_value": round(total_value, 2),
        "notification": {
            "channel": "whatsapp",
            "phone_number": data.phone_number,
            "message": message,
            "status": "queued",
        },
    }
