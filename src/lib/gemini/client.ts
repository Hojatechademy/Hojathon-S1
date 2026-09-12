/**
 * Ward Sahayakan - Google Gemini Client Configuration
 * Powered by gemini-3.6-flash for natural language comprehension in Malayalam, English, and Manglish.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

const geminiApiKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) || (globalThis as any).process?.env?.VITE_GEMINI_API_KEY || (globalThis as any).process?.env?.GEMINI_API_KEY || '';

export const isGeminiConfigured = Boolean(
  geminiApiKey && 
  !geminiApiKey.includes('your-gemini-api-key')
);

export const GEMINI_MODEL_NAME = 'gemini-3.6-flash';

let geminiClientInstance: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI | null {
  if (!isGeminiConfigured) {
    return null;
  }
  if (!geminiClientInstance) {
    geminiClientInstance = new GoogleGenerativeAI(geminiApiKey);
  }
  return geminiClientInstance;
}

export function getGeminiModel(): GenerativeModel | null {
  const client = getGeminiClient();
  if (!client) return null;
  return client.getGenerativeModel({
    model: GEMINI_MODEL_NAME,
    generationConfig: {
      temperature: 0.2
    }
  });
}

export function getGeminiStatus(): { configured: boolean; message: string; model: string } {
  if (isGeminiConfigured) {
    return {
      configured: true,
      message: `Gemini live model active (${GEMINI_MODEL_NAME}).`,
      model: GEMINI_MODEL_NAME
    };
  }
  return {
    configured: false,
    message: 'Gemini API key pending in environment. Operating with robust local civic reasoning.',
    model: 'heuristic-local'
  };
}
