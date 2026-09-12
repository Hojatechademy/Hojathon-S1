import { useCallback, useEffect, useRef, useState } from "react";

const WS_URL =
  (window.location.protocol === "https:" ? "wss://" : "ws://") +
  window.location.host +
  "/ws/live";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

let nextId = 1;
const makeId = () => `m${Date.now()}-${nextId++}`;

const MIC_SAMPLE_RATE = 16000; // Live API realtime audio input format: 16-bit PCM @ 16kHz mono
const MIN_VOICE_SAMPLES = 6400; // ignore taps shorter than ~0.4s

// Resample a Float32 mono frame to 16-bit PCM @ 16kHz.
function downsampleTo16k(input, inRate) {
  const convert = (samples) => {
    const out = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      out[i] = s < 0 ? s * 32768 : s * 32767;
    }
    return out;
  };
  if (!inRate || inRate === MIC_SAMPLE_RATE) return convert(input);
  const ratio = inRate / MIC_SAMPLE_RATE;
  const outLen = Math.floor(input.length / ratio);
  const resampled = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const a = input[idx] || 0;
    const b = input[idx + 1] || 0;
    resampled[i] = a + (b - a) * frac;
  }
  return convert(resampled);
}

function int16ToBase64(int16) {
  const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
  let bin = "";
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export default function App() {
  const [messages, setMessages] = useState([
    { id: makeId(), role: "ai", text: "Hello! How can I help you?" },
  ]);
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState(null); // { dataUrl, name }
  const [connected, setConnected] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [streaming, setStreaming] = useState(false); // chunks have started arriving
  const [recording, setRecording] = useState(false);
  const [notice, setNotice] = useState("");
  const [muted, setMuted] = useState(false);

  const wsRef = useRef(null);
  const streamIdRef = useRef(null);
  const voiceMsgIdRef = useRef(null);
  const audioCtxRef = useRef(null);
  const playheadRef = useRef(0);
  const mutedRef = useRef(false);
  const listRef = useRef(null);
  const endRef = useRef(null);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const micCtxRef = useRef(null);
  const micProcRef = useRef(null);
  const micActiveRef = useRef(false);
  const micSamplesRef = useRef(0);
  const audioStreamRef = useRef(null);
  const reconnectRef = useRef(null);
  const noticeTimerRef = useRef(null);

  const showNotice = useCallback((text) => {
    setNotice(text);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    if (text) noticeTimerRef.current = setTimeout(() => setNotice(""), 5000);
  }, []);

  const finishAiTurn = useCallback(() => {
    streamIdRef.current = null;
    voiceMsgIdRef.current = null;
    setStreaming(false);
    setAiBusy(false);
  }, []);

  // Play one base64 PCM chunk (16-bit mono @ 24kHz, the Live API's audio format).
  const playPcmChunk = useCallback((base64) => {
    if (mutedRef.current) return;
    try {
      let ctx = audioCtxRef.current;
      if (!ctx || ctx.state === "closed") {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC({ sampleRate: 24000 });
        audioCtxRef.current = ctx;
        playheadRef.current = 0;
      }
      if (ctx.state === "suspended") void ctx.resume();
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      if (bytes.length < 2) return;
      const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.length / 2));
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
      const buf = ctx.createBuffer(1, float32.length, 24000);
      buf.getChannelData(0).set(float32);
      const src = ctx.createBufferSource();
      src.connect(ctx.destination);
      const startAt = Math.max(ctx.currentTime + 0.02, playheadRef.current);
      src.start(startAt);
      playheadRef.current = startAt + buf.duration;
    } catch {
      /* ignore audio glitches */
    }
  }, []);

  const stopPlayback = useCallback(() => {
    try {
      audioCtxRef.current?.close();
    } catch {
      /* ignore */
    }
    audioCtxRef.current = null;
    playheadRef.current = 0;
  }, []);

  const appendChunk = useCallback((text) => {
    setStreaming(true);
    const id = streamIdRef.current;
    if (id) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text: m.text + text } : m)));
    } else {
      const newId = makeId();
      streamIdRef.current = newId;
      setMessages((prev) => [...prev, { id: newId, role: "ai", text }]);
    }
  }, []);

  const pushError = useCallback(
    (message) => {
      finishAiTurn();
      setMessages((prev) => [...prev, { id: makeId(), role: "ai", text: message, error: true }]);
    },
    [finishAiTurn]
  );

  // ---- WebSocket: one persistent connection for the whole conversation ----
  useEffect(() => {
    let closed = false;

    const connect = () => {
      if (closed) return;
      let ws;
      try {
        ws = new WebSocket(WS_URL);
      } catch {
        reconnectRef.current = setTimeout(connect, 2000);
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };
      ws.onclose = () => {
        setConnected(false);
        setSessionReady(false);
        wsRef.current = null;
        if (!closed) reconnectRef.current = setTimeout(connect, 2000);
      };
      ws.onerror = () => {
        try {
          ws.close();
        } catch {
          /* ignore */
        }
      };
      ws.onmessage = (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        switch (msg.type) {
          case "ready":
            setSessionReady(true);
            break;
          case "chunk":
            if (msg.text) appendChunk(msg.text);
            break;
          case "done":
          case "interrupted":
            finishAiTurn();
            break;
          case "audio-out":
            if (msg.data) playPcmChunk(msg.data);
            break;
          case "user-transcript": {
            const id = voiceMsgIdRef.current;
            if (id && msg.text) {
              setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, text: m.text + msg.text } : m))
              );
            }
            break;
          }
          case "error":
            pushError(msg.message || "Something went wrong.");
            break;
          default:
            break;
        }
      };
    };

    connect();
    return () => {
      closed = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      try {
        wsRef.current?.close();
      } catch {
        /* ignore */
      }
    };
  }, [appendChunk, finishAiTurn, pushError, playPcmChunk]);

  // ---- auto-scroll to latest message ----
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, aiBusy, recording]);

  const sendToServer = useCallback((payload) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      showNotice("Not connected yet — please wait a moment and retry.");
      return false;
    }
    ws.send(JSON.stringify(payload));
    return true;
  }, [showNotice]);

  const beginAiTurn = useCallback(() => {
    streamIdRef.current = null; // barge in: previous partial answer stays as-is
    stopPlayback(); // cut off any voice still playing
    setStreaming(false);
    setAiBusy(true);
  }, [stopPlayback]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if ((!text && !imagePreview) || recording) return;
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      showNotice("Not connected yet — please wait a moment and retry.");
      return;
    }
    const userMsg = {
      id: makeId(),
      role: "user",
      text,
      image: imagePreview ? imagePreview.dataUrl : null,
      voice: false,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setImagePreview(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    beginAiTurn();
    if (imagePreview) {
      // Image (+ optional caption) goes out as one message; the server merges it into one turn.
      sendToServer({ type: "image", dataUrl: imagePreview.dataUrl, text });
    } else if (text) {
      sendToServer({ type: "text", text });
    }
  }, [input, imagePreview, recording, beginAiTurn, sendToServer]);

  // ---- image upload ----
  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        showNotice("Please choose a JPG, PNG or WEBP image.");
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        showNotice("Image is too large (max 10 MB).");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setImagePreview({ dataUrl: String(reader.result), name: file.name });
      reader.onerror = () => showNotice("Could not read that image.");
      reader.readAsDataURL(file);
    },
    [showNotice]
  );

  // ---- microphone: stream 16kHz PCM to the Live session while recording ----
  const stopRecording = useCallback(() => {
    if (!micActiveRef.current) return;
    micActiveRef.current = false;
    const proc = micProcRef.current;
    const ctx = micCtxRef.current;
    micProcRef.current = null;
    micCtxRef.current = null;
    if (proc) {
      try {
        proc.disconnect();
      } catch {
        /* ignore */
      }
    }
    if (ctx) {
      try {
        void ctx.close();
      } catch {
        /* ignore */
      }
    }
    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {
        /* ignore */
      }
      audioStreamRef.current = null;
    }
    setRecording(false);
    const samples = micSamplesRef.current;
    micSamplesRef.current = 0;
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      showNotice("Not connected yet — please wait a moment and retry.");
      return;
    }
    sendToServer({ type: "audio-end" }); // always close the turn
    if (samples < MIN_VOICE_SAMPLES) {
      showNotice("Didn't catch that — try speaking a little longer.");
      return;
    }
    const voiceId = makeId();
    voiceMsgIdRef.current = voiceId;
    setMessages((prev) => [
      ...prev,
      { id: voiceId, role: "user", text: "", image: null, voice: true },
    ]);
    beginAiTurn();
  }, [beginAiTurn, sendToServer, showNotice]);

  const startRecording = useCallback(async () => {
    if (micActiveRef.current) {
      stopRecording();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      showNotice("Microphone is not available in this browser.");
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      showNotice("Audio capture is not supported in this browser.");
      return;
    }
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      showNotice("Not connected yet — please wait a moment and retry.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      audioStreamRef.current = stream;
      const ctx = new AC();
      micCtxRef.current = ctx;
      if (ctx.state === "suspended") {
        try {
          await ctx.resume();
        } catch {
          /* ignore */
        }
      }
      const src = ctx.createMediaStreamSource(stream);
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      micProcRef.current = proc;
      micSamplesRef.current = 0;
      proc.onaudioprocess = (e) => {
        if (!micActiveRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        const pcm = downsampleTo16k(input, e.inputBuffer.sampleRate);
        if (!pcm.length) return;
        micSamplesRef.current += pcm.length;
        sendToServer({ type: "audio", data: int16ToBase64(pcm), mimeType: "audio/pcm" });
      };
      src.connect(proc);
      const sink = ctx.createGain(); // keep the processor running without audible output
      sink.gain.value = 0;
      proc.connect(sink);
      sink.connect(ctx.destination);
      micActiveRef.current = true;
      stopPlayback(); // barge in: cut off any voice still playing
      setRecording(true);
    } catch (err) {
      const name = err?.name || "";
      showNotice(
        name === "NotAllowedError"
          ? "Microphone permission was denied. Allow access and try again."
          : "Could not start the microphone."
      );
    }
  }, [stopRecording, sendToServer, stopPlayback, showNotice]);

  // Stop mic capture if the component unmounts mid-recording.
  useEffect(
    () => () => {
      micActiveRef.current = false;
      try {
        micProcRef.current?.disconnect();
      } catch {
        /* ignore */
      }
      try {
        void micCtxRef.current?.close();
      } catch {
        /* ignore */
      }
      try {
        audioStreamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {
        /* ignore */
      }
    },
    []
  );

  const onTextareaKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      mutedRef.current = next;
      if (next) stopPlayback();
      return next;
    });
  };

  const canSend = (input.trim() || imagePreview) && !recording;
  const statusText = recording
    ? "listening"
    : aiBusy
      ? "responding"
      : !connected
        ? "connecting"
        : connected && !sessionReady
          ? "starting"
          : "";

  return (
    <div className="page">
      <div className="chat">
        <header className="chat-header">
          <span className={`dot ${connected && sessionReady ? "on" : "pending"}`} />
          <h1>AI Assistant</h1>
          {statusText === "listening" && (
            <span className="status rec">
              <span className="pulse" /> Listening&hellip;
            </span>
          )}
          {statusText === "responding" && (
            <span className="status busy">
              <span className="pulse" /> AI responding&hellip;
            </span>
          )}
          {statusText === "connecting" && <span className="status idle">Connecting&hellip;</span>}
          {statusText === "starting" && (
            <span className="status idle">Starting session&hellip;</span>
          )}
          <button
            className="mute-btn"
            onClick={toggleMute}
            title={muted ? "Unmute AI voice" : "Mute AI voice"}
            aria-label={muted ? "Unmute AI voice" : "Mute AI voice"}
          >
            {muted ? "\uD83D\uDD07" : "\uD83D\uDD0A"}
          </button>
        </header>

        {notice && (
          <div className="notice" role="alert">
            {notice}
            <button className="notice-x" onClick={() => showNotice("")} aria-label="Dismiss">
              &times;
            </button>
          </div>
        )}

        <div className="messages" ref={listRef}>
          {messages.map((m) =>
            m.role === "user" ? (
              <div className="row user" key={m.id}>
                <div className="bubble user-bubble">
                  {m.image && <img src={m.image} alt="Uploaded" className="msg-image" />}
                  {m.voice && (
                    <span className="voice-tag">
                      <span aria-hidden="true">&#x1F3A4;</span> Voice message
                    </span>
                  )}
                  {m.text && <div className="msg-text">{m.text}</div>}
                </div>
              </div>
            ) : (
              <div className="row ai" key={m.id}>
                <div className={`bubble ai-bubble${m.error ? " error" : ""}`}>
                  <div className="msg-text">{m.text}</div>
                </div>
              </div>
            )
          )}

          {aiBusy && !streaming && (
            <div className="row ai">
              <div className="bubble ai-bubble thinking">
                <span className="thinking-text">AI is thinking</span>
                <span className="thinking-dots" aria-hidden="true">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {imagePreview && (
          <div className="preview-bar">
            <div className="preview-thumb">
              <img src={imagePreview.dataUrl} alt="Preview" />
              <button
                className="preview-remove"
                onClick={() => setImagePreview(null)}
                aria-label="Remove image"
                title="Remove image"
              >
                &times; Remove
              </button>
            </div>
          </div>
        )}

        <footer className="input-bar">
          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            className="icon-btn"
            title="Attach image (JPG, PNG, WEBP)"
            aria-label="Attach image"
            onClick={() => fileRef.current?.click()}
            disabled={recording}
          >
            &#x1F4CE;
          </button>

          <textarea
            ref={textareaRef}
            className="input"
            placeholder={recording ? "Listening…" : "Message AI…"}
            rows={1}
            value={input}
            disabled={recording}
            onChange={(e) => {
              setInput(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
            onKeyDown={onTextareaKeyDown}
          />

          <button
            className={`icon-btn mic${recording ? " active" : ""}`}
            title={recording ? "Stop recording" : "Speak"}
            aria-label={recording ? "Stop recording" : "Speak"}
            onClick={startRecording}
          >
            {recording ? "\u25A0" : "\uD83C\uDFA4"}
          </button>

          <button
            className="icon-btn send"
            title="Send"
            aria-label="Send"
            onClick={handleSend}
            disabled={!canSend}
          >
            &#x27A4;
          </button>
        </footer>
      </div>
    </div>
  );
}
