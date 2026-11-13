import { apiClient } from "../client";
import { authHeader } from "@/lib/auth";
import type {
  Paginated,
  SavedCollection,
  SavedCollectionDetail,
  SavedItem,
  SavedItemType,
} from "../models";
import { toQuery, type ListParams } from "./query";

/** Saved-item collections ("folders"), `/api/saved-items/me/collections*`. Signed in only. */
const base = "/api/saved-items/me/collections";
const one = (id: string) => `${base}/${encodeURIComponent(id)}`;
const opts = () => ({ headers: authHeader() });

export interface CollectionInput {
  /** 1+ characters. */
  name: string;
  description?: string;
  /** A single emoji. */
  emoji?: string;
}

export type CollectionPatch = Partial<CollectionInput>;

export interface CollectionDetailParams extends ListParams {
  itemType?: SavedItemType;
}

/** Newest first. Each row has `itemCount` and up to four `previewItems`. */
export function listCollections(params?: ListParams): Promise<Paginated<SavedCollection>> {
  return apiClient.get<Paginated<SavedCollection>>(`${base}${toQuery(params)}`, opts());
}

export function createCollection(input: CollectionInput): Promise<SavedCollection> {
  return apiClient.post<SavedCollection>(base, input, opts());
}

/** The collection plus a page of its saved items (`items`, `pagination`). 404 if it doesn't exist. */
export function getCollection(
  collectionId: string,
  params?: CollectionDetailParams,
): Promise<SavedCollectionDetail> {
  return apiClient.get<SavedCollectionDetail>(`${one(collectionId)}${toQuery(params)}`, opts());
}

export function updateCollection(
  collectionId: string,
  patch: CollectionPatch,
): Promise<SavedCollection> {
  return apiClient.patch<SavedCollection>(one(collectionId), patch, opts());
}

/** Items in the collection stay saved. */
export function deleteCollection(collectionId: string): Promise<null> {
  return apiClient.delete<null>(one(collectionId), opts());
}

/** Idempotent. Resolves with the saved item (its `collectionIds` updated). */
export function addToCollection(collectionId: string, savedItemId: string): Promise<SavedItem> {
  return apiClient.put<SavedItem>(
    `${one(collectionId)}/items/${encodeURIComponent(savedItemId)}`,
    undefined,
    opts(),
  );
}

/** The item stays saved. */
export function removeFromCollection(collectionId: string, savedItemId: string): Promise<SavedItem> {
  return apiClient.delete<SavedItem>(
    `${one(collectionId)}/items/${encodeURIComponent(savedItemId)}`,
    opts(),
  );
}
