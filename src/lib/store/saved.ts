"use client";

/**
 * Saved items (hearts). Signed in only: `/api/saved-items/me`. Guests are sent
 * through the account gate.
 */

import { useCallback } from "react";
import { savedItemsApi, getErrorMessage, type SavedItem } from "@/lib/api";
import { patchSavedItemsCache, refreshSavedItems, useSavedItems } from "@/lib/hooks";
import { useRequireAccount } from "./gate";
import { toast } from "./toast";

export interface SaveTarget {
  /** "recipe" | "fast_hack" | "order" */
  itemType: string;
  itemId: string;
  title: string;
  subtitle?: string;
}

export function useSaved() {
  const { items, isLoading, find } = useSavedItems();
  const requireAccount = useRequireAccount();

  const isSaved = useCallback(
    (itemType: string, itemId: string) => Boolean(find(itemType, itemId)),
    [find],
  );

  /** Toggle with optimistic update, gate for guests, toast with Undo. Returns the new saved state. */
  const toggle = useCallback(
    async (t: SaveTarget): Promise<boolean | undefined> => {
      if (!requireAccount(t.itemType === "recipe" ? "Saving recipes" : "Saving hacks"))
        return undefined;
      const existing = find(t.itemType, t.itemId);
      try {
        if (existing) {
          patchSavedItemsCache((list) =>
            list.filter((i) => i.savedItemId !== existing.savedItemId),
          );
          await savedItemsApi.removeSavedItem(existing.savedItemId);
          toast.success(`${t.title} removed`, {
            body: "Taken out of your saved items.",
            action: {
              label: "Undo",
              run: () => void savedItemsApi.saveItem(t).then(refreshSavedItems),
            },
          });
          return false;
        }
        const optimistic: SavedItem = {
          savedItemId: `pending-${t.itemType}-${t.itemId}`,
          itemType: t.itemType,
          itemId: t.itemId,
          title: t.title,
          subtitle: t.subtitle ?? null,
          createdAt: null,
        };
        patchSavedItemsCache((list) => [optimistic, ...list]);
        const saved = await savedItemsApi.saveItem(t);
        patchSavedItemsCache((list) =>
          list.map((i) => (i.savedItemId === optimistic.savedItemId ? saved : i)),
        );
        toast.success(`${t.title} saved`, {
          body: "Find it under You > Saved.",
          action: {
            label: "Undo",
            run: () =>
              void savedItemsApi.removeSavedItem(saved.savedItemId).then(refreshSavedItems),
          },
        });
        return true;
      } catch (err) {
        await refreshSavedItems();
        toast.error("Couldn't update saved items", { body: getErrorMessage(err) });
        return undefined;
      }
    },
    [find, requireAccount],
  );

  return { items, isLoading, isSaved, toggle, count: items.length };
}
