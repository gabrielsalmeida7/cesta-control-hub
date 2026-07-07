import type { Href } from 'expo-router';

export type AppRole = 'admin' | 'institution';

export function getHomeRouteForRole(role: AppRole | string | undefined | null): Href {
  if (role === 'admin') {
    return '/(admin)';
  }

  if (role === 'institution') {
    return '/(institution)/dashboard';
  }

  return '/(auth)/login';
}

export function isAppRole(role: unknown): role is AppRole {
  return role === 'admin' || role === 'institution';
}
