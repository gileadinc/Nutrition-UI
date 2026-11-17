import { apiClient } from "../client";
import type { FastHack, MenuItem, Paginated, Restaurant } from "../models";
import { toQuery, type ListParams } from "./query";

export interface EatOutListParams extends ListParams {
  goal?: string;
  near?: string;
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
}

export function listRestaurants(params?: EatOutListParams): Promise<Paginated<Restaurant>> {
  return apiClient.get<Paginated<Restaurant>>(`/api/eat-out/restaurants${toQuery(params)}`);
}

export function getRestaurant(restaurantId: string): Promise<Restaurant> {
  return apiClient.get<Restaurant>(`/api/eat-out/restaurants/${encodeURIComponent(restaurantId)}`);
}

export function getMenuItem(menuItemId: string): Promise<MenuItem> {
  return apiClient.get<MenuItem>(`/api/eat-out/menu-items/${encodeURIComponent(menuItemId)}`);
}

/** Fast hacks ranked for the given goal (`params.goal`), best match first. */
export function getRecommendations(params?: EatOutListParams): Promise<Paginated<FastHack>> {
  return apiClient.get<Paginated<FastHack>>(`/api/eat-out/recommendations${toQuery(params)}`);
}

export function listFastHacks(params?: EatOutListParams): Promise<Paginated<FastHack>> {
  return apiClient.get<Paginated<FastHack>>(`/api/eat-out/fast-hacks${toQuery(params)}`);
}

export function getFastHack(fastHackId: string): Promise<FastHack> {
  return apiClient.get<FastHack>(`/api/eat-out/fast-hacks/${encodeURIComponent(fastHackId)}`);
}

export function getSimilarFastHacks(fastHackId: string, limit = 4): Promise<FastHack[]> {
  return apiClient
    .get<FastHack[] | Paginated<FastHack>>(
      `/api/eat-out/fast-hacks/${encodeURIComponent(fastHackId)}/similar${toQuery({ limit })}`,
    )
    .then((res) => (Array.isArray(res) ? res : res.items));
}
