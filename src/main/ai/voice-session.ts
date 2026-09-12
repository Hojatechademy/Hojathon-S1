/**
 * Voice input: Gemini Live used strictly as real-time speech-to-text. This
 * session deliberately has NO tools configured — the model physically
 * cannot call propose_application_update/etc. from audio, so nothing from
 * speech can ever reach the draft without the user reviewing recognized
 * text and pressing Send through the normal text path first (same
 * validation, same tool-calling, same everything). Output audio/text from
 * the model is received (the API requires an output modality) but is
 * entirely discarded — we only read serverContent.inputTranscription.
 *
 * Same session-generation-guarded lifecycle pattern as intake-orchestrator.ts.
 */
import { GoogleGenAI, Modality, LiveServerMessage, Session } from "@google/genai";

const DEBUG = process.env.GEMINI_DEBUG !== "0";
function diag(msg: string): void {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.log(`[voice] ${msg}`);
}

export type TranscriptListener = (text: string, final: boolean) => void;

let session: Session | null = null;
let generation = 0;
let liveGeneration = -1;
let accumulated = "";
let listener: TranscriptListener | null = null;
let stopWaiters: ((text: string) => void)[] = [];
let idleFlushTimer: ReturnType<typeof setTimeout> | null = null;

export function setTranscriptListener(fn: TranscriptListener | null): void {
  listener = fn;
}

function invalidate(gen: number, reason: string): void {
  if (gen !== liveGeneration) return;
  diag(`invalidating voice session generation ${gen}: ${reason}`);
  const dying = session;
  session = null;
  liveGeneration = -1;
  try {
    dying?.close();
  } catch {
    /* best-effort */
  }
}

async function connect(): Promise<Session> {
  if (session) return session;

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured. Voice input is unavailable.");
  if (!model) throw new Error("GEMINI_MODEL is not configured. Voice input is unavailable.");

  const ai = new GoogleGenAI({ apiKey });
  const myGeneration = ++generation;

  const s = await Promise.race([
    ai.live.connect({
      model,
      callbacks: {
        onopen: () => diag(`gen=${myGeneration} onopen`),
        onmessage: (message) => handleMessage(myGeneration, message),
        onerror: (e) => {
          diag(`gen=${myGeneration} onerror: ${e?.message ?? "unknown"}`);
          invalidate(myGeneration, "onerror");
        },
        onclose: () => {
          diag(`gen=${myGeneration} onclose`);
          invalidate(myGeneration, "onclose");
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {}
        // Deliberately no `tools` — this session cannot call any function.
      }
    }),
    new Promise<Session>((_, reject) => setTimeout(() => reject(new Error("Voice session setup timed out.")), 10_000))
  ]);

  liveGeneration = myGeneration;
  session = s;
  diag(`gen=${myGeneration} connected`);
  return s;
}

function handleMessage(gen: number, message: LiveServerMessage): void {
  if (gen !== liveGeneration) return;

  const text = message.serverContent?.inputTranscription?.text;
  if (text) {
    accumulated += text;
    listener?.(accumulated, false);
    // Reset the idle-flush timer: if no more transcription arrives for a
    // beat, treat what we have as settled without waiting indefinitely.
    if (idleFlushTimer) clearTimeout(idleFlushTimer);
  }
  // Output audio/text from the model is intentionally never read.

  if (message.serverContent?.turnComplete) {
    diag(`gen=${gen} turnComplete, accumulated length=${accumulated.length}`);
    const waiters = stopWaiters;
    stopWaiters = [];
    for (const resolve of waiters) resolve(accumulated);
  }
}

/** Starts (or resumes) a voice turn. Must be called before pushAudioChunk(). */
export async function startVoice(): Promise<void> {
  accumulated = "";
  await connect();
  diag("voice turn started");
}

/** base64-encoded 16-bit PCM @ 16kHz mono, matching the Live API's realtime audio input format. */
export function pushAudioChunk(base64: string): void {
  if (!session) return;
  session.sendRealtimeInput({ audio: { data: base64, mimeType: "audio/pcm;rate=16000" } });
}

/** Ends the audio stream and resolves with the final recognized text (bounded wait for a trailing turnComplete). */
export async function stopVoice(): Promise<string> {
  if (!session) return accumulated;
  const gen = liveGeneration;
  try {
    session.sendRealtimeInput({ audioStreamEnd: true });
  } catch {
    return accumulated;
  }

  const finalText = await new Promise<string>((resolve) => {
    stopWaiters.push(resolve);
    setTimeout(() => resolve(accumulated), 4_000); // bounded — never hang indefinitely
  });

  listener?.(finalText, true);
  invalidate(gen, "voice turn stopped");
  return finalText;
}

export function isVoiceAvailable(): boolean {
  return !!process.env.GEMINI_API_KEY && !!process.env.GEMINI_MODEL;
}
