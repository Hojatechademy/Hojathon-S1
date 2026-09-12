from pydantic import BaseModel, Field


class BuyerSearchInput(BaseModel):
    crop: str
    quantity_kg: float = Field(gt=0)
    location: str


BUYERS = [
    {
        "buyer_id": "BUYER001",
        "name": "FreshMart Wholesale",
        "type": "Bulk Buyer",
        "location": "Thiruvananthapuram",
        "crop": "Tomato",
        "max_quantity_kg": 5000,
        "price_per_kg": 36,
    },
    {
        "buyer_id": "BUYER002",
        "name": "GreenBasket Retail",
        "type": "Retail Buyer",
        "location": "Kochi",
        "crop": "Tomato",
        "max_quantity_kg": 2000,
        "price_per_kg": 34,
    },
    {
        "buyer_id": "BUYER003",
        "name": "Local Food Processor",
        "type": "Processor",
        "location": "Kollam",
        "crop": "Tomato",
        "max_quantity_kg": 10000,
        "price_per_kg": 35,
    },
]


def find_buyers(data: BuyerSearchInput) -> dict:
    matches = [
        buyer
        for buyer in BUYERS
        if buyer["crop"].lower() == data.crop.lower()
        and buyer["max_quantity_kg"] >= data.quantity_kg
    ]

    matches.sort(
        key=lambda buyer: buyer["price_per_kg"],
        reverse=True,
    )

    return {
        "source": "Kisan Mitra Buyer Network",
        "crop": data.crop,
        "quantity_kg": data.quantity_kg,
        "farmer_location": data.location,
        "buyers": matches,
    }
