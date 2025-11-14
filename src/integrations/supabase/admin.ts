// Admin client for creating users
// WARNING: This should ideally be in a backend/Edge Function, not exposed in frontend
// For development purposes, we're using it here, but in production this should be moved to a secure backend
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY not found. User creation will fail.');
}

// Create admin client with service_role key (bypasses RLS)
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

