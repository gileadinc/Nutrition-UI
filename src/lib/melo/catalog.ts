"use client";

import { useMemo } from "react";
import { toHackVM, toRecipeVM } from "@/screens/catalog/adapt";
import { useFastHacks, useRecipes } from "@/lib/store";
import type { MeloItem } from "./engine";

/** The real catalogue (fast hacks + recipes from the API) as Melo's search corpus. */
export function useMeloCatalog(): MeloItem[] {
  const hacks = useFastHacks({ limit: 100 });
  const recipes = useRecipes({ limit: 100 });
  return useMemo(() => {
    const out: MeloItem[] = [];
    for (const h of hacks.data?.items ?? []) {
      const v = toHackVM(h);
      out.push({
        kind: "hack",
        id: v.id,
        title: v.title,
        restaurant: v.restaurant,
        description: v.description,
        image: v.image,
        to: `/hack/${v.id}`,
        calories: v.calories,
        protein: v.protein,
        minutes: 0,
        tags: [...v.goalTags, ...v.tags],
        ingredients: [],
        subtitle: [v.restaurant, v.distanceMi != null ? `${v.distanceMi} mi` : ""].filter(Boolean).join(" · "),
      });
    }
    for (const r of recipes.data?.items ?? []) {
      const v = toRecipeVM(r);
      out.push({
        kind: "recipe",
        id: v.id,
        title: v.title,
        restaurant: "",
        description: v.description,
        image: v.image,
        to: `/recipes/${v.id}`,
        calories: v.calories,
        protein: v.protein,
        minutes: v.minutes,
        tags: [...v.goalTags, ...v.tags, v.category].filter(Boolean),
        ingredients: v.ingredients,
        subtitle: [v.time, v.badge].filter(Boolean).join(" · "),
      });
    }
    return out;
  }, [hacks.data, recipes.data]);
}
