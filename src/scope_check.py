"""Lightweight scope check: this prototype's rules engine only covers
headache/dizziness/neurological red flags. Asking follow-up questions for an
unrelated complaint (e.g. stomach pain) would produce a nonsensical triage,
so we check up front with a simple keyword match rather than an extra LLM call.
"""

IN_SCOPE_KEYWORDS = [
    "headache", "head pain", "head ache", "migraine",
    "dizzy", "dizziness", "vertigo", "lightheaded", "light-headed",
    "head injury", "concussion", "neurological",
    "confusion", "blurred vision", "vision change", "double vision",
    "numbness", "weakness", "slurred", "stroke", "seizure",
]


def is_in_scope(symptom_summary, raw_text=""):
    combined = f"{symptom_summary} {raw_text}".lower()
    return any(keyword in combined for keyword in IN_SCOPE_KEYWORDS)
