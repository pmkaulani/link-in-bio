import { createClient } from '@supabase/supabase-js';
import { createLocalSupabaseClient } from './localDatabase.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Reflects whether real Supabase credentials are actually configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isLocalMode = !isSupabaseConfigured;

if (isLocalMode) {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '[CRITICAL SECURITY WARNING] Running without Supabase credentials in production. ' +
      'Local mock mode is active, but all admin privileges and auto-grants are disabled.'
    );
  } else {
    console.warn(
      '[link-in-bio] Running in LOCAL DEMO MODE — Supabase env vars are missing. ' +
      'All data is stored in localStorage / in-memory. ' +
      'Do NOT deploy this configuration to production.'
    );
  }
}

// In real production / configured mode, ensure any legacy sandbox demo data is cleaned up
if (isSupabaseConfigured && typeof window !== 'undefined') {
  try {
    localStorage.removeItem('local_supabase_db');
    localStorage.removeItem('linkinbio_local_session');
    localStorage.removeItem('mock_profiles');
    localStorage.removeItem('mock_blocks');
  } catch (e) {
    // ignore
  }
}

export const supabase = isLocalMode
  ? createLocalSupabaseClient()
  : createClient(supabaseUrl, supabaseAnonKey);
