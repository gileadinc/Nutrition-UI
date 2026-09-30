import { apiClient } from "../client";
import { authHeader } from "@/lib/auth/session";
import type { Paginated, Recipe, Restaurant, MenuItem } from "../models";
import { toQuery, type ListParams } from "./query";

/* -------------------------------------------------------------------------- */
/*  Analytics                                                                  */
/* -------------------------------------------------------------------------- */

export interface AdminOverview {
  users: number;
  onboardingSessions: number;
  nutritionLogs: number;
  savedItems: number;
  recipes: number;
  restaurants: number;
  menuItems: number;
  fastHacks: number;
}

export interface AdminDashboard {
  overview: AdminOverview;
  catalog: {
    totalItems: number;
    restaurantsWithMenus: number;
    averageMenuItemsPerRestaurant: number;
  };
  engagement: {
    usersWhoLogged: number;
    averageLogsPerUser: number;
    savedItemsPerUser: number;
  };
}

export function getOverview(): Promise<AdminOverview> {
  return apiClient.get<AdminOverview>("/api/admin/analytics/overview", {
    headers: authHeader(),
  });
}

export function getDashboard(): Promise<AdminDashboard> {
  return apiClient.get<AdminDashboard>("/api/admin/dashboard", { headers: authHeader() });
}

/* -------------------------------------------------------------------------- */
/*  Shared publish contract                                                    */
/* -------------------------------------------------------------------------- */

export type PublishStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "REJECTED" | string;

export interface PublishInput {
  status: PublishStatus;
  reviewNotes?: string;
}

/** Fields the backend accepts on catalog writes but doesn't return on reads. */
export interface WorkflowFields {
  status?: PublishStatus;
  reviewNotes?: string;
  publishedAt?: string;
}

/* -------------------------------------------------------------------------- */
/*  Recipes                                                                    */
/* -------------------------------------------------------------------------- */

export interface AdminRecipe extends Recipe {
  status?: PublishStatus;
  reviewNotes?: string | null;
  publishedAt?: string | null;
}

export interface RecipeInput extends WorkflowFields {
  title: string;
  description: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  prepTimeMinutes?: number;
  servings?: number;
  goalTags?: string[];
  category?: string;
  imageUrl?: string;
  ingredients?: string[];
  steps?: string[];
}

export const recipes = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<AdminRecipe>>(`/api/admin/recipes${toQuery(params)}`, {
      headers: authHeader(),
    }),
  get: (id: string) =>
    apiClient.get<AdminRecipe>(`/api/admin/recipes/${encodeURIComponent(id)}`, {
      headers: authHeader(),
    }),
  create: (body: RecipeInput) =>
    apiClient.post<AdminRecipe>("/api/admin/recipes", body, { headers: authHeader() }),
  update: (id: string, body: Partial<RecipeInput>) =>
    apiClient.patch<AdminRecipe>(`/api/admin/recipes/${encodeURIComponent(id)}`, body, {
      headers: authHeader(),
    }),
  remove: (id: string) =>
    apiClient.delete<null>(`/api/admin/recipes/${encodeURIComponent(id)}`, {
      headers: authHeader(),
    }),
  publish: (id: string, body: PublishInput) =>
    apiClient.patch<AdminRecipe>(`/api/admin/recipes/${encodeURIComponent(id)}/publish`, body, {
      headers: authHeader(),
    }),
};

/* -------------------------------------------------------------------------- */
/*  Restaurants                                                                */
/* -------------------------------------------------------------------------- */

export interface AdminRestaurant extends Restaurant {
  status?: PublishStatus;
  reviewNotes?: string | null;
  publishedAt?: string | null;
}

export interface RestaurantInput extends WorkflowFields {
  name: string;
  city?: string;
  state?: string;
  distanceMiles?: number;
  latitude?: number;
  longitude?: number;
  category?: string;
  bestForGoals?: string[];
  summary?: string;
  testedOrderCount?: number;
  imageUrl?: string;
}

export const restaurants = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<AdminRestaurant>>(`/api/admin/restaurants${toQuery(params)}`, {
      headers: authHeader(),
    }),
  get: (id: string) =>
    apiClient.get<AdminRestaurant>(`/api/admin/restaurants/${encodeURIComponent(id)}`, {
      headers: authHeader(),
    }),
  create: (body: RestaurantInput) =>
    apiClient.post<AdminRestaurant>("/api/admin/restaurants", body, { headers: authHeader() }),
  update: (id: string, body: Partial<RestaurantInput>) =>
    apiClient.patch<AdminRestaurant>(`/api/admin/restaurants/${encodeURIComponent(id)}`, body, {
      headers: authHeader(),
    }),
  remove: (id: string) =>
    apiClient.delete<null>(`/api/admin/restaurants/${encodeURIComponent(id)}`, {
      headers: authHeader(),
    }),
  publish: (id: string, body: PublishInput) =>
    apiClient.patch<AdminRestaurant>(
      `/api/admin/restaurants/${encodeURIComponent(id)}/publish`,
      body,
      { headers: authHeader() },
    ),
};

/* -------------------------------------------------------------------------- */
/*  Menu items                                                                 */
/* -------------------------------------------------------------------------- */

export interface AdminMenuItem extends MenuItem {
  status?: PublishStatus;
  reviewNotes?: string | null;
  publishedAt?: string | null;
}

export interface MenuItemInput extends WorkflowFields {
  restaurantId: string;
  restaurantName: string;
  name: string;
  description: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  goalTags?: string[];
  swaps?: string[];
  whatToOrder?: string[];
  whyThisWorks?: string;
  imageUrl?: string;
}

export const menuItems = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<AdminMenuItem>>(`/api/admin/menu-items${toQuery(params)}`, {
      headers: authHeader(),
    }),
  get: (id: string) =>
    apiClient.get<AdminMenuItem>(`/api/admin/menu-items/${encodeURIComponent(id)}`, {
      headers: authHeader(),
    }),
  create: (body: MenuItemInput) =>
    apiClient.post<AdminMenuItem>("/api/admin/menu-items", body, { headers: authHeader() }),
  update: (id: string, body: Partial<MenuItemInput>) =>
    apiClient.patch<AdminMenuItem>(`/api/admin/menu-items/${encodeURIComponent(id)}`, body, {
      headers: authHeader(),
    }),
  remove: (id: string) =>
    apiClient.delete<null>(`/api/admin/menu-items/${encodeURIComponent(id)}`, {
      headers: authHeader(),
    }),
  publish: (id: string, body: PublishInput) =>
    apiClient.patch<AdminMenuItem>(
      `/api/admin/menu-items/${encodeURIComponent(id)}/publish`,
      body,
      { headers: authHeader() },
    ),
};

/* -------------------------------------------------------------------------- */
/*  Fast hacks                                                                 */
/* -------------------------------------------------------------------------- */

export interface AdminFastHack {
  id: string;
  title: string;
  outcome: string;
  description: string;
  goalTags?: string[];
  restaurantId?: string | null;
  menuItemId?: string | null;
  status?: PublishStatus;
  reviewNotes?: string | null;
  publishedAt?: string | null;
  [key: string]: unknown;
}

export interface FastHackInput extends WorkflowFields {
  title: string;
  outcome: string;
  description: string;
  goalTags?: string[];
  restaurantId?: string;
  menuItemId?: string;
}

export const fastHacks = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<AdminFastHack>>(`/api/admin/fast-hacks${toQuery(params)}`, {
      headers: authHeader(),
    }),
  get: (id: string) =>
    apiClient.get<AdminFastHack>(`/api/admin/fast-hacks/${encodeURIComponent(id)}`, {
      headers: authHeader(),
    }),
  create: (body: FastHackInput) =>
    apiClient.post<AdminFastHack>("/api/admin/fast-hacks", body, { headers: authHeader() }),
  update: (id: string, body: Partial<FastHackInput>) =>
    apiClient.patch<AdminFastHack>(`/api/admin/fast-hacks/${encodeURIComponent(id)}`, body, {
      headers: authHeader(),
    }),
  remove: (id: string) =>
    apiClient.delete<null>(`/api/admin/fast-hacks/${encodeURIComponent(id)}`, {
      headers: authHeader(),
    }),
  publish: (id: string, body: PublishInput) =>
    apiClient.patch<AdminFastHack>(
      `/api/admin/fast-hacks/${encodeURIComponent(id)}/publish`,
      body,
      { headers: authHeader() },
    ),
};

// Types used by shared UI keyed on resource kind.
export type AdminResourceKind = "recipes" | "restaurants" | "menu-items" | "fast-hacks";
