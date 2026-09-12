from pydantic import BaseModel, Field


class QualityInput(BaseModel):
    crop: str
    grade: str = "A"
    visual_score: float = Field(default=0.85, ge=0, le=1)


def check_quality(data: QualityInput) -> dict:
    """
    Lightweight quality verification for the hackathon MVP.
    """

    score = round(data.visual_score, 2)

    if score >= 0.80:
        grade = "A"
        status = "verified"
    elif score >= 0.60:
        grade = "B"
        status = "verified"
    else:
        grade = "C"
        status = "manual_review"

    return {
        "crop": data.crop,
        "requested_grade": data.grade,
        "assessed_grade": grade,
        "quality_score": score,
        "status": status,
        "verified": status == "verified",
        "source": "Kisan Mitra Quality Engine",
    }
