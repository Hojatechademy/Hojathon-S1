// ============================================
// ShopAgent — Gemini Function-Calling Agent
// ============================================
// Uses the NEW @google/genai SDK (replacing the
// deprecated @google/generative-ai) with function
// calling to interpret user intent and invoke tools.
// Falls back to the keyword parser on any error.
// ============================================

import { GoogleGenAI } from "@google/genai";
import { addLog, getState, type AgentResponse, type ToolCallRecord, type ToolResultRecord } from "./store";
import { executeTool } from "./tools";
import { toolSchemas } from "./tool-schemas";
import { runFallbackAgent } from "./fallback-agent";

function buildSystemPrompt(): string {
  const state = getState();
  const inventoryLines = state.inventory
    .map((i) => `  - ${i.name} | ${i.category} | ${i.stock} ${i.unit} | ₹${i.price}/${i.unit}`)
    .join("\n");

  return `You are ShopAgent, an autonomous AI operations agent for a local Indian grocery/general store (kirana shop). Your job is to execute the shopkeeper's commands by calling the right tools.

You have access to these tools:
1. update_inventory — Add, update, or modify inventory items. Supports modes: "add" (increase stock), "subtract" (decrease stock/record sales), "set" (set exact stock level).
2. create_promo_campaign — Create a promotional discount campaign with a promo code.
3. broadcast_notification — Send WhatsApp or SMS broadcast to customer groups.
4. remove_item — Permanently delete an item from inventory. Use when the shopkeeper says "remove", "delete", or "get rid of" an item.

CURRENT INVENTORY STATE:
${inventoryLines || "  (empty)"}

ACTIVE CAMPAIGNS: ${state.campaigns.length}

RULES:
- Always use tools to take action. NEVER ask follow-up questions — use the inventory context above to fill in any missing details.
- For multi-step requests, call multiple tools in sequence.
- When subtracting stock (sales), use mode "subtract".
- When only updating price without changing stock, use mode "add" with stock_delta_or_total = 0.
- When adding new items, use mode "add".
- When the user says "remove" or "delete" an item, use the remove_item tool — do NOT set stock to 0.
- Generate engaging, emoji-rich promo messages for campaigns.
- Be concise in your responses — confirm what was done.
- All prices are in INR (₹).
- You already know the full inventory. Do NOT ask the user for item details that you can see above.`;
}

export async function runGeminiAgent(message: string): Promise<AgentResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return runFallbackAgent(message);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = buildSystemPrompt();

    const toolCalls: ToolCallRecord[] = [];
    const toolResults: ToolResultRecord[] = [];
    let thought = "";

    // Initial generation with function declarations
    let response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        tools: [{
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          functionDeclarations: toolSchemas as any,
        }],
      },
    });

    // Process function calls in a loop (multi-turn tool use)
    let maxIterations = 10;

    // Build conversation history for multi-turn
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const history: any[] = [
      { role: "user", parts: [{ text: message }] },
    ];

    while (maxIterations > 0) {
      maxIterations--;

      // Check for function calls in the response
      const parts = response.candidates?.[0]?.content?.parts || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const functionCalls = parts.filter((p: any) => p.functionCall);

      if (functionCalls.length === 0) {
        // No more function calls — extract final text
        break;
      }

      // Log thought
      if (!thought) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const names = functionCalls.map((fc: any) => fc.functionCall?.name);
        thought = `I need to call ${functionCalls.length} tool(s): ${names.join(", ")}`;
      }
      addLog({ type: "THOUGHT", content: thought });

      // Add model response to history
      history.push({
        role: "model",
        parts: parts,
      });

      // Execute each function call and build function responses
      const functionResponseParts: unknown[] = [];

      for (const fc of functionCalls) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const funcCall = (fc as any).functionCall as { name: string; args: Record<string, unknown> };
        const args = funcCall.args || {};

        toolCalls.push({ tool: funcCall.name, args });
        const toolResult = executeTool(funcCall.name, args);
        toolResults.push({
          tool: funcCall.name,
          result: toolResult as unknown as Record<string, unknown>,
        });

        functionResponseParts.push({
          functionResponse: {
            name: funcCall.name,
            response: toolResult,
          },
        });
      }

      // Add function responses to history
      history.push({
        role: "user",
        parts: functionResponseParts,
      });

      // Send function results back to the model
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: history,
        config: {
          systemInstruction: systemPrompt,
          tools: [{
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            functionDeclarations: toolSchemas as any,
          }],
        },
      });
    }

    // Get final text response
    const agentResponse = response.text || "Actions completed successfully.";

    if (!thought) {
      thought = "Processed the request and executed the necessary actions.";
      addLog({ type: "THOUGHT", content: thought });
    }

    return {
      thought,
      toolCalls,
      toolResults,
      agentResponse,
      state: getState(),
    };
  } catch (error) {
    console.error("Gemini API error, falling back to keyword parser:", error);
    addLog({
      type: "STATUS",
      content: `Gemini API error: ${error instanceof Error ? error.message : "Unknown error"}. Falling back to local agent.`,
    });
    return runFallbackAgent(message);
  }
}
