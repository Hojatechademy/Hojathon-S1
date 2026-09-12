"""Streamlit UI for Symptom-to-Care Navigator.

This is a presentation layer only -- it reuses the exact same core modules
as src/main.py (conversation manager, gemini_agent/mock_agent, rules_engine,
hospital_routing, summary, scope_check) unmodified, and just replaces the
CLI's input()/print() loop with Streamlit widgets and session state.

Does NOT modify src/main.py -- the CLI remains a working fallback.

Run with: streamlit run src/app.py
"""

from pathlib import Path

import streamlit as st
from dotenv import load_dotenv

from conversation import ConversationState
from hospital_routing import notify_ed, schedule_callback, select_hospital
from rules_engine import SLOTS, evaluate, missing_slots
from scope_check import is_in_scope
from summary import generate_summary

MAX_QUESTIONS = 5

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

st.set_page_config(page_title="Symptom-to-Care Navigator")
st.title("Symptom-to-Care Navigator")


def init_session():
    if "stage" not in st.session_state:
        st.session_state.stage = "start"
        st.session_state.log = []
        st.session_state.client = None


init_session()

use_mock = st.sidebar.checkbox(
    "Use mock agent (no API calls)",
    value=False,
    disabled=st.session_state.stage != "start",
    help="Same --mock flag as the CLI. Locked once a conversation has started.",
)
if use_mock:
    import mock_agent as agent
else:
    import gemini_agent as agent


def log(msg):
    st.session_state.log.append(msg)


def log_trace(trace):
    for description, result in trace:
        log(f"Checking red flag: {description}? -> {'YES' if result else 'no'}")


def log_current_facts(state):
    known = {k: v for k, v in state.slots.items() if v is not None}
    log(f"Current facts: {known}")


def render_log():
    if st.session_state.log:
        st.code("\n".join(f"[agent] {entry}" for entry in st.session_state.log), language=None)


def advance_after_evaluation(tier):
    if tier is None:
        tier = "Routine"
        log("No specific red flag matched; defaulting to Routine care out of caution.")
    st.session_state.tier = tier


render_log()

if st.session_state.stage == "start":
    text = st.text_input("Describe what's going on:")
    if st.button("Start") and text.strip():
        client = agent.get_client()
        st.session_state.client = client

        log("Reading your description and extracting known facts...")
        start = agent.start_conversation(client, text.strip(), SLOTS)
        facts = start.get("facts", {})
        symptom_summary = start.get("symptom_summary", text.strip())

        log("Checking whether this complaint is in scope...")
        if not is_in_scope(symptom_summary, text.strip()):
            log(
                "This prototype is currently scoped to headache-related triage. "
                "For other symptom types, a production version would use a broader rule library."
            )
            st.session_state.stage = "out_of_scope"
            st.rerun()

        state = ConversationState(symptom_summary=symptom_summary)
        for name, value in facts.items():
            if name in SLOTS:
                state.set(name, value)

        log(f"Understood: {symptom_summary}")
        if facts:
            log(f"Extracted from your description: {facts}")

        log_current_facts(state)
        tier, matched_rule, trace = evaluate(state.slots)
        log_trace(trace)

        next_q = start.get("next_question")
        pending_slot = next_q.get("slot") if next_q else None
        pending_question = next_q.get("question") if next_q else None
        if pending_slot not in SLOTS:
            pending_slot = None
            pending_question = None

        st.session_state.state = state
        st.session_state.symptom_summary = symptom_summary
        st.session_state.matched_rule = matched_rule
        st.session_state.pending_slot = pending_slot
        st.session_state.pending_question = pending_question
        st.session_state.questions_asked = 0

        if tier != "Emergency" and pending_question:
            st.session_state.tier = tier
            st.session_state.stage = "asking"
        else:
            advance_after_evaluation(tier)
            st.session_state.stage = "outcome"
        st.rerun()

elif st.session_state.stage == "out_of_scope":
    st.info("Conversation stopped by the scope check -- see reasoning trace above.")

elif st.session_state.stage == "asking":
    st.write(st.session_state.pending_question)
    answer_key = f"answer_{st.session_state.questions_asked}"
    answer = st.text_input("Your answer:", key=answer_key)
    if st.button("Submit answer") and answer.strip():
        state = st.session_state.state
        pending_slot = st.session_state.pending_slot
        pending_question = st.session_state.pending_question

        remaining_after = [s for s in missing_slots(state.slots) if s != pending_slot]
        result = agent.process_answer(
            st.session_state.client,
            st.session_state.symptom_summary,
            pending_slot,
            SLOTS[pending_slot],
            pending_question,
            answer.strip(),
            state.slots,
            remaining_after,
            SLOTS,
            state.qa_history,
        )
        value = result.get("extracted_value")
        state.set(pending_slot, value)
        state.add_qa(pending_question, answer.strip())
        st.session_state.questions_asked += 1

        log_current_facts(state)
        tier, matched_rule, trace = evaluate(state.slots)
        log_trace(trace)
        st.session_state.matched_rule = matched_rule

        next_q = result.get("next_question")
        next_slot = next_q.get("slot") if next_q else None
        next_question = next_q.get("question") if next_q else None
        if next_slot not in SLOTS:
            next_slot = None
            next_question = None
        st.session_state.pending_slot = next_slot
        st.session_state.pending_question = next_question

        if tier != "Emergency" and next_question and st.session_state.questions_asked < MAX_QUESTIONS:
            st.session_state.tier = tier
            st.session_state.stage = "asking"
        else:
            advance_after_evaluation(tier)
            st.session_state.stage = "outcome"
        st.rerun()

elif st.session_state.stage == "outcome":
    tier = st.session_state.tier
    symptom_summary = st.session_state.symptom_summary
    include_hospital_note = tier in ("Emergency", "Urgent")

    if include_hospital_note:
        if "hospital" not in st.session_state:
            log("Selecting nearest appropriate facility...")
            hospital = select_hospital(tier)
            st.session_state.hospital = hospital
            log(
                f"Recommended facility: {hospital['name']} "
                f"({hospital['type']}, {hospital['distance_km']} km away)"
            )
            log(f"Contact: {hospital['phone']}")
            st.rerun()

        hospital = st.session_state.hospital
        st.write("Would you like me to notify them and schedule a callback?")
        col1, col2 = st.columns(2)
        if col1.button("Yes"):
            log("Notifying ED...")
            confirmation_id, eta_minutes = notify_ed(hospital, symptom_summary)
            log(f"ED notified. Confirmation ID: {confirmation_id}, estimated response time: {eta_minutes} min.")
            log("Scheduling callback...")
            reference_id = schedule_callback(hospital, tier)
            log(
                f"Callback scheduled: a care coordinator from {hospital['name']} "
                f"will contact you within 15 minutes. Reference ID: {reference_id}."
            )
            st.session_state.stage = "done"
            st.rerun()
        if col2.button("No"):
            log(
                "Understood -- no action taken. Please seek care at your own "
                "discretion given the urgency level identified."
            )
            st.session_state.stage = "done"
            st.rerun()
    else:
        st.session_state.stage = "done"
        st.rerun()

elif st.session_state.stage == "done":
    state = st.session_state.state
    tier = st.session_state.tier
    matched_rule = st.session_state.matched_rule
    symptom_summary = st.session_state.symptom_summary
    include_hospital_note = tier in ("Emergency", "Urgent")

    st.subheader("Pre-Visit Summary")
    st.code(
        generate_summary(
            symptom_summary, state.slots, state.qa_history, tier, matched_rule, include_hospital_note
        ),
        language=None,
    )
    if st.button("Start over"):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.rerun()
