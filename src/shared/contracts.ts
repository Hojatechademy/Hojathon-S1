/**
 * Shared contract types and runtime validation (zod), used by main, preload
 * and renderer. This is the ONLY place these shapes are defined — main and
 * renderer both import from here so they cannot silently drift apart.
 *
 * Protocol version 1.0.0. Bump PROTOCOL_VERSION and resolve the change with
 * Vijay (portal-manifest owner) and Mohan (app owner) together.
 */
import { z } from "zod";

export const PROTOCOL_VERSION = "1.0.0" as const;
export const SchemaVersion = z.literal(PROTOCOL_VERSION);

// ---------------------------------------------------------------------------
// URL pattern matching: deliberately restricted, data-only convention.
// NOT arbitrary regex/JS — manifests stay data, never executable code.
//   - Matched against pathname + search, e.g. "/econtroller/citizen/apply"
//   - `*` matches any run of characters; match is full-string after substitution
// ---------------------------------------------------------------------------
export function matchesUrlPattern(pattern: string, urlPathAndSearch: string): boolean {
  const escaped = pattern
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${escaped}$`).test(urlPathAndSearch);
}

export function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

export function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * For the mock-portal demonstration only: https is always fine; plain http
 * is allowed exclusively for localhost/127.0.0.1, since the mock portal runs
 * as a local Vite dev server. This must never be used for the real-government
 * flow, which stays HTTPS-only via isHttpsUrl().
 */
export function isAllowedMockOrigin(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol === "https:") return true;
    return u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Case
// ---------------------------------------------------------------------------
export const CaseFieldStatus = z.enum(["missing", "extracted", "confirmed", "conflicting"]);
export type CaseFieldStatus = z.infer<typeof CaseFieldStatus>;

export const CaseField = z.object({
  value: z.string().nullable(),
  status: CaseFieldStatus,
  sourceRefs: z.array(z.string())
});
export type CaseField = z.infer<typeof CaseField>;

export const CaseFile = z.object({
  id: z.string(),
  originalName: z.string(),
  storedName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  sha256: z.string(),
  documentType: z.string().nullable(),
  checks: z.array(z.string())
});
export type CaseFile = z.infer<typeof CaseFile>;

export const NoteEntry = z.object({
  id: z.string(),
  text: z.string(),
  author: z.literal("user"),
  createdAt: z.string()
});
export type NoteEntry = z.infer<typeof NoteEntry>;

export const ValidationIssue = z.object({
  code: z.string(),
  fieldKey: z.string().optional(),
  message: z.string(),
  blocking: z.boolean()
});
export type ValidationIssue = z.infer<typeof ValidationIssue>;

export const Approval = z.object({
  revision: z.number().int().nonnegative(),
  digest: z.string(),
  approvedActionIds: z.array(z.string()),
  approvedAt: z.string()
});
export type Approval = z.infer<typeof Approval>;

export const CaseLifecycle = z.enum([
  "draft",
  "ready_for_review",
  "approved",
  "filling",
  "paused",
  "prepared",
  "failed"
]);
export type CaseLifecycle = z.infer<typeof CaseLifecycle>;

export const Case = z.object({
  id: z.string(),
  schemaVersion: SchemaVersion,
  revision: z.number().int().nonnegative(),
  serviceId: z.literal("income_certificate"),
  jurisdiction: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  fields: z.record(z.string(), CaseField),
  files: z.array(CaseFile),
  notes: z.array(NoteEntry),
  validationIssues: z.array(ValidationIssue),
  approval: Approval.nullable(),
  lifecycle: CaseLifecycle
});
export type Case = z.infer<typeof Case>;

// ---------------------------------------------------------------------------
// Portal manifest (Vijay's output — imported, never fabricated or overwritten here)
// ---------------------------------------------------------------------------
export const LocatorStrategy = z.enum(["label", "role", "css"]);

export const LocatorSpec = z.object({
  strategy: LocatorStrategy,
  value: z.string(),
  role: z.string().optional(),
  exact: z.boolean().optional()
});
export type LocatorSpec = z.infer<typeof LocatorSpec>;

export const ConditionOperator = z.enum(["equals", "in"]);

export const Condition = z
  .object({
    fieldKey: z.string(),
    operator: ConditionOperator,
    values: z.array(z.string())
  })
  .nullable();
export type Condition = z.infer<typeof Condition>;

export const FieldControl = z.enum(["text", "textarea", "select", "radio", "checkbox", "file"]);
export const FieldVerification = z.enum(["observed", "unverified"]);
export const ReadbackKind = z.enum(["value", "selectedOption", "checked", "filename", "manual"]);

export const FieldMapping = z.object({
  key: z.string(),
  label: z.string(),
  control: FieldControl,
  locator: LocatorSpec,
  required: z.boolean().nullable(),
  condition: Condition,
  options: z.array(z.object({ label: z.string(), value: z.string() })),
  documentType: z.string().nullable(),
  limits: z.object({
    accept: z.string().optional(),
    maxBytes: z.number().int().positive().optional(),
    maxPages: z.number().int().positive().optional()
  }),
  verification: FieldVerification,
  sourceRefs: z.array(z.string()),
  readback: ReadbackKind,
  notes: z.string()
});
export type FieldMapping = z.infer<typeof FieldMapping>;

export const ActionKind = z.enum(["navigate", "next", "save", "upload", "submit", "authenticate"]);
export const ActionEffect = z.enum([
  "navigation_only",
  "transmits_data",
  "persists_draft",
  "final_submission",
  "unknown"
]);
export const ActionAutomation = z.enum(["allowed", "manual", "blocked"]);

export const ActionMapping = z.object({
  id: z.string(),
  label: z.string(),
  locator: LocatorSpec,
  kind: ActionKind,
  effect: ActionEffect,
  automation: ActionAutomation,
  nextPageId: z.string().nullable(),
  evidenceNotes: z.string()
});
export type ActionMapping = z.infer<typeof ActionMapping>;

export const PageManifest = z.object({
  id: z.string(),
  urlPattern: z.string(),
  readyLocator: LocatorSpec,
  frameSelectors: z.array(z.string()),
  fields: z.array(FieldMapping),
  actions: z.array(ActionMapping),
  stopBoundary: z.boolean()
});
export type PageManifest = z.infer<typeof PageManifest>;

export const ManifestStatus = z.enum(["draft", "partial", "verified"]);

export const ManifestSource = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  checkedAt: z.string(),
  evidenceNotes: z.string()
});

export const PortalManifest = z.object({
  schemaVersion: SchemaVersion,
  portalId: z.string(),
  manifestVersion: z.string(),
  serviceId: z.literal("income_certificate"),
  jurisdiction: z.string(),
  officialStartUrl: z.string().url(),
  allowedOrigins: z.array(z.string()),
  authenticationOrigins: z.array(z.string()).default([]),
  verifiedAt: z.string().nullable(),
  status: ManifestStatus,
  sources: z.array(ManifestSource),
  uncertainties: z.array(z.string()),
  pages: z.array(PageManifest)
});
export type PortalManifest = z.infer<typeof PortalManifest>;

export interface ManifestValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Import-time checks beyond shape validation, so Vijay gets a useful error
 * instead of the app silently ignoring a broken manifest:
 *  - every nextPageId resolves to a real page id
 *  - locator values are non-empty (an empty locator can never be "observed")
 *  - every FieldMapping.key is unique across the whole manifest
 *  - at least one stopBoundary page exists once any page is defined
 */
export function validateManifestIntegrity(manifest: PortalManifest): string[] {
  const errors: string[] = [];
  const pageIds = new Set(manifest.pages.map((p) => p.id));
  const seenFieldKeys = new Set<string>();

  for (const page of manifest.pages) {
    if (!page.readyLocator.value.trim()) {
      errors.push(`Page "${page.id}" has an empty readyLocator value.`);
    }
    for (const field of page.fields) {
      if (seenFieldKeys.has(field.key)) {
        errors.push(`Field key "${field.key}" is declared more than once across the manifest.`);
      }
      seenFieldKeys.add(field.key);
      if (field.verification === "observed" && !field.locator.value.trim()) {
        errors.push(`Field "${field.key}" is marked observed but has an empty locator value.`);
      }
    }
    for (const action of page.actions) {
      if (action.nextPageId && !pageIds.has(action.nextPageId)) {
        errors.push(`Page "${page.id}" action "${action.id}" references unknown nextPageId "${action.nextPageId}".`);
      }
      if (action.automation === "allowed" && !action.locator.value.trim()) {
        errors.push(`Action "${action.id}" is automation:"allowed" but has an empty locator value.`);
      }
    }
  }

  if (manifest.pages.length > 0 && !manifest.pages.some((p) => p.stopBoundary)) {
    errors.push("Manifest has no page with stopBoundary=true; automation would have no defined stop.");
  }

  return errors;
}

export function validateManifest(raw: unknown): { manifest: PortalManifest | null; errors: string[] } {
  const parsed = PortalManifest.safeParse(raw);
  if (!parsed.success) {
    return { manifest: null, errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  }
  const integrityErrors = validateManifestIntegrity(parsed.data);
  return { manifest: integrityErrors.length === 0 ? parsed.data : null, errors: integrityErrors };
}

// ---------------------------------------------------------------------------
// Browser events (main -> renderer activity feed)
// ---------------------------------------------------------------------------
export const BrowserEventType = z.enum([
  "browser_opened",
  "awaiting_user",
  "page_ready",
  "field_filled",
  "field_verified",
  "paused",
  "resumed",
  "blocked",
  "failed",
  "finished",
  "closed",
  "diagnostics"
]);
export type BrowserEventType = z.infer<typeof BrowserEventType>;

export const DemoRunSummary = z.object({
  fieldsVerified: z.number(),
  fieldsMismatched: z.number(),
  attachmentsSelected: z.number(),
  attachmentsMissing: z.number(),
  uploadsAcknowledged: z.number(),
  unresolvedIssues: z.array(z.string()),
  stoppedEarly: z.boolean(),
  finalMessage: z.string()
});
export type DemoRunSummary = z.infer<typeof DemoRunSummary>;

export const BrowserEvent = z.object({
  runId: z.string(),
  caseId: z.string().nullable(),
  timestamp: z.string(),
  type: BrowserEventType,
  pageId: z.string().optional(),
  fieldKey: z.string().optional(),
  message: z.string(),
  errorCode: z.string().optional(),
  summary: DemoRunSummary.optional()
});
export type BrowserEvent = z.infer<typeof BrowserEvent>;
// NEVER put credentials, full ID numbers, file contents or raw personal
// values into a BrowserEvent.message. Callers must pass already-redacted text.

// ---------------------------------------------------------------------------
// Local, temporary portal settings (URL/jurisdiction) used ONLY until a real
// manifest exists. This is Phase-1 scaffolding, not a manifest substitute:
// it never enables filling, only "Open Government Website" for manual login.
// ---------------------------------------------------------------------------
export const PortalSettings = z.object({
  jurisdiction: z.string().nullable(),
  officialStartUrl: z.string().nullable()
});
export type PortalSettings = z.infer<typeof PortalSettings>;

// ---------------------------------------------------------------------------
// Browser manager status, surfaced to the renderer for login/pause/close UI.
// ---------------------------------------------------------------------------
export const BrowserRunState = z.enum(["closed", "opening", "open", "paused", "closing"]);
export type BrowserRunState = z.infer<typeof BrowserRunState>;

export const BrowserDiagnostics = z.object({
  chromiumInstalled: z.boolean(),
  executablePath: z.string().nullable(),
  installCommand: z.string()
});
export type BrowserDiagnostics = z.infer<typeof BrowserDiagnostics>;

export const PageCheckResult = z.object({
  url: z.string(),
  title: z.string(),
  checkedAt: z.string()
});
export type PageCheckResult = z.infer<typeof PageCheckResult>;

// ---------------------------------------------------------------------------
// Mock portal (edistrict-kerala) income-certificate field/document schema.
//
// Mirrored directly from the cloned source as inspected on 2026-09-12:
//   edistrict-kerala/src/components/IncomeForm.jsx (field list + validStage1())
//   edistrict-kerala/src/lib/data.js (DISTRICTS, PURPOSES, DOCS)
// This is a black-box dependency on an external repo we do not control. If
// the portal's options/validation change, this must be updated to match —
// a mismatch will surface as a portal-adapter fill/select failure, not a
// silent wrong value.
//
// "members" (dynamic family-member rows) is intentionally excluded from
// Phase 1 automation: it is optional, unvalidated, and its add/remove-row UI
// adds complexity out of proportion to what it demonstrates. Documented as
// an untested field group, not silently dropped.
// ---------------------------------------------------------------------------
export const MOCK_INCOME_CERT_FIELD_KEYS = [
  "fullName", "gender", "dob", "fatherName", "relation", "address",
  "district", "taluk", "village", "pincode", "mobile", "email",
  "aadhaar", "ration", "purpose", "certLang",
  "land", "salary", "business", "labour", "nri", "rent"
] as const;
export type MockIncomeCertFieldKey = (typeof MOCK_INCOME_CERT_FIELD_KEYS)[number];

export const MOCK_INCOME_CERT_REQUIRED_FIELD_KEYS: MockIncomeCertFieldKey[] = [
  "fullName", "gender", "mobile", "district", "purpose", "address"
];

export const MOCK_DISTRICTS = [
  "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", "Idukki",
  "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
] as const;

export const MOCK_PURPOSES = [
  "Scholarship / Fee Concession", "School / College Admission", "Bank Loan", "Pension",
  "Property Tax Relaxation", "Govt Scheme / Subsidy", "Other"
] as const;

export const MOCK_GENDERS = ["Male", "Female", "Other"] as const;
export const MOCK_RELATIONS = ["Self", "Father", "Mother", "Spouse", "Child", "Other"] as const;
export const MOCK_CERT_LANGUAGES = ["English", "Malayalam"] as const;

export interface MockDocSpec {
  key: string;
  label: string;
  required: boolean;
}

export const MOCK_DOC_SPECS: MockDocSpec[] = [
  { key: "ration", label: "Ration Card", required: true },
  { key: "income", label: "Proof of Income (Salary Certificate / Form 16 / IT Return)", required: true },
  { key: "landtax", label: "Land Tax Receipt", required: true },
  { key: "basictax", label: "Basic Tax Payment Receipt", required: true },
  { key: "idproof", label: "ID Proof (Aadhaar / Voter ID)", required: true },
  { key: "affidavit", label: "Affidavit", required: false }
];

export const MOCK_ACCEPTED_FILE_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

/**
 * Field-level validation mirroring IncomeForm.jsx's validStage1(): required
 * fields must be non-empty, dropdowns must be one of the portal's actual
 * options, and Aadhaar — while optional — must be exactly 12 digits if given.
 */
export function validateMockIncomeCertFields(fields: Record<string, string | undefined>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const get = (k: string) => (fields[k] ?? "").trim();

  for (const key of MOCK_INCOME_CERT_REQUIRED_FIELD_KEYS) {
    if (get(key) === "") {
      issues.push({ code: "missing_required_field", fieldKey: key, message: `"${key}" is required by the portal's Stage 1 validation.`, blocking: true });
    }
  }
  if (get("gender") !== "" && !(MOCK_GENDERS as readonly string[]).includes(get("gender"))) {
    issues.push({ code: "invalid_dropdown_value", fieldKey: "gender", message: `"gender" must be one of: ${MOCK_GENDERS.join(", ")}.`, blocking: true });
  }
  if (get("district") !== "" && !(MOCK_DISTRICTS as readonly string[]).includes(get("district"))) {
    issues.push({ code: "invalid_dropdown_value", fieldKey: "district", message: `"district" must be one of the portal's actual districts.`, blocking: true });
  }
  if (get("purpose") !== "" && !(MOCK_PURPOSES as readonly string[]).includes(get("purpose"))) {
    issues.push({ code: "invalid_dropdown_value", fieldKey: "purpose", message: `"purpose" must be one of the portal's actual purposes.`, blocking: true });
  }
  const mobileDigits = get("mobile").replace(/\D/g, "");
  if (get("mobile") !== "" && mobileDigits.length < 10) {
    issues.push({ code: "invalid_mobile", fieldKey: "mobile", message: "mobile must have at least 10 digits.", blocking: true });
  }
  const aadhaarDigits = get("aadhaar").replace(/\D/g, "");
  if (get("aadhaar") !== "" && aadhaarDigits.length !== 12) {
    issues.push({ code: "invalid_aadhaar", fieldKey: "aadhaar", message: "aadhaar, if provided, must be exactly 12 digits.", blocking: true });
  }
  if (get("relation") !== "" && !(MOCK_RELATIONS as readonly string[]).includes(get("relation"))) {
    issues.push({ code: "invalid_dropdown_value", fieldKey: "relation", message: `"relation" must be one of: ${MOCK_RELATIONS.join(", ")}.`, blocking: true });
  }
  if (get("certLang") !== "" && !(MOCK_CERT_LANGUAGES as readonly string[]).includes(get("certLang"))) {
    issues.push({ code: "invalid_dropdown_value", fieldKey: "certLang", message: `"certLang" must be one of: ${MOCK_CERT_LANGUAGES.join(", ")}.`, blocking: true });
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Demo application case: the JSON-driven input for the mock-portal demonstration.
// ---------------------------------------------------------------------------
export const DemoAttachment = z.object({
  fieldKey: z.string(),
  path: z.string()
});
export type DemoAttachment = z.infer<typeof DemoAttachment>;

export const DemoApplication = z.object({
  schemaVersion: z.literal("1.0"),
  service: z.literal("income_certificate"),
  demoOnly: z.literal(true),
  fields: z.record(z.string(), z.string()),
  attachments: z.array(DemoAttachment)
});
export type DemoApplication = z.infer<typeof DemoApplication>;

export interface DemoValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  resolvedAttachments: { fieldKey: string; absolutePath: string; sha256: string; sizeBytes: number }[];
  digest: string | null;
}

// ---------------------------------------------------------------------------
// AI intake draft (Gemini-driven natural-language extraction). Authoritative
// state lives in src/main/ai/intake-orchestrator.ts; these are just the
// shapes shared with the renderer over IPC.
// ---------------------------------------------------------------------------
export interface DraftFieldState {
  value: string | null;
  status: "missing" | "extracted" | "conflicting";
  sourceMessageId: string | null;
  evidenceText: string | null;
}

export interface ConversationEntry {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: string;
}

export interface IntakeDraftSnapshot {
  revision: number;
  fields: Record<string, DraftFieldState>;
  conversation: ConversationEntry[];
  pendingClarification: { fieldKeys: string[]; question: string } | null;
  readiness: { ok: boolean; missingRequired: string[]; issues: string[] } | null;
}

export interface SendMessageResult {
  reply: string;
  draft: IntakeDraftSnapshot;
}

// ---------------------------------------------------------------------------
// IPC channel names + request/response typing shared by preload and main.
// ---------------------------------------------------------------------------
export interface DemoReviewPayload {
  jsonFilePath: string;
  application: DemoApplication;
  validation: DemoValidationResult;
}

export const IpcChannels = {
  aiSendMessage: "ai:sendMessage",
  aiGetDraft: "ai:getDraft",
  aiResetDraft: "ai:resetDraft",
  aiReviewAndPrepare: "ai:reviewAndPrepare",
  aiVoiceAvailable: "ai:voiceAvailable",
  aiVoiceStart: "ai:voiceStart",
  aiVoiceAudioChunk: "ai:voiceAudioChunk",
  aiVoiceStop: "ai:voiceStop",
  aiVoiceTranscript: "ai:voiceTranscript", // main -> renderer push channel
  demoLoadSample: "demo:loadSample",
  demoLoadJsonFile: "demo:loadJsonFile",
  demoGetCurrentReview: "demo:getCurrentReview",
  demoStart: "demo:start",
  demoPause: "demo:pause",
  demoResume: "demo:resume",
  demoStop: "demo:stop",
  demoGetConfig: "demo:getConfig",
  caseCreate: "case:create",
  caseGet: "case:get",
  caseList: "case:list",
  caseSetField: "case:setField",
  caseAddNote: "case:addNote",
  caseAttachFile: "case:attachFile",
  caseRemoveFile: "case:removeFile",
  caseValidate: "case:validate",
  caseApprove: "case:approve",
  manifestList: "manifest:list",
  manifestGet: "manifest:get",
  settingsGet: "settings:get",
  settingsSet: "settings:set",
  browserDiagnostics: "browser:diagnostics",
  browserOpenForLogin: "browser:openForLogin",
  browserCheckPage: "browser:checkPage",
  browserPause: "browser:pause",
  browserResume: "browser:resume",
  browserClose: "browser:close",
  browserEvent: "browser:event", // main -> renderer push channel
  dialogPickFiles: "dialog:pickFiles"
} as const;

export const SetFieldRequest = z.object({
  caseId: z.string(),
  fieldKey: z.string(),
  value: z.string().nullable(),
  status: CaseFieldStatus
});
export type SetFieldRequest = z.infer<typeof SetFieldRequest>;

export const AttachFileRequest = z.object({
  caseId: z.string(),
  pendingFileToken: z.string(),
  documentType: z.string().nullable().optional()
});
export type AttachFileRequest = z.infer<typeof AttachFileRequest>;

export const ApproveRequest = z.object({
  caseId: z.string(),
  expectedRevision: z.number().int().nonnegative(),
  approvedActionIds: z.array(z.string())
});
export type ApproveRequest = z.infer<typeof ApproveRequest>;

export const SetSettingsRequest = z.object({
  jurisdiction: z.string().nullable(),
  officialStartUrl: z.string().nullable()
});
export type SetSettingsRequest = z.infer<typeof SetSettingsRequest>;

/** Typed surface exposed on window.api by the preload bridge. */
export interface RendererApi {
  aiSendMessage: (text: string) => Promise<SendMessageResult>;
  aiGetDraft: () => Promise<IntakeDraftSnapshot>;
  aiResetDraft: () => Promise<IntakeDraftSnapshot>;
  aiReviewAndPrepare: (useDemoDocuments: boolean, manualAttachmentTokens?: Record<string, string>) => Promise<DemoReviewPayload>;
  aiVoiceAvailable: () => Promise<boolean>;
  aiVoiceStart: () => Promise<void>;
  aiVoiceAudioChunk: (base64Pcm16kMono: string) => Promise<void>;
  aiVoiceStop: () => Promise<string>;
  onVoiceTranscript: (cb: (text: string, final: boolean) => void) => () => void;
  loadSampleApplication: () => Promise<DemoReviewPayload>;
  loadApplicationFromDialog: () => Promise<DemoReviewPayload | null>;
  getCurrentReview: () => Promise<DemoReviewPayload | null>;
  startDemo: (digest: string) => Promise<{ runId: string }>;
  pauseDemo: () => Promise<void>;
  resumeDemo: () => Promise<void>;
  stopDemo: () => Promise<void>;
  getDemoConfig: () => Promise<{ mockPortalUrl: string; autoRun: boolean }>;
  createCase: (jurisdiction: string) => Promise<Case>;
  getCase: (caseId: string) => Promise<Case | null>;
  listCases: () => Promise<Case[]>;
  setField: (req: SetFieldRequest) => Promise<Case>;
  addNote: (caseId: string, text: string) => Promise<Case>;
  attachFile: (req: AttachFileRequest) => Promise<Case>;
  removeFile: (caseId: string, fileId: string) => Promise<Case>;
  validateCase: (caseId: string) => Promise<Case>;
  approveCase: (req: ApproveRequest) => Promise<Case>;
  listManifests: () => Promise<PortalManifest[]>;
  getManifest: (portalId: string) => Promise<PortalManifest | null>;
  getSettings: () => Promise<PortalSettings>;
  setSettings: (req: SetSettingsRequest) => Promise<PortalSettings>;
  getBrowserDiagnostics: () => Promise<BrowserDiagnostics>;
  openGovernmentWebsite: () => Promise<{ runId: string }>;
  checkPage: () => Promise<PageCheckResult>;
  pauseBrowser: () => Promise<void>;
  resumeBrowser: () => Promise<void>;
  closeBrowser: () => Promise<void>;
  pickFiles: () => Promise<{ token: string; name: string }[]>;
  onBrowserEvent: (cb: (event: BrowserEvent) => void) => () => void;
}
