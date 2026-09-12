import React from "react";
import type { Case, FieldMapping } from "@shared/contracts";

interface Props {
  caseData: Case;
  fields: FieldMapping[];
  onChanged: () => void;
}

/**
 * Phase 1 document handling: decode + basic checks only, done in main
 * (file-store.ts). No OCR, no AI classification of document type — the user
 * assigns documentType manually. Files never travel as renderer-typed paths:
 * pickFiles() returns one-time tokens from a trusted native dialog result,
 * and attachFile() consumes a token rather than accepting a path string.
 */
export default function FilesPanel({ caseData, fields, onChanged }: Props) {
  const fileFields = fields.filter((f) => f.control === "file");
  const documentTypes = Array.from(new Set(fileFields.map((f) => f.documentType).filter(Boolean))) as string[];

  async function attach(documentType: string | null) {
    const picked = await window.api.pickFiles();
    for (const { token } of picked) {
      await window.api.attachFile({ caseId: caseData.id, pendingFileToken: token, documentType });
    }
    onChanged();
  }

  async function remove(fileId: string) {
    await window.api.removeFile(caseData.id, fileId);
    onChanged();
  }

  return (
    <section>
      <h3>Evidence files</h3>
      <div className="file-actions">
        <button onClick={() => attach(null)}>Attach file (unassigned type)</button>
        {documentTypes.map((dt) => (
          <button key={dt} onClick={() => attach(dt)}>
            Attach as "{dt}"
          </button>
        ))}
      </div>
      <ul className="file-list">
        {caseData.files.map((f) => (
          <li key={f.id}>
            <strong>{f.originalName}</strong> — {(f.sizeBytes / 1024).toFixed(1)} KB —{" "}
            {f.documentType ?? <span className="muted">unassigned type</span>} —{" "}
            <span className="muted">checks: {f.checks.join(", ") || "none"}</span>
            <button className="link-button" onClick={() => remove(f.id)}>
              remove
            </button>
          </li>
        ))}
        {caseData.files.length === 0 && <li className="muted">No files attached.</li>}
      </ul>
    </section>
  );
}
