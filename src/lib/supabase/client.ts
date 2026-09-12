/**
 * Ente Ward - Supabase Client Configuration Placeholder
 * Prepared for integration with the database schemas being set up by team member.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || (globalThis as any).process?.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || (globalThis as any).process?.env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id')
);

// Fallback dummy URL to prevent createClient throwing during build if env vars are unset
const effectiveUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const effectiveKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(effectiveUrl, effectiveKey);

export function getSupabaseStatus(): { configured: boolean; message: string } {
  if (isSupabaseConfigured) {
    return {
      configured: true,
      message: 'Supabase client initialized with environment variables.'
    };
  }
  return {
    configured: false,
    message: 'Supabase credentials pending in .env. Using mock foundation layer.'
  };
}
