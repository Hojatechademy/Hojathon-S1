"""Canned stand-in for gemini_agent.py, used with --mock.

Same function signatures as gemini_agent.py, no network calls, no API key
needed. Lets the conversation loop, rules engine, and printing be exercised
for free while developing, saving real Gemini quota for rehearsals.
"""

PLACEHOLDER_QUESTION = "(mock) Can you tell me more about that?"


def get_client():
    return None


def start_conversation(client, text, slots):
    slot_names = list(slots)
    first_slot = slot_names[0] if slot_names else None
    return {
        "facts": {},
        "symptom_summary": text or "(mock) symptom summary",
        "next_question": (
            {"slot": first_slot, "question": PLACEHOLDER_QUESTION} if first_slot else None
        ),
    }


def process_answer(client, symptom_summary, target_slot, slot_meta, question, answer_text,
                    known_facts, unknown_slots, slots, qa_history):
    next_slot = unknown_slots[0] if unknown_slots else None
    return {
        "extracted_value": None,
        "next_question": (
            {"slot": next_slot, "question": PLACEHOLDER_QUESTION} if next_slot else None
        ),
    }
