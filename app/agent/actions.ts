"use server";

import { runAgent, type AgentChatMessage, type AgentExecutionResponse } from "@/lib/agent/engine";
import { revalidatePath } from "next/cache";

export async function sendAgentMessage({
  message,
  history = [],
}: {
  message: string;
  history?: AgentChatMessage[];
}): Promise<AgentExecutionResponse> {
  if (!message || message.trim().length === 0) {
    return {
      response: "Please provide a question or instruction.",
      actions: [],
      contextUpdated: false,
      error: "Empty message",
    };
  }

  const result = await runAgent({ message: message.trim(), history });

  if (result.contextUpdated) {
    revalidatePath("/dashboard");
  }

  return result;
}
