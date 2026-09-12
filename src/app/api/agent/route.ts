// ============================================
// ShopAgent — API Route Handler
// ============================================
// POST /api/agent — Process a user message through
//   the agent (Gemini or fallback) and return results.
// GET  /api/agent — Return current state snapshot
//   for initial dashboard hydration.
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getState } from "@/lib/store";
import { runGeminiAgent } from "@/lib/gemini-agent";
import { runFallbackAgent } from "@/lib/fallback-agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message: string = body.message;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    // Choose agent: Gemini if API key is available, otherwise fallback
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    const agentMode = hasGeminiKey ? "gemini" : "fallback";

    let result;
    if (hasGeminiKey) {
      result = await runGeminiAgent(message.trim());
    } else {
      result = await runFallbackAgent(message.trim());
    }

    return NextResponse.json({
      ...result,
      meta: {
        agentMode,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Agent API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    state: getState(),
    meta: {
      agentMode: process.env.GEMINI_API_KEY ? "gemini" : "fallback",
      timestamp: new Date().toISOString(),
    },
  });
}

