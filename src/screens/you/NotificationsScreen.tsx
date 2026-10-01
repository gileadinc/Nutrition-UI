"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { ProfileLayout } from "@/components/Track/ProfileParts";
import { getErrorMessage, profileApi, type NotificationPrefs } from "@/lib/api";
import { invalidate, toast, useAppSession, useNotifications, useProfile } from "@/lib/store";
import { SWITCH_ON } from "@/components/styles";

const PREFS: { key: keyof NotificationPrefs; label: string }[] = [
  { key: "mealReminders", label: "Meal reminders" },
  { key: "goalUpdates", label: "Goal updates" },
  { key: "productUpdates", label: "Product updates" },
];

const ago = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(m)) return "";
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)} h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

function Switch({ on, label, onToggle, disabled }: { on: boolean; label: string; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className="tap-24 flex h-6 w-11 items-center disabled:opacity-50"
    >
      <span className={cn("flex h-6 w-11 items-center rounded-full p-0.5 transition-colors", on ? SWITCH_ON : "bg-border-default")}>
        <span className={cn("size-5 rounded-full bg-white transition-transform", on && "translate-x-5")} />
      </span>
    </button>
  );
}

function Preferences() {
  const { profile, refresh } = useProfile();
  const [busy, setBusy] = useState(false);
  const current = profile?.notifications;
  const toggle = async (key: keyof NotificationPrefs) => {
    if (!current) return;
    setBusy(true);
    try {
      await profileApi.updatePreferences({ notifications: { ...current, [key]: !current[key] } });
      await refresh();
    } catch (err) {
      toast.error("Couldn't update reminders", { body: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel p-4">
      <h2 className="text-[15px] type-section-title tracking-[-0.5px] text-brand-navy">Reminders</h2>
      <p className="mt-1 type-meta text-xs leading-5 text-text-secondary">Choose which reminders should reach you.</p>
      <div className="mt-2">
        {PREFS.map((p) => (
          <div
            key={p.key}
            className="flex min-h-12 items-center gap-3 border-b border-border-divider py-2 last:border-b-0"
          >
            <span className="flex-1 type-item-title text-sm text-text-primary">{p.label}</span>
            <Switch
              on={Boolean(current?.[p.key])}
              label={p.label}
              disabled={!current || busy}
              onToggle={() => void toggle(p.key)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function NotificationsScreen() {
  const session = useAppSession();
  const n = useNotifications();
  void invalidate;
  return (
    <ProfileLayout
      title="Notifications"
      subtitle="Reminders and updates that help you stay on track."
      aside={session.isSignedIn ? <Preferences /> : undefined}
      asideLabel="Notification preferences"
    >
      <section aria-label="Recent activity" className="panel overflow-hidden">
        <div className="flex items-center border-b border-border-divider px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] type-section-title tracking-[-0.5px] text-brand-navy">Recent activity</h2>
            <p className="mt-0.5 type-meta text-xs text-text-secondary">
              {n.unreadCount === 0 ? "You're all caught up" : `${n.unreadCount} unread`}
            </p>
          </div>
          {n.unreadCount > 0 && (
            <button type="button" onClick={() => void n.markAllRead()} className="tap-24 text-xs type-button text-primary">
              Mark all read
            </button>
          )}
        </div>
        {!session.isSignedIn ? (
          <p className="px-5 py-8 text-center text-[13px] type-meta text-text-secondary">
            Notifications are available with an account.
          </p>
        ) : n.isLoading ? (
          <p className="px-5 py-8 text-center text-[13px] type-meta text-text-secondary">Loading…</p>
        ) : n.error ? (
          <p className="px-5 py-8 text-center text-[13px] type-meta text-text-secondary">{n.error}</p>
        ) : n.items.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] type-meta text-text-secondary">Nothing new right now.</p>
        ) : (
          <ul className="divide-y divide-border-divider">
            {n.items.map((i) => (
              <li key={i.id} className="flex items-start gap-3 px-5 py-3.5">
                <span
                  aria-hidden="true"
                  className={cn("mt-2 size-2 shrink-0 rounded-full", i.read ? "bg-border-default" : "bg-primary")}
                />
                <button
                  type="button"
                  onClick={() => !i.read && void n.markRead(i.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block text-sm type-item-title text-text-primary">{i.title}</span>
                  {i.body && <span className="mt-0.5 block text-[13px] type-meta leading-5 text-text-secondary">{i.body}</span>}
                  <span className="mt-0.5 block text-xs type-meta text-text-neutral-500">{ago(i.createdAt)}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Dismiss ${i.title}`}
                  onClick={() => void n.dismiss(i.id)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-brand-warm-gray"
                >
                  <Icon name="close" size={14} color="currentColor" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ProfileLayout>
  );
}
