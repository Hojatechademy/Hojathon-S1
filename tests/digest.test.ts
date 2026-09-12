/**
 * Approval-digest boundary tests: any change to fields, file hashes,
 * manifest version, or approved action scope must change the digest, so a
 * stale approval can never be reused to drive the browser after an edit.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeDigest } from "../src/main/storage/digest";
import type { Case } from "../src/shared/contracts";

function baseCase(): Case {
  return {
    id: "case1",
    schemaVersion: "1.0.0",
    revision: 3,
    serviceId: "income_certificate",
    jurisdiction: "kerala",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    fields: {
      applicant_full_name: { value: "Arun Kumar", status: "confirmed", sourceRefs: ["user_manual_entry"] }
    },
    files: [],
    notes: [],
    validationIssues: [],
    approval: null,
    lifecycle: "ready_for_review"
  };
}

test("computeDigest: identical input produces identical digest", () => {
  const c = baseCase();
  const d1 = computeDigest(c, "1.0.0", ["actionA"]);
  const d2 = computeDigest(baseCase(), "1.0.0", ["actionA"]);
  assert.equal(d1, d2);
});

test("computeDigest: changing a field value changes the digest", () => {
  const c1 = baseCase();
  const c2 = baseCase();
  c2.fields.applicant_full_name.value = "Arun K.";
  assert.notEqual(computeDigest(c1, "1.0.0", []), computeDigest(c2, "1.0.0", []));
});

test("computeDigest: changing manifest version changes the digest", () => {
  const c = baseCase();
  assert.notEqual(computeDigest(c, "1.0.0", []), computeDigest(c, "1.0.1", []));
});

test("computeDigest: changing approved action scope changes the digest", () => {
  const c = baseCase();
  assert.notEqual(computeDigest(c, "1.0.0", ["actionA"]), computeDigest(c, "1.0.0", ["actionA", "actionB"]));
});

test("computeDigest: action id order does not matter (scope is sorted)", () => {
  const c = baseCase();
  assert.equal(computeDigest(c, "1.0.0", ["a", "b"]), computeDigest(c, "1.0.0", ["b", "a"]));
});

test("computeDigest: adding a file hash changes the digest", () => {
  const c1 = baseCase();
  const c2 = baseCase();
  c2.files.push({
    id: "f1",
    originalName: "doc.pdf",
    storedName: "abc.pdf",
    mimeType: "application/pdf",
    sizeBytes: 10,
    sha256: "deadbeef",
    documentType: "id_proof",
    checks: []
  });
  assert.notEqual(computeDigest(c1, "1.0.0", []), computeDigest(c2, "1.0.0", []));
});
