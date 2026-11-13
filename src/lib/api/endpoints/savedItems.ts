import { apiClient } from "../client";
import { authHeader } from "@/lib/auth";
import type { Paginated, SavedItem, SavedItemType } from "../models";
import { toQuery, type ListParams } from "./query";

export interface SaveItemInput {
  itemType: SavedItemType;
  itemId: string;
  title: string;
  subtitle?: string;
}

export interface SavedItemListParams extends ListParams {
  itemType?: SavedItemType;
}

export function saveItem(input: SaveItemInput): Promise<SavedItem> {
  return apiClient.post<SavedItem>("/api/saved-items/me", input, { headers: authHeader() });
}

export function listSavedItems(params?: SavedItemListParams): Promise<Paginated<SavedItem>> {
  return apiClient.get<Paginated<SavedItem>>(`/api/saved-items/me${toQuery(params)}`, {
    headers: authHeader(),
  });
}

export function listFavorites(params?: SavedItemListParams): Promise<Paginated<SavedItem>> {
  return apiClient.get<Paginated<SavedItem>>(`/api/saved-items/me/favorites${toQuery(params)}`, {
    headers: authHeader(),
  });
}

export function removeSavedItem(savedItemId: string): Promise<null> {
  return apiClient.delete<null>(`/api/saved-items/me/${encodeURIComponent(savedItemId)}`, {
    headers: authHeader(),
  });
}
