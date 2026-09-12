/**
 * The model's entire tool surface for income-certificate intake — exactly
 * three tools, matching the brief. None of them can start browser filling,
 * approve a case, submit, touch arbitrary files, or execute code; they only
 * read/propose against the in-memory draft (see intake-orchestrator.ts).
 */
import { Type, FunctionDeclaration } from "@google/genai";
import { MOCK_INCOME_CERT_FIELD_KEYS } from "../../shared/contracts";

export const proposeApplicationUpdateDeclaration: FunctionDeclaration = {
  name: "propose_application_update",
  description:
    "Propose one or more field updates extracted from the user's own words. Only propose a value the user actually stated or clearly confirmed — never invent gender, date of birth, identifiers, or income figures the user did not provide.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      updates: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            fieldKey: { type: Type.STRING, enum: [...MOCK_INCOME_CERT_FIELD_KEYS], description: "Canonical field key from the actual form schema." },
            value: { type: Type.STRING, description: "The exact value to propose, already normalized to the field's expected format." },
            sourceMessageId: { type: Type.STRING, description: "The id of the user message this value came from." },
            evidenceText: { type: Type.STRING, description: "The exact phrase from the user's message that supports this value." }
          },
          required: ["fieldKey", "value", "sourceMessageId", "evidenceText"]
        }
      }
    },
    required: ["updates"]
  }
};

export const checkApplicationReadinessDeclaration: FunctionDeclaration = {
  name: "check_application_readiness",
  description: "Check the current draft against the portal's actual required-field and dropdown rules. Call this before telling the user the application is ready, or to see what's still missing.",
  parameters: { type: Type.OBJECT, properties: {} }
};

export const requestClarificationDeclaration: FunctionDeclaration = {
  name: "request_clarification",
  description: "Flag that one or more fields are missing or ambiguous and you are about to ask the user a focused question about them.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      fieldKeys: { type: Type.ARRAY, items: { type: Type.STRING, enum: [...MOCK_INCOME_CERT_FIELD_KEYS] } },
      question: { type: Type.STRING, description: "The short, focused question you are about to ask." }
    },
    required: ["fieldKeys", "question"]
  }
};

export const INTAKE_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  proposeApplicationUpdateDeclaration,
  checkApplicationReadinessDeclaration,
  requestClarificationDeclaration
];

export const MAX_TOOL_CALLS_PER_TURN = 6;
