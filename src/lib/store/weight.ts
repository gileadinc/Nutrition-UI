"use client";

/**
 * Weigh-ins. The backend has no weight endpoint, so readings live in this browser's
 * localStorage (per device, not synced to the account). One reading per day.
 */

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { isoDate } from "@/lib/nutrition";

export interface WeightReading {
  /** YYYY-MM-DD (local). */
  date: string;
  pounds: number;
}

const KEY = "forkthis.weight";
const EMPTY: WeightReading[] = [];
const listeners = new Set<() => void>();
let cached: { raw: string | null; value: WeightReading[] } = { raw: null, value: EMPTY };

const isReading = (x: unknown): x is WeightReading => {
  const r = x as WeightReading;
  return !!r && typeof r.date === "string" && typeof r.pounds === "number" && r.pounds > 0;
};

function read(): WeightReading[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cached.raw) return cached.value;
    const p = raw ? (JSON.parse(raw) as unknown) : null;
    const list = Array.isArray(p) ? p.filter(isReading) : [];
    cached = { raw, value: list.length ? list : EMPTY };
    return cached.value;
  } catch {
    return EMPTY;
  }
}

function write(list: WeightReading[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage unavailable: readings just won't persist
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export function useWeight() {
  const all = useSyncExternalStore(subscribe, read, () => EMPTY);
  const today = isoDate(new Date());
  /** Newest first. */
  const readings = useMemo(() => [...all].sort((a, b) => b.date.localeCompare(a.date)), [all]);
  const todayReading = readings.find((r) => r.date === today) ?? null;
  /** Most recent reading from a previous day. */
  const previous = readings.find((r) => r.date !== today) ?? null;

  /** Saves today's reading (replacing any earlier one); `null` clears today's. */
  const setToday = useCallback((pounds: number | null) => {
    const d = isoDate(new Date());
    const rest = read().filter((r) => r.date !== d);
    write(pounds === null ? rest : [...rest, { date: d, pounds }]);
  }, []);

  return { readings, todayReading, previous, setToday };
}
