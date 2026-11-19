"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useActivity } from "@/lib/store";
import {
  TRACK_METRICS,
  dayCalories,
  dayProtein,
  dayWaterOz,
  metricByLabel,
  useTrackDays,
} from "@/lib/track";
import { MetricChart, shortDate } from "@/components/Track/MetricCharts";
import { isoDate } from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import { Empty, MACRO_FILL, MEALS, WidgetCard, fmt, useToday } from "./TrackOverview";

function Ring({
  pct,
  color,
  label,
  center,
}: {
  pct: number;
  color: string;
  label: string;
  center: string;
}) {
  const r = 15.9155;
  const f = Math.min(100, Math.max(0, pct));
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <span className="relative block size-14">
        <svg viewBox="0 0 36 36" className="size-full -rotate-90" aria-hidden>
          <circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            stroke="var(--color-border-divider)"
            strokeWidth="4"
          />
          {f > 0 && (
            <circle
              cx="18"
              cy="18"
              r={r}
              pathLength="100"
              fill="none"
              stroke={f >= 100 ? "var(--color-teal-500)" : color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${f} 100`}
            />
          )}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] type-row-figure tabular-nums text-brand-navy">
          {center}
        </span>
      </span>
      <span className="max-w-full truncate text-[12px] type-meta text-text-secondary">{label}</span>
    </div>
  );
}

/** The "More on today" block under the overview grid. */
export function MoreOnToday() {
  const day = useToday();
  const { days } = useTrackDays(7);
  const activity = useActivity();
  const [pick, setPick] = useState<string>("Calories");
  const [selected, setSelected] = useState<number | null>(null);
  if (!day) return null;

  const carbs = day.meals.reduce((s, m) => s + m.carbs, 0);
  const fat = day.meals.reduce((s, m) => s + m.fat, 0);
  const goals = [
    {
      key: "calories",
      label: "Calories",
      value: dayCalories(day),
      goal: day.calorieGoal,
      color: "var(--color-accent-graphic)",
    },
    {
      key: "protein",
      label: "Protein",
      value: dayProtein(day),
      goal: day.proteinGoal,
      color: "var(--color-brand-navy)",
    },
    {
      key: "carbs",
      label: "Carbs",
      value: carbs,
      goal: Math.round(day.calorieGoal * 0.1124),
      color: "var(--color-navy-400)",
    },
    {
      key: "fat",
      label: "Fat",
      value: fat,
      goal: Math.round(day.calorieGoal * 0.0371),
      color: "var(--color-badge-gold)",
    },
    {
      key: "water",
      label: "Water",
      value: dayWaterOz(day),
      goal: day.waterGoalOz,
      color: "var(--color-graphic)",
    },
    {
      key: "activity",
      label: "Active",
      value: activity.todayMinutes,
      goal: activity.goalMinutes,
      color: "var(--color-accent-graphic)",
    },
  ].map((g) => ({ ...g, pct: g.goal > 0 ? (g.value / g.goal) * 100 : 0 }));
  const reached = goals.filter((g) => g.pct >= 100).length;
  const closest = goals.filter((g) => g.pct > 0 && g.pct < 100).sort((a, b) => b.pct - a.pct)[0];

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
    return {
      meal: m,
      protein: rows.reduce((s, x) => s + x.protein, 0),
      carbs: rows.reduce((s, x) => s + x.carbs, 0),
      fat: rows.reduce((s, x) => s + x.fat, 0),
    };
  });
  const mostProtein = [...perMeal].sort((a, b) => b.protein - a.protein)[0];
  const mealMax = Math.max(1, ...perMeal.map((m) => m.protein + m.carbs + m.fat));

  const balance = [
    { key: "protein", label: "Protein", pct: goals[1].pct, color: MACRO_FILL.protein },
    { key: "carbs", label: "Carbs", pct: goals[2].pct, color: MACRO_FILL.carbs },
    { key: "fat", label: "Fat", pct: goals[3].pct, color: MACRO_FILL.fat },
    { key: "water", label: "Water", pct: goals[4].pct, color: "var(--color-graphic)" },
  ];

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
              unit: closest ? `${Math.round(closest.pct)}%` : undefined,
            },
          ]}
        >
          <div className="grid grid-cols-3 gap-x-2 gap-y-3">
            {goals.map((g) => (
              <Ring
                key={g.key}
                pct={g.pct}
                color={g.color}
                label={g.label}
                center={`${Math.round(g.pct)}%`}
              />
            ))}
          </div>
        </WidgetCard>

        <WidgetCard
          title="This week"
          icon="activity"
          subtitle="Pick a metric, then a day"
          heightClass="h-[14rem]"
          className="md:col-span-2 xl:col-span-8"
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
                  new Date(`${d.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" }),
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
          className="xl:col-span-6"
          stats={[
            {
              label: "Most protein",
              value: day.meals.length ? mostProtein.meal : "–",
              unit: day.meals.length ? `${Math.round(mostProtein.protein)} g` : undefined,
            },
          ]}
        >
          {day.meals.length === 0 ? (
            <Empty>Log a meal to see its macros here.</Empty>
          ) : (
            <ul className="flex h-full flex-col justify-center gap-2.5">
              {perMeal.map((m) => {
                const total = m.protein + m.carbs + m.fat;
                return (
                  <li key={m.meal} className="flex items-center gap-3 text-[12px]">
                    <span className="w-16 shrink-0 text-text-primary">{m.meal}</span>
                    <span className="flex h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-navy-100">
                      {total > 0 && (
                        <span
                          className="flex h-full"
                          style={{ width: `${(total / mealMax) * 100}%` }}
                        >
                          <span
                            style={{
                              width: `${(m.protein / total) * 100}%`,
                              backgroundColor: MACRO_FILL.protein,
                            }}
                          />
                          <span
                            style={{
                              width: `${(m.carbs / total) * 100}%`,
                              backgroundColor: MACRO_FILL.carbs,
                            }}
                          />
                          <span
                            style={{
                              width: `${(m.fat / total) * 100}%`,
                              backgroundColor: MACRO_FILL.fat,
                            }}
                          />
                        </span>
                      )}
                    </span>
                    <span className="w-12 shrink-0 text-right tabular-nums text-text-secondary">
                      {fmt(total)} g
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </WidgetCard>

        <WidgetCard
          title="Nutrient balance"
          icon="leaf"
          subtitle="Goals and limits as a share of each"
          heightClass="h-[13rem]"
          className="xl:col-span-6"
          stats={[
            {
              label: "Goals reached",
              value: `${balance.filter((b) => b.pct >= 100).length} of ${balance.length}`,
            },
          ]}
        >
          <ul className="flex h-full flex-col justify-center gap-3">
            {balance.map((b) => (
              <li key={b.key} className="flex items-center gap-3 text-[12px]">
                <span className="w-14 shrink-0 text-text-primary">{b.label}</span>
                <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-navy-100">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${Math.min(100, b.pct)}%`, backgroundColor: b.color }}
                  />
                </span>
                <span className="w-10 shrink-0 text-right tabular-nums text-text-secondary">
                  {Math.round(b.pct)}%
                </span>
              </li>
            ))}
          </ul>
        </WidgetCard>
      </div>
    </section>
  );
}
