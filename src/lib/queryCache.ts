import type { QueryClient } from "@tanstack/react-query";
import { clearPersistedQueryCache } from "@/lib/queryPersister";

let queryClientRef: QueryClient | null = null;

export function registerQueryClient(client: QueryClient) {
  queryClientRef = client;
}

export async function clearAppQueryCache() {
  queryClientRef?.clear();
  await clearPersistedQueryCache();
}
