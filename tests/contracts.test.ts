/**
 * Tests for pure, electron-independent logic in the shared contract:
 * URL/origin boundary matching and manifest integrity rejection. These use
 * local fixtures only — passing them is NOT government-portal integration
 * evidence, only proof the guard logic itself behaves as intended.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesUrlPattern, originOf, isHttpsUrl, validateManifest, PortalManifest } from "../src/shared/contracts";

test("matchesUrlPattern: exact path matches", () => {
  assert.equal(matchesUrlPattern("/apply", "/apply"), true);
});

test("matchesUrlPattern: wildcard matches a suffix", () => {
  assert.equal(matchesUrlPattern("/apply*", "/apply?formId=12"), true);
});

test("matchesUrlPattern: does not match an unrelated path", () => {
  assert.equal(matchesUrlPattern("/apply*", "/other"), false);
});

test("matchesUrlPattern: is not substring matching (must match full string)", () => {
  assert.equal(matchesUrlPattern("/apply", "/apply/extra"), false);
});

test("originOf: extracts scheme+host+port", () => {
  assert.equal(originOf("https://example.invalid:8443/a/b?x=1"), "https://example.invalid:8443");
});

test("originOf: returns empty string for garbage input instead of throwing", () => {
  assert.equal(originOf("not a url"), "");
});

test("isHttpsUrl: rejects http and non-URLs", () => {
  assert.equal(isHttpsUrl("http://example.invalid"), false);
  assert.equal(isHttpsUrl("javascript:alert(1)"), false);
  assert.equal(isHttpsUrl("https://example.invalid"), true);
});

function baseManifest(): unknown {
  const manifest: PortalManifest = {
    schemaVersion: "1.0.0",
    portalId: "test_portal",
    manifestVersion: "0.0.1",
    serviceId: "income_certificate",
    jurisdiction: "kerala",
    officialStartUrl: "https://example.invalid/apply",
    allowedOrigins: ["https://example.invalid"],
    authenticationOrigins: [],
    verifiedAt: null,
    status: "partial",
    sources: [],
    uncertainties: [],
    pages: [
      {
        id: "page1",
        urlPattern: "/apply*",
        readyLocator: { strategy: "role", role: "heading", value: "Apply" },
        frameSelectors: [],
        fields: [
          {
            key: "applicant_full_name",
            label: "Full name",
            control: "text",
            locator: { strategy: "label", value: "Full name" },
            required: true,
            condition: null,
            options: [],
            documentType: null,
            limits: {},
            verification: "observed",
            sourceRefs: [],
            readback: "value",
            notes: ""
          }
        ],
        actions: [],
        stopBoundary: true
      }
    ]
  };
  return manifest;
}

test("validateManifest: accepts a well-formed manifest", () => {
  const { manifest, errors } = validateManifest(baseManifest());
  assert.equal(errors.length, 0);
  assert.ok(manifest);
});

test("validateManifest: rejects a dangling nextPageId", () => {
  const m = baseManifest() as PortalManifest;
  m.pages[0].actions.push({
    id: "next1",
    label: "Next",
    locator: { strategy: "role", role: "button", value: "Next" },
    kind: "next",
    effect: "navigation_only",
    automation: "allowed",
    nextPageId: "does_not_exist",
    evidenceNotes: ""
  });
  const { manifest, errors } = validateManifest(m);
  assert.equal(manifest, null);
  assert.ok(errors.some((e) => e.includes("does_not_exist")));
});

test("validateManifest: rejects an observed field with an empty locator", () => {
  const m = baseManifest() as PortalManifest;
  m.pages[0].fields[0].locator.value = "";
  const { manifest, errors } = validateManifest(m);
  assert.equal(manifest, null);
  assert.ok(errors.some((e) => e.includes("empty locator")));
});

test("validateManifest: rejects a manifest with pages but no stopBoundary", () => {
  const m = baseManifest() as PortalManifest;
  m.pages[0].stopBoundary = false;
  const { manifest, errors } = validateManifest(m);
  assert.equal(manifest, null);
  assert.ok(errors.some((e) => e.includes("stopBoundary")));
});

test("validateManifest: rejects a duplicate field key across pages", () => {
  const m = baseManifest() as PortalManifest;
  m.pages.push({ ...m.pages[0], id: "page2", stopBoundary: false });
  m.pages[0].stopBoundary = true;
  const { manifest, errors } = validateManifest(m);
  assert.equal(manifest, null);
  assert.ok(errors.some((e) => e.includes("declared more than once")));
});
