// Minimal backend for the Gemini chat demo.
// Plain request/response over HTTP (no WebSocket, no Live API) — the browser
// posts one turn (+ history) and gets one JSON reply back.
import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3001);
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: API_KEY });

const app = express();
app.use(express.json({ limit: "15mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, model: MODEL }));

function parseDataUrl(dataUrl) {
  const m = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl || "");
  if (!m) return null;
  return { mimeType: m[1] || "image/png", data: m[3] };
}

// history: [{ role: "user"|"model", text, image? }]
// message: { text, image? }  (image is a data: URL)
app.post("/api/chat", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY. Add it to .env and restart." });
  }
  const { history, message } = req.body || {};
  if (!message || (!message.text && !message.image)) {
    return res.status(400).json({ error: "Message text or image is required." });
  }

  const toContent = (role, m) => {
    const parts = [];
    if (m.image) {
      const parsed = parseDataUrl(m.image);
      if (parsed) parts.push({ inlineData: { data: parsed.data, mimeType: parsed.mimeType } });
    }
    const text = String(m.text || "").trim();
    parts.push({ text: text || "Describe this image." });
    return { role, parts };
  };

  const contents = [
    ...(Array.isArray(history) ? history : []).map((h) => toContent(h.role === "ai" ? "model" : "user", h)),
    toContent("user", message),
  ];

  try {
    const result = await ai.models.generateContent({ model: MODEL, contents });
    const text = result.text || "";
    res.json({ text });
  } catch (err) {
    console.error("[chat] generateContent failed:", err?.message || err);
    res.status(502).json({ error: `Gemini request failed: ${err?.message || err}` });
  }
});

// Serve the built React client in production.
const distDir = path.resolve(__dirname, "../client/dist");
app.use(express.static(distDir));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(distDir, "index.html"), (err) => {
    if (err) res.status(404).send("Client not built. Run `npm run build` first.");
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT} (model: ${MODEL})`);
});
