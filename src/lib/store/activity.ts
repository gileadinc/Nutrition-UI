"use client";

/**
 * Activity log. The backend has no activity endpoint, so entries live in this browser's
 * localStorage (per device, not synced to the account).
 */

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { isoDate } from "@/lib/nutrition";

export interface ActivityEntry {
  id: string;
  name: string;
  minutes: number;
  calories: number;
  /** ISO timestamp. */
  loggedAt: string;
}

export const ACTIVE_MINUTES_GOAL = 30;

const KEY = "forkthis.activity";
const EMPTY: ActivityEntry[] = [];
const listeners = new Set<() => void>();
let cached: { raw: string | null; value: ActivityEntry[] } = { raw: null, value: EMPTY };

const isEntry = (x: unknown): x is ActivityEntry => {
  const e = x as ActivityEntry;
  return (
    !!e &&
    typeof e === "object" &&
    typeof e.id === "string" &&
    typeof e.name === "string" &&
    typeof e.minutes === "number" &&
    typeof e.calories === "number" &&
    typeof e.loggedAt === "string"
  );
};

function read(): ActivityEntry[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cached.raw) return cached.value;
    const p = raw ? (JSON.parse(raw) as unknown) : null;
    const list = Array.isArray(p) ? p.filter(isEntry) : [];
    cached = { raw, value: list.length ? list : EMPTY };
    return cached.value;
  } catch {
    return EMPTY;
  }
}

function write(list: ActivityEntry[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage unavailable: entries just won't persist
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

const dayOf = (iso: string) => isoDate(new Date(iso));

export function useActivity() {
  const all = useSyncExternalStore(subscribe, read, () => EMPTY);
  const today = isoDate(new Date());

  /** Newest first. */
  const entries = useMemo(() => [...all].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt)), [all]);
  const todayEntries = useMemo(() => entries.filter((e) => dayOf(e.loggedAt) === today), [entries, today]);
  const todayMinutes = todayEntries.reduce((s, e) => s + e.minutes, 0);
  const todayCalories = todayEntries.reduce((s, e) => s + e.calories, 0);

  /** Distinct recent activities (newest first), for the quick-add "Recent" rows. */
  const recents = useMemo(() => {
    const seen = new Set<string>();
    const out: ActivityEntry[] = [];
    for (const e of entries) {
      const k = e.name.trim().toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(e);
      if (out.length === 3) break;
    }
    return out;
  }, [entries]);

  const add = useCallback((input: { name: string; minutes: number; calories: number }, at = new Date()) => {
    const list = read();
    const entry: ActivityEntry = {
      id: `act-${Date.now().toString(36)}-${list.length}`,
      name: input.name,
      minutes: input.minutes,
      calories: input.calories,
      loggedAt: at.toISOString(),
    };
    write([...list, entry]);
    return entry;
  }, []);

  const remove = useCallback((id: string) => write(read().filter((e) => e.id !== id)), []);

  return {
    entries,
    todayEntries,
    todayMinutes,
    todayCalories,
    goalMinutes: ACTIVE_MINUTES_GOAL,
    recents,
    add,
    remove,
  };
}
