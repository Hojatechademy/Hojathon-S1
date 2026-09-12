import React, { useEffect, useState } from "react";
import type { PortalManifest, PortalSettings, BrowserDiagnostics, BrowserEvent } from "@shared/contracts";

interface Props {
  manifest: PortalManifest | null;
  events: BrowserEvent[];
}

/**
 * M1: lets Mohan configure the government URL/jurisdiction until Vijay's
 * manifest exists, shows portal status ("Portal mapping pending" when no
 * verified manifest is loaded), runs browser dependency diagnostics, and
 * drives the manual-login browser lifecycle (open/check/pause/resume/close).
 * There is no "fill" control here — that arrives at Milestone M2.
 */
export default function PortalPanel({ manifest, events }: Props) {
  const [settings, setSettingsState] = useState<PortalSettings>({ jurisdiction: null, officialStartUrl: null });
  const [urlInput, setUrlInput] = useState("");
  const [jurisdictionInput, setJurisdictionInput] = useState("");
  const [diagnostics, setDiagnostics] = useState<BrowserDiagnostics | null>(null);
  const [browserState, setBrowserState] = useState<"closed" | "opening" | "open" | "paused">("closed");
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    window.api.getSettings().then((s) => {
      setSettingsState(s);
      setUrlInput(s.officialStartUrl ?? "");
      setJurisdictionInput(s.jurisdiction ?? "");
    });
    window.api.getBrowserDiagnostics().then(setDiagnostics);
  }, []);

  useEffect(() => {
    const latest = events[events.length - 1];
    if (!latest) return;
    if (latest.type === "browser_opened") setBrowserState("opening");
    if (latest.type === "awaiting_user" || latest.type === "page_ready" || latest.type === "resumed") setBrowserState("open");
    if (latest.type === "paused") setBrowserState("paused");
    if (latest.type === "closed" || latest.type === "failed") setBrowserState("closed");
  }, [events]);

  async function saveSettings() {
    const next = await window.api.setSettings({
      jurisdiction: jurisdictionInput.trim() || null,
      officialStartUrl: urlInput.trim() || null
    });
    setSettingsState(next);
    setActionError(null);
  }

  async function openWebsite() {
    try {
      await window.api.openGovernmentWebsite();
      setActionError(null);
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  async function doCheckPage() {
    try {
      const result = await window.api.checkPage();
      setLastCheck(`${result.title || "(no title)"} — ${result.url}`);
      setActionError(null);
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  async function doPause() {
    try {
      await window.api.pauseBrowser();
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  async function doResume() {
    try {
      await window.api.resumeBrowser();
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  async function doClose() {
    try {
      await window.api.closeBrowser();
      setLastCheck(null);
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  return (
    <section className="portal-panel">
      <h3>Portal status</h3>
      {manifest ? (
        <p>
          Manifest loaded: <strong>{manifest.portalId}</strong> — <span className={`status-${manifest.status}`}>{manifest.status}</span>
        </p>
      ) : (
        <p className="warning">Portal mapping pending — no verified manifest for this jurisdiction yet. Filling stays disabled until one is imported.</p>
      )}

      <h4>Browser dependency</h4>
      {diagnostics ? (
        diagnostics.chromiumInstalled ? (
          <p className="diagnostics-ok">Chromium found at {diagnostics.executablePath}</p>
        ) : (
          <p className="diagnostics-missing">
            Chromium not installed. Run <code className="inline">{diagnostics.installCommand}</code> then restart the app.
          </p>
        )
      ) : (
        <p className="muted">Checking...</p>
      )}

      <h4>Government URL (temporary, until Vijay's manifest exists)</h4>
      <div>
        <input placeholder="Jurisdiction, e.g. kerala" value={jurisdictionInput} onChange={(e) => setJurisdictionInput(e.target.value)} />
      </div>
      <div>
        <input placeholder="https://... official portal URL" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
        <button onClick={saveSettings}>Save</button>
      </div>
      {settings.officialStartUrl && !settings.officialStartUrl.startsWith("https://") && (
        <p className="warning">Saved URL is not https:// — opening will be refused.</p>
      )}

      <h4>Browser controls</h4>
      <div className="browser-controls">
        <button disabled={browserState !== "closed" || !settings.officialStartUrl} onClick={openWebsite}>
          Open Government Website
        </button>
        <button disabled={browserState === "closed"} onClick={doCheckPage}>
          I've finished — check page
        </button>
        <button disabled={browserState !== "open"} onClick={doPause}>
          Pause
        </button>
        <button disabled={browserState !== "paused"} onClick={doResume}>
          Resume
        </button>
        <button disabled={browserState === "closed"} onClick={doClose}>
          Close
        </button>
        <span className="muted"> State: {browserState}</span>
      </div>
      {lastCheck && <p className="muted">Last check: {lastCheck}</p>}
      {actionError && <p className="error-banner">{actionError}</p>}
      <p className="muted">
        Login, OTP and CAPTCHA are always yours to complete in the opened window. The app never asks you to paste a password or OTP here.
      </p>
    </section>
  );
}
