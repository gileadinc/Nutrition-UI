"use client";

/**
 * Device-local UI state that has no backend equivalent and is not user data:
 * recent searches. (Persisted in localStorage.)
 */

import { useCallback, useSyncExternalStore } from "react";

const RECENT_KEY = "forkthis.recentSearches";
const MAX_RECENT = 6;
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let cached: { raw: string | null; value: string[] } = { raw: null, value: EMPTY };

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (raw === cached.raw) return cached.value;
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    const value = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : EMPTY;
    cached = { raw, value: value.length ? value : EMPTY };
    return cached.value;
  } catch {
    return EMPTY;
  }
}

function write(list: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

export function useRecentSearches() {
  const recent = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    read,
    () => EMPTY,
  );
  const remember = useCallback((q: string) => {
    const t = q.trim();
    if (t.length < 2) return;
    write([t, ...read().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT));
  }, []);
  const clear = useCallback(() => write([]), []);
  return { recent, remember, clear };
}
