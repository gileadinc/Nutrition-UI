import { apiClient } from "../client";
import { authHeader } from "@/lib/auth";
import type {
  Paginated,
  ShoppingList,
  ShoppingListItemInput,
  ShoppingListItemPatch,
} from "../models";
import { toQuery, type ListParams } from "./query";

const base = "/api/shopping-lists/me";
const list = (id: string) => `${base}/${encodeURIComponent(id)}`;
const opts = () => ({ headers: authHeader() });

export function listShoppingLists(params?: ListParams): Promise<Paginated<ShoppingList>> {
  return apiClient.get<Paginated<ShoppingList>>(`${base}${toQuery(params)}`, opts());
}

export function createShoppingList(input: {
  name: string;
  listId?: string;
  items?: ShoppingListItemInput[];
}): Promise<ShoppingList> {
  return apiClient.post<ShoppingList>(base, input, opts());
}

export function getShoppingList(listId: string): Promise<ShoppingList> {
  return apiClient.get<ShoppingList>(list(listId), opts());
}

export function renameShoppingList(listId: string, name: string): Promise<ShoppingList> {
  return apiClient.patch<ShoppingList>(list(listId), { name }, opts());
}

export function deleteShoppingList(listId: string): Promise<null> {
  return apiClient.delete<null>(list(listId), opts());
}

/** Every item mutation resolves with the whole updated list. */
export function addShoppingListItems(
  listId: string,
  items: ShoppingListItemInput[],
): Promise<ShoppingList> {
  return apiClient.post<ShoppingList>(`${list(listId)}/items`, { items }, opts());
}

export function updateShoppingListItem(
  listId: string,
  itemId: string,
  patch: ShoppingListItemPatch,
): Promise<ShoppingList> {
  return apiClient.patch<ShoppingList>(
    `${list(listId)}/items/${encodeURIComponent(itemId)}`,
    patch,
    opts(),
  );
}

export function deleteShoppingListItem(listId: string, itemId: string): Promise<ShoppingList> {
  return apiClient.delete<ShoppingList>(
    `${list(listId)}/items/${encodeURIComponent(itemId)}`,
    opts(),
  );
}

export function clearCheckedShoppingListItems(listId: string): Promise<ShoppingList> {
  return apiClient.post<ShoppingList>(`${list(listId)}/clear-checked`, undefined, opts());
}

/** Adds a recipe's ingredients to the list. */
export function addRecipeIngredients(listId: string, recipeId: string): Promise<ShoppingList> {
  return apiClient.post<ShoppingList>(
    `${list(listId)}/recipes/${encodeURIComponent(recipeId)}`,
    undefined,
    opts(),
  );
}

export interface SyncShoppingListInput {
  listId: string;
  name?: string;
  updatedAt: string;
  deleted?: boolean;
  items?: (ShoppingListItemInput & {
    itemId: string;
    updatedAt: string;
    position?: number;
    deleted?: boolean;
  })[];
}

/** Offline-first sync (response shape not exercised by the app). */
export function syncShoppingLists(input: {
  since?: string;
  lists: SyncShoppingListInput[];
}): Promise<unknown> {
  return apiClient.post<unknown>(`${base}/sync`, input, opts());
}
