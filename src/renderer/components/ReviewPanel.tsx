import React from "react";
import type { Case, PortalManifest } from "@shared/contracts";

interface Props {
  caseData: Case;
  manifest: PortalManifest | null;
  onValidate: () => void;
  onApprove: () => void;
}

/**
 * M1: review, checks, and approval snapshot only. There is no "fill" button
 * here yet — approved cases wait for Milestone M2's runner, which is not
 * wired into the app until the M1 checkpoint is confirmed.
 */
export default function ReviewPanel({ caseData, manifest, onValidate, onApprove }: Props) {
  const canApprove = caseData.validationIssues.every((i) => !i.blocking) && caseData.lifecycle === "ready_for_review" && manifest !== null;
  const isApproved = caseData.approval !== null && caseData.approval.revision === caseData.revision;

  const actionScope = manifest ? manifest.pages.flatMap((p) => p.actions).filter((a) => a.automation === "allowed") : [];

  return (
    <section>
      <h3>Review &amp; approval</h3>

      <button onClick={onValidate}>Run checks</button>

      {caseData.validationIssues.length > 0 && (
        <ul className="issue-list">
          {caseData.validationIssues.map((issue, i) => (
            <li key={i} className={issue.blocking ? "issue-blocking" : "issue-info"}>
              {issue.blocking ? "BLOCKING" : "notice"} — {issue.message}
            </li>
          ))}
        </ul>
      )}

      <div className="approval-disclosure">
        <p>Approving records a snapshot of the current fields/files. Nothing is sent to the government site in Phase 1 M1 — approval only becomes actionable once field filling (M2) is confirmed and enabled.</p>
        <ul>
          {actionScope.length === 0 && <li className="muted">No automated actions defined yet in the manifest.</li>}
          {actionScope.map((a) => (
            <li key={a.id}>
              {a.label} — <span className="muted">{a.effect}</span>
            </li>
          ))}
        </ul>
        <p className="muted">Login, OTP, CAPTCHA and final submission always require you.</p>
      </div>

      <button disabled={!canApprove} onClick={onApprove}>
        Approve this version (revision {caseData.revision})
      </button>

      {isApproved && <span className="approved-mark"> ✓ Approved</span>}
      {!manifest && <p className="warning">No verified manifest for this jurisdiction/service yet — approval is disabled.</p>}
    </section>
  );
}
