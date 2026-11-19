"use client";

/**
 * "My recipes": recipes the person builds themselves. The backend has no endpoint for these, so
 * (like weigh-ins) they live in this browser's localStorage and are not synced between devices.
 */

import { useMemo, useSyncExternalStore } from "react";

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type IngredientUnit = "g" | "oz" | "cup" | "tbsp" | "tsp" | "piece";

export interface RecipeIngredient {
  id: string;
  name: string;
  /** Matched food in the built-in list, or null for a free-typed ingredient. */
  refId: string | null;
  quantity: number | null;
  unit: IngredientUnit;
  /** Values typed by the person for the amount above; null = use the estimate. */
  macros: Macros | null;
}

export interface CustomRecipe {
  id: string;
  title: string;
  servings: number;
  finishedGrams: number | null;
  photo: string | null;
  ingredients: RecipeIngredient[];
  updatedAt: number;
}

/* ------------------------------------------------------------ food list */

interface Food {
  id: string;
  name: string;
  per100g: Macros;
  /** Grams in one "piece", when that makes sense. */
  pieceG?: number;
}

const f = (
  id: string,
  name: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  pieceG?: number,
): Food => ({
  id,
  name,
  per100g: { calories, protein, carbs, fat },
  pieceG,
});

export const FOODS: Food[] = [
  f("chicken-breast", "Chicken breast, cooked", 165, 31, 0, 3.6),
  f("ground-turkey", "Ground turkey, cooked", 203, 27, 0, 10),
  f("ground-beef", "Lean ground beef, cooked", 217, 26, 0, 12),
  f("salmon", "Salmon, cooked", 206, 22, 0, 12),
  f("tuna", "Tuna, canned in water", 116, 26, 0, 1),
  f("shrimp", "Shrimp, cooked", 99, 24, 0.2, 0.3),
  f("egg", "Egg, whole", 143, 12.6, 0.7, 9.5, 50),
  f("egg-white", "Egg white", 52, 11, 0.7, 0.2, 33),
  f("tofu", "Tofu, firm", 144, 17, 3, 9),
  f("greek-yogurt", "Greek yogurt, plain nonfat", 59, 10, 3.6, 0.4),
  f("milk", "Milk, 2%", 50, 3.3, 4.8, 2),
  f("cheddar", "Cheddar cheese", 403, 25, 1.3, 33),
  f("feta", "Feta cheese", 264, 14, 4, 21),
  f("rice", "White rice, cooked", 130, 2.7, 28, 0.3),
  f("brown-rice", "Brown rice, cooked", 123, 2.7, 26, 1),
  f("quinoa", "Quinoa, cooked", 120, 4.4, 21, 1.9),
  f("oats", "Rolled oats, dry", 379, 13, 68, 6.5),
  f("pasta", "Pasta, cooked", 158, 5.8, 31, 0.9),
  f("bread", "Whole wheat bread", 252, 12, 43, 3.5, 30),
  f("tortilla", "Flour tortilla", 312, 8, 52, 8, 45),
  f("potato", "Potato, baked", 93, 2.5, 21, 0.1, 170),
  f("sweet-potato", "Sweet potato, baked", 90, 2, 21, 0.2, 130),
  f("black-beans", "Black beans, cooked", 132, 8.9, 24, 0.5),
  f("chickpeas", "Chickpeas, cooked", 164, 8.9, 27, 2.6),
  f("lentils", "Lentils, cooked", 116, 9, 20, 0.4),
  f("broccoli", "Broccoli", 34, 2.8, 7, 0.4),
  f("spinach", "Spinach", 23, 2.9, 3.6, 0.4),
  f("kale", "Kale", 49, 4.3, 9, 0.9),
  f("tomato", "Tomato", 18, 0.9, 3.9, 0.2, 120),
  f("cucumber", "Cucumber", 15, 0.7, 3.6, 0.1),
  f("bell-pepper", "Bell pepper", 31, 1, 6, 0.3, 120),
  f("onion", "Onion", 40, 1.1, 9.3, 0.1, 110),
  f("carrot", "Carrot", 41, 0.9, 9.6, 0.2, 60),
  f("avocado", "Avocado", 160, 2, 8.5, 15, 150),
  f("banana", "Banana", 89, 1.1, 23, 0.3, 120),
  f("apple", "Apple", 52, 0.3, 14, 0.2, 180),
  f("blueberries", "Blueberries", 57, 0.7, 14, 0.3),
  f("olive-oil", "Olive oil", 884, 0, 0, 100),
  f("butter", "Butter", 717, 0.9, 0.1, 81),
  f("almonds", "Almonds", 579, 21, 22, 50),
  f("peanut-butter", "Peanut butter", 588, 25, 20, 50),
  f("honey", "Honey", 304, 0.3, 82, 0),
];

const UNIT_G: Record<Exclude<IngredientUnit, "piece">, number> = {
  g: 1,
  oz: 28.3495,
  cup: 240,
  tbsp: 15,
  tsp: 5,
};

export const UNIT_LABEL: Record<IngredientUnit, string> = {
  g: "grams",
  oz: "ounces",
  cup: "cups",
  tbsp: "tablespoons",
  tsp: "teaspoons",
  piece: "pieces",
};
export const UNITS: IngredientUnit[] = ["g", "oz", "cup", "tbsp", "tsp", "piece"];

export const foodById = (id: string | null) => FOODS.find((x) => x.id === id) ?? null;

export function searchFoods(q: string): Food[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  return FOODS.filter((x) => x.name.toLowerCase().includes(t)).slice(0, 6);
}

/** Units that make sense for a food (pieces only when it has a piece weight). */
export const unitsFor = (refId: string | null): IngredientUnit[] =>
  foodById(refId)?.pieceG || !refId ? UNITS : UNITS.filter((u) => u !== "piece");

const uid = () => `ing-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const newIngredient = (food: Food | null, name: string): RecipeIngredient => ({
  id: uid(),
  name: food ? food.name : name.trim(),
  refId: food?.id ?? null,
  quantity: null,
  unit: food?.pieceG && food.per100g.calories < 200 ? "piece" : "g",
  macros: null,
});

/** "200 g chicken breast" -> ingredient. One per line. */
export function parseIngredients(text: string): RecipeIngredient[] {
  const out: RecipeIngredient[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(/^[-*•]\s*/, "");
    if (!line) continue;
    const m =
      /^(\d+(?:\.\d+)?|\d+\s*\/\s*\d+)\s*(grams?|g|ounces?|oz|cups?|tablespoons?|tbsp|teaspoons?|tsp|pieces?|slices?)?\.?\s+(?:of\s+)?(.+)$/i.exec(
        line,
      );
    const qty = m
      ? m[1].includes("/")
        ? Number(m[1].split("/")[0]) / Number(m[1].split("/")[1])
        : Number(m[1])
      : null;
    const u = (m?.[2] ?? "").toLowerCase();
    const unit: IngredientUnit = u.startsWith("g")
      ? "g"
      : u.startsWith("o")
        ? "oz"
        : u.startsWith("c")
          ? "cup"
          : u.startsWith("tb")
            ? "tbsp"
            : u.startsWith("te") || u === "tsp"
              ? "tsp"
              : u
                ? "piece"
                : "piece";
    const name = (m ? m[3] : line).trim();
    const food =
      FOODS.find((x) =>
        x.name
          .toLowerCase()
          .split(",")[0]
          .split(" ")
          .every((w) => name.toLowerCase().includes(w.replace(/[^a-z]/g, ""))),
      ) ?? null;
    const ing = newIngredient(food, name);
    out.push({
      ...ing,
      name: food ? food.name : name,
      quantity: qty,
      unit: m && u ? unit : food?.pieceG ? "piece" : "g",
    });
  }
  return out;
}

/* ----------------------------------------------------------------- maths */

const round1 = (n: number) => Math.round(n * 10) / 10;
const ZERO: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export function gramsOf(i: RecipeIngredient): number | null {
  if (i.quantity === null) return null;
  const food = foodById(i.refId);
  if (i.unit === "piece") return food?.pieceG ? i.quantity * food.pieceG : null;
  return i.quantity * UNIT_G[i.unit];
}

/** Nutrition for one ingredient: what the person typed, else an estimate, else none. */
export function ingredientMacros(i: RecipeIngredient): {
  macros: Macros;
  source: "typed" | "estimate" | "none";
} {
  if (i.macros) return { macros: i.macros, source: "typed" };
  const food = foodById(i.refId);
  const g = gramsOf(i);
  if (!food || g === null) return { macros: ZERO, source: "none" };
  const k = g / 100;
  const p = food.per100g;
  return {
    macros: {
      calories: p.calories * k,
      protein: p.protein * k,
      carbs: p.carbs * k,
      fat: p.fat * k,
    },
    source: "estimate",
  };
}

export interface RecipeNutrition {
  total: Macros;
  perServing: Macros;
  incomplete: number;
  totalGrams: number | null;
  gramsFromFinished: boolean;
}

export function recipeNutrition(
  r: Pick<CustomRecipe, "ingredients" | "servings" | "finishedGrams">,
): RecipeNutrition {
  const total = { ...ZERO };
  let incomplete = 0;
  let grams = 0;
  let known = true;
  for (const i of r.ingredients) {
    const { macros, source } = ingredientMacros(i);
    if (source === "none") incomplete += 1;
    total.calories += macros.calories;
    total.protein += macros.protein;
    total.carbs += macros.carbs;
    total.fat += macros.fat;
    const g = gramsOf(i);
    if (g === null) known = false;
    else grams += g;
  }
  const n = r.servings > 0 ? r.servings : 1;
  const rounded: Macros = {
    calories: Math.round(total.calories),
    protein: Math.round(total.protein),
    carbs: Math.round(total.carbs),
    fat: Math.round(total.fat),
  };
  return {
    total: rounded,
    perServing: {
      calories: Math.round(total.calories / n),
      protein: round1(total.protein / n),
      carbs: round1(total.carbs / n),
      fat: round1(total.fat / n),
    },
    incomplete,
    totalGrams: r.finishedGrams ?? (known && r.ingredients.length > 0 ? grams : null),
    gramsFromFinished: r.finishedGrams !== null,
  };
}

export const emptyRecipe = (): CustomRecipe => ({
  id: "",
  title: "",
  servings: 1,
  finishedGrams: null,
  photo: null,
  ingredients: [],
  updatedAt: 0,
});

/** Problems that block saving, by field. */
export function recipeProblems(r: CustomRecipe): ("title" | "servings" | "ingredients")[] {
  const out: ("title" | "servings" | "ingredients")[] = [];
  if (!r.title.trim()) out.push("title");
  if (!(r.servings >= 1 && r.servings <= 100)) out.push("servings");
  if (r.ingredients.length === 0) out.push("ingredients");
  return out;
}

/* ----------------------------------------------------------------- store */

const KEY = "forkthis.customRecipes";
const EMPTY: CustomRecipe[] = [];
const listeners = new Set<() => void>();
let cached: { raw: string | null; value: CustomRecipe[] } = { raw: null, value: EMPTY };

function read(): CustomRecipe[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cached.raw) return cached.value;
    const p = raw ? (JSON.parse(raw) as unknown) : null;
    const list = Array.isArray(p)
      ? (p as CustomRecipe[]).filter(
          (x) => x && typeof x.id === "string" && Array.isArray(x.ingredients),
        )
      : [];
    cached = { raw, value: list.length ? list : EMPTY };
    return cached.value;
  } catch {
    return EMPTY;
  }
}

function write(list: CustomRecipe[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable (or the photo was too big): recipes just won't persist */
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};

export function saveCustomRecipe(r: CustomRecipe): CustomRecipe {
  const id = r.id || `my-${Date.now().toString(36)}`;
  const next: CustomRecipe = { ...r, id, title: r.title.trim(), updatedAt: Date.now() };
  const rest = read().filter((x) => x.id !== id);
  write([next, ...rest]);
  return next;
}

export function deleteCustomRecipe(id: string) {
  write(read().filter((x) => x.id !== id));
}

export function useCustomRecipes() {
  const all = useSyncExternalStore(subscribe, read, () => EMPTY);
  return useMemo(() => [...all].sort((a, b) => b.updatedAt - a.updatedAt), [all]);
}

export function useCustomRecipe(id: string | undefined) {
  const all = useCustomRecipes();
  return useMemo(() => (id ? all.find((x) => x.id === id) : undefined), [all, id]);
}
