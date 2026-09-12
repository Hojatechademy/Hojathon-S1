"""Hospital routing for Urgent/Emergency tiers.

Purely local, deterministic logic -- no LLM calls -- since hospital selection
and notification only run after the urgency tier has already been decided by
rules_engine.py. Routine/Self-care never reach this module.
"""

import random
import string

HOSPITALS = [
    {
        "name": "KIMS Al Shifa Super Speciality Hospital",
        "type": "Multi-specialty, ER-capable",
        "distance_km": 1.5,
        "phone": "04933-227616",
    },
    {
        "name": "Moulana Hospital",
        "type": "Multi-specialty",
        "distance_km": 1.0,
        "phone": "04933-227148",
    },
    {
        "name": "MES Medical College Hospital",
        "type": "Multi-specialty teaching hospital",
        "distance_km": 5.5,
        "phone": "04933-298300",
    },
]


def select_hospital(tier, hospitals=HOSPITALS):
    """Pick the most appropriate hospital for the given urgency tier.

    Emergency prefers ER-capable facilities (falling back to any facility if
    none are ER-capable); Urgent considers any facility. Both pick the
    nearest match by distance.
    """
    candidates = hospitals
    if tier == "Emergency":
        er_capable = [h for h in hospitals if "ER-capable" in h["type"]]
        candidates = er_capable or hospitals
    return min(candidates, key=lambda h: h["distance_km"])


def notify_ed(hospital, patient_summary):
    # SIMULATED -- represents a real hospital API integration in production.
    print(f"  [agent] Sending to {hospital['name']} ({hospital['phone']}): \"{patient_summary}\"")
    confirmation_id = "ED-" + "".join(random.choices(string.digits, k=4))
    eta_minutes = random.choice([5, 10, 15])
    print(
        f"  [agent] ED notified. Confirmation ID: {confirmation_id}, "
        f"estimated response time: {eta_minutes} min."
    )
    return confirmation_id, eta_minutes


def schedule_callback(hospital, urgency_tier):
    # SIMULATED -- represents a real hospital API integration in production.
    reference_id = "CB-" + "".join(random.choices(string.digits, k=4))
    print(
        f"  [agent] Callback scheduled: a care coordinator from {hospital['name']} "
        f"will contact you within 15 minutes. Reference ID: {reference_id}."
    )
    return reference_id
