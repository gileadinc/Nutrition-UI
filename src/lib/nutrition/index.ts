export type GoalKey = "lose" | "gain" | "maintain" | "recomp";
export type ActivityKey =
  | "mostlyInactive"
  | "lightlyActive"
  | "moderatelyActive"
  | "veryActive"
  | "extremelyActive";
export type SurgicalContext =
  | "No surgery"
  | "Preparing for surgery"
  | "Recovering from surgery"
  | "Prefer not to say";

export const GOAL_LABEL: Record<GoalKey, string> = {
  lose: "lose weight",
  gain: "build muscle",
  maintain: "maintain weight",
  recomp: "recompose your body",
};

export const ACTIVITY_KEYS: ActivityKey[] = [
  "mostlyInactive",
  "lightlyActive",
  "moderatelyActive",
  "veryActive",
  "extremelyActive",
];
export const ACTIVITY_LABEL: Record<ActivityKey, string> = {
  mostlyInactive: "Sedentary",
  lightlyActive: "Lightly active",
  moderatelyActive: "Moderately active",
  veryActive: "Very active",
  extremelyActive: "Extremely active",
};
export const ACTIVITY_HINT: Record<ActivityKey, string> = {
  mostlyInactive: "Little or no activity",
  lightlyActive: "Exercise 1–3 days per week",
  moderatelyActive: "Exercise 3–5 days per week",
  veryActive: "Exercise 5–7 days per week",
  extremelyActive: "Physical job plus hard training",
};
const ACTIVITY_MULTIPLIER: Record<ActivityKey, number> = {
  mostlyInactive: 1.2,
  lightlyActive: 1.375,
  moderatelyActive: 1.55,
  veryActive: 1.725,
  extremelyActive: 1.9,
};
const GOAL_CALORIE_DELTA: Record<GoalKey, number> = { lose: -500, gain: 500, maintain: 0, recomp: -200 };

/** Mifflin-St Jeor with a neutral (-78) sex offset. */
export function tdee(i: { weightKg: number; heightCm: number; age: number; activity: ActivityKey }) {
  if (i.age <= 0 || i.weightKg <= 0 || i.heightCm <= 0) return null;
  const bmr = 10 * i.weightKg + 6.25 * i.heightCm - 5 * i.age - 78;
  return Math.round(bmr * ACTIVITY_MULTIPLIER[i.activity]);
}

/** Daily calorie target; never recommends below 1000 kcal. */
export function calorieTarget(i: Parameters<typeof tdee>[0] & { goal: GoalKey }) {
  const base = tdee(i);
  if (base === null) return null;
  const target = base + GOAL_CALORIE_DELTA[i.goal];
  return target < 1000 ? null : target;
}

/** Default 30/40/30 macro split in grams (protein, carbs, fat). */
export const macroGrams = (kcal: number) => ({
  protein: Math.round((kcal * 0.3) / 4),
  carbs: Math.round((kcal * 0.4) / 4),
  fat: Math.round((kcal * 0.3) / 9),
});

/** Whole years from a date of birth, or null if the date isn't real. */
export function ageFromDob(month: number, day: number, year: number, now = new Date()) {
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  let age = now.getFullYear() - year;
  const m = now.getMonth() - (month - 1);
  if (m < 0 || (m === 0 && now.getDate() < day)) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

export const IN_TO_CM = 2.54;
export const LB_TO_KG = 0.453592;
