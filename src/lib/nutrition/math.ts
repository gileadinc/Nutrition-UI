/**
 * Pure nutrition / body maths (no I/O). Ported from the deployed store chunk.
 * The backend computes the authoritative daily targets; these are used for the
 * client-side estimate shown while onboarding and by the calculators.
 */

import type { ActivityKey, GoalKey, MealLabel } from "./constants";
import { MEAL_TYPES } from "./constants";

export type Sex = "male" | "female" | "other";

/** Mifflin-St Jeor constants. */
const SEX_OFFSET: Record<Sex, number> = { male: 5, female: -161, other: -78 };

export function bmr({
  weightKg,
  heightCm,
  age,
  sex,
}: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
}) {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + SEX_OFFSET[sex];
}

export const ACTIVITY_MULTIPLIER: Record<ActivityKey, number> = {
  mostlyInactive: 1.2,
  lightlyActive: 1.375,
  moderatelyActive: 1.55,
  veryActive: 1.725,
  extremelyActive: 1.9,
};

export const GOAL_CALORIE_DELTA: Record<GoalKey, number> = {
  lose: -500,
  gain: 500,
  maintain: 0,
  recomp: -200,
};

/** Total daily energy expenditure, or null for unusable input. */
export function tdee(input: {
  weightKg: number;
  heightCm: number;
  age: number | null;
  activityLevel: ActivityKey;
  sex?: Sex;
}): number | null {
  const { weightKg, heightCm, age, activityLevel, sex = "other" } = input;
  if (age === null || age <= 0 || weightKg <= 0 || heightCm <= 0) return null;
  return Math.round(bmr({ weightKg, heightCm, age, sex }) * ACTIVITY_MULTIPLIER[activityLevel]);
}

/** Daily calorie target for a goal, or null (below 1000 kcal is never recommended). */
export function calorieTarget(input: {
  weightKg: number;
  heightCm: number;
  age: number | null;
  activityLevel: ActivityKey;
  goal: GoalKey;
  sex?: Sex;
}): number | null {
  const { weightKg, heightCm, age, activityLevel, goal, sex = "other" } = input;
  if (age === null || age <= 0 || weightKg <= 0 || heightCm <= 0) return null;
  const base = bmr({ weightKg, heightCm, age, sex });
  const target = Math.round(base * ACTIVITY_MULTIPLIER[activityLevel]) + GOAL_CALORIE_DELTA[goal];
  return target < 1000 ? null : target;
}

export const MACRO_SPLIT = [
  { key: "protein", label: "Protein", pct: 30, kcalPerGram: 4 },
  { key: "carbs", label: "Carbs", pct: 40, kcalPerGram: 4 },
  { key: "fat", label: "Fat", pct: 30, kcalPerGram: 9 },
] as const;

/** Default macro grams for a calorie target (30/40/30). */
export const macroGrams = (kcal: number) =>
  MACRO_SPLIT.map((m) => ({
    ...m,
    grams: Math.round((kcal * m.pct) / 100 / m.kcalPerGram),
  }));

export const BMI_BANDS = [
  { label: "Underweight", start: 0, end: 18.5 },
  { label: "Healthy", start: 18.5, end: 25 },
  { label: "Overweight", start: 25, end: 30 },
  { label: "Obesity", start: 30, end: 45 },
] as const;
export const bmiBand = (bmi: number) =>
  BMI_BANDS.find((b) => bmi < b.end) ?? BMI_BANDS[BMI_BANDS.length - 1];

export const inchesToCm = (inches: number) => inches * 2.54;
export const cmToInches = (cm: number) => cm / 2.54;
export const lbToKg = (lb: number) => lb * 0.453592;
export const kgToLb = (kg: number) => kg / 0.453592;
export const mlToOz = (ml: number) => ml / 29.5735;
export const ozToMl = (oz: number) => oz * 29.5735;

/** Age in whole years from an `MM/DD/YYYY` string; null when unparsable. */
export function ageFromDob(dob: string): number | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dob.trim());
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const now = new Date();
  let age = now.getFullYear() - year;
  if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) age -= 1;
  return age;
}

/** `MM/DD/YYYY` -> `YYYY-MM-DD` (API format); null when invalid. */
export function dobToIso(dob: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dob.trim());
  return m ? `${m[3]}-${m[1]}-${m[2]}` : null;
}

/** `YYYY-MM-DD` -> `MM/DD/YYYY`. */
export function isoToDob(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${m[2]}/${m[3]}/${m[1]}` : "";
}

/** Meal label for the current time of day. */
export function mealForTime(date = new Date()): MealLabel {
  const h = date.getHours();
  return h < 11 ? "Breakfast" : h < 16 ? "Lunch" : h < 21 ? "Dinner" : "Snack";
}

/** Case/plural-insensitive meal label lookup ("dinners" -> "Dinner"). */
export function parseMealLabel(v: string | null | undefined): MealLabel | null {
  const t = v?.trim().toLowerCase().replace(/s$/, "");
  return t ? (MEAL_TYPES.find((m) => m.toLowerCase() === t) ?? null) : null;
}

/** API meal type ("breakfast") <-> UI label ("Breakfast"). */
export const mealLabel = (t: string): MealLabel =>
  MEAL_TYPES.find((m) => m.toLowerCase() === t.toLowerCase()) ?? "Snack";
export const mealApi = (l: MealLabel) =>
  l.toLowerCase() as "breakfast" | "lunch" | "dinner" | "snack";

/** Portion multipliers offered in the portion sheet. */
export const PORTION_STEPS = [0.5, 1, 1.5, 2] as const;
const PORTION_GLYPH: Record<number, string> = { 0.5: "½", 1: "1", 1.5: "1½", 2: "2" };
export const portionGlyph = (n: number) => PORTION_GLYPH[n];
export const portionLabel = (n: number) => `${PORTION_GLYPH[n]} portion${n > 1 ? "s" : ""}`;
/** Free-form portion label ("2½ portions"). */
export function portionText(n: number) {
  const whole = Math.floor(n);
  const half = Math.abs(n - whole - 0.5) < 1e-9;
  const body = half ? `${whole === 0 ? "" : whole}½` : String(Math.round(n * 100) / 100);
  return `${body} portion${n > 1 ? "s" : ""}`;
}

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
/** Scale macros by servings, rounding each to whole numbers. */
export const scaleMacros = (m: Macros, servings: number): Macros => ({
  calories: Math.round(m.calories * servings),
  protein: Math.round(m.protein * servings),
  carbs: Math.round(m.carbs * servings),
  fat: Math.round(m.fat * servings),
});

/** Local calendar date as `YYYY-MM-DD`. */
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
