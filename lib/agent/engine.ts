import { createClient } from "@/lib/supabase/server";
import { getFollowUpContext } from "@/lib/workspace/context";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  agentFunctionDeclarations,
  executeAgentTool,
  type ToolExecutionResult,
} from "./tools";

export interface AgentChatMessage {
  role: "user" | "model";
  content: string;
}

export interface AgentExecutionResponse {
  response: string;
  actions: ToolExecutionResult[];
  contextUpdated: boolean;
  error?: string;
}

export async function runAgent({
  message,
  history = [],
}: {
  message: string;
  history?: AgentChatMessage[];
}): Promise<AgentExecutionResponse> {
  // 1. Authenticate user
  const supabase = await createClient();
  if (!supabase) {
    return {
      response: "Database connection unavailable. Please verify your configuration.",
      actions: [],
      contextUpdated: false,
      error: "Supabase client not available",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      response: "Your session has expired. Please sign in again to access your follow-up assistant.",
      actions: [],
      contextUpdated: false,
      error: "Unauthorized",
    };
  }

  // 2. Fetch live patient context
  const contextRes = await getFollowUpContext();
  const context = "error" in contextRes ? null : contextRes;

  const patientName =
    context?.profile?.display_name ||
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    "Patient";

  const tasksSummary =
    context?.tasks
      .map(
        (t) =>
          `- [${t.status.toUpperCase()}] "${t.title}" (Due: ${
            t.due_at ? new Date(t.due_at).toLocaleDateString() : "No due date"
          }, ID: ${t.id})`
      )
      .join("\n") || "No tasks recorded";

  const apptsSummary =
    context?.appointments
      .map(
        (a) =>
          `- [${a.status.toUpperCase()}] "${a.title}" on ${new Date(
            a.starts_at
          ).toLocaleString()} at ${a.location || "Hospital Clinic"} (ID: ${a.id})`
      )
      .join("\n") || "No appointments recorded";

  const remsSummary =
    context?.reminders
      .map(
        (r) =>
          `- [${r.status.toUpperCase()}] Scheduled for ${new Date(
            r.remind_at
          ).toLocaleString()} (ID: ${r.id})`
      )
      .join("\n") || "No reminders recorded";

  const systemInstruction = `
You are the "CareFlow Follow-up AI Assistant", an empathetic, precise, and stateful administrative healthcare coordinator for patient "${patientName}".
Current local UTC timestamp: ${new Date().toISOString()}.

YOUR CLINICAL SAFETY BOUNDARIES (STRICT & MANDATORY):
- You are an administrative care coordinator, NOT a doctor or medical provider.
- You MUST NEVER give medical diagnoses, prescribe drugs, alter prescription dosages, interpret clinical lab tests, or triage acute emergencies.
- If a patient asks for medical advice, prescription changes, or describes emergency symptoms (chest pain, shortness of breath, dizziness, sudden weakness), advise them firmly and calmly to call 911 or contact their prescribing physician immediately.

YOUR ADMINISTRATIVE CAPABILITIES:
- Help patients understand their post-care follow-up plan, next steps, and visit schedules.
- Answer questions about their upcoming visits, missed appointments, and pending tasks.
- If a patient missed an appointment (e.g. "I missed my follow-up appointment. What should I do next?"):
  1. Inspect their records or call get_follow_up_status.
  2. Explain the administrative next step: contact the clinic or hospital to reschedule.
  3. Offer to set or schedule an in-app reminder in their workspace.
- When creating reminders, updating tasks, or listing appointments, invoke the corresponding tool.
- When you execute a tool, acknowledge what action was taken clearly.
- Be concise, structured, supportive, and action-oriented. Never invent appointments or doctors that do not exist.

PATIENT'S CURRENT DATABASE RECORD:
[PROFILE]
Name: ${patientName}

[ACTIVE FOLLOW-UP TASKS]
${tasksSummary}

[APPOINTMENTS]
${apptsSummary}

[REMINDERS]
${remsSummary}
`;

  const actions: ToolExecutionResult[] = [];
  let contextUpdated = false;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in .env.local.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiAgent = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      systemInstruction,
      tools: [{ functionDeclarations: agentFunctionDeclarations }],
    });

    // Build chat contents from history
    const contents: any[] = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // 1st Model Call
    let result = await geminiAgent.generateContent({ contents });
    let functionCalls = result.response.functionCalls();

    let turns = 0;
    while (functionCalls && functionCalls.length > 0 && turns < 3) {
      turns++;
      const call = functionCalls[0];
      const toolResult = await executeAgentTool(
        supabase,
        user.id,
        call.name,
        call.args as Record<string, any>
      );

      actions.push(toolResult);
      if (toolResult.mutatedData) {
        contextUpdated = true;
      }

      // Append assistant intent & tool output to conversation
      contents.push({
        role: "model",
        parts: [{ text: `Checking records via action: ${call.name}...` }],
      });
      contents.push({
        role: "user",
        parts: [
          {
            text: `[System Tool Execution Result for ${call.name}]:\nSummary: ${
              toolResult.summary
            }\nData: ${JSON.stringify(
              toolResult.result
            )}\nPlease synthesize your helpful follow-up response for the patient now.`,
          },
        ],
      });

      result = await geminiAgent.generateContent({ contents });
      functionCalls = result.response.functionCalls();
    }

    const responseText = result.response.text();

    return {
      response: responseText,
      actions,
      contextUpdated,
    };
  } catch (err: any) {
    console.error("Gemini Agent Execution Note:", err?.message || err);

    // Deterministic Truthful Fallback
    let fallbackText = `I encountered a momentary issue communicating with Gemini (${
      err?.message || "Service error"
    }). `;

    if (context) {
      const pendingCount = context.tasks.filter((t) => t.status !== "completed").length;
      const missedCount = context.appointments.filter((a) => a.status === "missed").length;
      fallbackText += `\n\nYour Current Follow-up Snapshot:\n- **${missedCount} Missed Visit(s)**: If you missed an appointment, please contact your care team or clinic directly to reschedule.\n- **${pendingCount} Pending Task(s)**: Check your task list on the dashboard.`;
    }

    return {
      response: fallbackText,
      actions,
      contextUpdated,
      error: err?.message,
    };
  }
}
