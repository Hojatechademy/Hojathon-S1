"""Deterministic red-flag rules engine.

This is the agent's "tool": urgency is decided by checking patient-reported
facts against a fixed table, not by LLM judgment. The LLM only decides what
question to ask and extracts facts from free text; this module is what
actually turns those facts into a triage decision.
"""

SLOTS = {
    "onset": {
        "type": "enum",
        "options": ["sudden", "gradual"],
        "question_hint": "Was the onset sudden (like a thunderclap) or gradual?",
    },
    "severity": {
        "type": "enum",
        "options": ["mild", "moderate", "severe"],
        "question_hint": "How severe is the pain: mild, moderate, or severe?",
    },
    "vision_changes": {
        "type": "bool",
        "question_hint": "Any vision changes, such as blurred or double vision?",
    },
    "fever": {
        "type": "bool",
        "question_hint": "Any fever?",
    },
    "head_injury": {
        "type": "bool",
        "question_hint": "Any recent head injury or trauma?",
    },
    "worst_headache_of_life": {
        "type": "bool",
        "question_hint": "Is this the worst headache of your life?",
    },
    "neck_stiffness": {
        "type": "bool",
        "question_hint": "Any neck stiffness?",
    },
    "confusion": {
        "type": "bool",
        "question_hint": "Any confusion, slurred speech, or weakness on one side?",
    },
}

# Checked in order; the first matching rule wins, so more severe rules are
# listed first. Every rule is still evaluated to produce a full trace for
# the live "Checking red flag: ..." output.
_RULES = [
    {
        "id": "thunderclap_headache",
        "description": "Sudden ('thunderclap') onset with severe pain",
        "tier": "Emergency",
        "check": lambda s: s.get("onset") == "sudden" and s.get("severity") == "severe",
    },
    {
        "id": "worst_headache_of_life",
        "description": "Patient reports this is the worst headache of their life",
        "tier": "Emergency",
        "check": lambda s: s.get("worst_headache_of_life") is True,
    },
    {
        "id": "neuro_deficit",
        "description": "Confusion, slurred speech, or focal weakness present",
        "tier": "Emergency",
        "check": lambda s: s.get("confusion") is True,
    },
    {
        "id": "meningitis_signs",
        "description": "Fever together with neck stiffness",
        "tier": "Emergency",
        "check": lambda s: s.get("fever") is True and s.get("neck_stiffness") is True,
    },
    {
        "id": "head_injury_present",
        "description": "Symptoms following a recent head injury",
        "tier": "Urgent",
        "check": lambda s: s.get("head_injury") is True,
    },
    {
        "id": "vision_changes_present",
        "description": "New vision changes accompanying the headache",
        "tier": "Urgent",
        "check": lambda s: s.get("vision_changes") is True,
    },
    {
        "id": "fever_alone",
        "description": "Fever present (without neck stiffness)",
        "tier": "Urgent",
        "check": lambda s: s.get("fever") is True,
    },
    {
        "id": "moderate_persistent",
        "description": "Moderate-severity headache",
        "tier": "Routine",
        "check": lambda s: s.get("severity") == "moderate",
    },
    {
        "id": "mild_gradual",
        "description": "Mild, gradual-onset headache",
        "tier": "Self-care",
        "check": lambda s: s.get("severity") == "mild" and s.get("onset") == "gradual",
    },
]


def evaluate(state):
    """Check state against every red-flag rule, in priority order.

    Returns (tier_or_None, matched_rule_or_None, trace), where trace is a
    list of (description, result_bool) pairs covering every rule checked --
    this is what gets printed live so the agent's reasoning is visible.
    """
    trace = []
    matched = None
    for rule in _RULES:
        result = bool(rule["check"](state))
        trace.append((rule["description"], result))
        if result and matched is None:
            matched = rule
    tier = matched["tier"] if matched else None
    return tier, matched, trace


def missing_slots(state):
    return [name for name in SLOTS if state.get(name) is None]
