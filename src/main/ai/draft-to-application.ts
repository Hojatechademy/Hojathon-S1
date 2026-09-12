/**
 * Adapts the reviewed AI draft into the EXISTING DemoApplication schema and
 * hands it to the EXISTING case-loader/demo-controller path — no parallel
 * form runner. The model never supplies a file path; attachments only ever
 * come from this app's own bundled demo documents (selected via the
 * explicit "Use demo documents" control), resolved here by app-owned id.
 */
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import { DemoApplication, MOCK_INCOME_CERT_FIELD_KEYS, MOCK_DOC_SPECS, IntakeDraftSnapshot } from "../../shared/contracts";

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

/** Writes a reviewed snapshot under userData and returns its path, ready for demo-controller.loadAndValidate(). */
export function writeReviewedApplication(draft: IntakeDraftSnapshot, useDemoDocuments: boolean): string {
  const fields: Record<string, string> = {};
  for (const key of MOCK_INCOME_CERT_FIELD_KEYS) {
    const value = draft.fields[key]?.value;
    if (value) fields[key] = value;
  }

  const application: DemoApplication = {
    schemaVersion: "1.0",
    service: "income_certificate",
    demoOnly: true,
    fields,
    attachments: useDemoDocuments ? demoAttachments() : []
  };

  const outDir = app.getPath("userData");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "ai-reviewed-application.json");
  fs.writeFileSync(outPath, JSON.stringify(application, null, 2), "utf-8");
  return outPath;
}
