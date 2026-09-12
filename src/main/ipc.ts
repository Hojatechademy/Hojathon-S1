/**
 * Narrow, validated IPC bridge handlers and event publication. Every handler:
 *   1. Confirms the request came from our own main window's webContents
 *      (rejects anything from a devtools extension page, a stray webview, etc).
 *   2. Parses the payload with the shared zod contract before touching
 *      storage or the browser — a malformed/hostile payload is rejected with
 *      a clear error instead of reaching case-store/file-store/browser code.
 */
import { ipcMain, BrowserWindow, dialog, IpcMainInvokeEvent } from "electron";
import {
  IpcChannels,
  SetFieldRequest,
  AttachFileRequest,
  ApproveRequest,
  SetSettingsRequest,
  BrowserEvent
} from "../shared/contracts";
import * as caseStore from "./storage/case-store";
import * as fileStore from "./storage/file-store";
import * as settingsStore from "./storage/settings-store";
import * as manifestStore from "./browser/manifest";
import * as browserManager from "./browser/manager";
import * as demoController from "./demo-controller";
import { MOCK_PORTAL_URL, AUTO_RUN_DEMO } from "./config";
import * as intakeOrchestrator from "./ai/openrouter-intake";
import { writeReviewedApplication } from "./ai/draft-to-application";
import * as voiceSession from "./ai/voice-session";

export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null): void {
  function assertTrustedSender(event: IpcMainInvokeEvent): void {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    const mainWindow = getMainWindow();
    if (!senderWindow || senderWindow !== mainWindow) {
      throw new Error("Rejected: IPC call from an untrusted sender.");
    }
  }

  browserManager.setEventEmitter((partial) => {
    const evt: BrowserEvent = { timestamp: new Date().toISOString(), ...partial };
    getMainWindow()?.webContents.send(IpcChannels.browserEvent, evt);
  });

  ipcMain.handle(IpcChannels.aiSendMessage, (event, text: unknown) => {
    assertTrustedSender(event);
    if (typeof text !== "string") throw new Error("text must be a string.");
    return intakeOrchestrator.sendMessage(text);
  });

  ipcMain.handle(IpcChannels.aiGetDraft, (event) => {
    assertTrustedSender(event);
    return intakeOrchestrator.getDraft();
  });

  ipcMain.handle(IpcChannels.aiResetDraft, (event) => {
    assertTrustedSender(event);
    return intakeOrchestrator.resetDraft();
  });

  ipcMain.handle(IpcChannels.aiReviewAndPrepare, async (event, useDemoDocuments: unknown) => {
    assertTrustedSender(event);
    if (typeof useDemoDocuments !== "boolean") throw new Error("useDemoDocuments must be a boolean.");
    const jsonPath = writeReviewedApplication(intakeOrchestrator.getDraft(), useDemoDocuments);
    return demoController.loadAndValidate(jsonPath);
  });

  voiceSession.setTranscriptListener((text, final) => {
    getMainWindow()?.webContents.send(IpcChannels.aiVoiceTranscript, text, final);
  });

  ipcMain.handle(IpcChannels.aiVoiceAvailable, (event) => {
    assertTrustedSender(event);
    return voiceSession.isVoiceAvailable();
  });

  ipcMain.handle(IpcChannels.aiVoiceStart, (event) => {
    assertTrustedSender(event);
    return voiceSession.startVoice();
  });

  ipcMain.handle(IpcChannels.aiVoiceAudioChunk, (event, base64: unknown) => {
    assertTrustedSender(event);
    if (typeof base64 !== "string" || base64.length === 0) throw new Error("Invalid audio chunk.");
    if (base64.length > 200_000) throw new Error("Audio chunk too large."); // ~150KB of PCM per chunk is already generous
    voiceSession.pushAudioChunk(base64);
  });

  ipcMain.handle(IpcChannels.aiVoiceStop, (event) => {
    assertTrustedSender(event);
    return voiceSession.stopVoice();
  });

  ipcMain.handle(IpcChannels.demoLoadSample, (event) => {
    assertTrustedSender(event);
    return demoController.loadAndValidate(demoController.defaultSamplePath());
  });

  ipcMain.handle(IpcChannels.demoLoadJsonFile, async (event) => {
    assertTrustedSender(event);
    const mainWindow = getMainWindow();
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [{ name: "Application JSON", extensions: ["json"] }]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return demoController.loadAndValidate(result.filePaths[0]);
  });

  ipcMain.handle(IpcChannels.demoGetCurrentReview, (event) => {
    assertTrustedSender(event);
    return demoController.getCurrentReview();
  });

  ipcMain.handle(IpcChannels.demoStart, (event, digest: unknown) => {
    assertTrustedSender(event);
    if (typeof digest !== "string") throw new Error("digest must be a string.");
    return demoController.startDemo(digest);
  });

  ipcMain.handle(IpcChannels.demoPause, (event) => {
    assertTrustedSender(event);
    browserManager.pause();
  });

  ipcMain.handle(IpcChannels.demoResume, (event) => {
    assertTrustedSender(event);
    browserManager.resume();
  });

  ipcMain.handle(IpcChannels.demoStop, (event) => {
    assertTrustedSender(event);
    browserManager.requestStop();
    if (browserManager.currentState() === "paused") browserManager.resume(); // unblock a paused wait so the stop takes effect
  });

  ipcMain.handle(IpcChannels.demoGetConfig, (event) => {
    assertTrustedSender(event);
    return { mockPortalUrl: MOCK_PORTAL_URL, autoRun: AUTO_RUN_DEMO };
  });

  ipcMain.handle(IpcChannels.caseCreate, (event, jurisdiction: unknown) => {
    assertTrustedSender(event);
    if (typeof jurisdiction !== "string" || jurisdiction.trim() === "") {
      throw new Error("jurisdiction must be a non-empty string.");
    }
    return caseStore.createCase(jurisdiction);
  });

  ipcMain.handle(IpcChannels.caseGet, (event, caseId: unknown) => {
    assertTrustedSender(event);
    if (typeof caseId !== "string") throw new Error("caseId must be a string.");
    return caseStore.getCase(caseId);
  });

  ipcMain.handle(IpcChannels.caseList, (event) => {
    assertTrustedSender(event);
    return caseStore.listCases();
  });

  ipcMain.handle(IpcChannels.caseSetField, (event, req: unknown) => {
    assertTrustedSender(event);
    const parsed = SetFieldRequest.parse(req);
    return caseStore.setField(parsed.caseId, parsed.fieldKey, parsed.value, parsed.status);
  });

  ipcMain.handle(IpcChannels.caseAddNote, (event, caseId: unknown, text: unknown) => {
    assertTrustedSender(event);
    if (typeof caseId !== "string" || typeof text !== "string") throw new Error("Invalid addNote payload.");
    return caseStore.addNote(caseId, text);
  });

  ipcMain.handle(IpcChannels.caseAttachFile, (event, req: unknown) => {
    assertTrustedSender(event);
    const parsed = AttachFileRequest.parse(req);
    const file = fileStore.importPendingFile(parsed.pendingFileToken, parsed.documentType ?? null);
    return caseStore.addFile(parsed.caseId, file);
  });

  ipcMain.handle(IpcChannels.caseRemoveFile, (event, caseId: unknown, fileId: unknown) => {
    assertTrustedSender(event);
    if (typeof caseId !== "string" || typeof fileId !== "string") throw new Error("Invalid removeFile payload.");
    const { case: updated, removed } = caseStore.removeFileRecord(caseId, fileId);
    if (removed) fileStore.deleteStoredFile(removed.storedName);
    return updated;
  });

  ipcMain.handle(IpcChannels.caseValidate, (event, caseId: unknown) => {
    assertTrustedSender(event);
    if (typeof caseId !== "string") throw new Error("caseId must be a string.");
    const c = caseStore.getCase(caseId);
    const manifest = c ? manifestStore.getManifestForService(c.serviceId, c.jurisdiction) : null;
    return caseStore.validateCase(caseId, manifest);
  });

  ipcMain.handle(IpcChannels.caseApprove, (event, req: unknown) => {
    assertTrustedSender(event);
    const parsed = ApproveRequest.parse(req);
    const c = caseStore.getCase(parsed.caseId);
    if (!c) throw new Error("Case not found.");
    const manifest = manifestStore.getManifestForService(c.serviceId, c.jurisdiction);
    if (!manifest) throw new Error("No verified portal manifest available yet for this jurisdiction/service.");
    return caseStore.approveCase(parsed.caseId, parsed.expectedRevision, manifest, parsed.approvedActionIds);
  });

  ipcMain.handle(IpcChannels.manifestList, (event) => {
    assertTrustedSender(event);
    return manifestStore.listValidManifests();
  });

  ipcMain.handle(IpcChannels.manifestGet, (event, portalId: unknown) => {
    assertTrustedSender(event);
    if (typeof portalId !== "string") throw new Error("portalId must be a string.");
    return manifestStore.getManifest(portalId);
  });

  ipcMain.handle(IpcChannels.settingsGet, (event) => {
    assertTrustedSender(event);
    return settingsStore.getSettings();
  });

  ipcMain.handle(IpcChannels.settingsSet, (event, req: unknown) => {
    assertTrustedSender(event);
    const parsed = SetSettingsRequest.parse(req);
    return settingsStore.setSettings(parsed);
  });

  ipcMain.handle(IpcChannels.browserDiagnostics, (event) => {
    assertTrustedSender(event);
    return browserManager.getDiagnostics();
  });

  ipcMain.handle(IpcChannels.browserOpenForLogin, (event) => {
    assertTrustedSender(event);
    const settings = settingsStore.getSettings();
    if (!settings.officialStartUrl) {
      throw new Error("No government URL configured yet. Set it in Portal Settings first.");
    }
    const manifest = settings.jurisdiction
      ? manifestStore.getManifestForService("income_certificate", settings.jurisdiction)
      : null;
    const allowedOrigins = manifest ? [...manifest.allowedOrigins, ...manifest.authenticationOrigins] : [];
    return browserManager.openForLogin(settings.officialStartUrl, null, allowedOrigins);
  });

  ipcMain.handle(IpcChannels.browserCheckPage, (event) => {
    assertTrustedSender(event);
    return browserManager.checkPage();
  });

  ipcMain.handle(IpcChannels.browserPause, (event) => {
    assertTrustedSender(event);
    browserManager.pause();
  });

  ipcMain.handle(IpcChannels.browserResume, (event) => {
    assertTrustedSender(event);
    browserManager.resume();
  });

  ipcMain.handle(IpcChannels.browserClose, (event) => {
    assertTrustedSender(event);
    return browserManager.close();
  });

  ipcMain.handle(IpcChannels.dialogPickFiles, async (event) => {
    assertTrustedSender(event);
    const mainWindow = getMainWindow();
    if (!mainWindow) return [];
    const result = await dialog.showOpenDialog(mainWindow, { properties: ["openFile", "multiSelections"] });
    if (result.canceled) return [];
    return fileStore.registerPickedFiles(result.filePaths);
  });
}
