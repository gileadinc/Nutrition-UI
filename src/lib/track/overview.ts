"use client";

/**
 * Which cards the Track "Overview" shows, and in what order. Stored in this browser's
 * localStorage (per device, not synced to the account).
 */

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { IconName } from "@/components/Icon";

export type OverviewId =
  | "calories"
  | "protein"
  | "carbs"
  | "fat"
  | "sugar"
  | "sodium"
  | "water"
  | "activeMinutes"
  | "weight"
  | "medication";

export const OVERVIEW_ITEMS: { id: OverviewId; label: string; icon: IconName }[] = [
  { id: "calories", label: "Calories", icon: "fire" },
  { id: "protein", label: "Protein", icon: "dumbbell" },
  { id: "carbs", label: "Carbs", icon: "apple" },
  { id: "fat", label: "Fat", icon: "leaf" },
  { id: "sugar", label: "Sugar", icon: "apple" },
  { id: "sodium", label: "Sodium", icon: "bolt" },
  { id: "water", label: "Water", icon: "droplet" },
  { id: "activeMinutes", label: "Active minutes", icon: "activity" },
  { id: "weight", label: "Weight", icon: "weightScale" },
  { id: "medication", label: "Medication", icon: "medication" },
];

export const DEFAULT_OVERVIEW: OverviewId[] = ["calories", "protein", "carbs", "fat", "sugar", "sodium"];

const KEY = "forkthis.track.overview";
const TOUR_KEY = "forkthis.track.overview.tourDismissed";
const IDS = new Set<string>(OVERVIEW_ITEMS.map((i) => i.id));
const listeners = new Set<() => void>();
let cached: { raw: string | null; value: OverviewId[] } = { raw: null, value: DEFAULT_OVERVIEW };

function read(): OverviewId[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cached.raw) return cached.value;
    const p = raw ? (JSON.parse(raw) as unknown) : null;
    const list = Array.isArray(p)
      ? [...new Set(p.filter((x): x is OverviewId => typeof x === "string" && IDS.has(x)))]
      : null;
    cached = { raw, value: list ?? DEFAULT_OVERVIEW };
    return cached.value;
  } catch {
    return DEFAULT_OVERVIEW;
  }
}

function write(list: OverviewId[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage unavailable: the choice just won't persist
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export function useOverviewLayout() {
  const showing = useSyncExternalStore(subscribe, read, () => DEFAULT_OVERVIEW);
  const hidden = useMemo(
    () => OVERVIEW_ITEMS.map((i) => i.id).filter((id) => !showing.includes(id)),
    [showing],
  );

  const move = useCallback((id: OverviewId, by: -1 | 1) => {
    const list = [...read()];
    const i = list.indexOf(id);
    const j = i + by;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    write(list);
  }, []);
  const remove = useCallback((id: OverviewId) => write(read().filter((x) => x !== id)), []);
  const add = useCallback((id: OverviewId) => {
    const list = read();
    if (!list.includes(id)) write([...list, id]);
  }, []);
  const reset = useCallback(() => write([...DEFAULT_OVERVIEW]), []);

  return { showing, hidden, move, remove, add, reset };
}

/* ---- "make this overview yours" banner (dismissed once) */

const tourListeners = new Set<() => void>();
const readTour = () => {
  try {
    return window.localStorage.getItem(TOUR_KEY) === "1";
  } catch {
    return false;
  }
};
const subscribeTour = (cb: () => void) => {
  tourListeners.add(cb);
  return () => {
    tourListeners.delete(cb);
  };
};

export function useOverviewTipDismissed() {
  const dismissed = useSyncExternalStore(subscribeTour, readTour, () => true);
  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(TOUR_KEY, "1");
    } catch {
      // ignore
    }
    tourListeners.forEach((l) => l());
  }, []);
  return [dismissed, dismiss] as const;
}
