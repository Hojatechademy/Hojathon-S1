/**
 * Portal manifest loading, validation and DATA-ONLY locator resolution.
 *
 * Manifests are hand-authored JSON files produced from real, observed portal
 * inspection (Vijay's output). This module never fabricates or overwrites a
 * manifest — it only loads, validates against the shared contract, and turns
 * a LocatorSpec into a Playwright Locator. It never evaluates manifest
 * strings as code: `css` locators are passed to Playwright's own selector
 * engine as plain strings, `role`/`label` locators use Playwright's built-in
 * accessible-name matching. There is no eval(), no Function(), no template
 * execution of manifest content anywhere in this file.
 */
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import type { Page, Locator } from "playwright";
import { PortalManifest, LocatorSpec, validateManifest } from "../../shared/contracts";

function manifestsDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "manifests");
  }
  return path.join(__dirname, "..", "..", "..", "..", "manifests");
}

export interface LoadedManifest {
  fileName: string;
  manifest: PortalManifest | null;
  errors: string[];
}

export function loadAllManifests(): LoadedManifest[] {
  const dir = manifestsDir();
  if (!fs.existsSync(dir)) return [];
  const results: LoadedManifest[] = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
    } catch (err) {
      results.push({ fileName: f, manifest: null, errors: [`Invalid JSON: ${(err as Error).message}`] });
      continue;
    }
    const { manifest, errors } = validateManifest(raw);
    if (errors.length > 0) {
      console.error(`Manifest "${f}" rejected:`, errors);
    }
    results.push({ fileName: f, manifest, errors });
  }
  return results;
}

export function listValidManifests(): PortalManifest[] {
  return loadAllManifests()
    .map((r) => r.manifest)
    .filter((m): m is PortalManifest => m !== null);
}

export function getManifest(portalId: string): PortalManifest | null {
  return listValidManifests().find((m) => m.portalId === portalId) ?? null;
}

export function getManifestForService(serviceId: string, jurisdiction: string): PortalManifest | null {
  return listValidManifests().find((m) => m.serviceId === serviceId && m.jurisdiction === jurisdiction) ?? null;
}

/** Turns manifest data into a Playwright Locator. No manifest string is ever executed as code. */
export function toLocator(page: Page, spec: LocatorSpec): Locator {
  switch (spec.strategy) {
    case "label":
      return page.getByLabel(spec.value, { exact: spec.exact ?? false });
    case "role":
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return page.getByRole(spec.role as any, { name: spec.value, exact: spec.exact ?? false });
    case "css":
      return page.locator(spec.value);
  }
}
