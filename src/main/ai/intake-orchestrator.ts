/**
 * Gemini Live intake backend. NOT the primary text backend anymore — see
 * openrouter-intake.ts, which is what ipc.ts wires up for text. Kept here,
 * working and tested, for the voice feature (Live API's audio modality is
 * what voice needs; a plain chat-completions API like OpenRouter's can't do
 * real-time audio turns the same way).
 *
 * One Gemini Live session per active application (module-level singleton,
 * matching the same "one active X" pattern already used elsewhere). The
 * Live API is used (not plain generateContent) because GEMINI_MODEL is a
 * "-live-preview" model, which is Live-API-only.
 *
 * Session-generation + stale-session-reuse bug fix: a turn that timed out
 * used to leave the (possibly broken) `session` object cached, so the next
 * `sendMessage()` reused it and could hang identically. Every connect()
 * attempt now gets its own generation number baked into its callbacks via
 * closure; a timeout/error/close on generation N marks that generation dead
 * and forces the next call to reconnect, and any stray late event from
 * generation N is ignored once dead.
 */
import crypto from "node:crypto";
import { GoogleGenAI, Modality, LiveServerMessage, Session } from "@google/genai";
import { SendMessageResult } from "../../shared/contracts";
import { INTAKE_TOOL_DECLARATIONS, MAX_TOOL_CALLS_PER_TURN } from "./intake-tools";
import { getDraft, buildSystemInstruction, draftContextBlock, executeToolSafely, pushConversationEntry, nowIso } from "./intake-state";

// Temporary targeted diagnostics (structural only — never logs API keys, phone numbers, message text, or documents).
const DEBUG = process.env.GEMINI_DEBUG !== "0";
function diag(gen: number, turnId: string | null, msg: string): void {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.log(`[gemini gen=${gen} turn=${turnId ?? "-"}] ${msg}`);
}

let session: Session | null = null;
let sessionConnecting: Promise<Session> | null = null;
/** Bumped every time a session is created or torn down; identifies which connect() attempt is "live". */
let sessionGeneration = 0;
/** The generation the *current* `session` belongs to, so stray callbacks from a superseded generation are ignored. */
let liveGeneration = -1;

interface ActiveTurn {
  id: string;
  generation: number;
  settled: boolean;
  resolve: (value: SendMessageResult) => void;
  reject: (err: Error) => void;
  replyParts: string[];
  toolCallsThisTurn: number;
  timeoutHandle: ReturnType<typeof setTimeout>;
}
let activeTurn: ActiveTurn | null = null;

function settleTurn(turn: ActiveTurn, kind: "resolve" | "reject", value: SendMessageResult | Error): void {
  if (turn.settled) {
    diag(turn.generation, turn.id, `settle ignored — already settled`);
    return;
  }
  turn.settled = true;
  clearTimeout(turn.timeoutHandle);
  if (activeTurn === turn) activeTurn = null; // release the busy flag on every exit path
  diag(turn.generation, turn.id, `settled via ${kind}`);
  if (kind === "resolve") turn.resolve(value as SendMessageResult);
  else turn.reject(value as Error);
}

/** Marks the given generation dead: any further event tagged with it is ignored, and forces a fresh connect() next time. */
function invalidateGeneration(gen: number, reason: string): void {
  if (gen !== liveGeneration) return; // already superseded, nothing to do
  diag(gen, null, `invalidating session generation: ${reason}`);
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
  if (sessionConnecting) return sessionConnecting;

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured. Add it to .env and restart the app.");
  if (!model) throw new Error("GEMINI_MODEL is not configured. Add it to .env and restart the app.");

  const ai = new GoogleGenAI({ apiKey });

  const attempt = (): Promise<Session> => {
    const myGeneration = ++sessionGeneration;
    diag(myGeneration, null, "connect attempt starting");
    return ai.live.connect({
      model,
      callbacks: {
        onopen: () => diag(myGeneration, null, "onopen"),
        onmessage: (message) => handleServerMessage(myGeneration, message),
        onerror: (e) => {
          diag(myGeneration, activeTurn?.id ?? null, `onerror: ${e?.message ?? "unknown"}`);
          if (activeTurn && activeTurn.generation === myGeneration) {
            settleTurn(activeTurn, "reject", new Error(`Gemini connection error: ${e?.message ?? "unknown error"}`));
          }
          invalidateGeneration(myGeneration, "onerror");
        },
        onclose: () => {
          diag(myGeneration, activeTurn?.id ?? null, "onclose");
          if (activeTurn && activeTurn.generation === myGeneration) {
            settleTurn(activeTurn, "reject", new Error("Gemini session closed before finishing this turn."));
          }
          invalidateGeneration(myGeneration, "onclose");
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
        systemInstruction: buildSystemInstruction(),
        tools: [{ functionDeclarations: INTAKE_TOOL_DECLARATIONS }]
      }
    }).then((s) => {
      liveGeneration = myGeneration;
      diag(myGeneration, null, "connected");
      return s;
    });
  };

  const withTimeout = (p: Promise<Session>): Promise<Session> =>
    Promise.race([
      p,
      new Promise<Session>((_, reject) => setTimeout(() => reject(new Error("Gemini setup timed out.")), 10_000))
    ]);

  sessionConnecting = (async () => {
    try {
      return await withTimeout(attempt());
    } catch {
      // One documented safe retry on setup failure only — never mid-turn.
      return await withTimeout(attempt());
    }
  })();

  try {
    session = await sessionConnecting;
    return session;
  } finally {
    sessionConnecting = null;
  }
}

function handleServerMessage(generation: number, message: LiveServerMessage): void {
  if (generation !== liveGeneration) {
    diag(generation, null, "dropping message from a superseded session generation");
    return;
  }
  const turn = activeTurn;
  if (!turn || turn.generation !== generation) {
    diag(generation, turn?.id ?? null, "dropping message — no matching active turn for this generation");
    return;
  }

  const elapsedMs = Date.now() - Number(turn.id.split("-")[0] || 0);
  const hasToolCall = !!message.toolCall?.functionCalls?.length;
  const hasText = !!message.serverContent?.outputTranscription?.text;
  const hasTurnComplete = !!message.serverContent?.turnComplete;
  diag(generation, turn.id, `onmessage elapsed=${elapsedMs}ms toolCall=${hasToolCall} text=${hasText} turnComplete=${hasTurnComplete}`);

  // 1. Tool calls: respond to EVERY one, exactly once, unconditionally —
  //    never gated on, or followed by, an early return.
  if (message.toolCall?.functionCalls?.length) {
    const responses = message.toolCall.functionCalls.map((fc) => {
      diag(generation, turn.id, `tool call name=${fc.name} id=${fc.id}`);
      if (turn.toolCallsThisTurn >= MAX_TOOL_CALLS_PER_TURN) {
        diag(generation, turn.id, `tool call id=${fc.id} rejected — budget exceeded`);
        return { id: fc.id, name: fc.name, response: { error: "Tool call budget exceeded for this turn." } };
      }
      turn.toolCallsThisTurn += 1;
      const response = executeToolSafely(fc.name ?? "", (fc.args ?? {}) as Record<string, unknown>);
      diag(generation, turn.id, `tool response sent id=${fc.id}`);
      return { id: fc.id, name: fc.name, response };
    });
    session?.sendToolResponse({ functionResponses: responses });
  }

  // 2. Transcription text: independent of (1) and (3) — never in an
  //    else-if chain with turnComplete.
  const text = message.serverContent?.outputTranscription?.text;
  if (text) turn.replyParts.push(text);
  // Assistant audio bytes (message.data) are intentionally never read/buffered.

  // 3. Turn completion: checked unconditionally on every message, whether
  //    or not this same message also carried a tool call or transcription.
  if (message.serverContent?.turnComplete) {
    const reply = turn.replyParts.join("").trim();
    if (reply) pushConversationEntry({ id: crypto.randomUUID(), role: "assistant", text: reply, at: nowIso() });
    settleTurn(turn, "resolve", { reply, draft: getDraft() });
  }
}

/** Only one input turn executes at a time — a second call while busy is rejected, not queued silently. */
export async function sendMessage(text: string): Promise<SendMessageResult> {
  if (activeTurn) {
    throw new Error("Still processing your previous message — please wait.");
  }
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Message is empty.");

  const s = await connect();
  const myGeneration = liveGeneration;
  const turnId = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  const messageId = crypto.randomUUID();
  pushConversationEntry({ id: messageId, role: "user", text: trimmed, at: nowIso() });

  return new Promise((resolve, reject) => {
    // Registered BEFORE sendClientContent so no message can arrive before
    // there is something to receive it.
    const turn: ActiveTurn = {
      id: turnId,
      generation: myGeneration,
      settled: false,
      resolve,
      reject,
      replyParts: [],
      toolCallsThisTurn: 0,
      timeoutHandle: setTimeout(() => {
        diag(myGeneration, turnId, "TIMEOUT firing");
        // A timed-out turn must never complete a later turn's promise, and
        // the connection that produced it is presumed unusable — force a
        // fresh session on the next call rather than reusing a broken one.
        invalidateGeneration(myGeneration, "turn timeout");
        settleTurn(turn, "reject", new Error("Gemini did not finish responding in time. Your message and case were preserved — try again."));
      }, 25_000)
    };
    activeTurn = turn;

    try {
      s.sendClientContent({
        turns: [{ role: "user", parts: [{ text: `${draftContextBlock()}\n\n[Message ${messageId}] ${trimmed}` }] }],
        turnComplete: true
      });
      diag(myGeneration, turnId, "sendClientContent dispatched");
    } catch (err) {
      settleTurn(turn, "reject", err instanceof Error ? err : new Error(String(err)));
    }
  });
}
