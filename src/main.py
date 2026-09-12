"""Symptom-to-Care Navigator -- terminal entry point.

Wires together the conversation manager, the Gemini LLM layer (decides what
to ask next), and the deterministic red-flag rules engine (decides urgency)
into one visible, step-by-step agent loop.

Run with --mock to exercise the loop/rules engine/printing without spending
any real Gemini API quota (e.g. `python src/main.py --mock`).
"""

import argparse
from pathlib import Path

from dotenv import load_dotenv

from conversation import ConversationState
from hospital_routing import notify_ed, schedule_callback, select_hospital
from rules_engine import SLOTS, evaluate, missing_slots
from scope_check import is_in_scope
from summary import generate_summary

MAX_QUESTIONS = 5


def log(msg):
    print(f"  [agent] {msg}")


def print_trace(trace):
    for description, result in trace:
        log(f"Checking red flag: {description}? -> {'YES' if result else 'no'}")


def print_current_facts(state):
    known = {k: v for k, v in state.slots.items() if v is not None}
    log(f"Current facts: {known}")


def present_outcome(symptom_summary, state, tier, matched_rule):
    """Handles hospital routing for Urgent/Emergency, then prints the summary.

    Routine/Self-care skip hospital routing entirely. Kept as its own function
    so it can be tested directly (see the standalone --mock-free test in
    scratchpad) without needing to go through the full Gemini conversation loop.
    """
    include_hospital_note = tier in ("Emergency", "Urgent")

    if include_hospital_note:
        log("Selecting nearest appropriate facility...")
        hospital = select_hospital(tier)
        print(
            f"\n  [agent] Recommended facility: {hospital['name']} "
            f"({hospital['type']}, {hospital['distance_km']} km away)"
        )
        print(f"  Contact: {hospital['phone']}")
        answer = input("  Would you like me to notify them and schedule a callback? (yes/no)\n> ").strip().lower()

        if answer in ("yes", "y"):
            log("Notifying ED...")
            notify_ed(hospital, symptom_summary)
            log("Scheduling callback...")
            schedule_callback(hospital, tier)
        else:
            log(
                "Understood -- no action taken. Please seek care at your own "
                "discretion given the urgency level identified."
            )

    print()
    print(
        generate_summary(
            symptom_summary, state.slots, state.qa_history, tier, matched_rule, include_hospital_note
        )
    )


def main():
    parser = argparse.ArgumentParser(description="Symptom-to-Care Navigator")
    parser.add_argument(
        "--mock", action="store_true", help="Use canned responses instead of calling the Gemini API"
    )
    args = parser.parse_args()

    if args.mock:
        import mock_agent as agent
    else:
        import gemini_agent as agent

    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    client = agent.get_client()

    print("Symptom-to-Care Navigator" + (" (mock mode)" if args.mock else ""))
    print("-" * 60)
    text = input("Describe what's going on: ").strip()
    print()

    log("Reading your description and extracting known facts...")
    start = agent.start_conversation(client, text, SLOTS)
    facts = start.get("facts", {})
    symptom_summary = start.get("symptom_summary", text)

    log("Checking whether this complaint is in scope...")
    if not is_in_scope(symptom_summary, text):
        log(
            "This prototype is currently scoped to headache-related triage. "
            "For other symptom types, a production version would use a broader rule library."
        )
        return

    state = ConversationState(symptom_summary=symptom_summary)
    for name, value in facts.items():
        if name in SLOTS:
            state.set(name, value)

    log(f"Understood: {symptom_summary}")
    if facts:
        log(f"Extracted from your description: {facts}")
    print()

    print_current_facts(state)
    tier, matched_rule, trace = evaluate(state.slots)
    print_trace(trace)

    next_q = start.get("next_question")
    pending_slot = next_q.get("slot") if next_q else None
    pending_question = next_q.get("question") if next_q else None
    if pending_slot not in SLOTS:
        pending_slot = None
        pending_question = None

    questions_asked = 0
    while tier != "Emergency" and pending_question and questions_asked < MAX_QUESTIONS:
        print(f"\n{pending_question}")
        answer = input("> ").strip()
        questions_asked += 1

        remaining_after = [s for s in missing_slots(state.slots) if s != pending_slot]
        result = agent.process_answer(
            client,
            symptom_summary,
            pending_slot,
            SLOTS[pending_slot],
            pending_question,
            answer,
            state.slots,
            remaining_after,
            SLOTS,
            state.qa_history,
        )
        value = result.get("extracted_value")
        state.set(pending_slot, value)
        state.add_qa(pending_question, answer)

        print()
        print_current_facts(state)
        tier, matched_rule, trace = evaluate(state.slots)
        print_trace(trace)

        next_q = result.get("next_question")
        pending_slot = next_q.get("slot") if next_q else None
        pending_question = next_q.get("question") if next_q else None
        if pending_slot not in SLOTS:
            pending_slot = None
            pending_question = None

    print()
    if tier is None:
        tier = "Routine"
        log("No specific red flag matched; defaulting to Routine care out of caution.")

    present_outcome(symptom_summary, state, tier, matched_rule)


if __name__ == "__main__":
    main()
