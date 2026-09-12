from pydantic import BaseModel


class GIInput(BaseModel):
    crop: str
    claimed_region: str


def verify_gi(data: GIInput) -> dict:
    """
    Lightweight GI verification layer for the hackathon MVP.
    Final production version will connect to the official GI Registry.
    """

    return {
        "crop": data.crop,
        "claimed_region": data.claimed_region,
        "gi_status": "verification_pending",
        "verified": False,
        "source": "GI Registry / IP India",
        "message": (
            "GI claim captured. Official registry verification "
            "is required before treating the product as GI-authenticated."
        ),
    }
