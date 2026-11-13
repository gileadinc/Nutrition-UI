"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Link } from "@/lib/nav";
import { useAppSession, useNotifications } from "@/lib/store";
import { NotificationList, toNotificationVM } from "./NotificationList";

/** Navbar bell: opens a popover preview; "View notification center" goes to the full page. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const session = useAppSession();
  const n = useNotifications();
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const items = useMemo(() => n.items.map(toNotificationVM), [n.items]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = n.unreadCount;
  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        title="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="tap-44 relative flex size-10 items-center justify-center rounded-full border border-border-default bg-white"
      >
        <Icon name="bell" size={18} color="var(--color-brand-navy)" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full border-2 border-white bg-primary text-[13px] type-meta text-white"
          >
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div
          id={id}
          ref={panel}
          role="dialog"
          aria-label="Notifications preview"
          tabIndex={-1}
          className="panel absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden shadow-raised focus:outline-none"
        >
          <div className="flex items-center border-b border-border-divider px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <h2 className="text-base type-section-title text-brand-navy">Notifications</h2>
              <p className="type-meta text-xs text-text-secondary">
                {unread === 0 ? "Nothing unread" : `${unread} unread`}
              </p>
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => void n.markAllRead()}
                className="tap-24 tap-44 relative text-xs type-button text-primary"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[min(26rem,calc(100dvh-10rem))] overflow-y-auto">
            <NotificationList
              items={items}
              compact
              emptyBody={
                session.isSignedIn
                  ? "Reminders you turn on will show up here."
                  : "Create an account to get reminders and updates."
              }
              onOpen={(nid) => {
                void n.markRead(nid);
                setOpen(false);
              }}
              onMarkRead={(nid) => void n.markRead(nid)}
              onDismiss={(nid) => void n.dismiss(nid)}
            />
          </div>
          <Link
            to="/you/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border-divider px-4 py-3 text-center text-[14px] type-button text-primary"
          >
            View notification center
          </Link>
        </div>
      )}
    </div>
  );
}
