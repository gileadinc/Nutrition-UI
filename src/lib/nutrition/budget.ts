/**
 * "Does this fit what's left today?" helpers behind the "Fits today" badge and
 * filter. Built from a real `DailySummary` (see `useDayBudget` in the store).
 */

import type { DailySummary } from "@/lib/api";

export interface BudgetLine {
  key: "calories" | "protein" | "water";
  label: string;
  unit: string;
  consumed: number;
  goal: number;
  remaining: number;
  over: number;
  /** 0..1 */
  progress: number;
}

export interface Budget {
  calories: BudgetLine;
  protein: BudgetLine;
  water: BudgetLine;
  /** True when the goals come from the user's own targets (not app defaults). */
  personalised: boolean;
}

const line = (
  key: BudgetLine["key"],
  label: string,
  unit: string,
  consumed: number,
  goal: number,
): BudgetLine => ({
  key,
  label,
  unit,
  consumed: Math.round(consumed),
  goal: Math.round(goal),
  remaining: Math.max(0, Math.round(goal - consumed)),
  over: Math.max(0, Math.round(consumed - goal)),
  progress: goal <= 0 ? 0 : Math.min(1, Math.max(0, consumed / goal)),
});

const ML_PER_OZ = 29.5735;

/** Defaults used only when no server targets are available yet. */
export const DEFAULT_TARGETS = { calories: 2100, protein: 112, waterOz: 64 } as const;

export function budgetFromSummary(summary: DailySummary | null | undefined): Budget {
  const totals = summary?.totals;
  const targets = summary?.targets;
  const waterConsumed = (totals?.waterMl ?? 0) / ML_PER_OZ;
  const waterGoal = targets?.waterMl ? targets.waterMl / ML_PER_OZ : DEFAULT_TARGETS.waterOz;
  return {
    calories: line("calories", "Calories", "kcal", totals?.calories ?? 0, targets?.calories || DEFAULT_TARGETS.calories),
    protein: line("protein", "Protein", "g", totals?.protein ?? 0, targets?.protein || DEFAULT_TARGETS.protein),
    water: line("water", "Water", "oz", waterConsumed, waterGoal),
    personalised: !!targets?.calories,
  };
}

export type Fit =
  | { kind: "fits"; leaves: number; helpsProtein: boolean }
  | { kind: "tight"; leaves: number; helpsProtein: boolean }
  | { kind: "over"; by: number; helpsProtein: boolean };

const TIGHT_KCAL = 150;

/** How an item's calories/protein sit against today's remaining budget. */
export function fitFor(item: { calories: number; protein: number }, budget: Budget): Fit {
  const helpsProtein =
    budget.protein.remaining > 0 && item.protein >= Math.min(20, budget.protein.remaining);
  const left = budget.calories.remaining - item.calories;
  if (left < 0) return { kind: "over", by: -left, helpsProtein };
  if (left < TIGHT_KCAL) return { kind: "tight", leaves: left, helpsProtein };
  return { kind: "fits", leaves: left, helpsProtein };
}

export const fitsToday = (fit: Fit) => fit.kind !== "over";
