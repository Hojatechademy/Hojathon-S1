"""Tracks conversation state across turns: what's known and what's been asked."""


class ConversationState:
    def __init__(self, symptom_summary=""):
        self.symptom_summary = symptom_summary
        self.slots = {}
        self.qa_history = []

    def set(self, slot_name, value):
        self.slots[slot_name] = value

    def add_qa(self, question, answer):
        self.qa_history.append({"question": question, "answer": answer})
