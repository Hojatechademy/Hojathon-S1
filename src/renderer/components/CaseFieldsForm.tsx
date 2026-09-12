import React from "react";
import type { Case, CaseFieldStatus, FieldMapping } from "@shared/contracts";

interface Props {
  caseData: Case;
  fields: FieldMapping[];
  onChanged: () => void;
}

/**
 * Manual entry only in Phase 1. The user types the value and explicitly
 * marks it "confirmed" — there is no AI extraction and nothing is
 * auto-confirmed. When no manifest fields exist yet, this shows nothing
 * rather than inventing official field names.
 */
export default function CaseFieldsForm({ caseData, fields, onChanged }: Props) {
  const nonFileFields = fields.filter((f) => f.control !== "file");

  async function setValue(key: string, value: string) {
    const status: CaseFieldStatus = value.trim() === "" ? "missing" : "extracted";
    await window.api.setField({ caseId: caseData.id, fieldKey: key, value: value === "" ? null : value, status });
    onChanged();
  }

  async function confirm(key: string) {
    const current = caseData.fields[key];
    if (!current || current.value === null) return;
    await window.api.setField({ caseId: caseData.id, fieldKey: key, value: current.value, status: "confirmed" });
    onChanged();
  }

  return (
    <section>
      <h3>Application fields</h3>
      {nonFileFields.length === 0 && <p className="muted">No verified fields yet — waiting on the portal manifest.</p>}
      {nonFileFields.length > 0 && (
        <table className="fields-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {nonFileFields.map((f) => {
              const current = caseData.fields[f.key];
              return (
                <tr key={f.key}>
                  <td>
                    {f.label}
                    {f.required && <span className="required-mark"> *</span>}
                  </td>
                  <td>
                    <input type="text" defaultValue={current?.value ?? ""} onBlur={(e) => setValue(f.key, e.target.value)} />
                  </td>
                  <td>
                    <span className={`status-pill status-${current?.status ?? "missing"}`}>{current?.status ?? "missing"}</span>
                  </td>
                  <td>
                    <button disabled={!current?.value} onClick={() => confirm(f.key)}>
                      Confirm
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
