"use client";

/**
 * Nutrition tracking. Signed in -> `/api/tracking/me/*`; guest -> `/api/tracking/guest/*`
 * keyed by the guest session id. (The deployed UI gates tracking behind an
 * account for guests via `useRequireAccount`; the guest endpoints are here if a
 * screen wants to allow it.)
 */

import { useCallback } from "react";
import {
  trackingApi,
  type DailySummary,
  type MacroTotals,
  type NutritionEntry,
  type Paginated,
} from "@/lib/api";
import type { EntryInput, EntryListParams } from "@/lib/api/endpoints/tracking";
import { budgetFromSummary, isoDate, type Budget } from "@/lib/nutrition";
import { invalidate, keyOf, useCached } from "./resource";
import { getAppSession, useAppSession } from "./session";

const ZERO: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, waterMl: 0 };

/** Guest summary built client-side from that day's guest entries (no summary endpoint for guests). */
function summarize(date: string, entries: NutritionEntry[]): DailySummary {
  const totals = entries.reduce<MacroTotals>(
    (t, e) => ({
      calories: t.calories + (e.calories ?? 0),
      protein: t.protein + (e.protein ?? 0),
      carbs: t.carbs + (e.carbs ?? 0),
      fat: t.fat + (e.fat ?? 0),
      waterMl: (t.waterMl ?? 0) + (e.waterMl ?? 0),
    }),
    { ...ZERO },
  );
  return {
    date,
    entryCount: entries.length,
    totals,
    targets: ZERO,
    remaining: ZERO,
    progressPercent: ZERO,
  };
}

const sameDay = (iso: string, date: string) => isoDate(new Date(iso)) === date;

/** Daily totals + targets for `date` (default today). */
export function useDailySummary(date: string = isoDate(new Date())) {
  const s = useAppSession();
  const key = !s.ready
    ? null
    : s.isSignedIn
      ? `tracking:summary:${date}`
      : s.isGuest
        ? `tracking:guest-summary:${date}`
        : null;
  return useCached<DailySummary>(key, async () => {
    if (getAppSession().isSignedIn) return trackingApi.getDailySummary(date);
    const id = getAppSession().guestSessionId!;
    const res = await trackingApi.listGuestEntries(id, { limit: 200 });
    return summarize(
      date,
      res.items.filter((e) => sameDay(e.loggedAt, date)),
    );
  });
}

/** Budget (remaining calories/protein/water) for a day, ready for `fitFor()`. */
export function useDayBudget(date?: string): { budget: Budget; isLoading: boolean } {
  const { data, isLoading } = useDailySummary(date);
  return { budget: budgetFromSummary(data), isLoading };
}

/** Logged entries (newest first per backend). */
export function useEntries(params?: EntryListParams) {
  const s = useAppSession();
  const key = !s.ready
    ? null
    : s.isSignedIn
      ? keyOf("tracking:entries", params)
      : s.isGuest
        ? keyOf("tracking:guest-entries", params)
        : null;
  return useCached<Paginated<NutritionEntry>>(key, () => {
    const cur = getAppSession();
    return cur.isSignedIn
      ? trackingApi.listEntries(params)
      : trackingApi.listGuestEntries(cur.guestSessionId!, params);
  });
}

export function useMomentum(date?: string) {
  const s = useAppSession();
  return useCached<unknown>(s.isSignedIn ? keyOf("tracking:momentum", { date }) : null, () =>
    trackingApi.getMomentum(date),
  );
}

export function useTrackingRecommendations(date?: string) {
  const s = useAppSession();
  return useCached<unknown>(s.isSignedIn ? keyOf("tracking:recs", { date }) : null, () =>
    trackingApi.getTrackingRecommendations(date),
  );
}

/** Write helpers; each invalidates cached tracking reads. */
export function useTrackingActions() {
  const log = useCallback(async (input: EntryInput): Promise<NutritionEntry> => {
    const cur = getAppSession();
    const entry = cur.isSignedIn
      ? await trackingApi.createEntry(input)
      : await trackingApi.createGuestEntry({ ...input, sessionId: cur.guestSessionId! });
    invalidate("tracking");
    invalidate("home");
    return entry;
  }, []);

  const update = useCallback(async (entryId: string, input: Partial<EntryInput>) => {
    const cur = getAppSession();
    const entry = cur.isSignedIn
      ? await trackingApi.updateEntry(entryId, input)
      : await trackingApi.updateGuestEntry(cur.guestSessionId!, entryId, input);
    invalidate("tracking");
    return entry;
  }, []);

  const remove = useCallback(async (entryId: string) => {
    const cur = getAppSession();
    if (cur.isSignedIn) await trackingApi.deleteEntry(entryId);
    else await trackingApi.deleteGuestEntry(cur.guestSessionId!, entryId);
    invalidate("tracking");
    invalidate("home");
  }, []);

  /** Quick water log in millilitres. */
  const addWater = useCallback(
    (waterMl: number) => log({ mealType: "snack", sourceType: "water", waterMl }),
    [log],
  );

  return { log, update, remove, addWater };
}
