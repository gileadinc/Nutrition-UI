"use client";

import { Bell, Check } from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useApiResource } from "@/lib/hooks";
import { profileApi, getErrorMessage } from "@/lib/api";
import styles from "./NotificationBell.module.css";

interface NotificationRow {
  id: string;
  title: string;
  body?: string;
  read?: boolean;
  createdAt?: string;
}

function toRows(data: unknown): NotificationRow[] {
  if (Array.isArray(data)) return data as NotificationRow[];
  if (data && typeof data === "object" && "items" in data) {
    return (data as { items: NotificationRow[] }).items ?? [];
  }
  return [];
}

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const s = Math.round((Date.now() - then) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function NotificationBell() {
  const notifications = useApiResource(() => profileApi.listNotifications(), []);
  const { refetch } = notifications;
  const rows = toRows(notifications.data);
  const unread = rows.filter((n) => !n.read).length;

  async function markAll() {
    try {
      await profileApi.markAllNotificationsRead();
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function markOne(id: string) {
    try {
      await profileApi.markNotificationRead(id);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <Popover.Root>
      <Popover.Trigger className={styles.trigger} aria-label="Notifications">
        <Bell className="size-[1.125rem]" />
        {unread > 0 ? (
          <span className={styles.badge} aria-hidden="true">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={10} className={styles.positioner}>
          <Popover.Popup className={styles.popup}>
            <div className={styles.head}>
              <Popover.Title className={styles.title}>Notifications</Popover.Title>
              {unread > 0 ? (
                <button type="button" className={styles.markAll} onClick={markAll}>
                  <Check className="size-3.5" />
                  Mark all read
                </button>
              ) : null}
            </div>

            <div className={styles.body}>
              {notifications.isLoading && notifications.data === null ? (
                <div className={styles.state}>
                  <Spinner />
                </div>
              ) : notifications.error && notifications.data === null ? (
                <p className={styles.stateText}>Couldn&apos;t load notifications.</p>
              ) : rows.length === 0 ? (
                <p className={styles.stateText}>You&apos;re all caught up.</p>
              ) : (
                <ul className={styles.list}>
                  {rows.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        className={styles.item}
                        data-unread={n.read ? "false" : "true"}
                        onClick={() => !n.read && markOne(n.id)}
                      >
                        {!n.read ? <span className={styles.dot} aria-hidden="true" /> : null}
                        <span className={styles.itemBody}>
                          <span className={styles.itemTitle}>{n.title}</span>
                          {n.body ? <span className={styles.itemText}>{n.body}</span> : null}
                          {n.createdAt ? (
                            <span className={styles.itemTime}>{timeAgo(n.createdAt)}</span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
