import { apiClient } from "../client";
import type { Paginated, Recipe } from "../models";
import { toQuery, type ListParams } from "./query";

export interface RecipeListParams extends ListParams {
  goal?: string;
  category?: string;
}

export function listRecipes(params?: RecipeListParams): Promise<Paginated<Recipe>> {
  return apiClient.get<Paginated<Recipe>>(`/api/recipes${toQuery(params)}`);
}

export function getRecipe(recipeId: string): Promise<Recipe> {
  return apiClient.get<Recipe>(`/api/recipes/${encodeURIComponent(recipeId)}`);
}

export function getSimilarRecipes(recipeId: string, limit = 4): Promise<Recipe[]> {
  return apiClient
    .get<Recipe[] | Paginated<Recipe>>(
      `/api/recipes/${encodeURIComponent(recipeId)}/similar${toQuery({ limit })}`,
    )
    .then((res) => (Array.isArray(res) ? res : res.items));
}
