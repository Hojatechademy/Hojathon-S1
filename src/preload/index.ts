/**
 * Explicitly exposed methods only — the renderer never gets raw ipcRenderer.
 * Compatible with sandbox:true (uses only electron's contextBridge/ipcRenderer,
 * no Node builtins).
 */
import { contextBridge, ipcRenderer } from "electron";
import { IpcChannels, RendererApi, BrowserEvent } from "../shared/contracts";

const api: RendererApi = {
  aiSendMessage: (text) => ipcRenderer.invoke(IpcChannels.aiSendMessage, text),
  aiGetDraft: () => ipcRenderer.invoke(IpcChannels.aiGetDraft),
  aiResetDraft: () => ipcRenderer.invoke(IpcChannels.aiResetDraft),
  aiReviewAndPrepare: (useDemoDocuments, manualAttachmentTokens) => ipcRenderer.invoke(IpcChannels.aiReviewAndPrepare, useDemoDocuments, manualAttachmentTokens),
  aiVoiceAvailable: () => ipcRenderer.invoke(IpcChannels.aiVoiceAvailable),
  aiVoiceStart: () => ipcRenderer.invoke(IpcChannels.aiVoiceStart),
  aiVoiceAudioChunk: (base64) => ipcRenderer.invoke(IpcChannels.aiVoiceAudioChunk, base64),
  aiVoiceStop: () => ipcRenderer.invoke(IpcChannels.aiVoiceStop),
  onVoiceTranscript: (cb: (text: string, final: boolean) => void) => {
    const listener = (_e: Electron.IpcRendererEvent, text: string, final: boolean) => cb(text, final);
    ipcRenderer.on(IpcChannels.aiVoiceTranscript, listener);
    return () => ipcRenderer.removeListener(IpcChannels.aiVoiceTranscript, listener);
  },
  loadSampleApplication: () => ipcRenderer.invoke(IpcChannels.demoLoadSample),
  loadApplicationFromDialog: () => ipcRenderer.invoke(IpcChannels.demoLoadJsonFile),
  getCurrentReview: () => ipcRenderer.invoke(IpcChannels.demoGetCurrentReview),
  startDemo: (digest) => ipcRenderer.invoke(IpcChannels.demoStart, digest),
  pauseDemo: () => ipcRenderer.invoke(IpcChannels.demoPause),
  resumeDemo: () => ipcRenderer.invoke(IpcChannels.demoResume),
  stopDemo: () => ipcRenderer.invoke(IpcChannels.demoStop),
  getDemoConfig: () => ipcRenderer.invoke(IpcChannels.demoGetConfig),
  createCase: (jurisdiction) => ipcRenderer.invoke(IpcChannels.caseCreate, jurisdiction),
  getCase: (caseId) => ipcRenderer.invoke(IpcChannels.caseGet, caseId),
  listCases: () => ipcRenderer.invoke(IpcChannels.caseList),
  setField: (req) => ipcRenderer.invoke(IpcChannels.caseSetField, req),
  addNote: (caseId, text) => ipcRenderer.invoke(IpcChannels.caseAddNote, caseId, text),
  attachFile: (req) => ipcRenderer.invoke(IpcChannels.caseAttachFile, req),
  removeFile: (caseId, fileId) => ipcRenderer.invoke(IpcChannels.caseRemoveFile, caseId, fileId),
  validateCase: (caseId) => ipcRenderer.invoke(IpcChannels.caseValidate, caseId),
  approveCase: (req) => ipcRenderer.invoke(IpcChannels.caseApprove, req),
  listManifests: () => ipcRenderer.invoke(IpcChannels.manifestList),
  getManifest: (portalId) => ipcRenderer.invoke(IpcChannels.manifestGet, portalId),
  getSettings: () => ipcRenderer.invoke(IpcChannels.settingsGet),
  setSettings: (req) => ipcRenderer.invoke(IpcChannels.settingsSet, req),
  getBrowserDiagnostics: () => ipcRenderer.invoke(IpcChannels.browserDiagnostics),
  openGovernmentWebsite: () => ipcRenderer.invoke(IpcChannels.browserOpenForLogin),
  checkPage: () => ipcRenderer.invoke(IpcChannels.browserCheckPage),
  pauseBrowser: () => ipcRenderer.invoke(IpcChannels.browserPause),
  resumeBrowser: () => ipcRenderer.invoke(IpcChannels.browserResume),
  closeBrowser: () => ipcRenderer.invoke(IpcChannels.browserClose),
  pickFiles: () => ipcRenderer.invoke(IpcChannels.dialogPickFiles),
  onBrowserEvent: (cb: (event: BrowserEvent) => void) => {
    const listener = (_e: Electron.IpcRendererEvent, evt: BrowserEvent) => cb(evt);
    ipcRenderer.on(IpcChannels.browserEvent, listener);
    return () => ipcRenderer.removeListener(IpcChannels.browserEvent, listener);
  }
};

contextBridge.exposeInMainWorld("api", api);
