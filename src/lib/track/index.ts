"use client";

/**
 * Track view-model built from the real tracking endpoints.
 *
 * The deployed app kept a local `trackDays[]` store of meals / hydration /
 * activities / medication. Here the same shapes are derived from the API's
 * `NutritionEntry` rows (meal rows carry macros, water rows carry `waterMl`)
 * and the signed-in user's daily targets. Activity, weight and medication have
 * no endpoint, so they are not part of a `TrackDay`.
 */

import { useMemo } from "react";
import { trackingApi, type NutritionEntry } from "@/lib/api";
import type { EntryInput } from "@/lib/api/endpoints/tracking";
import {
  budgetFromSummary,
  isoDate,
  mealApi,
  mealLabel,
  mlToOz,
  type MealLabel,
} from "@/lib/nutrition";
import { useAppSession, useCached, useDailySummary } from "@/lib/store";

export interface TrackMeal {
  id: string;
  title: string;
  mealType: MealLabel;
  loggedAt: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sourceType: string | null;
  sourceItemId: string | null;
}

export interface TrackWater {
  id: string;
  loggedAt: string;
  ounces: number;
}

export interface TrackDay {
  /** YYYY-MM-DD (local) */
  date: string;
  meals: TrackMeal[];
  hydration: TrackWater[];
  calorieGoal: number;
  proteinGoal: number;
  waterGoalOz: number;
}

export interface TrackGoals {
  calorieGoal: number;
  proteinGoal: number;
  waterGoalOz: number;
}

/** Meal-type colours used by rings, bars and legends. */
export const MEAL_COLOR: Record<MealLabel, string> = {
  Breakfast: "var(--color-orange-400)",
  Lunch: "var(--color-accent-graphic)",
  Dinner: "var(--color-accent-ink)",
  Snack: "var(--color-orange-800)",
};

const MAX_PAGES = 10;
const PAGE_SIZE = 100;

/** Every logged entry for the current owner (signed in or guest), newest data first as the API returns it. */
export function useAllEntries() {
  const s = useAppSession();
  const key = !s.ready
    ? null
    : s.isSignedIn
      ? "tracking:all-entries"
      : s.isGuest
        ? "tracking:guest-all-entries"
        : null;
  return useCached<NutritionEntry[]>(key, async () => {
    const guestId = s.guestSessionId;
    const all: NutritionEntry[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = s.isSignedIn
        ? await trackingApi.listEntries({ limit: PAGE_SIZE, page })
        : await trackingApi.listGuestEntries(guestId!, { limit: PAGE_SIZE, page });
      all.push(...res.items);
      if (!res.pagination?.hasNextPage) break;
    }
    return all;
  });
}

/** Targets from today's daily summary (with app defaults while loading / for guests). */
export function useTrackGoals(): TrackGoals {
  const { data } = useDailySummary();
  return useMemo(() => {
    const b = budgetFromSummary(data);
    return {
      calorieGoal: b.calories.goal,
      proteinGoal: b.protein.goal,
      waterGoalOz: b.water.goal,
    };
  }, [data]);
}

const isWater = (e: NutritionEntry) => (e.waterMl ?? 0) > 0 && !((e.calories ?? 0) > 0);

/** Display title of a logged meal (the entry's note, set when logging). */
export const entryTitle = (e: NutritionEntry) => e.notes?.trim() || "Meal";

/** Group entries by local day. */
export function groupEntries(entries: NutritionEntry[]) {
  const meals = new Map<string, TrackMeal[]>();
  const water = new Map<string, TrackWater[]>();
  for (const e of entries) {
    const date = isoDate(new Date(e.loggedAt));
    if (isWater(e)) {
      const list = water.get(date) ?? [];
      list.push({ id: e.entryId, loggedAt: e.loggedAt, ounces: Math.round(mlToOz(e.waterMl ?? 0)) });
      water.set(date, list);
    } else {
      const list = meals.get(date) ?? [];
      list.push({
        id: e.entryId,
        title: entryTitle(e),
        mealType: mealLabel(e.mealType),
        loggedAt: e.loggedAt,
        calories: Math.round(e.calories ?? 0),
        protein: Math.round(e.protein ?? 0),
        carbs: Math.round(e.carbs ?? 0),
        fat: Math.round(e.fat ?? 0),
        sourceType: e.sourceType,
        sourceItemId: e.sourceItemId,
      });
      meals.set(date, list);
    }
  }
  return { meals, water };
}

export function dayFrom(
  date: string,
  grouped: ReturnType<typeof groupEntries>,
  goals: TrackGoals,
): TrackDay {
  return {
    date,
    meals: grouped.meals.get(date) ?? [],
    hydration: grouped.water.get(date) ?? [],
    ...goals,
  };
}

/** Local date `n` days before `from` (n may be negative). */
export function shiftDate(from: Date, n: number) {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return d;
}

/** The `count` days ending at `end` (default today), oldest first. */
export function useTrackDays(count: number, end?: Date) {
  const entries = useAllEntries();
  const goals = useTrackGoals();
  const endKey = end ? isoDate(end) : isoDate(new Date());
  const days = useMemo(() => {
    const grouped = groupEntries(entries.data ?? []);
    const anchor = new Date(`${endKey}T12:00:00`);
    return Array.from({ length: count }, (_, i) =>
      dayFrom(isoDate(shiftDate(anchor, i - (count - 1))), grouped, goals),
    );
  }, [entries.data, goals, count, endKey]);
  return { days, isLoading: entries.isLoading, error: entries.error, refresh: entries.refresh };
}

/* ------------------------------------------------------------ day maths */

export const dayCalories = (d: TrackDay) => d.meals.reduce((s, m) => s + m.calories, 0);
export const dayProtein = (d: TrackDay) => d.meals.reduce((s, m) => s + m.protein, 0);
export const dayWaterOz = (d: TrackDay) => d.hydration.reduce((s, w) => s + w.ounces, 0);
export const dayLogged = (d: TrackDay) => d.meals.length > 0 || d.hydration.length > 0;

/* -------------------------------------------------------------- metrics */

export interface TrackMetric {
  label: "Calories" | "Protein" | "Water";
  moreIsBetter: boolean;
  unit: string;
  accent: string;
  chart: "ringsByDay" | "columnsWithGoal";
  valueOf: (d: TrackDay) => number;
  goalOf: (d: TrackDay | null) => number;
  icon: "fire" | "dumbbell" | "droplet";
}

/** Metrics shown in Insights (activity / medication have no endpoint). */
export const TRACK_METRICS: TrackMetric[] = [
  {
    label: "Calories",
    moreIsBetter: false,
    unit: "kcal",
    accent: "var(--color-accent-graphic)",
    chart: "ringsByDay",
    valueOf: dayCalories,
    goalOf: (d) => d?.calorieGoal ?? 2100,
    icon: "fire",
  },
  {
    label: "Protein",
    moreIsBetter: true,
    unit: "g",
    accent: "var(--color-brand-navy)",
    chart: "columnsWithGoal",
    valueOf: dayProtein,
    goalOf: (d) => d?.proteinGoal ?? 112,
    icon: "dumbbell",
  },
  {
    label: "Water",
    moreIsBetter: true,
    unit: "oz",
    accent: "var(--color-graphic)",
    chart: "ringsByDay",
    valueOf: dayWaterOz,
    goalOf: (d) => d?.waterGoalOz ?? 64,
    icon: "droplet",
  },
];

export const metricByLabel = (label: string | null) =>
  TRACK_METRICS.find((m) => m.label === label) ?? TRACK_METRICS[0];

/** Mean over days that have a reading. */
export function metricAverage(m: TrackMetric, days: TrackDay[]) {
  const v = days.map((d) => m.valueOf(d)).filter((x) => x > 0);
  return v.length === 0 ? 0 : v.reduce((s, x) => s + x, 0) / v.length;
}

/** Re-create a removed meal (Undo). */
export const mealToInput = (m: TrackMeal): EntryInput => ({
  mealType: mealApi(m.mealType),
  loggedAt: m.loggedAt,
  sourceType: m.sourceType ?? undefined,
  sourceItemId: m.sourceItemId ?? undefined,
  calories: m.calories,
  protein: m.protein,
  carbs: m.carbs,
  fat: m.fat,
  notes: m.title,
});
