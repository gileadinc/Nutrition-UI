"use client";

import { useCallback, useSyncExternalStore } from "react";
import { savedItemsApi, type SavedItem } from "@/lib/api";
import { getSession, subscribe as subscribeAuth } from "@/lib/auth";

/**
 * Loads the current user's saved items once and caches them module-wide so
 * every <SaveButton> on a page can tell whether its item is already saved
 * without each firing its own request.
 */

interface Snapshot {
  items: SavedItem[] | null; // null = not loaded yet
  loading: boolean;
}

let snapshot: Snapshot = { items: null, loading: false };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

const EMPTY: SavedItem[] = [];

function setSnapshot(next: Snapshot) {
  snapshot = next;
  listeners.forEach((fn) => fn());
}

function load(force = false): Promise<void> {
  if (!getSession().accessToken) {
    setSnapshot({ items: [], loading: false });
    return Promise.resolve();
  }
  if (snapshot.items && !force) return Promise.resolve();
  if (inflight && !force) return inflight;

  setSnapshot({ items: snapshot.items, loading: true });
  inflight = savedItemsApi
    .listSavedItems({ limit: 200 })
    .then((res) => setSnapshot({ items: res.items, loading: false }))
    .catch(() => setSnapshot({ items: snapshot.items ?? [], loading: false }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

// Reload whenever auth changes (sign in / out).
if (typeof window !== "undefined") {
  subscribeAuth(() => {
    snapshot = { items: null, loading: false };
    void load(true);
  });
}

/** Optimistically patch the cache after a save/remove. */
export function patchSavedItemsCache(mutate: (items: SavedItem[]) => SavedItem[]) {
  setSnapshot({ items: mutate(snapshot.items ?? []), loading: snapshot.loading });
}

export function refreshSavedItems() {
  return load(true);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (snapshot.items === null && !inflight) void load();
  return () => {
    listeners.delete(cb);
  };
}

const SERVER_SNAPSHOT: Snapshot = { items: null, loading: true };

export interface UseSavedItems {
  items: SavedItem[];
  isLoading: boolean;
  find: (itemType: string, itemId: string) => SavedItem | undefined;
}

export function useSavedItems(): UseSavedItems {
  const snap = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );

  const find = useCallback(
    (itemType: string, itemId: string) =>
      (snap.items ?? EMPTY).find((i) => i.itemType === itemType && i.itemId === itemId),
    [snap.items],
  );

  return {
    items: snap.items ?? EMPTY,
    isLoading: snap.items === null || snap.loading,
    find,
  };
}
