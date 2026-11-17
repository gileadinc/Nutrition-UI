"use client";

import { useCallback, useMemo } from "react";
import { profileApi, type AppNotification } from "@/lib/api";
import { invalidate, useCached } from "./resource";
import { useAppSession } from "./session";

/** Notification centre (`/api/profile/me/notifications`), signed in only. */
export function useNotifications() {
  const s = useAppSession();
  const res = useCached<AppNotification[]>(
    s.isSignedIn ? "profile:notifications" : null,
    async () => {
      const r = await profileApi.listNotifications();
      return Array.isArray(r) ? r : r.items;
    },
  );
  const items = useMemo(() => res.data ?? [], [res.data]);
  const unreadCount = items.filter((n) => !n.read).length;

  const markRead = useCallback(
    async (id: string) => {
      res.mutate((prev) => (prev ?? []).map((n) => (n.id === id ? { ...n, read: true } : n)));
      await profileApi.markNotificationRead(id);
    },
    [res],
  );
  const markAllRead = useCallback(async () => {
    res.mutate((prev) => (prev ?? []).map((n) => ({ ...n, read: true })));
    await profileApi.markAllNotificationsRead();
  }, [res]);
  const dismiss = useCallback(
    async (id: string) => {
      res.mutate((prev) => (prev ?? []).filter((n) => n.id !== id));
      await profileApi.deleteNotification(id);
      invalidate("profile:notifications");
    },
    [res],
  );

  return {
    items,
    unreadCount,
    isLoading: res.isLoading,
    error: res.error,
    markRead,
    markAllRead,
    dismiss,
  };
}
