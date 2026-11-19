"use client";

import { useMemo, useState } from "react";
import { PageContainer } from "@/components/Layout";
import { PrimaryButton } from "@/components/Button";
import { Icon, type IconName } from "@/components/Icon";
import { Empty, WidgetCard, type Stat } from "@/components/Track/TrackOverview";
import { InsightChart, type InsightReading } from "@/components/Charts/TrackCharts";
import { useLogSheet, type LogTab } from "@/components/Track/LogSheet";
import { useBodyLog } from "@/components/Track/bodyLog";
import { Link, Navigate, useParams, useSearchParams } from "@/lib/nav";
import { isoDate } from "@/lib/nutrition";
import { useActivity, useWeight } from "@/lib/store";
import { dayCalories, dayProtein, dayWaterOz, useTrackDays, type TrackDay } from "@/lib/track";
import { cn } from "@/lib/utils";

type Direction = "limit" | "target" | "floor" | "none";

interface Metric {
  key: string;
  label: string;
  blurb: string;
  icon: IconName;
  unit: string;
  accent: string;
  direction: Direction;
  chart: "bars" | "line";
  log: LogTab;
}

const METRICS: Record<string, Metric> = {
  calories: {
    key: "calories",
    label: "Calories",
    blurb: "What you ate each day, against your daily goal.",
    icon: "fire",
    unit: "kcal",
    accent: "var(--color-accent-graphic)",
    direction: "limit",
    chart: "bars",
    log: "meal",
  },
  protein: {
    key: "protein",
    label: "Protein",
    blurb: "Grams of protein a day, against your target.",
    icon: "dumbbell",
    unit: "g",
    accent: "var(--color-brand-navy)",
    direction: "floor",
    chart: "bars",
    log: "meal",
  },
  carbs: {
    key: "carbs",
    label: "Carbs",
    blurb: "Grams of carbohydrate a day.",
    icon: "riceBowl",
    unit: "g",
    accent: "var(--color-navy-400)",
    direction: "target",
    chart: "bars",
    log: "meal",
  },
  fat: {
    key: "fat",
    label: "Fat",
    blurb: "Grams of fat a day.",
    icon: "leaf",
    unit: "g",
    accent: "var(--color-badge-gold)",
    direction: "limit",
    chart: "bars",
    log: "meal",
  },
  water: {
    key: "water",
    label: "Water",
    blurb: "Ounces you drank each day, against your goal.",
    icon: "droplet",
    unit: "oz",
    accent: "var(--color-graphic)",
    direction: "floor",
    chart: "bars",
    log: "water",
  },
  activity: {
    key: "activity",
    label: "Active minutes",
    blurb: "Minutes of movement each day, against your goal.",
    icon: "walking",
    unit: "min",
    accent: "var(--color-accent-graphic)",
    direction: "floor",
    chart: "bars",
    log: "activity",
  },
  steps: {
    key: "steps",
    label: "Steps",
    blurb: "Steps a day, from what you log.",
    icon: "runningShoes",
    unit: "steps",
    accent: "var(--color-accent-graphic)",
    direction: "floor",
    chart: "bars",
    log: "steps",
  },
  sleep: {
    key: "sleep",
    label: "Sleep",
    blurb: "Hours of sleep each night.",
    icon: "moon",
    unit: "h",
    accent: "var(--color-brand-navy)",
    direction: "floor",
    chart: "bars",
    log: "sleep",
  },
  weight: {
    key: "weight",
    label: "Weight",
    blurb: "Your weigh-ins over time.",
    icon: "weightScale",
    unit: "lb",
    accent: "var(--color-brand-navy)",
    direction: "none",
    chart: "line",
    log: "weight",
  },
};

const PERIODS = [7, 14, 30] as const;
const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString("en-US");
const dayName = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
const short = (iso: string, n: number) =>
  n <= 7
    ? new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1)
    : new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

interface Reading {
  date: string;
  value: number | null;
  target: number | null;
}

/** `/track/insights/:metric`: one metric over the last 7, 14 or 30 days. */
export function InsightMetricScreen() {
  const { metric = "" } = useParams<{ metric: string }>();
  const [params, setParams] = useSearchParams();
  const range = Number(params.get("range"));
  const period = (PERIODS as readonly number[]).includes(range) ? range : 7;
  const m = METRICS[metric];
  if (metric === "medication") return <Navigate to="/track/medication" />;
  if (!m) return <Navigate to="/track/insights" />;
  return (
    <Inner
      m={m}
      period={period}
      onPeriod={(n) => {
        const p = new URLSearchParams(params);
        if (n === 7) p.delete("range");
        else p.set("range", String(n));
        setParams(p, { replace: true });
      }}
    />
  );
}

function useReadings(m: Metric, n: number): Reading[] {
  const { days } = useTrackDays(n);
  const activity = useActivity();
  const weight = useWeight();
  const body = useBodyLog();
  return useMemo(() => {
    return days.map((d: TrackDay): Reading => {
      const date = d.date;
      const byDay = activity.entries
        .filter((e) => isoDate(new Date(e.loggedAt)) === date)
        .reduce((s, e) => s + e.minutes, 0);
      const none = (v: number) => (v > 0 ? v : null);
      switch (m.key) {
        case "calories":
          return { date, value: none(dayCalories(d)), target: d.calorieGoal };
        case "protein":
          return { date, value: none(dayProtein(d)), target: d.proteinGoal };
        case "carbs":
          return {
            date,
            value: none(d.meals.reduce((s, x) => s + x.carbs, 0)),
            target: Math.round(d.calorieGoal * 0.1124),
          };
        case "fat":
          return {
            date,
            value: none(d.meals.reduce((s, x) => s + x.fat, 0)),
            target: Math.round(d.calorieGoal * 0.0371),
          };
        case "water":
          return { date, value: none(dayWaterOz(d)), target: d.waterGoalOz };
        case "activity":
          return { date, value: none(byDay), target: activity.goalMinutes };
        case "steps":
          return { date, value: body.all[date]?.steps ?? null, target: 8000 };
        case "sleep":
          return { date, value: body.all[date]?.sleepHours ?? null, target: 7 };
        default:
          return {
            date,
            value: weight.readings.find((r) => r.date === date)?.pounds ?? null,
            target: null,
          };
      }
    });
  }, [days, m.key, activity.entries, activity.goalMinutes, weight.readings, body.all]);
}

function Inner({
  m,
  period,
  onPeriod,
}: {
  m: Metric;
  period: number;
  onPeriod: (n: number) => void;
}) {
  const logs = useLogSheet();
  const both = useReadings(m, period * 2);
  const readings = both.slice(period);
  const previous = both.slice(0, period);
  const [compare, setCompare] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const known = readings.filter((r) => r.value !== null) as (Reading & { value: number })[];
  const last = readings.reduce((acc, r, i) => (r.value === null ? acc : i), readings.length - 1);
  const cur = readings[Math.min(sel ?? last, readings.length - 1)];
  const sorted = [...known].sort((a, b) => a.value - b.value);
  const avg = known.length ? known.reduce((s, r) => s + r.value, 0) / known.length : null;
  const median = sorted.length
    ? sorted.length % 2
      ? sorted[(sorted.length - 1) / 2].value
      : (sorted[sorted.length / 2 - 1].value + sorted[sorted.length / 2].value) / 2
    : null;
  const low = sorted[0] ?? null;
  const high = sorted[sorted.length - 1] ?? null;
  const hit = (r: Reading & { value: number }) =>
    r.target === null
      ? null
      : m.direction === "limit"
        ? r.value <= r.target
        : m.direction === "floor"
          ? r.value >= r.target
          : Math.abs(r.value - r.target) <= r.target * 0.1;
  const onTarget = m.direction === "none" ? null : known.filter((r) => hit(r)).length;
  const over =
    m.direction === "none"
      ? 0
      : known.filter((r) => r.target !== null && r.value > r.target).length;
  const longest = (() => {
    let best = 0;
    let run = 0;
    for (const r of readings) {
      if (r.value !== null && hit(r as Reading & { value: number })) {
        run += 1;
        best = Math.max(best, run);
      } else run = 0;
    }
    return best;
  })();
  const target = known.length ? (known[known.length - 1].target ?? null) : null;

  const stats: Stat[] = [
    {
      label: "Average",
      value: avg === null ? "—" : fmt(avg),
      unit: avg === null ? undefined : m.unit,
    },
    {
      label: "Median",
      value: median === null ? "—" : fmt(median),
      unit: median === null ? undefined : m.unit,
    },
    { label: "Lowest", value: low ? fmt(low.value) : "—", unit: low ? m.unit : undefined },
    { label: "Highest", value: high ? fmt(high.value) : "—", unit: high ? m.unit : undefined },
    ...(onTarget === null
      ? []
      : [
          {
            label:
              m.direction === "limit"
                ? "Within limit"
                : m.direction === "floor"
                  ? "Goal reached"
                  : "On target",
            value: `${onTarget} of ${known.length}`,
          },
        ]),
    ...(over > 0
      ? [
          {
            label: m.direction === "limit" ? "Over limit" : "Past goal",
            value: `${over} of ${known.length}`,
          },
        ]
      : []),
    ...(onTarget !== null && longest > 1
      ? [{ label: "Longest run", value: String(longest), unit: "days" }]
      : []),
  ];

  return (
    <PageContainer className="max-w-5xl">
      <Link
        to="/track/insights"
        className="tap-44 relative inline-flex items-center gap-1.5 text-[13px] type-button text-primary"
      >
        <Icon name="arrowBack" size={16} color="currentColor" />
        All insights
      </Link>
      <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <header className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-full bg-icon-well text-icon-well-ink"
          >
            <Icon name={m.icon} size={22} color="currentColor" />
          </span>
          <div className="min-w-0">
            <h1 className="type-display text-brand-navy text-[24px] leading-[1.15] tracking-[-1.08px] md:text-[28px] md:tracking-[-1.26px]">
              {m.label}
            </h1>
            <p className="mt-1 type-meta text-[13px] tracking-[-0.3px] text-text-secondary">
              {m.blurb}
            </p>
          </div>
        </header>
        <div
          role="group"
          aria-label="Period"
          className="flex w-fit rounded-full bg-navy-soft p-0.5"
        >
          {PERIODS.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={period === n}
              onClick={() => {
                setSel(null);
                onPeriod(n);
              }}
              className={cn(
                "flex h-11 min-w-14 items-center justify-center rounded-full px-3 text-[13px] transition-colors",
                period === n
                  ? "bg-selected text-on-selected type-button"
                  : "type-button-secondary text-brand-navy hover:bg-surface-card",
              )}
            >
              {n} days
            </button>
          ))}
        </div>
      </div>

      <div className="@container mt-5 flex flex-col gap-4">
        <WidgetCard
          title={`${m.label} by day`}
          icon={m.icon}
          color={m.accent}
          subtitle={`Last ${period} days`}
          heightClass="h-[17rem]"
          stats={stats}
          action={
            <button
              type="button"
              role="switch"
              aria-checked={compare}
              onClick={() => setCompare((v) => !v)}
              className="tap-44 relative flex shrink-0 items-center gap-2 text-[12px] type-button text-text-primary"
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-5 w-9 items-center rounded-full border p-0.5",
                  compare
                    ? "justify-end border-control-on bg-control-on"
                    : "justify-start border-border-default bg-white",
                )}
              >
                <span
                  className={cn(
                    "size-3.5 rounded-full",
                    compare ? "bg-white" : "bg-text-neutral-400",
                  )}
                />
              </span>
              Compare
            </button>
          }
        >
          <div className="flex h-full flex-col gap-2">
            <p aria-live="polite" className="min-h-5 text-[13px] type-meta text-text-secondary">
              <span className="type-item-title text-text-primary">{dayName(cur.date)}</span> ·{" "}
              {cur.value === null ? "Not recorded" : `${fmt(cur.value)} ${m.unit}`}
            </p>
            <div className="min-h-0 flex-1">
              {known.length === 0 ? (
                <Empty icon={m.icon}>
                  Nothing logged for {m.label.toLowerCase()} in this period yet.
                </Empty>
              ) : (
                <InsightChart
                  data={readings.map((r, i): InsightReading => ({
                    key: r.date,
                    label: short(r.date, period),
                    value: r.value,
                    prev: previous[i]?.value ?? null,
                  }))}
                  kind={m.chart === "line" ? "line" : "bars"}
                  direction={m.direction}
                  accent={m.accent}
                  target={target}
                  unit={m.unit}
                  selected={sel ?? last}
                  onSelect={setSel}
                  compare={compare}
                  manyDays={period > 14}
                />
              )}
            </div>
          </div>
        </WidgetCard>

        <section aria-label="Day by day" className="panel overflow-hidden">
          <h2 className="border-b border-border-divider px-4 py-3 text-[15px] type-section-title text-brand-navy">
            Day by day
          </h2>
          <ul>
            {[...readings].reverse().map((r) => (
              <li
                key={r.date}
                className="flex items-center gap-3 border-b border-border-divider px-4 py-2.5 last:border-b-0"
              >
                <span className="min-w-0 flex-1 truncate text-[13px] text-text-primary">
                  {dayName(r.date)}
                </span>
                <span className="shrink-0 text-[13px] tabular-nums text-text-secondary">
                  {r.value === null ? "Not recorded" : `${fmt(r.value)} ${m.unit}`}
                  {r.value !== null &&
                    target !== null &&
                    r.target !== null &&
                    ` · goal ${fmt(r.target)}`}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <WidgetCard
          title="Take it from here"
          icon="target"
          color="var(--color-brand-navy)"
          heightClass="h-auto"
        >
          <div className="flex flex-col gap-3">
            <PrimaryButton
              label={`Log ${m.label.toLowerCase()}`}
              onPress={() => logs.open(m.log)}
            />
            {m.direction !== "none" && (
              <Link
                to="/you/goal"
                className="tap-44 relative inline-flex items-center justify-center gap-1 text-[13px] type-button text-primary"
              >
                Review your goal
                <Icon name="chevronRight" size={14} color="currentColor" />
              </Link>
            )}
          </div>
        </WidgetCard>
      </div>
    </PageContainer>
  );
}
