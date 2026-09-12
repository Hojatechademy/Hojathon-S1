/**
 * Minimal OpenRouter chat client.
 * Docs: https://openrouter.ai/docs/api-reference/chat-completion
 *
 * Server-only. The API key must never reach the browser, so this module is only
 * ever imported from route handlers.
 */

const CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

export const TEXT_MODEL =
  process.env.OPENROUTER_TEXT_MODEL ?? "anthropic/claude-sonnet-4.5";

export const VISION_MODEL =
  process.env.OPENROUTER_VISION_MODEL ?? "google/gemini-2.5-flash";

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export class OpenRouterError extends Error {
  readonly status?: number;
  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "OpenRouterError";
    this.status = options?.status;
  }
}

interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  /** Ask the provider to constrain output to a single JSON object. */
  jsonMode?: boolean;
  timeoutMs?: number;
}

function headers(): HeadersInit {
  // Trimmed, because an empty or whitespace-only shell variable silently shadows
  // .env.local and would otherwise be sent as a valid-looking bearer token.
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    throw new OpenRouterError("OPENROUTER_API_KEY is not set");
  }
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    // Optional attribution shown on OpenRouter's dashboard.
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
    "X-Title": process.env.OPENROUTER_SITE_NAME ?? "AgriPilot",
  };
}

export async function chat({
  model,
  messages,
  maxTokens = 900,
  temperature = 0.2,
  jsonMode = false,
  timeoutMs = 45_000,
}: ChatOptions): Promise<string> {
  let response: Response;
  try {
    response = await fetch(CHAT_URL, {
      method: "POST",
      headers: headers(),
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });
  } catch (cause) {
    if (cause instanceof OpenRouterError) throw cause;
    throw new OpenRouterError("Could not reach OpenRouter", { cause });
  }

  const raw = await response.text();

  if (!response.ok) {
    throw new OpenRouterError(
      `OpenRouter returned HTTP ${response.status}: ${raw.slice(0, 300)}`,
      { status: response.status },
    );
  }

  let payload: {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  try {
    payload = JSON.parse(raw);
  } catch (cause) {
    throw new OpenRouterError("OpenRouter returned a non-JSON body", { cause });
  }

  if (payload.error) {
    throw new OpenRouterError(payload.error.message ?? "OpenRouter error");
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new OpenRouterError("OpenRouter returned an empty message");
  }
  return content;
}

/**
 * Strips ```json fences some models add despite being told not to, then parses.
 */
export function parseJsonReply<T>(reply: string): T {
  let text = reply.trim();

  if (text.startsWith("```")) {
    text = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
  }

  // Last resort: grab the outermost object if the model wrapped it in prose.
  if (!text.startsWith("{")) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      text = text.slice(start, end + 1);
    }
  }

  try {
    return JSON.parse(text) as T;
  } catch (cause) {
    throw new OpenRouterError("Model reply was not valid JSON", { cause });
  }
}

/** Convenience wrapper: JSON-mode chat plus parsing, in one call. */
export async function chatJson<T>(options: ChatOptions): Promise<T> {
  const reply = await chat({ ...options, jsonMode: true });
  return parseJsonReply<T>(reply);
}
