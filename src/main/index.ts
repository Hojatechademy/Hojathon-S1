/**
 * Electron app lifecycle only. IPC handler registration lives in ipc.ts.
 *
 * Renderer hardening: nodeIntegration=false, contextIsolation=true,
 * sandbox=true, a restrictive CSP applied via response headers (not a
 * <meta> tag, so it can differ between the dev server and the packaged
 * app), no arbitrary navigation and no window.open popups. Government
 * pages are NEVER loaded here — only in the separate Playwright-controlled
 * Chromium instance (see browser/manager.ts).
 *
 * NOTE on sandbox:true: a sandboxed preload script cannot use plain
 * require() to resolve relative project files (only a small built-in
 * allow-list), so the preload is bundled into one self-contained file with
 * esbuild (see package.json "build:preload") instead of compiled by tsc
 * alongside main.
 */
import { app, BrowserWindow, session } from "electron";
import path from "node:path";
import dotenv from "dotenv";

// Load .env (GEMINI_API_KEY, GEMINI_MODEL) before anything else touches
// process.env. Never logged; the renderer never receives these values
// directly — only main-process AI code reads them.
dotenv.config({ path: path.join(__dirname, "..", "..", "..", ".env") });

import { registerIpcHandlers } from "./ipc";
import * as browserManager from "./browser/manager";

let mainWindow: BrowserWindow | null = null;

// Vite dev mode + React Fast Refresh inject a small inline bootstrap script,
// so the dev CSP must allow 'unsafe-inline' for script-src. The packaged app
// never needs that — it gets the strict policy.
const DEV_CSP =
  "default-src 'self' http://localhost:5173 ws://localhost:5173; script-src 'self' 'unsafe-inline' http://localhost:5173; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws://localhost:5173 http://localhost:5173";
const PROD_CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'";

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "..", "..", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const devServerUrl = process.env.ELECTRON_RENDERER_URL;
  const allowedLoadOrigin = devServerUrl ? new URL(devServerUrl).origin : "file://";

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (new URL(url).origin !== allowedLoadOrigin) {
      event.preventDefault();
    }
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  // Electron blocks every permission request by default. Allow only the
  // microphone (for voice input) from our own window; deny everything else
  // (camera, geolocation, notifications, etc.) explicitly.
  mainWindow.webContents.session.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === "media");
  });

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "..", "..", "dist-renderer", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const devServerUrl = process.env.ELECTRON_RENDERER_URL;
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isDevServerResponse = !!devServerUrl && details.url.startsWith(devServerUrl);
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [isDevServerResponse ? DEV_CSP : PROD_CSP]
      }
    });
  });

  registerIpcHandlers(() => mainWindow);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", (event) => {
  if (browserManager.isActive()) {
    event.preventDefault();
    browserManager.close().finally(() => app.quit());
  }
});
