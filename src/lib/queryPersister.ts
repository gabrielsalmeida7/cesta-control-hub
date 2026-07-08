import { get, set, del } from "idb-keyval";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

export const QUERY_CACHE_STORAGE_KEY = "cestajusta-query-cache";

export const queryPersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => await get(key),
    setItem: async (key, value) => await set(key, value),
    removeItem: async (key) => await del(key),
  },
  key: QUERY_CACHE_STORAGE_KEY,
});

export async function clearPersistedQueryCache() {
  await del(QUERY_CACHE_STORAGE_KEY);
}
