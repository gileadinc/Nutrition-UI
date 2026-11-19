"use client";

/**
 * Steps, sleep, mood and body measurements. The backend has no endpoints for these, so (like
 * weigh-ins) they live in this browser's localStorage, one record per day.
 */
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { isoDate } from "@/lib/nutrition";

export interface BodyDay {
  steps?: number | null;
  sleepHours?: number | null;
  feeling?: string | null;
  measurements?: { waist: number; hips: number; chest: number } | null;
}

const KEY = "forkthis.bodylog";
type Store = Record<string, BodyDay>;
const EMPTY: Store = {};
const listeners = new Set<() => void>();
let cached: { raw: string | null; value: Store } = { raw: null, value: EMPTY };

function read(): Store {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cached.raw) return cached.value;
    const p = raw ? (JSON.parse(raw) as unknown) : null;
    const value = p && typeof p === "object" && !Array.isArray(p) ? (p as Store) : EMPTY;
    cached = { raw, value };
    return value;
  } catch {
    return EMPTY;
  }
}

function write(next: Store) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: values just won't persist */
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export function useBodyLog() {
  const all = useSyncExternalStore(subscribe, read, () => EMPTY);
  const date = isoDate(new Date());
  const today = useMemo<BodyDay>(() => all[date] ?? {}, [all, date]);
  const set = useCallback((patch: BodyDay) => {
    const d = isoDate(new Date());
    const cur = read();
    write({ ...cur, [d]: { ...cur[d], ...patch } });
  }, []);
  return { today, all, set };
}
