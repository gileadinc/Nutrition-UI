/**
 * Dietary / profile vocabulary shared by the questionnaire, profile screens,
 * filters and dietary matching. Ported from the deployed build.
 */

import { NUTRITION_COPY } from "@/content";

export const DIETARY_PREFERENCE = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  pescatarian: "Pescatarian",
  highProtein: "High protein",
  dairyFree: "Dairy-free",
  glutenFree: "Gluten-free",
  lowCarb: "Low carb",
  wholeFoods: "Whole foods",
  keto: "Keto",
  paleo: "Paleo",
  sugarFree: "Sugar-free",
  lowFat: "Low-fat",
  flexitarian: "Flexitarian",
  mediterranean: "Mediterranean",
  carnivore: "Carnivore",
  rawFood: "Raw food",
} as const;
export type DietaryPreference = (typeof DIETARY_PREFERENCE)[keyof typeof DIETARY_PREFERENCE];
export const DIETARY_PREFERENCES: DietaryPreference[] = Object.values(DIETARY_PREFERENCE);

export const ALLERGEN = {
  treeNuts: "Tree nuts",
  peanuts: "Peanuts",
  dairy: "Dairy",
  shellfish: "Shellfish",
  fish: "Fish",
  soy: "Soy",
  wheat: "Wheat",
  eggs: "Eggs",
  sesame: "Sesame",
  corn: "Corn",
} as const;
export type Allergen = (typeof ALLERGEN)[keyof typeof ALLERGEN];
export const ALLERGENS: Allergen[] = Object.values(ALLERGEN);

/** Add a custom (free-text) entry to a list, de-duplicating case-insensitively and preferring the canonical spelling. */
export function addCustomEntry(
  list: string[],
  raw: string,
  canonical: readonly string[],
): string[] {
  const value = raw.trim().replace(/\s+/g, " ");
  if (!value) return list;
  const match = canonical.find((c) => c.toLowerCase() === value.toLowerCase()) ?? value;
  return list.some((x) => x.toLowerCase() === match.toLowerCase()) ? list : [...list, match];
}

export type GoalKey = "lose" | "gain" | "maintain" | "recomp";
export const GOAL_LABEL: Record<GoalKey, string> = NUTRITION_COPY.goalLabel;
export const GOAL_KEYS = Object.keys(GOAL_LABEL) as GoalKey[];
export const isGoalKey = (v: unknown): v is GoalKey => typeof v === "string" && v in GOAL_LABEL;

export type ActivityKey =
  "mostlyInactive" | "lightlyActive" | "moderatelyActive" | "veryActive" | "extremelyActive";
export const ACTIVITY_LABEL: Record<ActivityKey, string> = NUTRITION_COPY.activityLabel;
export const ACTIVITY_HINT: Record<ActivityKey, string> = NUTRITION_COPY.activityHint;
export const ACTIVITY_KEYS = Object.keys(ACTIVITY_LABEL) as ActivityKey[];
export const isActivityKey = (v: unknown): v is ActivityKey =>
  typeof v === "string" && v in ACTIVITY_LABEL;

/** The backend stores activity level as snake_case ("moderately_active"). */
export const activityToWire = (k: ActivityKey): string => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
/** Accepts the backend's snake_case value or our camelCase key; null when unrecognised. */
export const activityFromWire = (v: unknown): ActivityKey | null => {
  if (typeof v !== "string") return null;
  const camel = v.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  return isActivityKey(camel) ? camel : null;
};

export const SURGICAL_CONTEXTS = [
  "No surgery",
  "Preparing for surgery",
  "Recovering from surgery",
  "Prefer not to say",
] as const;
export type SurgicalContext = (typeof SURGICAL_CONTEXTS)[number];
const SURGICAL_LEGACY: Record<string, string> = {
  "Skip for now": "Prefer not to say",
  "No medical context": "No surgery",
};
/** Map legacy/unknown values onto the current vocabulary; null when unrecognised. */
export function normalizeSurgicalContext(v: string | null | undefined): SurgicalContext | null {
  const mapped = SURGICAL_LEGACY[v ?? ""] ?? v ?? "";
  return (SURGICAL_CONTEXTS as readonly string[]).includes(mapped)
    ? (mapped as SurgicalContext)
    : null;
}

/** Recipe listing quick filters (chips). */
export const RECIPE_FILTER = {
  all: "All",
  highProtein: "High Protein",
  underCalories: "Under 500 kcal",
  quickEasy: "Quick & Easy",
  mealPrep: "Meal Prep",
  veggie: "Veggie",
} as const;

/** Fast-hack listing quick filters (chips). */
export const HACK_FILTER = {
  nearby: "Nearby",
  lowCal: "Low cal",
  vegan: "Vegan",
  freeDelivery: "$0 delivery",
  topRated: "4.5★+",
  deals: "Deals",
  keto: "Keto",
  openNow: "Open now",
  bowls: "Bowls",
} as const;

export const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
export type MealLabel = (typeof MEAL_TYPES)[number];
