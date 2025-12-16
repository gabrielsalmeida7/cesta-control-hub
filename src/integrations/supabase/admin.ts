// ⚠️ DEPRECATED: Este arquivo não deve ser usado em produção
// A criação de usuários agora deve ser feita via Edge Function: supabase/functions/create-institution-user
// Este arquivo está mantido apenas para compatibilidade durante migração
// TODO: Remover todas as referências a supabaseAdmin e usar Edge Functions
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  if (import.meta.env.DEV) {
    console.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY not found. User creation will fail.');
  }
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

