export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  adminSeedEmail: process.env.EXPO_PUBLIC_ADMIN_SEED_EMAIL ?? '',
  isDev: __DEV__,
} as const;

function assertNoServiceRoleInClient(): void {
  const forbiddenKeys = Object.keys(process.env).filter((key) =>
    /service.?role/i.test(key)
  );

  if (forbiddenKeys.length > 0) {
    throw new Error(
      `Service role key must not be bundled in the mobile client. Remove: ${forbiddenKeys.join(', ')}`
    );
  }
}

export function assertEnv(): void {
  assertNoServiceRoleInClient();

  if (!env.supabaseUrl) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL. Copy values from the web .env.local into mobile/.env'
    );
  }
  if (!env.supabaseAnonKey) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy values from the web .env.local into mobile/.env'
    );
  }
}
