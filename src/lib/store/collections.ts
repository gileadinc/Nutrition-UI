"use client";

/**
 * Saved collections ("folders"), backed by `/api/saved-items/me/collections*`. Signed in only.
 * Membership lives on each saved item (`collectionIds`, from the saved-items cache); counts and
 * cover previews come from the collection rows. Writes are optimistic and revalidate afterwards.
 */

import { useCallback } from "react";
import {
  collectionsApi,
  getErrorMessage,
  type CollectionInput,
  type SavedCollection,
  type SavedCollectionDetail,
  type SavedItem,
} from "@/lib/api";
import { patchSavedItemsCache, refreshSavedItems } from "@/lib/hooks";
import { useRequireAccount } from "./gate";
import { invalidate, useCached } from "./resource";
import { useAppSession } from "./session";
import { toast } from "./toast";

/** Prefix shared by every collections cache key (list + details). */
export const COLLECTIONS_KEY = "collections";
const LIST_KEY = `${COLLECTIONS_KEY}:list`;
const detailKey = (id: string) => `${COLLECTIONS_KEY}:detail:${id}`;
const EMPTY: SavedCollection[] = [];

/** Revalidate every collection list/detail (call after saved items change). */
export const refreshCollections = () => invalidate(COLLECTIONS_KEY);

export function useCollections() {
  const { isSignedIn } = useAppSession();
  const requireAccount = useRequireAccount();
  const { data, error, isLoading, mutate, refresh } = useCached<SavedCollection[]>(
    isSignedIn ? LIST_KEY : null,
    async () => (await collectionsApi.listCollections({ limit: 100 })).items,
  );
  const collections = data ?? EMPTY;

  /** Creates a collection. Resolves with it, or undefined after an error toast (or a guest gate). */
  const create = useCallback(
    async (input: CollectionInput): Promise<SavedCollection | undefined> => {
      if (!requireAccount("Collections")) return undefined;
      try {
        const created = await collectionsApi.createCollection(input);
        mutate((prev) => [created, ...(prev ?? [])]);
        toast.success(`${created.name} created`, { body: "Add saved items to it from You > Saved." });
        return created;
      } catch (err) {
        toast.error("Couldn't create the collection", { body: getErrorMessage(err) });
        return undefined;
      }
    },
    [mutate, requireAccount],
  );

  /** Rename / change emoji or description. Resolves with the updated row, or undefined after a toast. */
  const update = useCallback(
    async (
      collectionId: string,
      patch: Partial<CollectionInput>,
    ): Promise<SavedCollection | undefined> => {
      try {
        const next = await collectionsApi.updateCollection(collectionId, patch);
        mutate((prev) => (prev ?? []).map((c) => (c.collectionId === collectionId ? next : c)));
        invalidate(detailKey(collectionId));
        return next;
      } catch (err) {
        toast.error("Couldn't update the collection", { body: getErrorMessage(err) });
        return undefined;
      }
    },
    [mutate],
  );

  /** Deletes the collection; its items stay saved. Resolves true on success. */
  const remove = useCallback(
    async (collection: Pick<SavedCollection, "collectionId" | "name">): Promise<boolean> => {
      const { collectionId, name } = collection;
      try {
        await collectionsApi.deleteCollection(collectionId);
        mutate((prev) => (prev ?? []).filter((c) => c.collectionId !== collectionId));
        patchSavedItemsCache((list) =>
          list.map((i) =>
            i.collectionIds?.includes(collectionId)
              ? { ...i, collectionIds: i.collectionIds.filter((c) => c !== collectionId) }
              : i,
          ),
        );
        toast.success(`${name} deleted`, { body: "Its items are still in your saved list." });
        return true;
      } catch (err) {
        toast.error("Couldn't delete the collection", { body: getErrorMessage(err) });
        refreshCollections();
        return false;
      }
    },
    [mutate],
  );

  /** Files a saved item into (`member`) or out of a collection. Optimistic; resolves true on success. */
  const setMembership = useCallback(
    async (item: SavedItem, collectionId: string, member: boolean): Promise<boolean> => {
      if (item.savedItemId.startsWith("pending-")) return false;
      const withMembership = (i: SavedItem): SavedItem => {
        if (i.savedItemId !== item.savedItemId) return i;
        const ids = (i.collectionIds ?? []).filter((c) => c !== collectionId);
        return { ...i, collectionIds: member ? [...ids, collectionId] : ids };
      };
      const had = (item.collectionIds ?? []).includes(collectionId);
      patchSavedItemsCache((list) => list.map(withMembership));
      if (had !== member) {
        mutate((prev) =>
          (prev ?? []).map((c) =>
            c.collectionId === collectionId
              ? { ...c, itemCount: Math.max(0, c.itemCount + (member ? 1 : -1)) }
              : c,
          ),
        );
      }
      try {
        const saved = member
          ? await collectionsApi.addToCollection(collectionId, item.savedItemId)
          : await collectionsApi.removeFromCollection(collectionId, item.savedItemId);
        patchSavedItemsCache((list) =>
          list.map((i) => (i.savedItemId === saved.savedItemId ? saved : i)),
        );
        refreshCollections();
        return true;
      } catch (err) {
        toast.error(
          member ? "Couldn't add to the collection" : "Couldn't remove from the collection",
          { body: getErrorMessage(err) },
        );
        await refreshSavedItems();
        refreshCollections();
        return false;
      }
    },
    [mutate],
  );

  return { collections, isLoading, error, refresh, create, update, remove, setMembership };
}

/** One collection with its saved items (first 100, newest first as returned by the API). */
export function useCollection(collectionId: string) {
  const { isSignedIn } = useAppSession();
  return useCached<SavedCollectionDetail>(
    isSignedIn && collectionId ? detailKey(collectionId) : null,
    () => collectionsApi.getCollection(collectionId, { limit: 100 }),
  );
}
