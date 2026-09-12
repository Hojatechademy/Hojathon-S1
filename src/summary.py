"""Formats the final doctor-ready pre-visit summary."""

CARE_LEVEL_TEXT = {
    "Emergency": "Seek emergency care immediately (call emergency services or go to the ER).",
    "Urgent": "Seek urgent care or contact your doctor today.",
    "Routine": "Schedule a routine appointment with your doctor in the next few days.",
    "Self-care": "Self-care at home; monitor symptoms and seek care if they worsen.",
}


HOSPITAL_NOTE = (
    "Note: hospital directory and ED notification are simulated for this demo "
    "using real local hospital data; the interface is designed to plug into a "
    "live hospital system API in production."
)


def generate_summary(symptom_summary, slots, qa_history, tier, matched_rule, include_hospital_note=False):
    lines = []
    lines.append("=" * 60)
    lines.append("PRE-VISIT SUMMARY")
    lines.append("=" * 60)
    lines.append(f"Presenting complaint: {symptom_summary}")
    lines.append("")

    lines.append("Questions asked and answers given:")
    if qa_history:
        for qa in qa_history:
            lines.append(f"  Q: {qa['question']}")
            lines.append(f"  A: {qa['answer']}")
    else:
        lines.append("  (none needed)")
    lines.append("")

    lines.append("Structured findings:")
    known = {k: v for k, v in slots.items() if v is not None}
    if known:
        for k, v in known.items():
            lines.append(f"  - {k}: {v}")
    else:
        lines.append("  (none recorded)")
    lines.append("")

    if matched_rule:
        lines.append(f"Suspected concern: {matched_rule['description']}")
    else:
        lines.append("Suspected concern: No specific red flag identified")
    lines.append(f"Urgency tier: {tier}")
    lines.append(f"Recommended care level: {CARE_LEVEL_TEXT[tier]}")
    if include_hospital_note:
        lines.append("")
        lines.append(HOSPITAL_NOTE)
    lines.append("=" * 60)
    return "\n".join(lines)
