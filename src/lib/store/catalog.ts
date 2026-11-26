"use client";

/** Cached read hooks for the public catalogue (recipes, restaurants, fast hacks) and discovery. */

import {
  discoveryApi,
  eatOutApi,
  recipesApi,
  type FastHack,
  type GuestHome,
  type HomeFeed,
  type MenuItem,
  type Paginated,
  type Recipe,
  type Restaurant,
} from "@/lib/api";
import type { RecipeListParams } from "@/lib/api/endpoints/recipes";
import type { EatOutListParams } from "@/lib/api/endpoints/eatOut";
import type { DiscoveryParams } from "@/lib/api/endpoints/discovery";
import { keyOf, useCached } from "./resource";
import { useAppSession } from "./session";

export const useRecipes = (params?: RecipeListParams) =>
  useCached<Paginated<Recipe>>(keyOf("catalog:recipes", params), () =>
    recipesApi.listRecipes(params),
  );

const PAGE_LIMIT = 100;
/** Safety stop so a misbehaving `hasNextPage` can never loop forever (100 × 20 = 2000 items). */
const MAX_PAGES = 20;

/** Walks `page=1..n` (limit 100) until the API says `hasNextPage` is false, returning one merged list. */
async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<Paginated<T>>,
): Promise<Paginated<T>> {
  const items: T[] = [];
  let last: Paginated<T> | undefined;
  for (let page = 1; page <= MAX_PAGES; page++) {
    last = await fetchPage(page);
    items.push(...last.items);
    if (!last.pagination?.hasNextPage) break;
  }
  return {
    items,
    pagination: {
      page: 1,
      limit: items.length,
      total: last?.pagination?.total ?? items.length,
      totalPages: 1,
      hasNextPage: false,
    },
  };
}

/** The whole recipe catalogue (all pages, not just the first 100). */
export const useAllRecipes = () =>
  useCached<Paginated<Recipe>>("catalog:recipes:all", () =>
    fetchAllPages((page) => recipesApi.listRecipes({ limit: PAGE_LIMIT, page })),
  );

/** Every fast hack for the given location (all pages). */
export const useAllFastHacks = (params?: EatOutListParams) =>
  useCached<Paginated<FastHack>>(keyOf("catalog:hacks:all", params), () =>
    fetchAllPages((page) => eatOutApi.listFastHacks({ ...params, limit: PAGE_LIMIT, page })),
  );

export const useRecipe = (id: string | null | undefined) =>
  useCached<Recipe>(id ? `catalog:recipe:${id}` : null, () => recipesApi.getRecipe(id!));

export const useSimilarRecipes = (id: string | null | undefined, limit = 4) =>
  useCached<Recipe[]>(id ? `catalog:recipe-similar:${id}:${limit}` : null, () =>
    recipesApi.getSimilarRecipes(id!, limit),
  );

export const useFastHacks = (params?: EatOutListParams) =>
  useCached<Paginated<FastHack>>(keyOf("catalog:hacks", params), () =>
    eatOutApi.listFastHacks(params),
  );

/** Fast hacks the backend ranks highest for the user's goal (`GET /api/eat-out/recommendations`). */
export const useEatOutRecommendations = (params?: EatOutListParams) =>
  useCached<Paginated<FastHack>>(keyOf("catalog:hack-recs", params), () =>
    eatOutApi.getRecommendations(params),
  );

export const useFastHack = (id: string | null | undefined) =>
  useCached<FastHack>(id ? `catalog:hack:${id}` : null, () => eatOutApi.getFastHack(id!));

export const useSimilarFastHacks = (id: string | null | undefined, limit = 4) =>
  useCached<FastHack[]>(id ? `catalog:hack-similar:${id}:${limit}` : null, () =>
    eatOutApi.getSimilarFastHacks(id!, limit),
  );

export const useRestaurants = (params?: EatOutListParams) =>
  useCached<Paginated<Restaurant>>(keyOf("catalog:restaurants", params), () =>
    eatOutApi.listRestaurants(params),
  );

export const useRestaurant = (id: string | null | undefined) =>
  useCached<Restaurant>(id ? `catalog:restaurant:${id}` : null, () => eatOutApi.getRestaurant(id!));

export const useMenuItem = (id: string | null | undefined) =>
  useCached<MenuItem>(id ? `catalog:menu-item:${id}` : null, () => eatOutApi.getMenuItem(id!));

/** Discovery filter facets (`GET /api/discovery/filters`). Shape is backend-defined. */
export const useDiscoveryFilters = () =>
  useCached<unknown>("catalog:filters", () => discoveryApi.getFilters());

/**
 * Home data. Signed in: `GET /api/discovery/home` (personalised feed).
 * Guest: `GET /api/discovery/guest-home`. Anonymous: waits (null).
 */
export function useHome(params?: DiscoveryParams) {
  const s = useAppSession();
  const signed = useCached<HomeFeed>(s.isSignedIn ? "home:feed" : null, () =>
    discoveryApi.getHome(),
  );
  const guest = useCached<GuestHome>(
    !s.isSignedIn && s.ready
      ? keyOf("home:guest", { ...params, sessionId: s.guestSessionId })
      : null,
    () => discoveryApi.getGuestHome({ ...params, sessionId: s.guestSessionId ?? undefined }),
  );
  return { signedIn: signed, guest, isSignedIn: s.isSignedIn };
}
