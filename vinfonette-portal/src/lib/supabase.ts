// ==============================================================================
// VINFONETTE INTERNAL PLACEMENT MANAGEMENT PORTAL
// Supabase Client with graceful fallback detection
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

// We export a real Supabase client if configured, or a dummy client instance to avoid crash
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://mock.supabase.co', 'mock-key');

export const getSupabaseConfigStatus = () => {
  return {
    isConfigured: isSupabaseConfigured,
    url: isSupabaseConfigured ? supabaseUrl : null,
  };
};
