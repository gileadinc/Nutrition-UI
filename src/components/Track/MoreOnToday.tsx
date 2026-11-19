"use client";

import { useState } from "react";
import {
  DailyGoalsChart,
  MacrosByMealChart,
  NutrientBalanceChart,
  type GoalRow,
  type NutrientRow,
} from "@/components/Charts/TodayCharts";
import { Icon } from "@/components/Icon";
import { MetricChart, shortDate } from "@/components/Track/MetricCharts";
import { isoDate } from "@/lib/nutrition";
import { useActivity } from "@/lib/store";
import {
  TRACK_METRICS,
  dayCalories,
  dayProtein,
  dayWaterOz,
  metricByLabel,
  useTrackDays,
} from "@/lib/track";
import { cn } from "@/lib/utils";
import { useBodyLog } from "./bodyLog";
import { Empty, MEALS, WidgetCard, fmt, useToday } from "./TrackOverview";
import { useLogSheet } from "./LogSheet";

const FEELING_LABEL: Record<string, string> = {
  rough: "Rough",
  low: "Low",
  okay: "Okay",
  good: "Good",
  great: "Great",
};
const FEELING_LEVEL: Record<string, number> = { rough: 1, low: 2, okay: 3, good: 4, great: 5 };

/** Nutrients the app has no endpoint for: shown as "Not recorded" like an unlogged day. */
const NUTRIENTS = [
  { key: "fiber", label: "Fiber", unit: "g", kind: "goal" as const, target: 28 },
  { key: "saturatedFat", label: "Saturated fat", unit: "g", kind: "limit" as const, target: 20 },
  { key: "addedSugar", label: "Added sugar", unit: "g", kind: "limit" as const, target: 25 },
  { key: "sugar", label: "Sugar", unit: "g", kind: "limit" as const, target: 50 },
  { key: "sodium", label: "Sodium", unit: "mg", kind: "limit" as const, target: 2300 },
];

function Dots({ value, color }: { value: number | undefined; color: string }) {
  return (
    <span aria-hidden className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className="h-2 w-5 rounded-full"
          style={{
            backgroundColor:
              value !== undefined && n <= value ? color : "var(--color-border-divider)",
          }}
        />
      ))}
    </span>
  );
}

/** The "More on today" block under the overview grid. */
export function MoreOnToday() {
  const day = useToday();
  const { days } = useTrackDays(7);
  const activity = useActivity();
  const body = useBodyLog();
  const logs = useLogSheet();
  const [pick, setPick] = useState<string>("Calories");
  const [selected, setSelected] = useState<number | null>(null);
  if (!day) return null;

  const steps = body.today.steps ?? 0;
  const sleepHours = body.today.sleepHours ?? 0;
  const raw = [
    {
      key: "calories",
      label: "Calories",
      value: dayCalories(day),
      goal: day.calorieGoal,
      unit: "kcal",
      fill: "var(--color-accent-graphic)",
    },
    {
      key: "protein",
      label: "Protein",
      value: dayProtein(day),
      goal: day.proteinGoal,
      unit: "g",
      fill: "var(--color-brand-navy)",
    },
    {
      key: "water",
      label: "Water",
      value: dayWaterOz(day),
      goal: day.waterGoalOz,
      unit: "oz",
      fill: "var(--color-graphic)",
    },
    {
      key: "activity",
      label: "Active min",
      value: activity.todayMinutes,
      goal: activity.goalMinutes,
      unit: "min",
      fill: "var(--color-badge-gold)",
    },
    {
      key: "steps",
      label: "Steps",
      value: steps,
      goal: 8000,
      unit: "steps",
      fill: "var(--color-navy-400)",
    },
    {
      key: "sleep",
      label: "Sleep",
      value: sleepHours,
      goal: 8,
      unit: "h",
      fill: "var(--color-teal-800)",
    },
  ];
  const goals: GoalRow[] = raw.map((g) => {
    const pct = g.value > 0 && g.goal > 0 ? Math.round((g.value / g.goal) * 100) : null;
    return {
      key: g.key,
      label: g.label,
      share: Math.min(100, pct ?? 0),
      pct,
      fill: g.fill,
      read: g.value > 0 ? { value: g.value, goal: g.goal, unit: g.unit } : null,
    };
  });
  const reached = goals.filter((g) => g.pct !== null && g.pct >= 100).length;
  const closest = goals
    .filter((g) => g.pct !== null && g.pct < 100)
    .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))[0];

  const metric = metricByLabel(pick);
  const dayIdx = Math.min(selected ?? days.length - 1, days.length - 1);
  const focus = days[dayIdx] ?? days[days.length - 1];
  const focusValue = metric.valueOf(focus);
  const focusGoal = metric.goalOf(focus);
  const logged = days.filter((d) => metric.valueOf(d) > 0);
  const average = logged.length
    ? logged.reduce((t, d) => t + metric.valueOf(d), 0) / logged.length
    : null;
  const met = days.filter(
    (d) => metric.valueOf(d) >= metric.goalOf(d) && metric.valueOf(d) > 0,
  ).length;

  const perMeal = MEALS.map((m) => {
    const rows = day.meals.filter((x) => x.mealType === m);
    const protein = Math.round(rows.reduce((s, x) => s + x.protein, 0));
    const carbs = Math.round(rows.reduce((s, x) => s + x.carbs, 0));
    const fat = Math.round(rows.reduce((s, x) => s + x.fat, 0));
    return {
      meal: m,
      protein,
      carbs,
      fat,
      calories: Math.round(rows.reduce((s, x) => s + x.calories, 0)),
    };
  });
  const mostProtein = [...perMeal].sort((a, b) => b.protein - a.protein)[0];

  const nutrients: NutrientRow[] = NUTRIENTS.map((n) => ({
    ...n,
    value: null,
    pct: 0,
    status: "Not recorded",
    fill: "var(--color-border-divider)",
  }));

  const feeling = body.today.feeling ?? null;
  const hasCheckIn = sleepHours > 0 || feeling !== null;
  const moodLevel = feeling ? FEELING_LEVEL[feeling] : undefined;

  return (
    <section aria-label="More on today" data-testid="today-pulse" className="flex flex-col gap-3">
      <div>
        <h2 className="eyebrow text-[12px]">More on today</h2>
        <p className="mt-1 text-[13px] type-meta text-text-secondary">
          Your goals, the week, nutrients and how you feel. Hover, tap or choose to explore.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
        <WidgetCard
          title="Daily goals"
          icon="target"
          subtitle="Six goals, one ring each"
          heightClass="h-auto min-h-[10.5rem]"
          className="xl:col-span-4"
          stats={[
            { label: "Reached", value: `${reached} of ${goals.length}` },
            {
              label: "Next closest",
              value: closest ? closest.label : "–",
              note: closest ? `${closest.pct}% there` : "Nothing in progress",
            },
          ]}
        >
          <DailyGoalsChart rows={goals} />
        </WidgetCard>

        <WidgetCard
          title="This week"
          icon="activity"
          subtitle="Pick a metric, then a day"
          heightClass="h-[14rem]"
          className="xl:col-span-8"
          stats={[
            {
              label: focus.date === isoDate(new Date()) ? "Today" : shortDate(focus.date),
              value: focusValue > 0 ? fmt(focusValue) : "–",
              unit: focusValue > 0 ? metric.unit : undefined,
              note:
                focusValue > 0 && focusGoal > 0
                  ? `${Math.round((focusValue / focusGoal) * 100)}% of ${fmt(focusGoal)}`
                  : "Not logged",
            },
            {
              label: "Average",
              value: average === null ? "–" : fmt(average),
              unit: average === null ? undefined : metric.unit,
              note: `${logged.length} of ${days.length} days`,
            },
            {
              label: "Goal met",
              value: `${met} of ${logged.length}`,
              note: logged.length === 1 ? "logged day" : "logged days",
            },
          ]}
        >
          <div className="flex h-full flex-col gap-2">
            <div
              role="group"
              aria-label="Week metric"
              className="flex gap-1.5 overflow-x-auto pb-0.5"
            >
              {TRACK_METRICS.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  aria-pressed={pick === m.label}
                  onClick={() => setPick(m.label)}
                  className={cn(
                    "tap-44 relative flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px]",
                    pick === m.label
                      ? "border-transparent bg-selected text-on-selected type-button"
                      : "border-border-default bg-white text-text-secondary type-button-secondary",
                  )}
                >
                  {pick === m.label && (
                    <Icon name="tick" size={12} color="var(--color-on-selected)" />
                  )}
                  {m.label}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1">
              <MetricChart
                metric={metric}
                days={days}
                labels={days.map((d) =>
                  new Date(`${d.date}T12:00:00`)
                    .toLocaleDateString("en-US", { weekday: "short" })
                    .slice(0, 1),
                )}
                selected={dayIdx}
                onSelect={setSelected}
              />
            </div>
          </div>
        </WidgetCard>

        <WidgetCard
          title="Macros by meal"
          icon="forkSpoon"
          subtitle="Where today’s protein, carbs and fat came from"
          heightClass="h-[13rem]"
          className="xl:col-span-4"
          stats={[
            {
              label: "Most protein",
              value: day.meals.length ? mostProtein.meal : "–",
              note: day.meals.length ? `${mostProtein.protein} g` : undefined,
            },
          ]}
        >
          {day.meals.length === 0 ? (
            <Empty>Log a meal to see its macros here.</Empty>
          ) : (
            <MacrosByMealChart data={perMeal} />
          )}
        </WidgetCard>

        <WidgetCard
          title="Nutrient balance"
          icon="leaf"
          subtitle="Goals and limits as a share of each"
          heightClass="h-[13rem]"
          className="xl:col-span-4"
          stats={[{ label: "Within limits", value: "–", note: "Nothing recorded yet" }]}
        >
          <NutrientBalanceChart rows={nutrients} />
        </WidgetCard>

        <WidgetCard
          title="Check-in"
          icon="faceSmile"
          subtitle="Last night and how you feel"
          action={
            <button
              type="button"
              onClick={() => logs.open("feelings")}
              aria-label="Log a check-in"
              className="tap-44 relative flex h-8 shrink-0 items-center rounded-full border border-border-default bg-white px-3 text-[12px] type-button-secondary text-text-primary hover:border-text-neutral-400"
            >
              Log
            </button>
          }
          heightClass="h-auto min-h-[10rem]"
          className="md:col-span-2 xl:col-span-4"
        >
          {hasCheckIn ? (
            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <p className="text-[12px] type-item-title text-text-primary">Sleep</p>
                  <p className="text-[12px] tabular-nums text-text-secondary">
                    {sleepHours > 0 ? `${sleepHours} h of 8 h` : "Not logged"}
                  </p>
                </div>
                {sleepHours > 0 && (
                  <div aria-hidden className="h-3 rounded-full bg-border-divider">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (sleepHours / 8) * 100)}%`,
                        backgroundColor: "var(--color-teal-800)",
                      }}
                    />
                  </div>
                )}
              </div>
              <dl className="flex flex-col gap-2">
                {[
                  {
                    key: "energy",
                    label: "Energy",
                    value: undefined,
                    color: "var(--color-accent-graphic)",
                  },
                  {
                    key: "mood",
                    label: "Mood",
                    value: moodLevel,
                    color: "var(--color-badge-gold)",
                  },
                  {
                    key: "sleepQuality",
                    label: "Sleep quality",
                    value: undefined,
                    color: "var(--color-teal-800)",
                  },
                ].map((r) => (
                  <div key={r.key} className="flex items-center gap-3">
                    <dt className="w-24 shrink-0 text-[12px] type-meta text-text-secondary">
                      {r.label}
                    </dt>
                    <dd className="flex min-w-0 flex-1 items-center gap-2">
                      <Dots value={r.value} color={r.color} />
                      <span className="truncate text-[12px] text-text-primary">
                        {r.value === undefined
                          ? "Not checked in"
                          : (feeling && FEELING_LABEL[feeling]) || ""}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <Empty icon="moon">
              <span>No check-in yet today.</span>
              <button
                type="button"
                onClick={() => logs.open("feelings")}
                className="tap-44 relative type-button text-primary"
              >
                Add sleep and how you feel
              </button>
            </Empty>
          )}
        </WidgetCard>
      </div>
    </section>
  );
}
