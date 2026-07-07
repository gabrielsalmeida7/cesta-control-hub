import * as Linking from 'expo-linking';
import { supabase } from '@/integrations/supabase/client';

export function getPasswordResetRedirectUrl(): string {
  return Linking.createURL('reset-password');
}

export function parseAuthParamsFromUrl(url: string): Record<string, string> {
  let paramString = '';
  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    paramString = url.slice(hashIndex + 1);
  } else {
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      paramString = url.slice(queryIndex + 1);
    }
  }

  const result: Record<string, string> = {};
  for (const part of paramString.split('&')) {
    if (!part) continue;
    const [rawKey, ...rawValue] = part.split('=');
    if (!rawKey) continue;
    const key = decodeURIComponent(rawKey);
    const value = decodeURIComponent(rawValue.join('='));
    result[key] = value;
  }

  return result;
}

export function isPasswordRecoveryUrl(url: string): boolean {
  if (!url.includes('reset-password')) {
    return false;
  }

  const params = parseAuthParamsFromUrl(url);
  return params.type === 'recovery' || Boolean(params.access_token && params.refresh_token);
}

export async function createSessionFromAuthUrl(url: string): Promise<void> {
  const params = parseAuthParamsFromUrl(url);
  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;

  if (!accessToken || !refreshToken) {
    throw new Error('Link de recuperação inválido ou expirado.');
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    throw error;
  }
}
