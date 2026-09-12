import React, { useEffect, useRef, useState } from "react";
import type { DemoReviewPayload, BrowserEvent, DemoRunSummary, IntakeDraftSnapshot, ConversationEntry } from "@shared/contracts";
import { MOCK_DOC_SPECS } from "@shared/contracts";
import ActivityLog from "./components/ActivityLog";
import { startVoiceCapture, MIN_VOICE_SAMPLES, VoiceCaptureHandle } from "./voice-capture";

type RunState = "idle" | "running" | "paused" | "finished";

const FIELD_GROUPS: { title: string; keys: string[] }[] = [
  { title: "Personal details", keys: ["fullName", "gender", "dob", "fatherName", "relation"] },
  { title: "Address & contact", keys: ["address", "district", "taluk", "village", "pincode", "mobile", "email"] },
  { title: "Income (Rs./year)", keys: ["land", "salary", "business", "labour", "nri", "rent"] },
  { title: "Certificate details", keys: ["purpose", "certLang", "aadhaar", "ration"] }
];

const EXAMPLE_TEXT =
  "My name is Fictional Demo Applicant. I live in Ernakulam. I need an income certificate for a bank loan in English. My salary is 180000 per year.";

export default function App() {
  const [config, setConfig] = useState<{ mockPortalUrl: string; autoRun: boolean } | null>(null);
  const [draft, setDraft] = useState<IntakeDraftSnapshot | null>(null);
  const [prevFieldValues, setPrevFieldValues] = useState<Record<string, string | null>>({});
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());
  const [composerText, setComposerText] = useState("");
  const [pendingPrompt, setPendingPrompt] = useState<ConversationEntry | null>(null);
  const [sending, setSending] = useState(false);
  const [activityLine, setActivityLine] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [useDemoDocuments, setUseDemoDocuments] = useState(true);

  const [voiceAvailable, setVoiceAvailable] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const voiceHandleRef = useRef<VoiceCaptureHandle | null>(null);

  const [review, setReview] = useState<DemoReviewPayload | null>(null);
  const [events, setEvents] = useState<BrowserEvent[]>([]);
  const [runState, setRunState] = useState<RunState>("idle");
  const [summary, setSummary] = useState<DemoRunSummary | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const autoRunTriggered = useRef(false);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.api.getDemoConfig().then(setConfig);
    window.api.aiGetDraft().then(setDraft);
    window.api.aiVoiceAvailable().then(setVoiceAvailable);
    const unsubscribeVoice = window.api.onVoiceTranscript((text, final) => {
      setComposerText(text);
      if (final) setRecording(false);
    });
    const unsubscribe = window.api.onBrowserEvent((evt) => {
      setEvents((prev) => [...prev, evt]);
      if (evt.type === "browser_opened") setRunState("running");
      if (evt.type === "paused") setRunState("paused");
      if (evt.type === "resumed") setRunState("running");
      if (evt.type === "finished") {
        setRunState("finished");
        if (evt.summary) setSummary(evt.summary);
      }
      if (evt.type === "failed" || evt.type === "closed") setRunState("finished");
    });
    return () => {
      unsubscribe();
      unsubscribeVoice();
    };
  }, []);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [draft?.conversation.length, pendingPrompt?.id, sending]);

  useEffect(() => {
    if (!config?.autoRun || autoRunTriggered.current) return;
    autoRunTriggered.current = true;
    // demo:auto still loads the fixed sample through the existing manual path — the AI path is opt-in via the chat.
    (async () => {
      const r = await window.api.loadSampleApplication();
      setReview(r);
      if (r.validation.ok && r.validation.digest) await handleStart(r.validation.digest);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  async function handleSend() {
    const text = composerText.trim();
    if (!text || sending) return;
    setSending(true);
    setAiError(null);
    setActivityLine("Working through your details");
    setPendingPrompt({
      id: `pending-${Date.now()}`,
      role: "user",
      text,
      at: new Date().toISOString()
    });
    setComposerText("");

    const before = draft?.fields ?? {};
    const beforeValues: Record<string, string | null> = {};
    for (const k of Object.keys(before)) beforeValues[k] = before[k].value;

    try {
      const result = await window.api.aiSendMessage(text);
      const changed = new Set<string>();
      for (const k of Object.keys(result.draft.fields)) {
        if (result.draft.fields[k].value !== beforeValues[k] && result.draft.fields[k].value !== null) changed.add(k);
      }
      setRecentlyUpdated(changed);
      setPrevFieldValues(beforeValues);
      setDraft(result.draft);
      setPendingPrompt(null);
      setActivityLine(
        changed.size > 0
          ? `Updated ${changed.size} detail${changed.size === 1 ? "" : "s"}`
          : result.draft.pendingClarification
            ? "Waiting for your confirmation"
            : "Checking missing information"
      );
      setTimeout(() => setRecentlyUpdated(new Set()), 4000);
    } catch (e) {
      setAiError((e as Error).message);
      setActivityLine(null);
      setPendingPrompt(null);
      setComposerText(text); // preserve the input the user typed
    } finally {
      setSending(false);
    }
  }

  function handleTryExample() {
    setComposerText(EXAMPLE_TEXT);
  }

  async function handleMicClick() {
    if (recording) {
      setRecording(false);
      const handle = voiceHandleRef.current;
      voiceHandleRef.current = null;
      const { samples } = (await handle?.stop()) ?? { samples: 0 };
      if (samples < MIN_VOICE_SAMPLES) {
        setVoiceError("Didn't catch that — try speaking a little longer.");
      }
      try {
        await window.api.aiVoiceStop();
      } catch (e) {
        setVoiceError((e as Error).message);
      }
      return;
    }

    setVoiceError(null);
    try {
      await window.api.aiVoiceStart();
    } catch (e) {
      setVoiceError((e as Error).message);
      return;
    }
    const handle = await startVoiceCapture(
      (base64) => {
        window.api.aiVoiceAudioChunk(base64).catch(() => {
          // A dropped chunk is not fatal — the rest of the utterance still streams.
        });
      },
      (_kind, message) => {
        setVoiceError(message);
        setRecording(false);
      }
    );
    if (handle) {
      voiceHandleRef.current = handle;
      setComposerText("");
      setRecording(true);
    }
  }

  // Stop mic capture if the component unmounts mid-recording.
  useEffect(
    () => () => {
      voiceHandleRef.current?.stop();
    },
    []
  );

  async function handleResetConversation() {
    const fresh = await window.api.aiResetDraft();
    setDraft(fresh);
    setReview(null);
    setSummary(null);
    setEvents([]);
    setRunState("idle");
  }

  async function handleReviewAndFill() {
    setBusy(true);
    setRunError(null);
    setActivityLine("Preparing the portal…");
    try {
      const r = await window.api.aiReviewAndPrepare(useDemoDocuments);
      setReview(r);
      setEvents([]);
      setSummary(null);
      setRunState("idle");
    } catch (e) {
      setRunError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleStart(explicitDigest?: string) {
    const digest = explicitDigest ?? review?.validation.digest;
    if (!digest) return;
    setRunError(null);
    try {
      await window.api.startDemo(digest);
    } catch (e) {
      setRunError((e as Error).message);
    }
  }
  async function handlePause() {
    try { await window.api.pauseDemo(); } catch (e) { setRunError((e as Error).message); }
  }
  async function handleResume() {
    try { await window.api.resumeDemo(); } catch (e) { setRunError((e as Error).message); }
  }
  async function handleStop() {
    try { await window.api.stopDemo(); } catch (e) { setRunError((e as Error).message); }
  }

  const readiness = draft?.readiness;
  const missingCount = readiness ? readiness.missingRequired.length : null;
  const canStart = !!review?.validation.ok && !!review.validation.digest && runState === "idle";
  const displayedConversation = pendingPrompt ? [...(draft?.conversation ?? []), pendingPrompt] : (draft?.conversation ?? []);
  const completedCount = draft ? Object.values(draft.fields).filter((field) => !!field.value).length : 0;
  const totalFieldCount = draft ? Object.keys(draft.fields).length : FIELD_GROUPS.reduce((sum, group) => sum + group.keys.length, 0);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">ServiceReady Kerala</p>
          <h1>Income Certificate Assistant <span className="badge">Demo portal</span></h1>
        </div>
        <div className="header-status">
          <span>{completedCount}/{totalFieldCount} fields captured</span>
          <span>{missingCount === null ? "Preparing draft" : missingCount === 0 ? "Ready for review" : `${missingCount} missing`}</span>
        </div>
      </header>

      <div className="intake-layout">
        {/* LEFT: conversation */}
        <section className="chat-pane">
          <div className="chat-toolbar">
            <div>
              <h2>AI Intake</h2>
              <p>Share applicant details in natural language. The draft updates as the assistant understands them.</p>
            </div>
            <div className={`live-dot ${sending ? "active" : ""}`}><span />{sending ? "Thinking" : "Online"}</div>
          </div>
          <div className="conversation">
            {displayedConversation.length === 0 && (
              <div className="empty-chat">
                <h3>Start with the applicant story</h3>
                <p>Name, district, purpose, income and contact details are enough to begin.</p>
              </div>
            )}
            {displayedConversation.map((m) => (
              <div key={m.id} className={`message-row ${m.role}`}>
                <div className={`avatar ${m.role}`}>{m.role === "user" ? "You" : "AI"}</div>
                <div className={`bubble ${m.role}`}>{m.text}</div>
              </div>
            ))}
            {sending && (
              <div className="message-row assistant">
                <div className="avatar assistant">AI</div>
                <div className="bubble assistant thinking-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="thinking-copy">Analyzing and updating the form</span>
                </div>
              </div>
            )}
            {!sending && activityLine && <div className="activity-line">{activityLine}</div>}
            {aiError && <div className="error-banner">{aiError}</div>}
            <div ref={conversationEndRef} />
          </div>

          <div className="composer">
            <textarea
              rows={2}
              placeholder="Type your details here…"
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
            />
            <div className="composer-actions">
              <button onClick={handleSend} disabled={sending || !composerText.trim() || recording}>{sending ? "Sending…" : "Send"}</button>
              <button
                className={`mic${recording ? " active" : ""}`}
                onClick={handleMicClick}
                disabled={voiceAvailable === false || voiceAvailable === null}
                title={
                  voiceAvailable === false
                    ? "Voice input unavailable — GEMINI_API_KEY/GEMINI_MODEL not configured."
                    : recording
                      ? "Stop recording"
                      : "Speak your details"
                }
              >
                {recording ? "■" : "🎤"}
              </button>
              {recording && <span className="activity-line" style={{ alignSelf: "center" }}>🔴 Listening…</span>}
              {voiceError && <span className="error-banner" style={{ padding: "2px 8px", fontSize: 12 }}>{voiceError}</span>}
              <label style={{ fontSize: 12.5 }}>
                <input type="checkbox" checked={useDemoDocuments} onChange={(e) => setUseDemoDocuments(e.target.checked)} /> Use demo documents
              </label>
              <div className="spacer" />
              <button className="link-button" onClick={handleTryExample} disabled={sending}>Try example</button>
              <button className="link-button" onClick={handleResetConversation} disabled={sending}>Start over</button>
            </div>
          </div>
        </section>

        {/* RIGHT: live application summary */}
        <section className="summary-pane">
          <div className="summary-header">
            <div>
              <p className="eyebrow">Live Draft</p>
              <h3>Application status</h3>
            </div>
            <span className={`readiness-pill ${missingCount === 0 ? "ready" : ""}`}>
              {missingCount === null ? "Loading" : missingCount === 0 ? "Ready" : `${missingCount} missing`}
            </span>
          </div>

          {draft?.pendingClarification && (
            <div className="clarification-banner">
              <b>Needs your input:</b> {draft.pendingClarification.question}
            </div>
          )}

          {FIELD_GROUPS.map((group) => (
            <div className="field-group" key={group.title}>
              <h4>{group.title}</h4>
              {group.keys.map((key) => {
                const field = draft?.fields[key];
                const isMissing = !field?.value;
                return (
                  <div key={key} className={`field-row ${isMissing ? "missing" : ""} ${recentlyUpdated.has(key) ? "recent" : ""}`}>
                    <span className="fk">{key}</span>
                    <span className="fv">{field?.value ?? "— not provided"}</span>
                  </div>
                );
              })}
            </div>
          ))}

          <div className="field-group">
            <h4>Documents</h4>
            <div className="field-row">
              <span className="fk">Demo fixture set (6 files)</span>
              <span className="fv">{useDemoDocuments ? "Selected" : "Not selected"}</span>
            </div>
            <div className="field-row"><span className="muted">Files are selected for the portal form — not uploaded to any server.</span></div>
          </div>

          <button className="primary-action" disabled={busy || missingCount === null || missingCount > 0} onClick={handleReviewAndFill}>
            Review &amp; Fill Application
          </button>
          {missingCount !== null && missingCount > 0 && (
            <p className="muted">Answer the missing required items above before reviewing.</p>
          )}

          {review && (
            <>
              <hr />
              <h4>Reviewed application (revision {draft?.revision ?? "?"})</h4>
              <table className="fields-table">
                <thead><tr><th>Document</th><th>Status</th></tr></thead>
                <tbody>
                  {MOCK_DOC_SPECS.map((d) => {
                    const resolved = review.validation.resolvedAttachments.find((a) => a.fieldKey === d.key);
                    const issue = review.validation.issues.find((i) => i.fieldKey === d.key);
                    return (
                      <tr key={d.key}>
                        <td>{d.label}</td>
                        <td>{resolved ? <span className="status-pill status-confirmed">Selected, decodes</span> : issue ? <span className="status-pill status-conflicting">{issue.message}</span> : <span className="muted">not provided</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {review.validation.issues.length > 0 && (
                <ul className="issue-list">
                  {review.validation.issues.map((issue, i) => (
                    <li key={i} className={issue.blocking ? "issue-blocking" : "issue-info"}>{issue.blocking ? "BLOCKING" : "notice"} — {issue.message}</li>
                  ))}
                </ul>
              )}

              {runError && <div className="error-banner">{runError}</div>}

              <div className="browser-controls" style={{ marginTop: 8 }}>
                <button disabled={!canStart} onClick={() => handleStart()}>Start Demonstration</button>
                <button disabled={runState !== "running"} onClick={handlePause}>Pause</button>
                <button disabled={runState !== "paused"} onClick={handleResume}>Resume</button>
                <button disabled={runState !== "running" && runState !== "paused"} onClick={handleStop}>Stop Run</button>
              </div>
              <p className="muted">Portal: {config?.mockPortalUrl} — State: {runState}</p>

              <ActivityLog events={events} />

              {summary && (
                <>
                  <h4>Final verification result</h4>
                  <p><b>{summary.finalMessage}</b></p>
                  <table className="fields-table">
                    <tbody>
                      <tr><th>Fields verified</th><td>{summary.fieldsVerified}</td></tr>
                      <tr><th>Fields mismatched</th><td>{summary.fieldsMismatched}</td></tr>
                      <tr><th>Attachments selected</th><td>{summary.attachmentsSelected}</td></tr>
                      <tr><th>Attachments missing</th><td>{summary.attachmentsMissing}</td></tr>
                      <tr><th>Uploads acknowledged</th><td>{summary.uploadsAcknowledged} <span className="muted">(this mock portal never uploads)</span></td></tr>
                    </tbody>
                  </table>
                  {summary.unresolvedIssues.length > 0 && (
                    <ul className="issue-list">{summary.unresolvedIssues.map((s, i) => <li key={i} className="issue-blocking">{s}</li>)}</ul>
                  )}
                </>
              )}
            </>
          )}

          <details className="dev-log">
            <summary>Developer details (raw draft JSON)</summary>
            <pre style={{ fontSize: 11, whiteSpace: "pre-wrap", background: "#0f172a", color: "#e2e8f0", padding: 8, borderRadius: 6 }}>
              {JSON.stringify(draft, null, 2)}
            </pre>
          </details>
        </section>
      </div>
    </div>
  );
}
