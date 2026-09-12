/**
 * Local, temporary settings: the government URL/jurisdiction Mohan configures
 * by hand until Vijay's real portal manifest exists. This NEVER enables
 * filling — it only feeds "Open Government Website" for manual, human login.
 * Filling is gated exclusively on a validated PortalManifest (see manifest.ts).
 */
import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import { PortalSettings } from "../../shared/contracts";

function settingsPath(): string {
  const dir = app.getPath("userData");
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  return path.join(dir, "settings.json");
}

const DEFAULTS: PortalSettings = { jurisdiction: null, officialStartUrl: null };

export function getSettings(): PortalSettings {
  try {
    const raw = fs.readFileSync(settingsPath(), "utf-8");
    return PortalSettings.parse(JSON.parse(raw));
  } catch {
    return DEFAULTS;
  }
}

export function setSettings(next: PortalSettings): PortalSettings {
  const parsed = PortalSettings.parse(next);
  fs.writeFileSync(settingsPath(), JSON.stringify(parsed, null, 2), { encoding: "utf-8", mode: 0o600 });
  return parsed;
}
