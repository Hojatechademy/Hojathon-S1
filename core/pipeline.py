"""
SahayAI - LangGraph Pipeline Orchestrator (മലയാളം Tri-Agent Workflow)
Coordinates stateful transitions between Intake Agent, Scheme Matcher, and Form-Filler / Grievance Agent.
"""

from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, END
from core.state import (
    SahayAgentState,
    CitizenProfile,
    SchemeMatchResult,
    IDCardExtraction
)
from agents.intake_agent import IntakeAgent
from agents.matcher_agent import SchemeMatcherAgent
from agents.form_filler_agent import FormFillerAgent
from utils.pdf_generator import generate_application_pdf, generate_grievance_pdf
from utils.sample_ids import get_mock_id_bytes
from core.gemini_client import GeminiService


class SahayPipeline:
    def __init__(self, api_key: Optional[str] = None):
        self.gemini = GeminiService(api_key=api_key)
        self.intake_agent = IntakeAgent(self.gemini)
        self.matcher_agent = SchemeMatcherAgent()
        self.form_filler_agent = FormFillerAgent(self.gemini)
        self.graph = self._build_graph()

    def _intake_node(self, state: SahayAgentState) -> Dict[str, Any]:
        raw_input = state.get("raw_input", "")
        modality = state.get("input_modality", "text")
        
        profile = self.intake_agent.process_citizen_input(raw_input, modality=modality)
        
        logs = list(state.get("audit_logs", []))
        logs.append(f"[Intake Agent] Extracted profile for '{profile.name}' ({profile.occupation}, {profile.district}, Kerala)")
        
        return {
            "citizen_profile": profile.model_dump(),
            "audit_logs": logs,
            "current_step": "intake_completed"
        }

    def _matcher_node(self, state: SahayAgentState) -> Dict[str, Any]:
        prof_dict = state.get("citizen_profile") or {}
        profile = CitizenProfile(**prof_dict)
        
        matches = self.matcher_agent.match_schemes(profile)
        matched_dicts = [m.model_dump() for m in matches]
        
        top_scheme_id = matched_dicts[0]["scheme_id"] if matched_dicts else None
        
        logs = list(state.get("audit_logs", []))
        logs.append(f"[Scheme Matcher] Evaluated {len(matched_dicts)} Kerala schemes. Top candidate: {top_scheme_id}")
        
        return {
            "matched_schemes": matched_dicts,
            "selected_scheme_id": state.get("selected_scheme_id") or top_scheme_id,
            "audit_logs": logs,
            "current_step": "matching_completed"
        }

    def _route_next_step(self, state: SahayAgentState) -> str:
        prof = state.get("citizen_profile") or {}
        intent = prof.get("intent", "scheme_discovery")
        if intent == "grievance_petition":
            return "grievance_node"
        return "form_filler_node"

    def _form_filler_node(self, state: SahayAgentState) -> Dict[str, Any]:
        prof_dict = state.get("citizen_profile") or {}
        profile = CitizenProfile(**prof_dict)
        
        # Get selected scheme
        matches = state.get("matched_schemes", [])
        selected_id = state.get("selected_scheme_id")
        selected_match = None
        for m in matches:
            if m["scheme_id"] == selected_id:
                selected_match = SchemeMatchResult(**m)
                break
        if not selected_match and matches:
            selected_match = SchemeMatchResult(**matches[0])

        # Get or mock document image / PDF
        img_bytes = state.get("document_image_bytes")
        mime_type = state.get("document_mime_type") or "image/png"
        if not img_bytes:
            img_bytes = get_mock_id_bytes(profile.name or "raghavan")
            mime_type = "image/png"

        # Multimodal ID document verification (supports PDF and images)
        id_extraction = self.form_filler_agent.verify_id_document(img_bytes, profile, mime_type=mime_type)

        # Prepare application package
        package = self.form_filler_agent.prepare_application_package(profile, selected_match, id_extraction)
        
        # Generate official PDF
        pdf_path = generate_application_pdf(package)
        package.pdf_path = pdf_path

        # Generate vernacular summary
        summary = self.form_filler_agent.generate_vernacular_summary(profile, selected_match, is_grievance=False)

        logs = list(state.get("audit_logs", []))
        logs.append(f"[Form Filler] Verified ID Document ({id_extraction.document_type}: {id_extraction.verification_status})")
        logs.append(f"[Form Filler] Generated official Akshaya application PDF: {pdf_path}")

        return {
            "extracted_id": id_extraction.model_dump(),
            "application_package": package.model_dump(),
            "vernacular_summary": summary.model_dump(),
            "audit_logs": logs,
            "current_step": "form_completed"
        }

    def _grievance_node(self, state: SahayAgentState) -> Dict[str, Any]:
        prof_dict = state.get("citizen_profile") or {}
        profile = CitizenProfile(**prof_dict)
        
        img_bytes = state.get("document_image_bytes")
        mime_type = state.get("document_mime_type") or "image/png"
        if not img_bytes:
            img_bytes = get_mock_id_bytes("gopalan")
            mime_type = "image/png"

        id_extraction = self.form_filler_agent.verify_id_document(img_bytes, profile, mime_type=mime_type)
        petition = self.form_filler_agent.prepare_grievance_petition(profile, id_extraction)
        
        pdf_path = generate_grievance_pdf(petition)
        petition.pdf_path = pdf_path

        summary = self.form_filler_agent.generate_vernacular_summary(profile, petition, is_grievance=True)

        logs = list(state.get("audit_logs", []))
        logs.append(f"[Grievance Agent] Verified ID ({id_extraction.verification_status})")
        logs.append(f"[Grievance Agent] Generated CM Grievance representation PDF: {pdf_path}")

        return {
            "extracted_id": id_extraction.model_dump(),
            "grievance_petition": petition.model_dump(),
            "vernacular_summary": summary.model_dump(),
            "audit_logs": logs,
            "current_step": "grievance_completed"
        }

    def _build_graph(self):
        workflow = StateGraph(SahayAgentState)

        workflow.add_node("intake", self._intake_node)
        workflow.add_node("matcher", self._matcher_node)
        workflow.add_node("form_filler", self._form_filler_node)
        workflow.add_node("grievance", self._grievance_node)

        workflow.set_entry_point("intake")
        workflow.add_edge("intake", "matcher")
        
        workflow.add_conditional_edges(
            "matcher",
            self._route_next_step,
            {
                "form_filler_node": "form_filler",
                "grievance_node": "grievance"
            }
        )

        workflow.add_edge("form_filler", END)
        workflow.add_edge("grievance", END)

        return workflow.compile()

    def run(
        self,
        raw_input: str,
        input_modality: str = "text",
        selected_scheme_id: Optional[str] = None,
        document_image_bytes: Optional[bytes] = None,
        document_mime_type: Optional[str] = None
    ) -> SahayAgentState:
        """Executes the full tri-agent LangGraph workflow."""
        initial_state: SahayAgentState = {
            "session_id": "sahay_session_001",
            "raw_input": raw_input,
            "input_modality": input_modality,
            "selected_scheme_id": selected_scheme_id,
            "document_image_bytes": document_image_bytes,
            "document_mime_type": document_mime_type or ("application/pdf" if document_image_bytes and document_image_bytes.startswith(b"%PDF-") else "image/png"),
            "audit_logs": [f"Pipeline initialized for {input_modality} citizen request."],
            "current_step": "initialized"
        }
        final_state = self.graph.invoke(initial_state)
        return final_state
