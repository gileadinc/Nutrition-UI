"use client";

import { useState, useSyncExternalStore } from "react";
import { PageContainer } from "@/components/Layout";
import { Icon } from "@/components/Icon";
import { TrackOverview } from "@/components/Track/TrackOverview";
import { MoreOnToday } from "@/components/Track/MoreOnToday";
import { ConfirmDialog } from "@/components/Collections";
import { GettingStarted } from "@/components/Track/TrackExtras";
import { profileApi } from "@/lib/api";
import { TodayLog, TrackHeader } from "@/components/Track/Dashboard";
import { useNow } from "@/lib/hooks";
import { GOAL_LABEL, isoDate } from "@/lib/nutrition";
import {
  firstNameOf,
  invalidate,
  toast,
  useFirstTimeState,
  useProfile,
  useActivity,
  useRequireAccount,
  useTrackingActions,
} from "@/lib/store";
import { dayCalories, mealToInput, useTrackDays, type TrackMeal } from "@/lib/track";

const greetingFor = (h: number) =>
  h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";

const NOTE_KEY = "forkthis_activity_note_dismissed";
const noteDismissed = () => {
  try {
    return localStorage.getItem(NOTE_KEY) === isoDate(new Date());
  } catch {
    return false;
  }
};

/** Shown when logged activity lowers today's net calories. */
function ActivityNote({ eaten, burned, goal }: { eaten: number; burned: number; goal: number }) {
  const [hidden, setHidden] = useState(false);
  const dismissed = useSyncExternalStore(
    () => () => {},
    noteDismissed,
    () => true,
  );
  if (burned <= 0 || hidden || dismissed) return null;
  const net = Math.max(0, eaten - burned);
  const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
  return (
    <section
      aria-label="Activity calorie adjustment"
      aria-live="polite"
      className="relative rounded-2xl border border-teal-500/30 bg-teal-500/10 py-3 pl-4 pr-14 text-sm text-brand-navy sm:pl-5"
    >
      <button
        type="button"
        onClick={() => {
          setHidden(true);
          try {
            localStorage.setItem(NOTE_KEY, isoDate(new Date()));
          } catch {
            /* ignore */
          }
        }}
        aria-label="Dismiss this note for today"
        className="tap-44 absolute right-2 top-2 flex size-9 items-center justify-center rounded-full text-brand-navy transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <Icon name="close" size={16} color="currentColor" />
      </button>
      <p className="type-section-title">Activity lowered your net calories today</p>
      <p className="mt-1 tabular-nums">
        {fmt(eaten)} eaten − {fmt(burned)} burned = {fmt(net)} net kcal ·{" "}
        {fmt(Math.max(0, goal - net))} remaining
      </p>
      <p className="mt-1 text-xs text-text-secondary">Your daily goal stays {fmt(goal)} kcal.</p>
    </section>
  );
}

export function TrackDashboardScreen() {
  const now = useNow();
  const requireAccount = useRequireAccount();
  const { profile } = useProfile();
  const { log, remove } = useTrackingActions();
  const { days } = useTrackDays(7);
  const activity = useActivity();
  const firstTime = useFirstTimeState();
  const [mealToRemove, setMealToRemove] = useState<TrackMeal | null>(null);
  const today = days[days.length - 1];

  const removeMeal = async (m: TrackMeal) => {
    if (!requireAccount("Tracking")) return;
    try {
      await remove(m.id);
      toast.success(`${m.title} removed`, {
        action: { label: "Undo", run: () => void log(mealToInput(m)) },
      });
    } catch {
      toast.error("Couldn't remove that entry");
    }
  };

  const dismissGettingStarted = () => {
    void profileApi
      .updateExperienceState({ trackingGuidanceCompleted: true })
      .then(() => invalidate("tracking:first-time"))
      .catch(() => toast.error("Couldn't save that. Try again."));
  };

  return (
    <PageContainer className="max-w-7xl">
      <div className="flex min-w-0 flex-col gap-6 md:gap-8 xl:gap-10">
        <TrackHeader
          greeting={greetingFor(now.getHours())}
          firstName={firstNameOf(profile)}
          longDate={now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
          goalLabel={profile?.goal ? GOAL_LABEL[profile.goal] : null}
        />
        {firstTime.data && (
          <GettingStarted state={firstTime.data} onDismiss={dismissGettingStarted} />
        )}
        <ActivityNote
          eaten={dayCalories(today)}
          burned={activity.todayCalories}
          goal={today.calorieGoal}
        />
        <div id="track-overview">
          <TrackOverview />
        </div>
        <MoreOnToday />
        <div className="panel min-w-0 p-4">
          <TodayLog
            day={today}
            titleClassName="text-[15px] type-section-title leading-5 text-brand-navy"
            history={{ label: "History", to: "/track/insights" }}
            onRemoveMeal={setMealToRemove}
          />
        </div>
        <a
          href="#track-overview"
          className="hidden min-h-11 w-fit items-center gap-2 self-end rounded-full px-4 text-sm type-button text-brand-navy underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy lg:inline-flex"
        >
          Back to overview <span aria-hidden="true">↑</span>
        </a>
      </div>
      {mealToRemove && (
        <ConfirmDialog
          title={`Remove ${mealToRemove.title}?`}
          body="It will be deleted from today's log and your totals will update."
          confirmLabel="Yes, remove it"
          onConfirm={() => {
            const m = mealToRemove;
            setMealToRemove(null);
            void removeMeal(m);
          }}
          onCancel={() => setMealToRemove(null)}
        />
      )}
    </PageContainer>
  );
}
