"use client";

import { useId, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { useActivity, useWeight } from "@/lib/store";
import {
  dayCalories,
  dayProtein,
  dayWaterOz,
  useTrackDays,
  type TrackDay,
  type TrackMeal,
} from "@/lib/track";
import { cn } from "@/lib/utils";
import { SheetFrame, useLogSheet, type LogTab } from "./LogSheet";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/* ----------------------------------------------------------- which widgets */

export const OVERVIEW_KEYS = ["calories", "protein", "water", "activity", "weight"] as const;
export type OverviewKey = (typeof OVERVIEW_KEYS)[number];
const LABEL: Record<OverviewKey, string> = {
  calories: "Calories",
  protein: "Macros",
  water: "Water",
  activity: "Activity",
  weight: "Weight",
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

interface Stat {
  label: string;
  value: string;
  unit?: string;
}

function WidgetCard({
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

function Empty({ children, icon = "plusSign" }: { children: ReactNode; icon?: IconName }) {
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

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
const MEAL_FILL: Record<(typeof MEALS)[number], string> = {
  Breakfast: "var(--color-orange-300)",
  Lunch: "var(--color-accent-graphic)",
  Dinner: "var(--color-orange-800)",
  Snack: "var(--color-orange-900)",
};
const MACRO_FILL = {
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

function Donut({
  parts,
  size = 118,
  thickness = 17,
  children,
}: {
  parts: { key: string; value: number; fill: string }[];
  size?: number;
  thickness?: number;
  children?: ReactNode;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  const segs = parts
    .filter((p) => p.value > 0)
    .reduce<{ key: string; fill: string; len: number; start: number }[]>((out, p) => {
      const start = out.length ? out[out.length - 1].start + out[out.length - 1].len : 0;
      out.push({ key: p.key, fill: p.fill, len: (p.value / total) * c, start });
      return out;
    }, []);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-navy-100)"
          strokeWidth={thickness}
        />
        {segs.map((g) => (
          <circle
            key={g.key}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={g.fill}
            strokeWidth={thickness}
            strokeDasharray={`${Math.max(0, g.len - 2)} ${c}`}
            strokeDashoffset={-g.start}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

function Rings({
  rows,
  size = 138,
}: {
  rows: { key: string; value: number; target: number; fill: string }[];
  size?: number;
}) {
  const stroke = 11;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden>
      {rows.map((row, i) => {
        const r = size / 2 - stroke / 2 - i * (stroke + 4);
        const c = 2 * Math.PI * r;
        const f = row.target > 0 ? Math.min(1, row.value / row.target) : 0;
        return (
          <g key={row.key} transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={row.fill}
              strokeOpacity={0.14}
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={row.fill}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${c * f} ${c}`}
              strokeOpacity={f === 0 ? 0 : 1}
            />
          </g>
        );
      })}
    </svg>
  );
}

const hourOf = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
};
const hourLabel = (h: number) =>
  h === 24 || h === 0 ? "12a" : h === 12 ? "12p" : h < 12 ? `${h}a` : `${h - 12}p`;

/** Running calorie total after each meal, as bars across the day, with the goal line. */
function RunningTotal({ meals, goal }: { meals: TrackMeal[]; goal: number }) {
  const sorted = [...meals].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  const start = 6;
  const end = 21;
  const bars = sorted.reduce<{ t: number; total: number; fill: string }[]>((out, m) => {
    const total = (out.length ? out[out.length - 1].total : 0) + m.calories;
    out.push({
      t: Math.min(end, Math.max(start, hourOf(m.loggedAt))),
      total,
      fill: MEAL_FILL[m.mealType as (typeof MEALS)[number]] ?? MEAL_FILL.Snack,
    });
    return out;
  }, []);
  const run = bars.length ? bars[bars.length - 1].total : 0;
  const max = Math.max(goal, run, 1);
  const W = 100;
  const H = 100;
  const goalY = H - (goal / max) * H;
  const ticks = [0, 1 / 3, 2 / 3, 1].map((f) => Math.round((max * (1 - f)) / 100) * 100);
  return (
    <div className="flex size-full gap-2">
      <div className="relative min-w-0 flex-1">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="size-full" aria-hidden>
          <line
            x1="0"
            x2={W}
            y1={goalY}
            y2={goalY}
            stroke="var(--color-text-neutral-400)"
            strokeDasharray="2 2"
            strokeWidth="0.4"
            vectorEffect="non-scaling-stroke"
          />
          {bars.map((b, i) => {
            const x = ((b.t - start) / (end - start)) * (W - 8);
            const h = (b.total / max) * H;
            return <rect key={i} x={x} y={H - h} width="5" height={h} rx="1" fill={b.fill} />;
          })}
        </svg>
        <span
          className="absolute left-1 text-[10px] text-text-secondary"
          style={{ top: `calc(${(goalY / H) * 100}% - 14px)` }}
        >
          Goal {fmt(goal)} kcal
        </span>
        <div className="absolute inset-x-0 -bottom-4 flex justify-between text-[10px] text-text-secondary">
          {[6, 9, 12, 15, 18, 21].map((h) => (
            <span key={h}>{hourLabel(h)}</span>
          ))}
        </div>
      </div>
      <div className="flex flex-col justify-between pb-0.5 text-[10px] tabular-nums text-text-secondary">
        {ticks.map((t, i) => (
          <span key={i}>{t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t}</span>
        ))}
      </div>
    </div>
  );
}

function Line({ values, labels }: { values: (number | null)[]; labels: string[] }) {
  const pts = values.map((v, i) => (v === null ? null : { i, v }));
  const real = pts.filter((p): p is { i: number; v: number } => p !== null);
  if (real.length === 0) return null;
  const min = Math.min(...real.map((p) => p.v));
  const max = Math.max(...real.map((p) => p.v));
  const span = Math.max(0.5, max - min);
  const W = 100;
  const H = 60;
  const x = (i: number) => 3 + (i / Math.max(1, values.length - 1)) * (W - 6);
  const y = (v: number) => 6 + (1 - (v - min) / span) * (H - 14);
  const avg = real.reduce((s, p) => s + p.v, 0) / real.length;
  return (
    <div className="flex size-full flex-col">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="min-h-0 flex-1"
        aria-hidden
      >
        <line
          x1="0"
          x2={W}
          y1={y(avg)}
          y2={y(avg)}
          stroke="var(--color-navy-300)"
          strokeDasharray="2 2"
          strokeWidth="0.4"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          fill="none"
          stroke="var(--color-brand-navy)"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          points={real.map((p) => `${x(p.i)},${y(p.v)}`).join(" ")}
        />
        {real.map((p) => (
          <circle
            key={p.i}
            cx={x(p.i)}
            cy={y(p.v)}
            r="1.6"
            fill="white"
            stroke="var(--color-brand-navy)"
            strokeWidth="0.9"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-text-secondary">
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function Pie({ slices }: { slices: { key: string; value: number; fill: string }[] }) {
  const total = slices.reduce((s, p) => s + p.value, 0) || 1;
  const arcs = slices.reduce<{ key: string; fill: string; a0: number; a1: number }[]>((out, sl) => {
    const a0 = out.length ? out[out.length - 1].a1 : -Math.PI / 2;
    out.push({ key: sl.key, fill: sl.fill, a0, a1: a0 + (sl.value / total) * Math.PI * 2 });
    return out;
  }, []);
  return (
    <svg viewBox="-60 -60 120 120" className="size-[120px] shrink-0" aria-hidden>
      {arcs.map((g) => {
        const large = g.a1 - g.a0 > Math.PI ? 1 : 0;
        const d =
          arcs.length === 1
            ? "M0 -56a56 56 0 1 1 0 112a56 56 0 1 1 0 -112Z"
            : `M0 0L${56 * Math.cos(g.a0)} ${56 * Math.sin(g.a0)}A56 56 0 ${large} 1 ${56 * Math.cos(g.a1)} ${56 * Math.sin(g.a1)}Z`;
        return <path key={g.key} d={d} fill={g.fill} stroke="white" strokeWidth="2" />;
      })}
    </svg>
  );
}

/* --------------------------------------------------------------- the grid */

function useToday(): TrackDay | undefined {
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
            <Donut parts={parts} size={118} thickness={17}>
              <span className="text-[22px] leading-none type-row-figure tabular-nums text-brand-navy">
                {fmt(eaten)}
              </span>
              <span className="text-[11px] text-text-secondary">kcal</span>
            </Donut>
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
        <RunningTotal meals={day.meals} goal={day.calorieGoal} />
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
        <Rings rows={rows} size={138} />
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
  const r = 44;
  const c = 2 * Math.PI * r;
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
        <svg
          viewBox="0 0 104 104"
          className="size-[104px]"
          aria-label={`Water today: ${fmt(oz)} of ${fmt(goal)} ounces`}
          role="img"
        >
          <circle
            cx="52"
            cy="52"
            r={r}
            fill="none"
            stroke="var(--color-teal-200)"
            strokeWidth="10"
          />
          <circle
            cx="52"
            cy="52"
            r={r}
            fill="none"
            stroke="var(--color-graphic)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(c * pct) / 100} ${c}`}
            transform="rotate(-90 52 52)"
          />
        </svg>
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
  const total = slices.reduce((s, x) => s + x.value, 0);
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
        <div className="flex size-full items-center justify-center gap-6">
          <Pie slices={slices} />
          <ul className="min-w-0 space-y-1.5 text-[12px]">
            {slices.map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: s.fill }}
                />
                <span className="min-w-0 flex-1 truncate text-text-primary">{s.name}</span>
                <span className="shrink-0 tabular-nums text-text-secondary">
                  {s.value} min · {Math.round((s.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
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
        <Line values={days.map((d) => d.v)} labels={days.map((d) => d.label)} />
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
        {has("weight") && <WeightWidget onHide={() => hide("weight")} />}
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
