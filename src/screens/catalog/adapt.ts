/**
 * View-models for the catalogue screens, derived from the real API payloads
 * (`Recipe`, `FastHack`, `MenuItem`). The deployed build's mock data carried
 * fields the API does not have (difficulty, rating, ETA, filterTags, ...);
 * everything here is computed from what the backend actually returns.
 */

import type { FastHack, MenuItem, Recipe } from "@/lib/api";
import { HACK_FILTER, RECIPE_FILTER } from "@/lib/nutrition";

const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

/** `high_protein` / `high-protein` -> `High protein`. */
export function humanize(tag: string) {
  const t = tag.replace(/[_-]+/g, " ").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

export interface RecipeVM {
  id: string;
  title: string;
  image: string;
  minutes: number;
  time: string;
  category: string;
  /** "Easy" or "Medium", derived from prep time, ingredient count and steps (the API has no difficulty). */
  badge: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
  ingredients: string[];
  steps: string[];
  goalTags: string[];
  /** Quick-filter chips this recipe satisfies (see `RECIPE_FILTER`). */
  tags: string[];
  /** Star average and count, when the API returned them (list + detail do). */
  averageRating: number | null;
  ratingCount: number;
}

export function toRecipeVM(r: Recipe): RecipeVM {
  const goalTags = r.goalTags ?? [];
  const ingredients = r.ingredients ?? [];
  const minutes = num(r.prepTimeMinutes);
  const calories = num(r.calories);
  const protein = num(r.protein);
  const text = `${r.title} ${r.description ?? ""}`.toLowerCase();
  const tags: string[] = [];
  if (goalTags.some((t) => /protein/i.test(t)) || protein >= 30) tags.push(RECIPE_FILTER.highProtein);
  if (calories > 0 && calories < 500) tags.push(RECIPE_FILTER.underCalories);
  if (minutes > 0 && minutes <= 20) tags.push(RECIPE_FILTER.quickEasy);
  if (goalTags.some((t) => /meal.?prep/i.test(t)) || /make-ahead|meal prep|overnight/.test(text))
    tags.push(RECIPE_FILTER.mealPrep);
  if (goalTags.some((t) => /veg/i.test(t))) tags.push(RECIPE_FILTER.veggie);
  const category = str(r.category);
  return {
    id: r.id,
    title: r.title,
    image: str(r.imageUrl),
    minutes,
    time: minutes > 0 ? `${minutes} min` : "",
    category,
    badge:
      minutes <= 20 && ingredients.length <= 8 && (r.steps ?? []).length <= 5 ? "Easy" : "Medium",
    description: str(r.description),
    calories,
    protein,
    carbs: num(r.carbs),
    fat: num(r.fat),
    servings: num(r.servings, 1),
    ingredients,
    steps: r.steps ?? [],
    goalTags,
    tags,
    averageRating: typeof r.averageRating === "number" ? r.averageRating : null,
    ratingCount: num(r.ratingCount),
  };
}

export interface HackVM {
  id: string;
  title: string;
  image: string;
  restaurant: string;
  restaurantId: string;
  menuItemId: string;
  description: string;
  outcome: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goalTags: string[];
  /** First goal tag, shown as the card pill. */
  badge: string;
  distanceMi: number | null;
  /** Quick-filter chips this hack satisfies (see `HACK_FILTER`). */
  tags: string[];
  /** Counter script lines (menu item "what to order"), when known. */
  orderScript: string[];
  swaps: string[];
  why: string;
}

function hackTags(h: {
  title: string;
  description: string;
  calories: number;
  carbs: number;
  goalTags: string[];
  distanceMi?: number | null;
}) {
  const text = `${h.title} ${h.description}`.toLowerCase();
  const tags: string[] = [];
  if (h.distanceMi != null && h.distanceMi <= 2) tags.push(HACK_FILTER.nearby);
  if (h.calories > 0 && h.calories <= 500) tags.push(HACK_FILTER.lowCal);
  if (h.goalTags.some((t) => /vegan|plant/i.test(t)) || /\bvegan\b/.test(text)) tags.push(HACK_FILTER.vegan);
  if (h.goalTags.some((t) => /keto|low.?carb/i.test(t)) || (h.carbs > 0 && h.carbs <= 20))
    tags.push(HACK_FILTER.keto);
  if (/\bbowls?\b/.test(text)) tags.push(HACK_FILTER.bowls);
  return tags;
}

export function toHackVM(h: FastHack, menu?: MenuItem | null): HackVM {
  const goalTags = Array.isArray(h.goalTags) ? h.goalTags : (menu?.goalTags ?? []);
  const description = str(h.description) || str(h.summary) || str(menu?.description);
  const calories = num(h.calories, menu?.calories);
  const carbs = num(h.carbs, menu?.carbs);
  const title = h.title;
  return {
    id: h.id,
    title,
    image: str(h.imageUrl) || str(menu?.imageUrl),
    restaurant: str(h.restaurantName) || str(menu?.restaurantName),
    restaurantId: str(h.restaurantId) || str(menu?.restaurantId),
    menuItemId: str(h.menuItemId) || str(menu?.id),
    description,
    outcome: str(h.outcome),
    calories,
    protein: num(h.protein, menu?.protein),
    carbs,
    fat: num(h.fat, menu?.fat),
    goalTags,
    badge: goalTags[0] ? humanize(goalTags[0]) : "",
    distanceMi: typeof h.distanceMiles === "number" ? h.distanceMiles : null,
    tags: hackTags({
      title,
      description,
      calories,
      carbs,
      goalTags,
      distanceMi: typeof h.distanceMiles === "number" ? h.distanceMiles : null,
    }),
    orderScript: menu?.whatToOrder ?? [],
    swaps: menu?.swaps ?? [],
    why: str(menu?.whyThisWorks),
  };
}

/** A restaurant menu item presented as a hack (search returns these). */
export function menuItemToHack(m: MenuItem): HackVM {
  return toHackVM(
    {
      id: m.id,
      title: m.name,
      description: m.description,
      calories: m.calories,
      protein: m.protein,
      goalTags: m.goalTags,
      imageUrl: m.imageUrl,
      restaurantName: m.restaurantName,
      restaurantId: m.restaurantId,
      carbs: m.carbs,
      fat: m.fat,
    },
    m,
  );
}
