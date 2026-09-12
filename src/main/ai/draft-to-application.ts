/**
 * Adapts the reviewed AI draft into the EXISTING DemoApplication schema and
 * hands it to the EXISTING case-loader/demo-controller path — no parallel
 * form runner. The model never supplies a file path; attachments only ever
 * come from either this app's own bundled demo documents ("Use demo
 * documents") or a user's own file picked through the main-process-owned
 * native dialog and resolved by one-time token (see file-store.ts) — never
 * a raw path sent from the renderer.
 */
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import { DemoApplication, MOCK_INCOME_CERT_FIELD_KEYS, MOCK_DOC_SPECS, IntakeDraftSnapshot } from "../../shared/contracts";
import { importPendingFile, resolveFilePath } from "../storage/file-store";

function demoDocumentsDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "samples", "documents");
  }
  return path.join(__dirname, "..", "..", "..", "..", "samples", "documents");
}

const DEMO_DOCUMENT_FILES: Record<string, string> = {
  ration: "ration-card.pdf",
  income: "income-proof.pdf",
  landtax: "land-tax-receipt.pdf",
  basictax: "basic-tax-receipt.pdf",
  idproof: "id-proof.png",
  affidavit: "affidavit.pdf"
};

export function demoAttachments(): { fieldKey: string; path: string }[] {
  const dir = demoDocumentsDir();
  return MOCK_DOC_SPECS.map((d) => ({ fieldKey: d.key, path: path.join(dir, DEMO_DOCUMENT_FILES[d.key]) }));
}

/**
 * Resolves user-picked files by their one-time dialog token (see
 * file-store.ts:registerPickedFiles / importPendingFile) into app-managed
 * absolute paths — copies each into app storage under a random id, so what
 * ends up in the application JSON is never the renderer's own claim about a
 * path, only a path this process itself just wrote.
 */
function resolveManualAttachments(manualAttachmentTokens: Record<string, string>): { fieldKey: string; path: string }[] {
  const resolved: { fieldKey: string; path: string }[] = [];
  for (const [fieldKey, token] of Object.entries(manualAttachmentTokens)) {
    if (!token) continue;
    const file = importPendingFile(token, fieldKey);
    resolved.push({ fieldKey, path: resolveFilePath(file.storedName) });
  }
  return resolved;
}

/** Writes a reviewed snapshot under userData and returns its path, ready for demo-controller.loadAndValidate(). */
export function writeReviewedApplication(
  draft: IntakeDraftSnapshot,
  useDemoDocuments: boolean,
  manualAttachmentTokens?: Record<string, string>
): string {
  const fields: Record<string, string> = {};
  for (const key of MOCK_INCOME_CERT_FIELD_KEYS) {
    const value = draft.fields[key]?.value;
    if (value) fields[key] = value;
  }

  const attachments = useDemoDocuments
    ? demoAttachments()
    : resolveManualAttachments(manualAttachmentTokens ?? {});

  const application: DemoApplication = {
    schemaVersion: "1.0",
    service: "income_certificate",
    demoOnly: true,
    fields,
    attachments
  };

  const outDir = app.getPath("userData");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "ai-reviewed-application.json");
  fs.writeFileSync(outPath, JSON.stringify(application, null, 2), "utf-8");
  return outPath;
}
