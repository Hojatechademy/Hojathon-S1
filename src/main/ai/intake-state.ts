/**
 * Provider-agnostic intake state and tool execution — used by BOTH
 * openrouter-intake.ts (the primary text backend) and intake-orchestrator.ts
 * (Gemini Live, kept for the voice feature). Authoritative state lives here;
 * neither provider's conversation transcript is the database. Tool
 * execution can only read/propose against this draft — never start browser
 * filling, approve, submit, touch arbitrary files, or execute code.
 */
import {
  MOCK_INCOME_CERT_FIELD_KEYS,
  MOCK_INCOME_CERT_REQUIRED_FIELD_KEYS,
  MOCK_GENDERS,
  MOCK_DISTRICTS,
  MOCK_PURPOSES,
  MOCK_RELATIONS,
  MOCK_CERT_LANGUAGES,
  validateMockIncomeCertFields,
  MockIncomeCertFieldKey,
  DraftFieldState,
  IntakeDraftSnapshot
} from "../../shared/contracts";

function blankFields(): Record<string, DraftFieldState> {
  const fields: Record<string, DraftFieldState> = {};
  for (const key of MOCK_INCOME_CERT_FIELD_KEYS) {
    fields[key] = { value: null, status: "missing", sourceMessageId: null, evidenceText: null };
  }
  return fields;
}

let draft: IntakeDraftSnapshot = {
  revision: 0,
  fields: blankFields(),
  conversation: [],
  pendingClarification: null,
  readiness: null
};

export function getDraft(): IntakeDraftSnapshot {
  return draft;
}

export function resetDraft(): IntakeDraftSnapshot {
  draft = { revision: 0, fields: blankFields(), conversation: [], pendingClarification: null, readiness: null };
  return draft;
}

export function bumpRevision(): void {
  draft = { ...draft, revision: draft.revision + 1 };
}

export function pushConversationEntry(entry: { id: string; role: "user" | "assistant"; text: string; at: string }): void {
  draft.conversation.push(entry);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function buildSystemInstruction(): string {
  return [
    "You are an intake assistant for ONE demonstration service: Kerala eDistrict Income Certificate, on our own mock portal (not a real government system).",
    "If asked about any other certificate/service, reply exactly: \"This demo currently supports income certificates.\" and do not extract anything.",
    "",
    `Field keys you may propose values for: ${MOCK_INCOME_CERT_FIELD_KEYS.join(", ")}.`,
    `Required fields: ${MOCK_INCOME_CERT_REQUIRED_FIELD_KEYS.join(", ")}. Aadhaar is optional but must be exactly 12 digits if given.`,
    `Allowed gender values (match casing exactly): ${MOCK_GENDERS.join(", ")}.`,
    `Allowed district values (must match exactly, including casing): ${MOCK_DISTRICTS.join(", ")}.`,
    `Allowed purpose values (must match exactly, including casing): ${MOCK_PURPOSES.join(", ")}.`,
    `Allowed relation values (match casing exactly): ${MOCK_RELATIONS.join(", ")}.`,
    `Allowed certificate language values (match casing exactly): ${MOCK_CERT_LANGUAGES.join(", ")}.`,
    `Income fields (each optional, Rs./year): land, salary, business, labour, nri, rent.`,
    "",
    "Rules:",
    "- Never invent or guess a value the user did not state — especially gender, date of birth, Aadhaar/identifiers, or any income figure.",
    "- Always match dropdown values to the allowed lists' EXACT casing (e.g. propose \"Male\", never \"male\"; \"Ernakulam\", never \"ernakulam\").",
    "- The `district` field and the `address` field are separate and BOTH required. A district or town name alone (e.g. just \"Palakkad\") is NOT a complete address — it only satisfies `district`. Keep `address` unresolved and ask for a house/street/locality-level detail even after the district is known.",
    "- Do not assume an unstated income source is zero. If the user seems to describe their full income situation, ask whether the other sources are genuinely zero, or leave them unstated.",
    "- Never silently convert units. If the user gives a MONTHLY amount for an annual field, say what you think the annual figure would be and ask them to confirm before proposing it as a value — do not propose the converted number directly without saying so in your reply.",
    "- An explicit correction (\"my salary is X, not Y\") replaces the prior value. A vague disagreement without a new value should trigger a clarification question instead, not a guess.",
    "- Only propose a district/purpose/gender/relation/certLang value that exactly matches one of the allowed lists above. If the user's wording is close but not exact, ask which of the allowed options they mean.",
    "- Use propose_application_update for any fact you are confident about, with the exact user wording as evidenceText.",
    "- Use check_application_readiness before telling the user the application is complete.",
    "- Use request_clarification when required information is missing or ambiguous, then ask a short, focused question in your reply.",
    "- Keep replies short and focused — one or two sentences plus, if needed, one targeted question.",
    "- Family members / dependents are not handled by this assistant; do not ask about them.",
    "- After using a tool, always also produce a short plain-text reply to the user in the same turn — never end a turn with only a tool call and no reply text."
  ].join("\n");
}

export function draftContextBlock(): string {
  const known = MOCK_INCOME_CERT_FIELD_KEYS.filter((k) => draft.fields[k].value !== null)
    .map((k) => `${k}=${JSON.stringify(draft.fields[k].value)}`)
    .join(", ") || "(none yet)";
  const missing = MOCK_INCOME_CERT_REQUIRED_FIELD_KEYS.filter((k) => draft.fields[k].value === null);
  return `[Current draft — revision ${draft.revision}]\nKnown facts: ${known}\nStill missing (required): ${missing.length ? missing.join(", ") : "none"}`;
}

/** Exported for direct unit testing of rejection behavior without needing a live model call. */
export function acceptUpdate(update: { fieldKey: string; value: string; sourceMessageId: string; evidenceText: string }): { accepted: boolean; reason?: string } {
  if (!MOCK_INCOME_CERT_FIELD_KEYS.includes(update.fieldKey as MockIncomeCertFieldKey)) {
    return { accepted: false, reason: `Unknown field key "${update.fieldKey}".` };
  }
  if (typeof update.value !== "string" || update.value.trim() === "") {
    return { accepted: false, reason: "Value must be a non-empty string." };
  }
  draft.fields[update.fieldKey] = {
    value: update.value.trim(),
    status: "extracted",
    sourceMessageId: update.sourceMessageId ?? null,
    evidenceText: update.evidenceText ?? null
  };
  return { accepted: true };
}

export function runReadinessCheck(): { ok: boolean; missingRequired: string[]; issues: string[] } {
  const fieldValues: Record<string, string | undefined> = {};
  for (const key of MOCK_INCOME_CERT_FIELD_KEYS) fieldValues[key] = draft.fields[key].value ?? undefined;
  const issues = validateMockIncomeCertFields(fieldValues);
  const missingRequired = MOCK_INCOME_CERT_REQUIRED_FIELD_KEYS.filter((k) => !draft.fields[k].value);
  const result = { ok: issues.length === 0 && missingRequired.length === 0, missingRequired, issues: issues.map((i) => i.message) };
  draft.readiness = result;
  return result;
}

/** Runs a named tool with raw args (already parsed from JSON) and always returns a response object. */
export function executeToolSafely(name: string, args: Record<string, unknown>): Record<string, unknown> {
  try {
    return executeTool(name, args);
  } catch (err) {
    return { error: `Tool execution failed: ${(err as Error).message}` };
  }
}

function executeTool(name: string, args: Record<string, unknown>): Record<string, unknown> {
  if (name === "propose_application_update") {
    const updates = Array.isArray(args.updates) ? (args.updates as Record<string, unknown>[]) : [];
    const accepted: string[] = [];
    const rejected: { fieldKey: unknown; reason: string }[] = [];
    for (const u of updates) {
      const result = acceptUpdate(u as { fieldKey: string; value: string; sourceMessageId: string; evidenceText: string });
      if (result.accepted) accepted.push(String(u.fieldKey));
      else rejected.push({ fieldKey: u.fieldKey, reason: result.reason ?? "rejected" });
    }
    if (accepted.length > 0) bumpRevision();
    const readiness = runReadinessCheck();
    return { accepted, rejected, missingRequired: readiness.missingRequired, canMoveToReview: readiness.ok };
  }

  if (name === "check_application_readiness") {
    return runReadinessCheck();
  }

  if (name === "request_clarification") {
    // Records the pending question and returns immediately — it does NOT
    // wait for the human's next answer, which arrives as a separate turn.
    const fieldKeys = Array.isArray(args.fieldKeys) ? (args.fieldKeys as string[]) : [];
    const question = typeof args.question === "string" ? args.question : "";
    draft.pendingClarification = { fieldKeys, question };
    return { ok: true, acknowledged: true };
  }

  return { error: `Unknown tool "${name}".` };
}
