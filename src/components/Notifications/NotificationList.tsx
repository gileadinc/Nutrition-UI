"use client";

import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { Link } from "@/lib/nav";
import type { AppNotification } from "@/lib/api";

export interface NotificationVM {
  id: string;
  title: string;
  body?: string;
  read: boolean;
  time: string;
  group: "Today" | "Earlier";
  icon: IconName;
  iconSurface: string;
  iconColor: string;
  to: string;
}

const ago = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(m)) return "";
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)} hr ago`;
  if (m < 2880) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const sameDay = (iso: string) => {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
  );
};

/** The API sends no icon or link, so both are inferred from the notification's wording. */
function look(text: string): Pick<NotificationVM, "icon" | "iconSurface" | "iconColor" | "to"> {
  const t = text.toLowerCase();
  if (/water|hydrat|drink/.test(t))
    return {
      icon: "droplet",
      iconSurface: "var(--color-track-water-fill)",
      iconColor: "var(--color-track-water-accent)",
      to: "/track/water",
    };
  if (/medic|dose|supplement/.test(t))
    return {
      icon: "medication",
      iconSurface: "var(--color-track-medication-fill)",
      iconColor: "var(--color-track-medication-accent)",
      to: "/track/medication",
    };
  if (/protein/.test(t))
    return {
      icon: "dumbbell",
      iconSurface: "var(--color-primary-soft)",
      iconColor: "var(--color-primary)",
      to: "/track",
    };
  if (/week|summary|insight|review/.test(t))
    return {
      icon: "analytics",
      iconSurface: "var(--color-navy-soft)",
      iconColor: "var(--color-brand-navy)",
      to: "/track/insights",
    };
  if (/meal|log|goal|calorie/.test(t))
    return {
      icon: "forkSpoon",
      iconSurface: "var(--color-icon-well)",
      iconColor: "var(--color-icon-well-ink)",
      to: "/track/log-meal",
    };
  return {
    icon: "bell",
    iconSurface: "var(--color-navy-soft)",
    iconColor: "var(--color-brand-navy)",
    to: "/you/notifications",
  };
}

export function toNotificationVM(n: AppNotification): NotificationVM {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    read: n.read,
    time: ago(n.createdAt),
    group: sameDay(n.createdAt) ? "Today" : "Earlier",
    ...look(`${n.title} ${n.body ?? ""}`),
  };
}

function Row({
  item,
  compact,
  onOpen,
  onMarkRead,
  onDismiss,
}: {
  item: NotificationVM;
  compact: boolean;
  onOpen?: () => void;
  onMarkRead: () => void;
  onDismiss: () => void;
}) {
  const unread = !item.read;
  return (
    <li
      data-slot="notification-row"
      className={cn(
        "group relative flex min-w-0 gap-3 border-b border-border-divider last:border-b-0 hover:bg-brand-warm-gray/50",
        compact ? "px-4 py-3.5" : "px-5 py-4",
        unread ? "bg-brand-cream" : "bg-white",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl",
          compact ? "size-9" : "size-11",
        )}
        style={{ backgroundColor: item.iconSurface }}
      >
        <Icon name={item.icon} size={compact ? 17 : 20} color={item.iconColor} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <Link
            to={item.to}
            onClick={onOpen}
            className="min-w-0 flex-1 text-[13px] type-item-title leading-5 text-text-primary after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-sm focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-focus"
          >
            {item.title}
          </Link>
          {unread && (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary">
              <span className="sr-only">Unread</span>
            </span>
          )}
        </span>
        {item.body && (
          <span
            className={cn(
              "mt-0.5 block type-meta text-text-secondary",
              compact ? "line-clamp-2 text-xs leading-4" : "text-[13px] leading-5",
            )}
          >
            {item.body}
          </span>
        )}
        <span className="mt-1.5 block text-[11px] type-meta text-text-neutral-500">{item.time}</span>
      </span>
      <span className="relative z-10 -mr-2.5 -mt-2 flex shrink-0 items-start">
        {unread && (
          <button
            type="button"
            onClick={onMarkRead}
            aria-label={`Mark “${item.title}” as read`}
            title="Mark as read"
            className="flex size-11 items-center justify-center rounded-full text-text-neutral-500 hover:bg-white hover:text-brand-navy"
          >
            <Icon name="tick" size={16} color="currentColor" />
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Dismiss “${item.title}”`}
          title="Dismiss"
          className="flex size-11 items-center justify-center rounded-full text-text-neutral-500 hover:bg-white hover:text-brand-navy"
        >
          <Icon name="close" size={15} color="currentColor" />
        </button>
      </span>
    </li>
  );
}

/** Notifications grouped under Today / Earlier. Used by the navbar popover (compact) and the page. */
export function NotificationList({
  items,
  compact = false,
  emptyBody = "Reminders you turn on will show up here.",
  onOpen,
  onMarkRead,
  onDismiss,
}: {
  items: NotificationVM[];
  compact?: boolean;
  emptyBody?: string;
  onOpen?: (id: string) => void;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  if (items.length === 0)
    return (
      <div className={cn("flex flex-col items-center text-center", compact ? "px-4 py-8" : "px-5 py-10")}>
        <span className="flex size-11 items-center justify-center rounded-full bg-positive">
          <Icon name="checkCircle" size={20} color="var(--color-positive-ink)" />
        </span>
        <p className="mt-3 text-[14px] type-section-title text-text-primary">You&apos;re all caught up.</p>
        <p className="mt-1 type-meta text-[12px] text-text-secondary">{emptyBody}</p>
      </div>
    );
  const groups = (["Today", "Earlier"] as const)
    .map((g) => ({ group: g, rows: items.filter((i) => i.group === g) }))
    .filter((g) => g.rows.length > 0);
  return (
    <div>
      {groups.map(({ group, rows }) => (
        <section key={group} aria-label={group}>
          <h3
            className={cn(
              "eyebrow border-b border-border-divider bg-white text-[11px]",
              compact ? "px-4 pb-1.5 pt-3" : "px-5 pb-2 pt-4",
            )}
          >
            {group}
          </h3>
          <ul>
            {rows.map((r) => (
              <Row
                key={r.id}
                item={r}
                compact={compact}
                onOpen={() => onOpen?.(r.id)}
                onMarkRead={() => onMarkRead(r.id)}
                onDismiss={() => onDismiss(r.id)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
