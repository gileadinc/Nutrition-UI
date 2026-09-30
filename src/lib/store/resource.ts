"use client";

/**
 * Tiny keyed, module-level cache for API reads (stale-while-revalidate light).
 * Every store hook that reads from the backend goes through `useCached` so
 * screens share requests and can invalidate after a write.
 *
 *   const { data, error, isLoading, refresh, mutate } = useCached("recipes:list?..", () => recipesApi.listRecipes(p));
 *
 * - `key === null` disables the fetch (e.g. while the session is loading).
 * - The whole cache is dropped whenever the auth session or guest session changes.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getErrorMessage } from "@/lib/api";
import { subscribe as subscribeAuth } from "@/lib/auth";

interface Entry<T = unknown> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  /** monotonically increasing so useSyncExternalStore sees a new snapshot */
  version: number;
  promise: Promise<void> | null;
}

export interface CachedResource<T> {
  data: T | undefined;
  error: string | null;
  /** True until the first response (or error) arrives for this key. */
  isLoading: boolean;
  /** True whenever a request is in flight (including background refreshes). */
  isFetching: boolean;
  refresh: () => Promise<void>;
  /** Replace the cached value locally (optimistic updates). */
  mutate: (next: T | ((prev: T | undefined) => T)) => void;
}

const cache = new Map<string, Entry>();
const listeners = new Set<() => void>();
const fetchers = new Map<string, () => Promise<unknown>>();

const notify = () => listeners.forEach((l) => l());

function getEntry(key: string): Entry {
  let e = cache.get(key);
  if (!e) {
    e = { data: undefined, error: null, loading: false, version: 0, promise: null };
    cache.set(key, e);
  }
  return e;
}

function patch(key: string, next: Partial<Entry>) {
  const prev = getEntry(key);
  cache.set(key, { ...prev, ...next, version: prev.version + 1 });
  notify();
}

function run(key: string, fetcher: () => Promise<unknown>, force = false): Promise<void> {
  const entry = getEntry(key);
  if (entry.promise && !force) return entry.promise;
  fetchers.set(key, fetcher);
  const promise = fetcher()
    .then((data) => {
      patch(key, { data, error: null, loading: false, promise: null });
    })
    .catch((err) => {
      patch(key, { error: getErrorMessage(err), loading: false, promise: null });
    });
  patch(key, { loading: true, promise });
  return promise;
}

/** Drop cached data whose key starts with `prefix` (or everything) and refetch active ones. */
export function invalidate(prefix = "") {
  for (const [key, entry] of cache) {
    if (!key.startsWith(prefix)) continue;
    const fetcher = fetchers.get(key);
    if (fetcher && listeners.size > 0) {
      // keep stale data visible while revalidating
      cache.set(key, { ...entry, promise: null, version: entry.version + 1 });
      void run(key, fetcher, true);
    } else {
      cache.delete(key);
    }
  }
  notify();
}

/** Forget everything (sign in/out). */
export function resetCache() {
  cache.clear();
  fetchers.clear();
  notify();
}

if (typeof window !== "undefined") {
  subscribeAuth(() => resetCache());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const IDLE: Entry = { data: undefined, error: null, loading: false, version: -1, promise: null };

export function useCached<T>(key: string | null, fetcher: () => Promise<T>): CachedResource<T> {
  const entry = useSyncExternalStore(
    subscribe,
    () => (key ? (cache.get(key) ?? IDLE) : IDLE),
    () => IDLE,
  );

  useEffect(() => {
    if (!key) return;
    const e = cache.get(key);
    if (!e || (e.data === undefined && e.error === null && !e.promise)) {
      void run(key, fetcher);
    } else {
      fetchers.set(key, fetcher);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `fetcher` is an inline closure keyed by `key`
  }, [key]);

  const refresh = useCallback(async () => {
    if (key) await run(key, fetcher, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const mutate = useCallback(
    (next: T | ((prev: T | undefined) => T)) => {
      if (!key) return;
      const prev = getEntry(key).data as T | undefined;
      patch(key, { data: typeof next === "function" ? (next as (p: T | undefined) => T)(prev) : next });
    },
    [key],
  );

  const settled = entry.data !== undefined || entry.error !== null;
  return {
    data: entry.data as T | undefined,
    error: entry.error,
    isLoading: key !== null && !settled,
    isFetching: entry.loading,
    refresh,
    mutate,
  };
}

/** Stable cache key from a name + params object. */
export function keyOf(name: string, params?: object | null): string {
  if (!params) return name;
  const entries = Object.entries(params as Record<string, unknown>)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b));
  return entries.length ? `${name}?${entries.map(([k, v]) => `${k}=${String(v)}`).join("&")}` : name;
}
