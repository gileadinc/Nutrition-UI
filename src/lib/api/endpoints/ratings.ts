import { apiClient } from "../client";
import { authHeader } from "@/lib/auth";
import type { MyRecipeRating, RecipeRatingsPage } from "../models";
import { toQuery, type ListParams } from "./query";

/** Recipe star ratings and reviews. Reading the summary/reviews is public; `/me` needs sign-in. */
const base = (recipeId: string) => `/api/recipes/${encodeURIComponent(recipeId)}/ratings`;
const opts = () => ({ headers: authHeader() });

export interface UpsertRatingInput {
  /** 1-5. */
  rating: number;
  /** Optional; an empty string or null clears it. */
  review?: string | null;
}

/** Summary (average, count, distribution) plus reviews, newest first (`page`/`limit` supported). */
export function listRecipeRatings(recipeId: string, params?: ListParams): Promise<RecipeRatingsPage> {
  return apiClient.get<RecipeRatingsPage>(`${base(recipeId)}${toQuery(params)}`);
}

/** `rating` is null when the user hasn't rated it. */
export function getMyRating(recipeId: string): Promise<MyRecipeRating> {
  return apiClient.get<MyRecipeRating>(`${base(recipeId)}/me`, opts());
}

/** Creates or replaces your rating; resolves with it and the new summary. */
export function rateRecipe(recipeId: string, input: UpsertRatingInput): Promise<MyRecipeRating> {
  return apiClient.put<MyRecipeRating>(`${base(recipeId)}/me`, input, opts());
}

/** 404 if you hadn't rated it. */
export function removeMyRating(recipeId: string): Promise<null> {
  return apiClient.delete<null>(`${base(recipeId)}/me`, opts());
}
