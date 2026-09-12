// Minimal backend for the Gemini Live chat demo.
// - Holds ONE persistent Gemini Live session per browser WebSocket connection.
// - Browser <-> server protocol is plain JSON over WebSocket (no API key leaves the server).
//
// NOTE: gemini-3.1-flash-live-preview is an AUDIO-output model on the Live API
// (it rejects TEXT response modality). So the session requests AUDIO and the
// server forwards output-audio transcriptions as the chat text (+ raw PCM for playback).
import "dotenv/config";
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import { GoogleGenAI, Modality, ThinkingLevel } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3010);
const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-live-preview";
const API_KEY = process.env.GEMINI_API_KEY;
const CONNECT_TIMEOUT_MS = 25000;
const MAX_PENDING = 20;

const app = express();
app.get("/api/health", (_req, res) => res.json({ ok: true, model: MODEL }));

// Serve the built React client in production.
const distDir = path.resolve(__dirname, "../client/dist");
app.use(express.static(distDir));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/ws") || req.path.startsWith("/api")) return next();
  res.sendFile(path.join(distDir, "index.html"), (err) => {
    if (err) res.status(404).send("Client not built. Run `npm run build` first.");
  });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/live" });

function parseDataUrl(dataUrl) {
  const m = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl || "");
  if (!m) return null;
  return { mimeType: m[1] || "image/png", data: m[3] };
}

// Connect hangs forever if the model refuses the setup message, so every
// attempt is guarded by a timeout AND fails fast if the socket closes early.
function openSession(ai, onEvent, withThinking) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    };
    const timer = setTimeout(() => fail(new Error("Timed out waiting for Gemini Live setup.")), CONNECT_TIMEOUT_MS);

    const config = {
      responseModalities: [Modality.AUDIO],
      outputAudioTranscription: {}, // model's spoken reply -> text for the chat
      inputAudioTranscription: {}, // user's spoken words -> text for voice bubbles
    };
    if (withThinking) {
      // Minimal thinking for fast responses (ThinkingLevel.MINIMAL === "minimal" thinking).
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
    }

    ai.live
      .connect({
        model: MODEL,
        config,
        callbacks: {
          onopen: () => {},
          onmessage: (msg) => {
            try {
              const sc = msg.serverContent;
              if (!sc) return;
              if (sc.interrupted) {
                onEvent({ type: "interrupted" });
                return;
              }
              for (const part of sc.modelTurn?.parts || []) {
                if (!part) continue;
                if (typeof part.text === "string" && part.text) {
                  onEvent({ type: "chunk", text: part.text });
                } else if (part.inlineData?.data) {
                  onEvent({
                    type: "audio-out",
                    data: part.inlineData.data,
                    mimeType: part.inlineData.mimeType || "",
                  });
                }
              }
              if (sc.outputTranscription?.text) {
                onEvent({ type: "chunk", text: sc.outputTranscription.text });
              }
              if (sc.inputTranscription?.text) {
                onEvent({ type: "user-transcript", text: sc.inputTranscription.text });
              }
              if (sc.turnComplete) onEvent({ type: "done" });
            } catch (err) {
              onEvent({ type: "error", message: String(err?.message || err) });
            }
          },
          onerror: (e) => onEvent({ type: "error", message: String(e?.message || e?.error || e) }),
          onclose: (e) => {
            const code = e?.code;
            const reason = String(e?.reason || "");
            if (!settled) {
              fail(
                new Error(
                  `Gemini closed the connection during setup.${code || reason ? ` (${[code, reason].filter(Boolean).join(" ")})` : ""}`
                )
              );
            }
            onEvent({ type: "closed" });
          },
        },
      })
      .then(
        (s) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(s);
          } else {
            try {
              s.close(); // late arrival after settle: don't leak it
            } catch {
              /* ignore */
            }
          }
        },
        (e) => fail(e instanceof Error ? e : new Error(String(e)))
      );
  });
}

function deliver(session, send, msg) {
  switch (msg.type) {
    case "text": {
      const text = String(msg.text || "").trim();
      if (!text) return;
      session.sendClientContent({
        turns: [{ role: "user", parts: [{ text }] }],
        turnComplete: true,
      });
      break;
    }
    case "image": {
      // One user turn containing the image (+ optional caption) so order is deterministic.
      const parsed = parseDataUrl(msg.dataUrl);
      if (!parsed) {
        send({ type: "error", message: "Could not read that image. Try another file." });
        return;
      }
      const parts = [{ inlineData: { data: parsed.data, mimeType: parsed.mimeType } }];
      const caption = String(msg.text || "").trim();
      parts.push({ text: caption || "Describe this image." });
      session.sendClientContent({ turns: [{ role: "user", parts }], turnComplete: true });
      break;
    }
    case "audio": {
      if (!msg.data) return;
      session.sendRealtimeInput({
        audio: { data: msg.data, mimeType: msg.mimeType || "audio/webm" },
      });
      break;
    }
    case "audio-end": {
      session.sendRealtimeInput({ audioStreamEnd: true });
      break;
    }
    default:
      break;
  }
}

wss.on("connection", (socket) => {
  const send = (obj) => {
    try {
      if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(obj));
    } catch {
      /* ignore */
    }
  };

  if (!API_KEY) {
    send({ type: "error", message: "Server is missing GEMINI_API_KEY. Add it to .env and restart." });
    socket.close();
    return;
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  let session = null;
  let ready = false;
  let dead = false;
  const pending = [];

  // Pre-ready 'closed' events are ignored here: the openSession promise
  // rejects on premature close, and the retry/final-error logic below runs.
  const forwardEvent = (evt) => {
    if (evt.type === "closed") {
      if (ready && !dead) {
        try {
          socket.close(); // session died mid-conversation: force a fresh reconnect
        } catch {
          /* ignore */
        }
      }
      return;
    }
    send(evt);
  };

  socket.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (!session || !ready || dead) {
      if (pending.length < MAX_PENDING) pending.push(msg); // flush once the session is ready
      return;
    }
    try {
      deliver(session, send, msg);
    } catch (err) {
      send({ type: "error", message: `Gemini send failed: ${err?.message || err}` });
    }
  });

  socket.on("close", () => {
    dead = true;
    try {
      session?.close();
    } catch {
      /* ignore */
    }
    console.log("[live] session closed");
  });
  socket.on("error", () => {});

  (async () => {
    try {
      session = await openSession(ai, forwardEvent, true);
    } catch (err1) {
      console.warn("[live] connect with thinkingConfig failed:", err1?.message || err1);
      if (dead) return;
      try {
        session = await openSession(ai, forwardEvent, false);
        console.log("[live] connected without thinkingConfig");
      } catch (err2) {
        console.error("[live] connect failed:", err2?.message || err2);
        dead = true;
        send({ type: "error", message: `Could not reach Gemini Live: ${err2?.message || err2}` });
        socket.close();
        return;
      }
    }
    if (dead) {
      try {
        session.close();
      } catch {
        /* ignore */
      }
      return;
    }
    ready = true;
    console.log("[live] persistent session opened");
    send({ type: "ready" });
    for (const msg of pending.splice(0)) {
      try {
        deliver(session, send, msg);
      } catch (err) {
        send({ type: "error", message: `Gemini send failed: ${err?.message || err}` });
      }
    }
  })();
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT} (model: ${MODEL})`);
});
