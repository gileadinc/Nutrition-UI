"use client";

import { useState } from "react";
import { PageContainer } from "@/components/Layout";
import { ConfirmDialog } from "@/components/Collections";
import { GettingStarted, MomentumCard, RecommendedMeals } from "@/components/Track/TrackExtras";
import { profileApi } from "@/lib/api";
import {
  AlsoToday,
  TodayLog,
  TodayRings,
  TrackHeader,
  TrackSection,
  WeekChart,
  mealTotals,
  toWeek,
  EYEBROW,
} from "@/components/Track/Dashboard";
import { useNow } from "@/lib/hooks";
import { GOAL_LABEL, isoDate, ozToMl } from "@/lib/nutrition";
import {
  firstNameOf,
  invalidate,
  toast,
  useFirstTimeState,
  useMomentum,
  useTrackingRecommendations,
  useProfile,
  useActivity,
  useRequireAccount,
  useTrackingActions,
  useWeight,
} from "@/lib/store";
import {
  dayCalories,
  dayProtein,
  dayWaterOz,
  mealToInput,
  useTrackDays,
  type TrackMeal,
} from "@/lib/track";
import { SECTION_TITLE } from "@/components/styles";
import { cn } from "@/lib/utils";

const greetingFor = (h: number) =>
  h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";

export function TrackDashboardScreen() {
  const now = useNow();
  const requireAccount = useRequireAccount();
  const { profile } = useProfile();
  const { log, remove, addWater } = useTrackingActions();
  const { days } = useTrackDays(7);
  const activity = useActivity();
  const momentum = useMomentum();
  const recs = useTrackingRecommendations(undefined, 3);
  const firstTime = useFirstTimeState();
  const [mealToRemove, setMealToRemove] = useState<TrackMeal | null>(null);
  const weight = useWeight();
  const latestWeight = weight.todayReading ?? weight.previous;
  const todayKey = isoDate(now);
  const today = days[days.length - 1];

  const addOz = async (oz: number) => {
    if (!requireAccount("Tracking")) return;
    try {
      const entry = await addWater(ozToMl(oz));
      toast.success(`${oz} oz logged`, {
        action: { label: "Undo", run: () => void remove(entry.entryId) },
      });
    } catch {
      toast.error("Couldn't log water");
    }
  };

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

  const waterOz = dayWaterOz(today);
  const waterGoal = Math.round(today.waterGoalOz);

  return (
    <PageContainer className="max-w-[1680px]">
      <div className="flex flex-col gap-6">
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
        {firstTime.data && <GettingStarted state={firstTime.data} onDismiss={dismissGettingStarted} />}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-x-10">
          <div className="flex flex-col gap-6">
            <TrackSection id="track-today" title="Today">
              <div className="mt-2">
                <TodayRings
                  calories={{ eaten: dayCalories(today), goal: today.calorieGoal }}
                  protein={{ eaten: dayProtein(today), goal: today.proteinGoal }}
                  meals={mealTotals(today)}
                />
              </div>
            </TrackSection>
            <WeekChart week={toWeek(days, todayKey)} title="Last 7 days" headingId="track-week" />
            {momentum.data && (
              <TrackSection id="track-streak" title="Your streak">
                <div className="mt-3">
                  <MomentumCard momentum={momentum.data} />
                </div>
              </TrackSection>
            )}
          </div>
          <div className="flex flex-col gap-6">
            <TrackSection id="track-also-today" title="Also today">
              <div className="mt-3">
                <AlsoToday
                  metrics={[
                    {
                      key: "water",
                      label: "Water",
                      icon: "droplet",
                      value: Math.round(waterOz).toLocaleString("en-US"),
                      unit: "oz",
                      goal: `of ${waterGoal}`,
                      spoken: `Water: ${waterOz} of ${waterGoal} oz`,
                      to: "/track/water",
                      progress: { value: waterOz, goal: waterGoal },
                      onQuick: () => void addOz(8),
                      quickLabel: "Add 8 oz of water",
                    },
                    {
                      key: "activity",
                      label: "Active minutes",
                      icon: "activity",
                      value: String(activity.todayMinutes),
                      unit: "min",
                      goal: `of ${activity.goalMinutes}`,
                      spoken: `Active minutes: ${activity.todayMinutes} of ${activity.goalMinutes}`,
                      to: "/track/activity",
                      progress: { value: activity.todayMinutes, goal: activity.goalMinutes },
                    },
                    {
                      key: "weight",
                      label: "Weight",
                      icon: "weightScale",
                      value: latestWeight ? latestWeight.pounds.toFixed(1) : "--",
                      unit: "lb",
                      goal: weight.todayReading ? "today" : latestWeight ? "last reading" : "not recorded",
                      spoken: latestWeight ? `Weight: ${latestWeight.pounds.toFixed(1)} lb` : "Weight: not recorded",
                      to: "/track/weight",
                      progress: { value: 0, goal: 0 },
                    },
                  ]}
                />
              </div>
            </TrackSection>
            {recs.data && recs.data.items.length > 0 && (
              <TrackSection id="track-recommended" title="Fits your day">
                <div className="mt-3">
                  <RecommendedMeals
                    items={recs.data.items}
                    remainingCalories={recs.data.remaining.calories}
                  />
                </div>
              </TrackSection>
            )}
            <div className="border-t border-border-divider pt-3">
              <TodayLog
                day={today}
                titleClassName={cn(EYEBROW, "text-brand-navy", SECTION_TITLE && "")}
                history={{ label: "History", to: "/track/insights" }}
                onRemoveMeal={setMealToRemove}
              />
            </div>
          </div>
        </div>
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
