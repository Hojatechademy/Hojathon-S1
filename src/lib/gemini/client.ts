/**
 * Ward Sahayakan - Google Gemini Client Placeholder
 * Prepared for agent model calls, intent classification, and Malayalam comprehension.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';

export const isGeminiConfigured = Boolean(
  geminiApiKey && 
  !geminiApiKey.includes('your-gemini-api-key')
);

export function getGeminiClient(): GoogleGenerativeAI | null {
  if (!isGeminiConfigured) {
    return null;
  }
  return new GoogleGenerativeAI(geminiApiKey);
}

export function getGeminiStatus(): { configured: boolean; message: string } {
  if (isGeminiConfigured) {
    return {
      configured: true,
      message: 'Gemini client configured with API key.'
    };
  }
  return {
    configured: false,
    message: 'Gemini API key pending in environment. Ward Sahayakan operating with local heuristic reasoning.'
  };
}
