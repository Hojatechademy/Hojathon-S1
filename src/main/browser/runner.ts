/**
 * M2 — NOT IMPLEMENTED YET, NOT WIRED INTO IPC.
 *
 * This file will hold bounded, known-step execution of an approved case
 * against an observed PortalManifest: walking pages via nextPageId, filling
 * only fields with verification:"observed", clicking only actions with
 * automation:"allowed" (never "submit"/"authenticate"/"final_submission"),
 * with bounded timeouts and no infinite retries. It will re-check the
 * approval digest and pause/cancel state between every action.
 *
 * Left as a typed placeholder until the M1 checkpoint is confirmed and Vijay
 * has produced an observed manifest to build and test against, per the
 * milestone gate in the brief ("don't dump untested code").
 */
import type { Case, PortalManifest } from "../../shared/contracts";
import type { EmitFn } from "./manager";

export interface FillRunRequest {
  caseData: Case;
  manifest: PortalManifest;
  approvedDigest: string;
}

export interface FillRunHandle {
  runId: string;
  requestStop: () => void;
}

export function startFill(_req: FillRunRequest, _emit: EmitFn): FillRunHandle {
  throw new Error("Not implemented: field filling is Milestone M2, pending the M1 checkpoint and an observed manifest.");
}
