import { QueryClient } from "@tanstack/react-query";

export const PERSISTABLE_QUERY_ROOTS = [
  "dashboard-stats",
  "institution-families",
  "families",
  "inventory",
  "institution-deliveries",
] as const;

export type PersistableQueryRoot = (typeof PERSISTABLE_QUERY_ROOTS)[number];

export function isPersistableQueryKey(queryKey: readonly unknown[]) {
  const root = queryKey[0];
  return (
    typeof root === "string" &&
    PERSISTABLE_QUERY_ROOTS.includes(root as PersistableQueryRoot)
  );
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 60 * 24,
        retry: (failureCount) => {
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            return false;
          }
          return failureCount < 2;
        },
        networkMode: "offlineFirst",
      },
      mutations: {
        networkMode: "online",
        retry: false,
      },
    },
  });
}
