"""LLM layer: calls Gemini to interpret free text and choose the next question.

The LLM never decides urgency -- it only (a) extracts structured facts from
free text and (b) picks which still-unknown fact would be most useful to ask
about next. rules_engine.py is what actually decides the urgency tier.

Each conversation turn that both extracts a fact AND needs a follow-up
question does so in a SINGLE Gemini call (see process_answer), to minimize
API usage against free-tier daily quotas.
"""

import json
import os

from google import genai

MODEL_NAME = "gemini-3.5-flash-lite"

SYSTEM_CONTEXT = (
    "You are a clinical intake assistant. You never diagnose and never state "
    "an urgency level yourself; you only collect structured facts from the patient."
)


def get_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Copy .env.example to .env and add your key."
        )
    return genai.Client(api_key=api_key)


def _generate_json(client, prompt):
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config={"response_mime_type": "application/json"},
    )
    text = response.text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)


def _slot_desc(name, meta):
    options = f", options: {meta['options']}" if meta["type"] == "enum" else ""
    return f'- "{name}" ({meta["type"]}{options}): {meta["question_hint"]}'


def start_conversation(client, text, slots):
    """First call of the conversation: extract initial facts from free text
    AND pick the first follow-up question, in one call."""
    slot_desc = "\n".join(_slot_desc(name, meta) for name, meta in slots.items())
    prompt = f"""{SYSTEM_CONTEXT}

A patient just described their symptoms in free text. Extract ONLY the facts
they explicitly stated or clearly implied, mapped onto this fixed set of
clinical fields. Do not guess values that were not mentioned -- omit them.

Fields:
{slot_desc}

Patient's free-text description:
\"\"\"{text}\"\"\"

Then choose ONE follow-up question that will most efficiently help rule in or
rule out a serious ("red flag") cause, from the fields you could NOT extract
from the description, prioritizing fields that would indicate a medical
emergency if positive.

Respond with a JSON object with three keys:
- "facts": an object containing only the fields you could confidently extract
  (field name -> value, matching the allowed type/options exactly, booleans
  as true/false)
- "symptom_summary": a short (under 15 words) plain-language summary of what
  the patient described
- "next_question": an object {{"slot": <field name>, "question": <a natural,
  friendly, single-sentence question that would elicit that field>}}, or null
  if every field was already covered by the description
"""
    return _generate_json(client, prompt)


def process_answer(client, symptom_summary, target_slot, slot_meta, question, answer_text,
                    known_facts, unknown_slots, slots, qa_history):
    """Extract the fact from the answer just given AND pick the next follow-up
    question, in one call."""
    type_hint = slot_meta["type"]
    options_hint = f" One of: {slot_meta['options']}." if type_hint == "enum" else " true or false."
    unknown_desc = "\n".join(_slot_desc(name, slots[name]) for name in unknown_slots) or "(none remaining)"
    history_desc = (
        "\n".join(f"Q: {qa['question']}\nA: {qa['answer']}" for qa in qa_history) or "(none yet)"
    )
    prompt = f"""{SYSTEM_CONTEXT}

Patient's presenting complaint: {symptom_summary}
Facts already known: {json.dumps(known_facts)}
Conversation so far:
{history_desc}

You just asked the patient: "{question}"
They answered: "{answer_text}"

Step 1: Extract the value of the field "{target_slot}" ({type_hint}).{options_hint}
If the answer is genuinely ambiguous or doesn't address the question, use null.

Step 2: Choose ONE more follow-up question that will most efficiently help
rule in or rule out a serious ("red flag") cause. Pick the single most
clinically useful field to ask about next from this list of still-unknown
fields, prioritizing fields that would indicate a medical emergency if
positive:
{unknown_desc}

Respond with a JSON object with two keys:
- "extracted_value": the extracted value for "{target_slot}", or null
- "next_question": an object {{"slot": <field name>, "question": <a natural,
  friendly, single-sentence question>}} chosen from the still-unknown fields
  above, or null if none remain
"""
    return _generate_json(client, prompt)
