"use client";

/**
 * Shopping list, backed by `/api/shopping-lists/me*`. The app uses a single default list
 * (the account's first list, created on first write). Signed in only; guests read an empty list.
 * Item mutations return the whole list, which replaces the cache; writes are optimistic.
 */

import { useCallback, useMemo } from "react";
import {
  getErrorMessage,
  shoppingListsApi,
  type ShoppingList,
  type ShoppingListItemInput,
} from "@/lib/api";
import { invalidate, useCached } from "./resource";
import { useAppSession } from "./session";
import { toast } from "./toast";

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  quantity: string | null;
  /** Recipe the item came from. */
  source: string | null;
}

const KEY = "shopping:list";
const LEGACY_KEY = "forkthis.shoppingList";
const LIST_NAME = "Shopping list";
const EMPTY: ShoppingItem[] = [];

/** Recipe titles by id, remembered from add() so recipe-sourced items can show their name. */
const recipeTitles = new Map<string, string>();

function legacyItems(): ShoppingListItemInput[] {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((x: { name?: unknown; checked?: unknown; source?: unknown }) =>
      typeof x?.name === "string" && x.name.trim()
        ? [
            {
              name: x.name.trim(),
              checked: x.checked === true,
              notes: typeof x.source === "string" ? x.source : null,
            },
          ]
        : [],
    );
  } catch {
    return [];
  }
}

const dropLegacy = () => {
  try {
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
};

let creating: Promise<ShoppingList> | null = null;

/** Creates the default list once, even with concurrent first writes. */
function createDefault(items?: ShoppingListItemInput[]): Promise<ShoppingList> {
  creating ??= shoppingListsApi
    .createShoppingList({ name: LIST_NAME, items })
    .finally(() => {
      creating = null;
    });
  return creating;
}

async function fetchList(): Promise<ShoppingList | null> {
  const page = await shoppingListsApi.listShoppingLists({ limit: 100 });
  let list = page.items[0] ?? null;
  // One-time migration of the old device-local list.
  const old = legacyItems();
  if (old.length) {
    try {
      const have = new Set((list?.items ?? []).map((i) => i.name.toLowerCase()));
      const fresh = old.filter((i) => !have.has(i.name.toLowerCase()));
      if (!list) list = await createDefault(fresh);
      else if (fresh.length) list = await shoppingListsApi.addShoppingListItems(list.listId, fresh);
      dropLegacy();
    } catch {
      // keep the local copy and retry on the next load
    }
  } else {
    dropLegacy();
  }
  return list;
}

const quantityOf = (q: number | null, unit: string | null) =>
  q == null ? null : [q, unit].filter(Boolean).join(" ");

export function useShoppingList() {
  const { isSignedIn } = useAppSession();
  const { data, mutate } = useCached<ShoppingList | null>(isSignedIn ? KEY : null, fetchList);
  const list = data ?? null;

  const items = useMemo<ShoppingItem[]>(
    () =>
      list?.items.length
        ? list.items.map((i) => ({
            id: i.itemId,
            name: i.name,
            checked: i.checked,
            quantity: quantityOf(i.quantity, i.unit),
            source: i.notes ?? (i.recipeId ? (recipeTitles.get(i.recipeId) ?? null) : null),
          }))
        : EMPTY,
    [list],
  );

  const fail = useCallback((title: string, err: unknown) => {
    toast.error(title, { body: getErrorMessage(err) });
    invalidate(KEY);
  }, []);

  /** The cached list, or a freshly created one. */
  const ensure = useCallback(async (): Promise<ShoppingList> => {
    if (list && list.listId !== "pending") return list;
    const page = await shoppingListsApi.listShoppingLists({ limit: 1 });
    return page.items[0] ?? (await createDefault());
  }, [list]);

  /**
   * Adds ingredient lines that aren't already on the list and returns how many are new
   * (synchronously; the request continues in the background). With `recipeId` + `whole`, the
   * server adds the recipe's ingredients itself.
   */
  const add = useCallback(
    (
      ingredients: string[],
      source?: string | null,
      opts?: { recipeId?: string; whole?: boolean },
    ): number => {
      const have = new Set(items.map((i) => i.name.toLowerCase()));
      const fresh: ShoppingListItemInput[] = [];
      for (const raw of ingredients) {
        const name = raw.trim();
        const key = name.toLowerCase();
        if (!name || have.has(key)) continue;
        have.add(key);
        fresh.push({ name, recipeId: opts?.recipeId ?? null, notes: source ?? null });
      }
      if (!fresh.length) return 0;
      if (opts?.recipeId && source) recipeTitles.set(opts.recipeId, source);
      const now = new Date().toISOString();
      mutate((prev) => {
        const base: ShoppingList = prev ?? {
          listId: "pending",
          name: LIST_NAME,
          items: [],
          itemCount: 0,
          checkedCount: 0,
          version: 0,
          createdAt: now,
          updatedAt: now,
        };
        return {
          ...base,
          items: [
            ...base.items,
            ...fresh.map((f, n) => ({
              itemId: `pending-${Date.now()}-${n}`,
              name: f.name,
              quantity: null,
              unit: null,
              category: null,
              recipeId: f.recipeId ?? null,
              notes: f.notes ?? null,
              checked: false,
              position: base.items.length + n,
              createdAt: now,
              updatedAt: now,
            })),
          ],
        };
      });
      void (async () => {
        try {
          const target = await ensure();
          const next =
            opts?.recipeId && opts.whole
              ? await shoppingListsApi.addRecipeIngredients(target.listId, opts.recipeId)
              : await shoppingListsApi.addShoppingListItems(target.listId, fresh);
          mutate(next);
        } catch (err) {
          fail("Couldn't add to your shopping list", err);
        }
      })();
      return fresh.length;
    },
    [items, mutate, ensure, fail],
  );

  const toggle = useCallback(
    (id: string) => {
      if (!list) return;
      const cur = list.items.find((i) => i.itemId === id);
      if (!cur || id.startsWith("pending-")) return;
      const checked = !cur.checked;
      mutate({
        ...list,
        items: list.items.map((i) => (i.itemId === id ? { ...i, checked } : i)),
      });
      shoppingListsApi
        .updateShoppingListItem(list.listId, id, { checked })
        .then(mutate)
        .catch((err) => fail("Couldn't update your shopping list", err));
    },
    [list, mutate, fail],
  );

  /** Deletes one item (optimistic) and offers Undo, which adds it back. */
  const remove = useCallback(
    (id: string) => {
      if (!list || id.startsWith("pending-")) return;
      const cur = list.items.find((i) => i.itemId === id);
      if (!cur) return;
      mutate({ ...list, items: list.items.filter((i) => i.itemId !== id) });
      shoppingListsApi
        .deleteShoppingListItem(list.listId, id)
        .then(mutate)
        .catch((err) => fail("Couldn't remove that item", err));
      toast.success(`${cur.name} removed`, {
        action: {
          label: "Undo",
          run: () => add([cur.name], cur.notes, { recipeId: cur.recipeId ?? undefined }),
        },
      });
    },
    [list, mutate, fail, add],
  );

  const clearChecked = useCallback(() => {
    if (!list) return;
    mutate({ ...list, items: list.items.filter((i) => !i.checked) });
    shoppingListsApi
      .clearCheckedShoppingListItems(list.listId)
      .then(mutate)
      .catch((err) => fail("Couldn't clear picked-up items", err));
  }, [list, mutate, fail]);

  const clearAll = useCallback(() => {
    if (!list) return;
    const id = list.listId;
    mutate(null);
    if (id === "pending") return;
    shoppingListsApi
      .deleteShoppingList(id)
      .catch((err) => fail("Couldn't clear your shopping list", err));
  }, [list, mutate, fail]);

  return { items, add, toggle, remove, clearChecked, clearAll };
}
