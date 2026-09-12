"""
SahayAI - Mock Kerala ID Card & Ration Card Image Generator
Generates realistic Aadhaar and Smart Ration Card images with PIL for multimodal testing.
"""

import io
from PIL import Image, ImageDraw, ImageFont


def generate_mock_id_card(
    name: str = "Raghavan Nair",
    card_type: str = "Aadhaar Card",
    dob: str = "14/08/1978",
    gender: str = "Male",
    masked_id: str = "XXXX-XXXX-8924",
    district: str = "Wayanad",
    state: str = "Kerala"
) -> Image.Image:
    """
    Creates an official-looking ID card graphic for Gemini 1.5 Flash Vision evaluation.
    """
    width, height = 650, 400
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Top border / Tricolor bar
    draw.rectangle([(0, 0), (width, 10)], fill=(255, 153, 51))  # Saffron
    draw.rectangle([(0, 10), (width, 20)], fill=(255, 255, 255)) # White
    draw.rectangle([(0, 20), (width, 30)], fill=(19, 136, 8))   # Green

    # Header Card Background
    draw.rectangle([(0, 30), (width, 80)], fill=(240, 245, 250))
    draw.rectangle([(0, 0), (width - 1, height - 1)], outline=(18, 53, 91), width=3)

    # Header Text
    draw.text((30, 38), "GOVERNMENT OF INDIA / KERALA STATE", fill=(18, 53, 91))
    draw.text((30, 56), f"Unique Identification Authority / {card_type.upper()}", fill=(70, 70, 70))

    # Photo Box
    draw.rectangle([(35, 110), (165, 260)], fill=(230, 235, 245), outline=(100, 100, 100), width=2)
    # Silhouette
    draw.ellipse([(70, 130), (130, 185)], fill=(140, 160, 190))
    draw.chord([(50, 195), (150, 270)], 180, 360, fill=(140, 160, 190))
    draw.text((75, 265), "[PHOTO]", fill=(90, 90, 90))

    # Text details
    x_text = 190
    draw.text((x_text, 115), f"Name: {name}", fill=(10, 10, 10))
    draw.text((x_text, 145), f"DOB / Age: {dob}", fill=(40, 40, 40))
    draw.text((x_text, 175), f"Gender: {gender}", fill=(40, 40, 40))
    draw.text((x_text, 205), f"State / District: {district}, {state}", fill=(40, 40, 40))
    draw.text((x_text, 235), "Status: Verified Citizen (അക്ഷയ സാക്ഷ്യപ്പെടുത്തിയത്)", fill=(20, 120, 40))

    # QR Code Placeholder
    draw.rectangle([(510, 110), (610, 210)], fill=(245, 245, 245), outline=(0, 0, 0), width=2)
    for i in range(120, 200, 15):
        draw.line([(520, i), (600, i)], fill=(0, 0, 0), width=3)
    draw.text((525, 215), "SECURE QR", fill=(60, 60, 60))

    # ID Number Highlight Bottom Box
    draw.rectangle([(20, 300), (width - 20, 365)], fill=(235, 242, 250), outline=(18, 53, 91), width=1)
    draw.text((width // 2 - 110, 325), masked_id, fill=(18, 53, 91))

    # Footer note
    draw.text(( width // 2 - 170, 375), "Mera Aadhaar, Meri Pehchan | Kerala Sevana e-KYC Enabled", fill=(100, 100, 100))

    return img


def get_mock_id_bytes(persona_id: str = "persona_farmer_raghavan") -> bytes:
    """Returns PNG bytes of mock ID card tailored to the persona."""
    if "bindu" in persona_id:
        img = generate_mock_id_card(
            name="Bindu Suresh",
            card_type="Kerala Smart Ration Card / Aadhaar",
            dob="21/04/1990",
            gender="Female",
            masked_id="XXXX-XXXX-4512",
            district="Ernakulam"
        )
    elif "anjali" in persona_id:
        img = generate_mock_id_card(
            name="Anjali Pradeep",
            card_type="Aadhaar Student ID",
            dob="12/06/2010",
            gender="Female",
            masked_id="XXXX-XXXX-7721",
            district="Alappuzha"
        )
    elif "gopalan" in persona_id:
        img = generate_mock_id_card(
            name="Gopalan K",
            card_type="Kerala Sevana Pension ID / Aadhaar",
            dob="05/11/1958",
            gender="Male",
            masked_id="XXXX-XXXX-1934",
            district="Thrissur"
        )
    else:
        img = generate_mock_id_card(
            name="Raghavan Nair",
            card_type="Aadhaar Card",
            dob="14/08/1978",
            gender="Male",
            masked_id="XXXX-XXXX-8924",
            district="Wayanad"
        )

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
