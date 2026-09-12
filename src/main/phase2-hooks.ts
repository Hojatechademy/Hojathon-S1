/**
 * Phase 2 interface stubs ONLY. Nothing here is implemented, called, or
 * wired into IPC. They exist so Phase 2 (OpenAI-backed extraction,
 * validation, clarification) can be built behind the same Case interface
 * without reshaping storage or the browser adapter. Do not add logic here
 * during Phase 1.
 */
import type { Case, ValidationIssue } from "../shared/contracts";

/** Turn free-form user text/notes into proposed field updates (status "extracted", never "confirmed"). */
export interface ExtractIntoCaseInput {
  caseId: string;
  freeText: string;
}
export interface ExtractIntoCaseResult {
  proposedFields: Record<string, { value: string; sourceRefs: string[] }>;
}
export declare function extractIntoCase(input: ExtractIntoCaseInput): Promise<ExtractIntoCaseResult>;

/** Phase 2 richer validation: conflict detection across fields/documents, beyond Phase 1's required/confirmed check. */
export interface ValidateCaseInput {
  caseData: Case;
}
export interface ValidateCaseResult {
  issues: ValidationIssue[];
}
export declare function validateCase(input: ValidateCaseInput): Promise<ValidateCaseResult>;

/** Generate the next targeted question to resolve a specific missing/conflicting field. */
export interface AskForClarificationInput {
  caseId: string;
  fieldKey: string;
}
export interface AskForClarificationResult {
  question: string;
}
export declare function askForClarification(input: AskForClarificationInput): Promise<AskForClarificationResult>;
