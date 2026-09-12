from pydantic import BaseModel


class NotificationInput(BaseModel):
    phone_number: str
    message: str
    channel: str = "whatsapp"


def send_notification(data: NotificationInput) -> dict:
    """
    Hackathon MVP notification tool.

    Production version can connect this interface to an actual
    WhatsApp Business/SMS provider.
    """

    if data.channel not in {"whatsapp", "sms"}:
        raise ValueError("Channel must be 'whatsapp' or 'sms'.")

    return {
        "status": "queued",
        "channel": data.channel,
        "phone_number": data.phone_number,
        "message": data.message,
        "provider": "Kisan Mitra Notification Service",
        "demo": True,
    }
