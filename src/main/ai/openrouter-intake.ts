/**
 * Primary text-intake LLM backend: OpenRouter's OpenAI-compatible chat
 * completions endpoint (https://openrouter.ai/api/v1/chat/completions),
 * called via plain fetch — no SDK dependency, matching "API: full control,
 * any language, no dependencies" from OpenRouter's own docs. Synchronous
 * request/response, so there is no session/turn-completion race to manage
 * the way the Gemini Live API needed (see intake-orchestrator.ts, kept for
 * voice). Same shared draft/tool logic as the Gemini backend — see
 * intake-state.ts — so switching backends never touches the rest of the app.
 */
import crypto from "node:crypto";
import { SendMessageResult } from "../../shared/contracts";
import { MAX_TOOL_CALLS_PER_TURN } from "./intake-tools";
import { getDraft, resetDraft as resetSharedDraft, buildSystemInstruction, draftContextBlock, executeToolSafely, pushConversationEntry, nowIso } from "./intake-state";

const DEBUG = process.env.OPENROUTER_DEBUG !== "0";
function diag(turnId: string, msg: string): void {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.log(`[openrouter turn=${turnId}] ${msg}`);
}

interface ChatToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}
interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ChatToolCall[];
  tool_call_id?: string;
  name?: string;
}

const OPENROUTER_TOOLS = [
  {
    type: "function",
    function: {
      name: "propose_application_update",
      description:
        "Propose one or more field updates extracted from the user's own words. Only propose a value the user actually stated or clearly confirmed — never invent gender, date of birth, identifiers, or income figures the user did not provide.",
      parameters: {
        type: "object",
        properties: {
          updates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                fieldKey: { type: "string", description: "Canonical field key from the actual form schema." },
                value: { type: "string", description: "The exact value to propose, already normalized to the field's expected format." },
                sourceMessageId: { type: "string", description: "The id of the user message this value came from." },
                evidenceText: { type: "string", description: "The exact phrase from the user's message that supports this value." }
              },
              required: ["fieldKey", "value", "sourceMessageId", "evidenceText"]
            }
          }
        },
        required: ["updates"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_application_readiness",
      description: "Check the current draft against the portal's actual required-field and dropdown rules.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "request_clarification",
      description: "Flag that one or more fields are missing or ambiguous and you are about to ask the user a focused question about them.",
      parameters: {
        type: "object",
        properties: {
          fieldKeys: { type: "array", items: { type: "string" } },
          question: { type: "string" }
        },
        required: ["fieldKeys", "question"]
      }
    }
  }
] as const;

// Conversation history sent to the model, separate from the UI-facing
// draft.conversation (which stores simplified {id,role,text,at} entries).
let history: ChatMessage[] = [];

export function resetHistory(): void {
  history = [];
}

export { getDraft };

/** Resets both the shared draft and this backend's own conversation history. */
export function resetDraft() {
  resetHistory();
  return resetSharedDraft();
}

let busy = false;

async function callOpenRouter(messages: ChatMessage[], apiKey: string, model: string): Promise<{
  message: ChatMessage;
  finishReason: string;
}> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://edistrict-kerala.vercel.app",
      "X-Title": "Income Certificate Assistant"
    },
    body: JSON.stringify({
      model,
      messages,
      tools: OPENROUTER_TOOLS,
      tool_choice: "auto"
    })
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`OpenRouter request failed (${res.status}): ${bodyText.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: { message: ChatMessage; finish_reason: string }[];
    error?: { message?: string };
  };
  if (json.error) throw new Error(`OpenRouter error: ${json.error.message ?? "unknown"}`);
  const choice = json.choices?.[0];
  if (!choice) throw new Error("OpenRouter returned no choices.");
  return { message: choice.message, finishReason: choice.finish_reason };
}

/** Only one input turn executes at a time — a second call while busy is rejected, not queued silently. */
export async function sendMessage(text: string): Promise<SendMessageResult> {
  if (busy) {
    throw new Error("Still processing your previous message — please wait.");
  }
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Message is empty.");

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured. Add it to .env and restart the app.");
  if (!model) throw new Error("OPENROUTER_MODEL is not configured. Add it to .env and restart the app.");

  busy = true;
  const turnId = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const messageId = crypto.randomUUID();

  try {
    if (history.length === 0) {
      history.push({ role: "system", content: buildSystemInstruction() });
    }
    history.push({ role: "user", content: `${draftContextBlock()}\n\n[Message ${messageId}] ${trimmed}` });
    pushConversationEntry({ id: messageId, role: "user", text: trimmed, at: nowIso() });

    let toolCallsThisTurn = 0;
    let finalReply = "";

    // Bounded loop: model may chain several tool-call rounds before giving
    // a final plain-text reply. Each round gets exactly one response per
    // function call, sent back before asking the model to continue.
    for (let round = 0; round < MAX_TOOL_CALLS_PER_TURN + 2; round++) {
      diag(turnId, `requesting completion, round=${round}`);
      const { message, finishReason } = await withTimeout(callOpenRouter(history, apiKey, model), 25_000, turnId);
      diag(turnId, `got response finishReason=${finishReason} toolCalls=${message.tool_calls?.length ?? 0} hasContent=${!!message.content}`);

      history.push(message);

      if (message.tool_calls && message.tool_calls.length > 0) {
        for (const call of message.tool_calls) {
          let args: Record<string, unknown> = {};
          let response: Record<string, unknown>;
          if (toolCallsThisTurn >= MAX_TOOL_CALLS_PER_TURN) {
            response = { error: "Tool call budget exceeded for this turn." };
          } else {
            toolCallsThisTurn += 1;
            try {
              args = JSON.parse(call.function.arguments || "{}");
            } catch {
              response = { error: "Invalid JSON arguments — could not parse." };
              history.push({ role: "tool", tool_call_id: call.id, name: call.function.name, content: JSON.stringify(response) });
              diag(turnId, `tool call name=${call.function.name} id=${call.id} rejected — invalid arguments JSON`);
              continue;
            }
            response = executeToolSafely(call.function.name, args);
          }
          diag(turnId, `tool call name=${call.function.name} id=${call.id} -> responded`);
          history.push({ role: "tool", tool_call_id: call.id, name: call.function.name, content: JSON.stringify(response) });
        }
        continue; // ask the model to continue now that tool results are in history
      }

      // No tool calls this round — this is the model's final reply.
      finalReply = (message.content ?? "").trim();
      break;
    }

    if (finalReply) pushConversationEntry({ id: crypto.randomUUID(), role: "assistant", text: finalReply, at: nowIso() });
    diag(turnId, "turn complete");
    return { reply: finalReply, draft: getDraft() };
  } finally {
    busy = false;
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, turnId: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        diag(turnId, "TIMEOUT firing");
        reject(new Error("OpenRouter did not finish responding in time. Your message and case were preserved — try again."));
      }, ms)
    )
  ]);
}
