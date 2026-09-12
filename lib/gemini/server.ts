import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

const DEFAULT_MODEL = "gemini-2.0-flash";

export function getGeminiModel(): GenerativeModel {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("The AI follow-up agent is not configured. Add GEMINI_API_KEY to .env.local and restart the app.");
  return new GoogleGenerativeAI(key).getGenerativeModel({ model: process.env.GEMINI_MODEL || DEFAULT_MODEL });
}

export async function generateGeminiText(prompt: string) {
  return (await getGeminiModel().generateContent(prompt)).response.text();
}
