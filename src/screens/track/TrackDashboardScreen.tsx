"use client";

import { PageContainer } from "@/components/Layout";
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
  toast,
  useProfile,
  useRequireAccount,
  useTrackingActions,
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

  const waterOz = dayWaterOz(today);
  const waterGoal = Math.round(today.waterGoalOz);

  return (
    <PageContainer className="max-w-7xl">
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
                  ]}
                />
              </div>
            </TrackSection>
            <div className="border-t border-border-divider pt-3">
              <TodayLog
                day={today}
                titleClassName={cn(EYEBROW, "text-brand-navy", SECTION_TITLE && "")}
                history={{ label: "History", to: "/track/insights" }}
                onRemoveMeal={(m) => void removeMeal(m)}
              />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
