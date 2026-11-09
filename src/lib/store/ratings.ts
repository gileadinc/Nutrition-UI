"use client";

/**
 * Recipe ratings, backed by `/api/recipes/{id}/ratings` (public: summary + reviews, newest first,
 * paged) and `/ratings/me` (signed in: get / upsert / delete your own). Your own rating is
 * written optimistically; the summary is recomputed locally and replaced by the server's.
 */

import { useCallback, useMemo } from "react";
import {
  getErrorMessage,
  ratingsApi,
  type MyRecipeRating,
  type RatingDistribution,
  type RecipeRating,
  type RecipeRatingSummary,
  type RecipeRatingsPage,
} from "@/lib/api";
import { useRequireAccount } from "./gate";
import { invalidate, useCached } from "./resource";
import { useAppSession } from "./session";
import { toast } from "./toast";

const PAGE_SIZE = 5;
const reviewsKey = (id: string) => `ratings:${id}:reviews`;
const mineKey = (id: string) => `ratings:${id}:me`;

const EMPTY_DIST: RatingDistribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

/** Summary after your rating changes from `prev` (null = none) to `next` (null = removed). */
function adjustSummary(
  s: RecipeRatingSummary,
  prev: number | null,
  next: number | null,
): RecipeRatingSummary {
  const dist = { ...EMPTY_DIST, ...s.distribution };
  if (prev) dist[String(prev) as keyof RatingDistribution] -= 1;
  if (next) dist[String(next) as keyof RatingDistribution] += 1;
  const count = s.ratingCount + (next ? 1 : 0) - (prev ? 1 : 0);
  const sum = (s.averageRating ?? 0) * s.ratingCount - (prev ?? 0) + (next ?? 0);
  return {
    ...s,
    distribution: dist,
    ratingCount: count,
    averageRating: count > 0 ? Math.round((sum / count) * 100) / 100 : null,
  };
}

/** Refresh anything showing this recipe's average (detail + lists). */
function refreshRecipeViews(recipeId: string) {
  invalidate(reviewsKey(recipeId));
  invalidate(`catalog:recipe:${recipeId}`);
  invalidate("catalog:recipes");
}

/** Summary + reviews for one recipe (public), with "Show more" paging. */
export function useRecipeReviews(recipeId: string) {
  const { data, error, isLoading, mutate } = useCached<RecipeRatingsPage>(
    recipeId ? reviewsKey(recipeId) : null,
    () => ratingsApi.listRecipeRatings(recipeId, { limit: PAGE_SIZE, page: 1 }),
  );

  const loadMore = useCallback(async () => {
    if (!data?.pagination.hasNextPage) return;
    try {
      const next = await ratingsApi.listRecipeRatings(recipeId, {
        limit: PAGE_SIZE,
        page: data.pagination.page + 1,
      });
      mutate((prev) =>
        prev
          ? {
              ...next,
              items: [
                ...prev.items,
                ...next.items.filter(
                  (n) => !prev.items.some((p) => p.createdAt === n.createdAt && p.authorName === n.authorName),
                ),
              ],
            }
          : next,
      );
    } catch (err) {
      toast.error("Couldn't load more reviews", { body: getErrorMessage(err) });
    }
  }, [data, mutate, recipeId]);

  const reviews = useMemo(() => data?.items ?? [], [data]);
  return {
    summary: data?.summary ?? null,
    reviews,
    total: data?.pagination.total ?? 0,
    hasMore: Boolean(data?.pagination.hasNextPage),
    isLoading,
    error,
    loadMore,
  };
}

/** Your own rating of a recipe, with submit / remove. Signed in only (guests hit the account gate). */
export function useMyRating(recipeId: string) {
  const { isSignedIn } = useAppSession();
  const requireAccount = useRequireAccount();
  const { data, isLoading, mutate } = useCached<MyRecipeRating>(
    isSignedIn && recipeId ? mineKey(recipeId) : null,
    () => ratingsApi.getMyRating(recipeId),
  );
  const mine: RecipeRating | null = data?.rating ?? null;

  const submit = useCallback(
    async (rating: number, review: string): Promise<boolean> => {
      if (!requireAccount("Rating recipes")) return false;
      const text = review.trim();
      const before = data ?? null;
      const now = new Date().toISOString();
      mutate((prev) => {
        const summary = prev?.summary ?? {
          recipeId,
          averageRating: null,
          ratingCount: 0,
          distribution: EMPTY_DIST,
        };
        return {
          rating: {
            recipeId,
            rating,
            review: text || null,
            createdAt: prev?.rating?.createdAt ?? now,
            updatedAt: now,
          },
          summary: adjustSummary(summary, prev?.rating?.rating ?? null, rating),
        };
      });
      try {
        const saved = await ratingsApi.rateRecipe(recipeId, { rating, review: text || null });
        mutate(saved);
        refreshRecipeViews(recipeId);
        toast.success(before?.rating ? "Rating updated" : "Thanks for rating", {
          body: "Your rating is on the recipe now.",
        });
        return true;
      } catch (err) {
        if (before) mutate(before);
        else invalidate(mineKey(recipeId));
        toast.error("Couldn't save your rating", { body: getErrorMessage(err) });
        return false;
      }
    },
    [data, mutate, recipeId, requireAccount],
  );

  const remove = useCallback(async (): Promise<boolean> => {
    if (!requireAccount("Rating recipes")) return false;
    const before = data ?? null;
    if (!before?.rating) return false;
    mutate({ rating: null, summary: adjustSummary(before.summary, before.rating.rating, null) });
    try {
      await ratingsApi.removeMyRating(recipeId);
      refreshRecipeViews(recipeId);
      toast.success("Rating removed");
      return true;
    } catch (err) {
      mutate(before);
      toast.error("Couldn't remove your rating", { body: getErrorMessage(err) });
      return false;
    }
  }, [data, mutate, recipeId, requireAccount]);

  return { mine, summary: data?.summary ?? null, isLoading, submit, remove };
}
