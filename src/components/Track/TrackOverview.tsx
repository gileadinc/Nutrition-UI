"use client";

import { useId, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { useActivity, useMedications, useWeight } from "@/lib/store";
import { dayCalories, dayProtein, dayWaterOz, useTrackDays, type TrackDay } from "@/lib/track";
import { cn } from "@/lib/utils";
import { SheetFrame, WaterBottle, useLogSheet, type LogTab } from "./LogSheet";
import {
  DonutChart,
  PieSlices,
  RingsChart,
  RunningTotalChart,
  WeightLineChart,
} from "@/components/Charts/TrackCharts";

export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/* ----------------------------------------------------------- which widgets */

export const OVERVIEW_KEYS = [
  "calories",
  "protein",
  "water",
  "activity",
  "limits",
  "weight",
  "medication",
] as const;
export type OverviewKey = (typeof OVERVIEW_KEYS)[number];
const LABEL: Record<OverviewKey, string> = {
  calories: "Calories",
  protein: "Macros",
  water: "Water",
  activity: "Activity",
  limits: "Daily limits",
  weight: "Weight",
  medication: "Medication",
};
const STORE_KEY = "forkthis.track.overview";
const listeners = new Set<() => void>();

const readKeys = (): string => {
  try {
    return localStorage.getItem(STORE_KEY) ?? "";
  } catch {
    return "";
  }
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};

/** Which overview widgets are shown (persisted in this browser). */
function useVisibleKeys(): [Set<OverviewKey>, (next: OverviewKey[]) => void] {
  const raw = useSyncExternalStore(subscribe, readKeys, () => "");
  const set = useMemo(() => {
    if (!raw) return new Set<OverviewKey>(OVERVIEW_KEYS);
    const keys = raw
      .split(",")
      .filter((k): k is OverviewKey => (OVERVIEW_KEYS as readonly string[]).includes(k));
    return new Set<OverviewKey>(keys);
  }, [raw]);
  const write = (next: OverviewKey[]) => {
    try {
      localStorage.setItem(STORE_KEY, next.join(",") || "none");
    } catch {
      /* storage unavailable: the choice just won't persist */
    }
    listeners.forEach((l) => l());
  };
  return [raw === "none" ? new Set() : set, write];
}

/* --------------------------------------------------------------- the card */

function Log({ tab, label }: { tab: LogTab; label: string }) {
  const logs = useLogSheet();
  return (
    <button
      type="button"
      onClick={() => logs.open(tab)}
      aria-label={label}
      className="tap-44 relative flex h-8 shrink-0 items-center rounded-full border border-border-default bg-white px-3 text-[12px] type-button-secondary text-text-primary hover:border-text-neutral-400"
    >
      Log
    </button>
  );
}

export interface Stat {
  label: string;
  value: string;
  unit?: string;
}

export function WidgetCard({
  title,
  icon,
  color = "var(--color-brand-navy)",
  subtitle,
  action,
  onHide,
  children,
  stats,
  className,
  heightClass = "h-[clamp(11rem,30vw,16rem)]",
}: {
  title: string;
  icon?: IconName;
  color?: string;
  subtitle?: string;
  action?: ReactNode;
  onHide?: () => void;
  children: ReactNode;
  stats?: Stat[];
  className?: string;
  heightClass?: string;
}) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className={cn("panel flex min-w-0 flex-col gap-3 p-4", className)}
    >
      <header className="flex items-center gap-2">
        {icon && (
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, white)` }}
          >
            <Icon name={icon} size={14} color={color} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 id={id} className="truncate text-[15px] type-section-title leading-5 text-brand-navy">
            {title}
          </h3>
          {subtitle && (
            <p className="truncate text-[12px] type-meta text-text-secondary">{subtitle}</p>
          )}
        </div>
        {action}
        {onHide && (
          <button
            type="button"
            onClick={onHide}
            aria-label={`Hide ${title}`}
            title={`Hide ${title}`}
            className="tap-44 relative flex size-8 shrink-0 items-center justify-center rounded-full text-brand-navy hover:bg-navy-soft"
          >
            <Icon name="eye" size={16} color="currentColor" />
          </button>
        )}
      </header>
      <div className={cn("min-w-0", heightClass)}>{children}</div>
      {stats && stats.length > 0 && (
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-x-4 gap-y-3 border-t border-border-divider pt-3">
          {stats.map((s) => (
            <div key={s.label} className="min-w-0">
              <dt className="truncate text-[12px] type-meta uppercase tracking-[0.04em] text-text-secondary">
                {s.label}
              </dt>
              <dd className="mt-0.5">
                <span className="text-[22px] leading-6 type-row-figure tabular-nums text-brand-navy">
                  {s.value}
                </span>
                {s.unit && <span className="ml-1 text-[12px] text-text-secondary">{s.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

export function Empty({ children, icon = "plusSign" }: { children: ReactNode; icon?: IconName }) {
  return (
    <div className="relative flex size-full min-h-36 overflow-hidden rounded-2xl border border-dashed border-border-default bg-[linear-gradient(180deg,white_0%,var(--color-brand-warm-gray)_100%)] px-4 text-center text-[13px] text-text-secondary">
      <div aria-hidden className="absolute inset-x-4 bottom-4 top-4 opacity-55">
        <span className="absolute inset-x-0 top-1/4 border-t border-border-divider" />
        <span className="absolute inset-x-0 top-1/2 border-t border-border-divider" />
        <span className="absolute inset-x-0 top-3/4 border-t border-border-divider" />
        {[
          ["10%", "24%"],
          ["27%", "42%"],
          ["44%", "31%"],
          ["61%", "56%"],
          ["78%", "38%"],
        ].map(([l, h]) => (
          <span
            key={l}
            className="absolute bottom-0 w-[9%] rounded-t-md bg-navy-100"
            style={{ left: l, height: h }}
          />
        ))}
      </div>
      <div className="relative m-auto flex max-w-[19rem] flex-col items-center gap-1 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-[2px]">
        <span
          aria-hidden
          className="mb-1 flex size-8 items-center justify-center rounded-full bg-navy-soft text-brand-navy"
        >
          <Icon name={icon} size={14} color="currentColor" />
        </span>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ charts */

export const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
const MEAL_FILL: Record<(typeof MEALS)[number], string> = {
  Breakfast: "var(--color-orange-300)",
  Lunch: "var(--color-accent-graphic)",
  Dinner: "var(--color-orange-800)",
  Snack: "var(--color-orange-900)",
};
export const MACRO_FILL = {
  protein: "var(--color-graphic)",
  carbs: "var(--color-accent-graphic)",
  fat: "var(--color-badge-gold)",
} as const;
const ACTIVITY_FILL = [
  "var(--color-brand-navy)",
  "var(--color-graphic)",
  "var(--color-badge-gold)",
  "var(--color-navy-400)",
];

const hourOf = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
};

/* --------------------------------------------------------------- the grid */

export function useToday(): TrackDay | undefined {
  const { days } = useTrackDays(1);
  return days[days.length - 1];
}

function CaloriesByMeal({ day, onHide }: { day: TrackDay; onHide: () => void }) {
  const eaten = dayCalories(day);
  const parts = MEALS.map((m) => ({
    key: m,
    value: day.meals.filter((x) => x.mealType === m).reduce((s, x) => s + x.calories, 0),
    fill: MEAL_FILL[m],
  }));
  return (
    <WidgetCard
      title="Calories by meal"
      onHide={onHide}
      heightClass="h-auto min-h-[9.75rem] space-y-3"
      className="@5xl:col-span-3"
    >
      {eaten === 0 ? (
        <Empty>Log a meal to see how today is split.</Empty>
      ) : (
        <>
          <div className="flex flex-col items-center justify-center">
            <DonutChart
              parts={parts}
              size={118}
              thickness={17}
              unit="kcal"
              partName={(k) => k}
              overflow={{
                value: eaten,
                target: day.calorieGoal,
                color: "var(--color-accent-graphic)",
              }}
              label={`Calories by meal: ${parts
                .filter((p) => p.value > 0)
                .map((p) => `${p.key} ${fmt(p.value)} kcal`)
                .join(", ")}`}
            >
              <span className="text-[22px] leading-none type-row-figure tabular-nums text-brand-navy">
                {fmt(eaten)}
              </span>
              <span className="text-[11px] text-text-secondary">kcal</span>
            </DonutChart>
          </div>
          <ul aria-label="Calories by meal" className="mt-3 space-y-1 text-[12px]">
            {parts
              .filter((p) => p.value > 0)
              .map((p) => (
                <li key={p.key} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: p.fill }}
                  />
                  <span className="min-w-0 flex-1 truncate text-text-primary">{p.key}</span>
                  <span className="shrink-0 tabular-nums text-text-secondary">
                    {fmt(p.value)} · {Math.round((p.value / eaten) * 100)}%
                  </span>
                </li>
              ))}
          </ul>
        </>
      )}
    </WidgetCard>
  );
}

function CaloriesThroughDay({ day, onHide }: { day: TrackDay; onHide: () => void }) {
  return (
    <WidgetCard
      title="Calories through the day"
      icon="fire"
      color="var(--color-accent-graphic)"
      subtitle="Running total after each meal"
      onHide={onHide}
      action={<Log tab="meal" label="Log a meal" />}
      heightClass="h-[9.75rem]"
      className="@2xl:order-last @2xl:col-span-2 @5xl:order-none @5xl:col-span-6"
      stats={[
        { label: "Eaten", value: fmt(dayCalories(day)), unit: "kcal" },
        { label: "Goal", value: fmt(day.calorieGoal), unit: "kcal" },
        { label: "Meals", value: String(day.meals.length) },
      ]}
    >
      {day.meals.length === 0 ? (
        <Empty>Your running total will build here as you log.</Empty>
      ) : (
        <RunningTotalChart
          events={day.meals.map((m) => ({
            t: hourOf(m.loggedAt),
            amount: m.calories,
            fill: MEAL_FILL[m.mealType as (typeof MEALS)[number]] ?? MEAL_FILL.Snack,
          }))}
          start={Math.min(6, ...day.meals.map((m) => hourOf(m.loggedAt)))}
          end={Math.max(21, ...day.meals.map((m) => hourOf(m.loggedAt)))}
          goal={day.calorieGoal}
          color="var(--color-accent-graphic)"
          unit="kcal"
          label={`Calories eaten through the day: ${fmt(dayCalories(day))} of ${fmt(day.calorieGoal)} kcal`}
        />
      )}
    </WidgetCard>
  );
}

function Macros({ day, onHide }: { day: TrackDay; onHide: () => void }) {
  const goals = {
    protein: day.proteinGoal,
    carbs: Math.round(day.calorieGoal * 0.1124),
    fat: Math.round(day.calorieGoal * 0.0371),
  };
  const vals = {
    protein: dayProtein(day),
    carbs: day.meals.reduce((s, m) => s + m.carbs, 0),
    fat: day.meals.reduce((s, m) => s + m.fat, 0),
  };
  const rows = (["protein", "carbs"] as const).map((k) => ({
    key: k,
    name: k === "protein" ? "Protein" : "Carbs",
    value: vals[k],
    target: goals[k],
    fill: MACRO_FILL[k],
  }));
  return (
    <WidgetCard
      title="Macros"
      onHide={onHide}
      heightClass="h-auto min-h-[9.75rem] space-y-3"
      className="@2xl:@max-5xl:col-span-1 @5xl:col-span-3"
    >
      <div className="flex items-center justify-center">
        <RingsChart
          rows={rows}
          size={138}
          label={`Macros against goals: ${rows.map((r) => `${r.name} ${fmt(r.value)} of ${fmt(r.target)} g`).join(", ")}`}
        />
      </div>
      <ul aria-label="Macros against goals" className="mt-3 space-y-1 text-[12px]">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: r.fill }}
            />
            <span className="flex-1 text-text-primary">{r.name}</span>
            <span className="tabular-nums text-text-secondary">
              {fmt(r.value)} / {fmt(r.target)}g
            </span>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}

function Water({ day, onHide }: { day: TrackDay; onHide: () => void }) {
  const oz = dayWaterOz(day);
  const goal = day.waterGoalOz;
  const pct = goal > 0 ? Math.min(100, (oz / goal) * 100) : 0;
  const drinks = day.hydration.filter((h) => h.ounces > 0).length;
  return (
    <WidgetCard
      title="Water"
      icon="droplet"
      color="var(--color-graphic)"
      subtitle="Your bottle fills as you log each drink"
      onHide={onHide}
      action={<Log tab="water" label="Log water" />}
      heightClass="h-[8.75rem]"
      className="@5xl:col-span-5"
      stats={[
        { label: "Drunk", value: fmt(oz), unit: "oz" },
        oz >= goal
          ? { label: "Left", value: "✓" }
          : { label: "Left", value: fmt(goal - oz), unit: "oz" },
        { label: "Drinks", value: String(drinks) },
      ]}
    >
      <div className="flex size-full items-center justify-center gap-6">
        <WaterBottle value={oz} goal={goal} size={104} showValue={false} />
        <div className="min-w-0">
          <p className="text-[36px] leading-none type-numeral tabular-nums tracking-[-1px] text-brand-navy">
            {Math.round(pct)}%
          </p>
          <p className="mt-1 text-[13px] text-text-secondary">of {fmt(goal)} oz goal</p>
        </div>
      </div>
    </WidgetCard>
  );
}

function Activity({ onHide }: { onHide: () => void }) {
  const a = useActivity();
  const slices = a.todayEntries.map((e, i) => ({
    key: `${e.id}`,
    name: e.name,
    value: e.minutes,
    fill: ACTIVITY_FILL[i % ACTIVITY_FILL.length],
  }));
  return (
    <WidgetCard
      title="Activity"
      icon="walking"
      color="var(--color-accent-graphic)"
      subtitle="Minutes by activity"
      onHide={onHide}
      action={<Log tab="activity" label="Log activity" />}
      heightClass="h-[8.75rem]"
      className="@5xl:col-span-4"
      stats={[
        { label: "Active", value: String(a.todayMinutes), unit: "min" },
        { label: "Burned", value: fmt(a.todayCalories), unit: "kcal" },
        { label: "Goal", value: String(a.goalMinutes), unit: "min" },
      ]}
    >
      {slices.length === 0 ? (
        <Empty icon="walking">Log an activity to see where your minutes went.</Empty>
      ) : (
        <PieSlices
          slices={slices.map((x) => ({
            key: x.key,
            name: x.name,
            value: x.value,
            fill: x.fill,
            text: `${x.value} min`,
          }))}
          label={`Active minutes by activity: ${slices.map((x) => `${x.name} ${x.value} min`).join(", ")}`}
        />
      )}
    </WidgetCard>
  );
}

function WeightWidget({ onHide }: { onHide: () => void }) {
  const w = useWeight();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3),
      v: w.readings.find((r) => r.date === key)?.pounds ?? null,
    };
  });
  const real = days.filter((d) => d.v !== null) as { label: string; v: number }[];
  const latest = real.length ? real[real.length - 1].v : null;
  const change = real.length > 1 ? real[real.length - 1].v - real[0].v : null;
  return (
    <WidgetCard
      title="Weight"
      icon="weightScale"
      color="var(--color-brand-navy)"
      subtitle="The week’s readings against their average"
      onHide={onHide}
      action={<Log tab="weight" label="Log weight" />}
      heightClass="h-[8.75rem]"
      className="@5xl:col-span-5"
      stats={[
        { label: "Latest", value: latest === null ? "—" : latest.toFixed(1), unit: "lb" },
        {
          label: "Change",
          value: change === null ? "—" : `${change > 0 ? "+" : "−"}${Math.abs(change).toFixed(1)}`,
          unit: "lb",
        },
        { label: "Weighed", value: `${real.length} of 7` },
      ]}
    >
      {real.length === 0 ? (
        <Empty icon="weightScale">Log a weigh-in to see your week here.</Empty>
      ) : (
        <WeightLineChart
          data={days.map((d) => ({ label: d.label, value: d.v }))}
          color="var(--color-brand-navy)"
          unit="lb"
          label="Weight this week"
        />
      )}
    </WidgetCard>
  );
}

function DailyLimits({ day, onHide }: { day: TrackDay; onHide: () => void }) {
  const fat = day.meals.reduce((s, m) => s + m.fat, 0);
  const fatGoal = Math.round(day.calorieGoal * 0.0371);
  const rows = [
    {
      key: "fat",
      label: "Fat",
      value: fat,
      limit: fatGoal,
      unit: "g",
      color: "var(--color-badge-gold)",
      known: day.meals.length > 0,
    },
    {
      key: "sugar",
      label: "Sugar",
      value: 0,
      limit: 50,
      unit: "g",
      color: "var(--color-badge-gold)",
      known: false,
    },
    {
      key: "sodium",
      label: "Sodium",
      value: 0,
      limit: 2300,
      unit: "mg",
      color: "var(--color-navy-400)",
      known: false,
    },
  ];
  return (
    <WidgetCard
      title="Daily limits"
      icon="shield"
      color="var(--color-brand-navy)"
      subtitle="Everything is within limits"
      onHide={onHide}
      heightClass="h-auto"
      className="@5xl:col-span-3"
    >
      <ul className="flex flex-col gap-2.5">
        {rows.map((r) => {
          const pct = r.known && r.limit > 0 ? Math.min(100, (r.value / r.limit) * 100) : 0;
          const over = r.known && r.value > r.limit;
          return (
            <li key={r.key} className="rounded-xl border border-border-divider px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] type-item-title text-text-primary">{r.label}</span>
                <span className="text-[12px] type-meta tabular-nums text-text-secondary">
                  {r.known
                    ? over
                      ? `${fmt(r.value - r.limit)} ${r.unit} over`
                      : `${fmt(r.limit - r.value)} ${r.unit} left`
                    : "Not tracked"}
                </span>
              </div>
              <p className="mt-0.5 text-brand-navy">
                <span className="text-[22px] type-numeral tabular-nums">
                  {r.known ? fmt(r.value) : "—"}
                </span>
                <span className="ml-1 text-[12px] text-text-secondary">
                  / {fmt(r.limit)} {r.unit}
                </span>
              </p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-navy-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: over ? "var(--color-error-red)" : r.color,
                  }}
                />
              </div>
              <p className="mt-1 text-[11px] text-text-secondary">
                Limit {fmt(r.limit)} {r.unit}
              </p>
            </li>
          );
        })}
      </ul>
    </WidgetCard>
  );
}

function MedicationWidget({ onHide }: { onHide: () => void }) {
  const { meds } = useMedications();
  const sorted = [...meds].sort((a, b) => a.time.localeCompare(b.time));
  const taken = sorted.filter((m) => m.taken).length;
  return (
    <WidgetCard
      title="Medication"
      icon="medication"
      color="var(--color-brand-navy)"
      subtitle="Taken and still due"
      onHide={onHide}
      action={<Log tab="medication" label="Open medication" />}
      heightClass="h-auto min-h-[8.75rem]"
      className="@5xl:col-span-4"
      stats={[
        { label: "Taken", value: `${taken} of ${sorted.length}` },
        { label: "Still due", value: String(sorted.length - taken) },
      ]}
    >
      {sorted.length === 0 ? (
        <Empty icon="medication">Add a medication to see today’s doses here.</Empty>
      ) : (
        <div className="flex w-full flex-col gap-3">
          <div
            role="img"
            aria-label={`Doses today: ${taken} of ${sorted.length} taken`}
            className="flex gap-1.5"
          >
            {sorted.map((m) => (
              <span
                key={m.id}
                className={cn("h-2 flex-1 rounded-full", m.taken ? "bg-teal-500" : "bg-navy-200")}
              />
            ))}
          </div>
          <ul className="flex flex-col gap-1.5">
            {sorted.map((m) => (
              <li
                key={m.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 rounded-xl border border-border-divider px-3 py-2"
              >
                <span
                  aria-hidden
                  className={cn(
                    "row-span-2 flex size-8 items-center justify-center rounded-full",
                    m.taken ? "bg-teal-500" : "border border-border-default bg-white",
                  )}
                >
                  <Icon
                    name={m.taken ? "tick" : "clock"}
                    size={16}
                    color={m.taken ? "white" : "var(--color-text-secondary)"}
                  />
                </span>
                <span className="min-w-0 truncate text-[13px] type-item-title text-text-primary">
                  {m.name}
                </span>
                <span
                  className={cn(
                    "text-[12px] type-meta tabular-nums",
                    m.taken ? "text-text-secondary" : "text-brand-navy",
                  )}
                >
                  {m.taken ? `Taken · ${m.time}` : `Due · ${m.time}`}
                </span>
                <span className="col-start-2 col-end-4 truncate text-[12px] text-text-secondary">
                  {m.dose}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </WidgetCard>
  );
}

/** The "Overview" block: eyebrow, Customize button and the widget grid. */
export function TrackOverview() {
  const day = useToday();
  const [keys, setKeys] = useVisibleKeys();
  const [open, setOpen] = useState(false);
  const hide = (k: OverviewKey) => setKeys([...keys].filter((x) => x !== k));
  const headingId = useId();
  if (!day) return null;
  const has = (k: OverviewKey) => keys.has(k);
  return (
    <section aria-labelledby={headingId} data-testid="track-overview">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 id={headingId} className="eyebrow text-[12px]">
            Overview
          </h2>
          <p className="mt-1 text-[13px] type-meta text-text-secondary">
            Your daily signals, arranged your way.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Customize overview, ${keys.size} ${keys.size === 1 ? "metric" : "metrics"} shown`}
          className="tap-44 relative flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand-navy px-4 text-[13px] type-button text-white transition-colors hover:bg-primary-hover"
        >
          <Icon name="filterSliders" size={16} color="currentColor" />
          Customize
          <span
            aria-hidden
            className="flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[11px] tabular-nums text-brand-navy"
          >
            {keys.size}
          </span>
        </button>
      </div>
      <div
        aria-label="Today at a glance"
        className="@container mt-3 grid grid-flow-dense grid-cols-1 gap-3 @2xl:grid-cols-2 @5xl:grid-cols-12"
      >
        {has("calories") && <CaloriesByMeal day={day} onHide={() => hide("calories")} />}
        {has("calories") && <CaloriesThroughDay day={day} onHide={() => hide("calories")} />}
        {has("protein") && <Macros day={day} onHide={() => hide("protein")} />}
        {has("water") && <Water day={day} onHide={() => hide("water")} />}
        {has("activity") && <Activity onHide={() => hide("activity")} />}
        {has("limits") && <DailyLimits day={day} onHide={() => hide("limits")} />}
        {has("weight") && <WeightWidget onHide={() => hide("weight")} />}
        {has("medication") && <MedicationWidget onHide={() => hide("medication")} />}
      </div>
      {keys.size === 0 && (
        <p className="mt-3 text-[13px] text-text-secondary">
          Nothing is shown. Tap Customize to bring metrics back.
        </p>
      )}
      {open && <CustomizeDialog keys={keys} onChange={setKeys} onClose={() => setOpen(false)} />}
    </section>
  );
}

function CustomizeDialog({
  keys,
  onChange,
  onClose,
}: {
  keys: Set<OverviewKey>;
  onChange: (next: OverviewKey[]) => void;
  onClose: () => void;
}) {
  const id = useId();
  return (
    <SheetFrame labelledBy={id} onClose={onClose}>
      <div className="flex items-center justify-between pt-4">
        <h2 id={id} className="text-2xl type-section-title text-brand-navy">
          Choose what to show
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-full bg-navy-soft"
        >
          <Icon name="close" size={18} color="currentColor" />
        </button>
      </div>
      <p className="mt-2 text-sm text-text-secondary">
        Pick the cards in your overview. They stay on this device.
      </p>
      <div className="mt-5 space-y-1">
        {OVERVIEW_KEYS.map((k) => {
          const on = keys.has(k);
          return (
            <label
              key={k}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 hover:bg-navy-soft"
            >
              <input
                type="checkbox"
                checked={on}
                disabled={on && keys.size === 1}
                onChange={() => onChange(on ? [...keys].filter((x) => x !== k) : [...keys, k])}
                className="size-5 accent-brand-navy"
              />
              <span className="flex-1 text-sm text-text-primary">{LABEL[k]}</span>
              <Icon name={on ? "eye" : "eyeOff"} size={16} color="var(--color-brand-navy)" />
            </label>
          );
        })}
      </div>
    </SheetFrame>
  );
}
