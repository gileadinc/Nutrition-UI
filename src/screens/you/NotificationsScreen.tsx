"use client";

import { useMemo, useState } from "react";
import { NotificationList, toNotificationVM } from "@/components/Notifications";
import { cn } from "@/lib/utils";
import { ProfileLayout } from "@/components/Track/ProfileParts";
import { getErrorMessage, profileApi, type NotificationPrefs, type Preferences as AllPrefs, type PrivacyPrefs } from "@/lib/api";
import { invalidate, toast, useAppSession, useCached, useNotifications, useProfile } from "@/lib/store";
import { SWITCH_ON } from "@/components/styles";

const PREFS: { key: keyof NotificationPrefs; label: string }[] = [
  { key: "mealReminders", label: "Meal reminders" },
  { key: "goalUpdates", label: "Goal updates" },
  { key: "productUpdates", label: "Product updates" },
];

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
      <h2 className="text-[16px] type-section-title tracking-[-0.5px] text-brand-navy">Reminders</h2>
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

const PREFS_KEY = "profile:preferences";

const PRIVACY: { key: "analytics" | "personalizedRecommendations"; label: string; hint: string }[] = [
  {
    key: "personalizedRecommendations",
    label: "Personalised recommendations",
    hint: "Use your goal and what you log to suggest meals.",
  },
  { key: "analytics", label: "Usage analytics", hint: "Share anonymous usage to help improve ForkThis." },
];

/** Privacy switches from `GET/PATCH /api/profile/me/preferences`. */
function PrivacySettings() {
  const prefs = useCached<AllPrefs>(PREFS_KEY, () => profileApi.getPreferences());
  const [busy, setBusy] = useState(false);
  const current = prefs.data?.privacy;
  const toggle = async (key: keyof PrivacyPrefs) => {
    if (!current) return;
    setBusy(true);
    try {
      await profileApi.updatePreferences({ privacy: { ...current, [key]: !current[key] } });
      invalidate(PREFS_KEY);
    } catch (err) {
      toast.error("Couldn't update privacy settings", { body: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel p-4">
      <h2 className="text-[16px] type-section-title tracking-[-0.5px] text-brand-navy">Privacy</h2>
      <p className="mt-1 type-meta text-xs leading-5 text-text-secondary">Control how your data is used.</p>
      <div className="mt-2">
        {PRIVACY.map((p) => (
          <div
            key={p.key}
            className="flex min-h-12 items-center gap-3 border-b border-border-divider py-2 last:border-b-0"
          >
            <span className="min-w-0 flex-1">
              <span className="block type-item-title text-sm text-text-primary">{p.label}</span>
              <span className="block type-meta text-xs leading-5 text-text-secondary">{p.hint}</span>
            </span>
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
  const items = useMemo(() => n.items.map(toNotificationVM), [n.items]);
  return (
    <ProfileLayout
      title="Notifications"
      subtitle="Reminders and updates that help you stay on track."
      aside={
        session.isSignedIn ? (
          <div className="flex flex-col gap-4">
            <Preferences />
            <PrivacySettings />
          </div>
        ) : undefined
      }
      asideLabel="Notification preferences"
    >
      <section aria-label="Recent activity" className="panel overflow-hidden">
        <div className="flex items-center border-b border-border-divider px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] type-section-title tracking-[-0.5px] text-brand-navy">Recent activity</h2>
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
        ) : (
          <NotificationList
            items={items}
            onOpen={(id) => void n.markRead(id)}
            onMarkRead={(id) => void n.markRead(id)}
            onDismiss={(id) => void n.dismiss(id)}
          />
        )}
      </section>
    </ProfileLayout>
  );
}
