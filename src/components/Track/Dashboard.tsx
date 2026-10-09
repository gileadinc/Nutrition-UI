"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { CheckMark } from "@/components/Layout";
import { Link, useSearchParams } from "@/lib/nav";
import { useNow } from "@/lib/hooks";
import { SegmentedRing } from "@/components/Charts";
import { MEAL_TYPES, mealApi, type MealLabel } from "@/lib/nutrition";
import {
  MEAL_COLOR,
  dayCalories,
  dayProtein,
  type TrackDay,
  type TrackMeal,
} from "@/lib/track";
import { META_TEXT, PAGE_TITLE, SELECTED_CHIP } from "@/components/styles";

export const EYEBROW = "text-[17px] type-eyebrow uppercase tracking-[0.06em]";
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/* ------------------------------------------------------- Today / Insights */

const VIEWS = [
  { id: "today", label: "Today", to: "/track" },
  { id: "insights", label: "Insights", to: "/track/insights" },
];

export function TrackSwitch({ current }: { current: "today" | "insights" }) {
  return (
    <nav
      aria-label="Track view"
      className="flex shrink-0 self-start rounded-full bg-brand-warm-gray p-1"
    >
      {VIEWS.map((v) =>
        v.id === current ? (
          <span
            key={v.id}
            aria-current="page"
            className={cn(
              "flex h-11 items-center gap-1.5 rounded-full px-4 text-[17px] type-button",
              SELECTED_CHIP,
            )}
          >
            <CheckMark size={13} />
            {v.label}
          </span>
        ) : (
          <Link
            key={v.id}
            to={v.to}
            className="flex h-11 items-center rounded-full px-4 text-[17px] type-button-secondary text-text-secondary hover:text-text-primary"
          >
            {v.label}
          </Link>
        ),
      )}
    </nav>
  );
}

export function TrackHeader({
  greeting,
  firstName,
  longDate,
  goalLabel,
}: {
  greeting: string;
  firstName: string | null;
  longDate: string;
  goalLabel: string | null;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className={PAGE_TITLE}>
          {greeting}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className={cn(META_TEXT, "flex flex-wrap items-center gap-x-1.5")}>
          <span>{longDate}</span>
          <span aria-hidden="true" className="text-text-neutral-400">
            ·
          </span>
          <Link
            to={`/questionnaire?step=goal&returnTo=${encodeURIComponent("/track")}`}
            aria-label={`Goal: ${goalLabel ?? "not set"}. Edit Goal`}
            className="inline-flex min-h-11 items-center gap-1 type-button text-text-primary underline-offset-2 hover:underline"
          >
            <Icon name="target" size={14} color="var(--color-primary)" />
            {goalLabel ?? "Set a goal"}
            <Icon name="chevronRight" size={12} color="var(--color-text-neutral-400)" />
          </Link>
        </p>
      </div>
      <TrackSwitch current="today" />
    </header>
  );
}

export function TrackSection({
  id,
  title,
  titleClassName,
  srOnlyTitle = false,
  className,
  children,
}: {
  id: string;
  title: string;
  titleClassName?: string;
  srOnlyTitle?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={cn("border-t border-border-divider pt-5", className)}>
      <h2
        id={id}
        className={
          srOnlyTitle ? "sr-only" : (titleClassName ?? cn(EYEBROW, "text-brand-navy"))
        }
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ---------------------------------------------------------------- Rings */

export interface Reading {
  eaten: number;
  goal: number;
}

export interface MealTotal {
  meal: MealLabel;
  kcal: number;
  logged: boolean;
  color: string;
}

export function mealTotals(day: TrackDay): MealTotal[] {
  return MEAL_TYPES.map((meal) => {
    const list = day.meals.filter((m) => m.mealType === meal);
    return {
      meal,
      kcal: list.reduce((s, m) => s + m.calories, 0),
      logged: list.length > 0,
      color: MEAL_COLOR[meal],
    };
  });
}

function RingCard({
  title,
  titleClassName,
  unit,
  reading,
  parts,
  label,
}: {
  title: string;
  titleClassName: string;
  unit: string;
  reading: Reading;
  parts: { key: string; value: number; color: string }[];
  label: string;
}) {
  return (
    <Link
      to="/track/log-meal"
      className="flex min-w-0 flex-col items-center gap-3 rounded-2xl px-1 py-3 transition-colors hover:bg-navy-soft"
    >
      <span aria-hidden="true" className={cn(EYEBROW, titleClassName)}>
        {title}
      </span>
      <SegmentedRing
        parts={parts}
        goal={reading.goal}
        size={176}
        stroke={14}
        trackColor="var(--color-border-divider)"
        label={label}
        fluid
      >
        <span
          data-slot="ring-numeral"
          className="type-numeral leading-none text-text-primary text-onb-display md:text-onb-display-lg"
        >
          {fmt(reading.eaten)}
        </span>
        <span data-slot="ring-goal" className="mt-1.5 text-[18px] type-unit text-text-secondary">
          of {fmt(reading.goal)} {unit}
        </span>
      </SegmentedRing>
      <span className="sr-only">Log a meal</span>
    </Link>
  );
}

function MealKey({ color, logged }: { color: string; logged: boolean }) {
  return logged ? (
    <span aria-hidden="true" className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: color }} />
  ) : (
    <span
      aria-hidden="true"
      className="size-2.5 shrink-0 rounded-full border-[1.5px] border-text-neutral-400"
    />
  );
}

export function TodayRings({
  calories,
  protein,
  meals,
}: {
  calories: Reading;
  protein: Reading;
  meals: MealTotal[];
}) {
  const none = meals.every((m) => !m.logged);
  const byMeal =
    meals
      .map((m, i) => {
        const n = i === 0 ? m.meal : m.meal.toLowerCase();
        return m.logged ? `${n} ${fmt(m.kcal)}` : `${n} not logged`;
      })
      .join(", ") + ".";
  const calLabel = `Calories: ${fmt(calories.eaten)} of ${fmt(calories.goal)} kcal today. ${none ? "No meals logged yet." : byMeal}`;
  const proLabel = `Protein: ${fmt(protein.eaten)} of ${fmt(protein.goal)} g today.`;
  return (
    <div className="flex flex-col gap-3">
      <div data-slot="today-rings" className="grid grid-cols-2 gap-3 sm:gap-8">
        <RingCard
          title="Calories"
          titleClassName="text-accent-ink"
          unit="kcal"
          reading={calories}
          parts={meals.map((m) => ({ key: m.meal, value: m.kcal, color: m.color }))}
          label={calLabel}
        />
        <RingCard
          title="Protein"
          titleClassName="text-brand-navy"
          unit="g"
          reading={protein}
          parts={[{ key: "Protein", value: protein.eaten, color: "var(--color-graphic)" }]}
          label={proLabel}
        />
      </div>
      <ul
        aria-label="Calories by meal"
        className="grid grid-cols-2 gap-x-4 border-y border-border-divider sm:grid-cols-4"
      >
        {meals.map((m) => (
          <li key={m.meal} data-meal={m.meal} className="min-w-0">
            <Link
              to="/track/log-meal"
              aria-label={`${m.meal}: ${m.logged ? `${fmt(m.kcal)} kcal` : "not logged"}. Log a meal`}
              className="flex min-h-11 items-center gap-2 px-1 transition-colors hover:bg-navy-soft"
            >
              <MealKey color={m.color} logged={m.logged} />
              <span className="min-w-0 flex-1 truncate text-[17px] type-meta text-text-secondary">
                {m.meal}
              </span>
              <span
                className={cn(
                  "shrink-0 text-[17px] tabular-nums",
                  m.logged
                    ? "type-row-figure text-text-primary"
                    : "type-meta text-text-neutral-500",
                )}
              >
                {m.logged ? fmt(m.kcal) : "—"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {none && (
        <Link
          to="/track/log-meal"
          className="inline-flex min-h-11 items-center gap-1 self-start text-[17px] type-button text-brand-navy underline-offset-2 hover:underline"
        >
          Log a meal to start today’s ring
          <Icon name="chevronRight" size={13} color="currentColor" />
        </Link>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- Week chart */

export interface WeekDay {
  date: string;
  weekday: string;
  long: string;
  isToday: boolean;
  logged: boolean;
  calories: number;
  protein: number;
  calorieGoal: number;
  proteinGoal: number;
}

export function toWeek(days: TrackDay[], todayKey: string): WeekDay[] {
  return days.map((d) => {
    const dt = new Date(`${d.date}T12:00:00`);
    return {
      date: d.date,
      weekday: dt.toLocaleDateString("en-US", { weekday: "short" }),
      long: dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      isToday: d.date === todayKey,
      logged: d.meals.length > 0,
      calories: dayCalories(d),
      protein: dayProtein(d),
      calorieGoal: d.calorieGoal,
      proteinGoal: d.proteinGoal,
    };
  });
}

const METRICS = [
  { id: "Calories", unit: "kcal", param: null as string | null },
  { id: "Protein", unit: "g", param: "protein" },
];
const COLORS = {
  Calories: { today: "var(--color-accent-graphic)", other: "var(--color-orange-300)" },
  Protein: { today: "var(--color-graphic)", other: "var(--color-teal-300)" },
};
const CHART_H = 120;

export function WeekChart({
  week,
  title,
  headingId,
}: {
  week: WeekDay[];
  title: string;
  headingId: string;
}) {
  const [params, setParams] = useSearchParams();
  const metric = params.get("week") === "protein" ? "Protein" : "Calories";
  const setMetric = (id: string) => {
    const next = new URLSearchParams(params);
    const p = METRICS.find((m) => m.id === id)!.param;
    if (p) next.set("week", p);
    else next.delete("week");
    setParams(next, { replace: true });
  };
  const unit = METRICS.find((m) => m.id === metric)!.unit;
  const colors = COLORS[metric];
  const val = (d: WeekDay) => (metric === "Calories" ? d.calories : d.protein);
  const goalOf = (d: WeekDay) => (metric === "Calories" ? d.calorieGoal : d.proteinGoal);
  const todayIdx = Math.max(0, week.findIndex((d) => d.isToday));
  const goal = goalOf(week[todayIdx] ?? week[week.length - 1]);
  const logged = week.filter((d) => d.logged);
  const avg = logged.length ? logged.reduce((s, d) => s + val(d), 0) / logged.length : 0;
  const max = Math.max(goal, ...logged.map(val), 1) * 1.1;
  const href = `/track/insights?metric=${metric}`;
  const [hover, setHover] = useState<number | null>(null);
  const [focusIdx, setFocusIdx] = useState(todayIdx);
  const box = useRef<HTMLDivElement>(null);
  const cur = week[hover ?? todayIdx];
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const last = week.length - 1;
    const to =
      e.key === "ArrowRight"
        ? Math.min(last, i + 1)
        : e.key === "ArrowLeft"
          ? Math.max(0, i - 1)
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (to !== null) {
      e.preventDefault();
      setFocusIdx(to);
      box.current?.querySelectorAll<HTMLElement>("[data-day]")[to]?.focus();
    }
  };
  const dayLabel = (d: WeekDay) =>
    `${d.long}: ${d.logged ? `${fmt(val(d))} ${unit}, goal ${fmt(goalOf(d))}` : "not logged"}. Open ${metric} in Insights`;
  const caption = logged.length
    ? `Avg ${fmt(avg)} ${unit}/day · ${logged.length} of ${week.length} days logged`
    : `No meals logged in the last ${week.length} days`;
  const group =
    `${metric}, last ${week.length} days. ` +
    (logged.length
      ? `Average ${fmt(avg)} ${unit} a day over ${logged.length} logged ${logged.length === 1 ? "day" : "days"}. `
      : "Nothing logged. ") +
    `Goal ${fmt(goal)} ${unit}. Arrow keys move between days.`;
  return (
    <section aria-labelledby={headingId} className="border-t border-border-divider pt-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id={headingId} className={cn(EYEBROW, "min-w-0 whitespace-nowrap text-brand-navy")}>
          {title}
        </h2>
        <div
          role="group"
          aria-label="Chart shows"
          className="flex shrink-0 rounded-full bg-brand-warm-gray p-1"
        >
          {METRICS.map((m) => {
            const on = m.id === metric;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={on}
                onClick={() => setMetric(m.id)}
                className={cn(
                  "flex h-11 items-center gap-1.5 rounded-full px-3 text-[17px] transition-colors",
                  on
                    ? cn("type-button", SELECTED_CHIP)
                    : "type-button-secondary text-text-secondary hover:text-text-primary",
                )}
              >
                {on && <CheckMark size={13} />}
                {m.id}
              </button>
            );
          })}
        </div>
      </div>
      <div
        aria-hidden="true"
        className="mt-3 flex items-center justify-between gap-3 text-[17px] type-meta"
      >
        <span data-slot="week-readout" className="min-w-0 truncate text-text-secondary">
          <span className="type-item-title text-text-primary">{cur.isToday ? "Today" : cur.long}</span>
          {" · "}
          {cur.logged ? (
            <>
              <span className="type-row-figure tabular-nums text-text-primary">{fmt(val(cur))}</span>{" "}
              {unit} · goal {fmt(goalOf(cur))}
            </>
          ) : (
            "not logged"
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-text-secondary">
          <span className="w-4 border-t-2 border-dashed border-text-secondary" />
          Goal
        </span>
      </div>
      <div
        role="group"
        aria-label={group}
        data-slot="week-chart"
        ref={box}
        className="relative mt-2"
        onMouseLeave={() => setHover(null)}
      >
        <span
          aria-hidden="true"
          data-slot="week-goal"
          className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-text-secondary"
          style={{ top: CHART_H - (goal / max) * CHART_H }}
        />
        <div className="flex">
          {week.map((d, i) => (
            <Link
              key={d.date}
              to={href}
              tabIndex={i === focusIdx ? 0 : -1}
              aria-label={dayLabel(d)}
              data-day={d.date}
              data-logged={d.logged}
              onMouseEnter={() => setHover(i)}
              onFocus={() => {
                setHover(i);
                setFocusIdx(i);
              }}
              onBlur={() => setHover(null)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center rounded-lg transition-colors",
                hover === i && "bg-navy-soft",
              )}
            >
              <span
                className="flex w-full items-end justify-center border-b border-border-divider"
                style={{ height: CHART_H }}
              >
                {d.logged ? (
                  <span
                    data-slot="week-bar"
                    className="w-full max-w-6 rounded-t-[4px] motion-safe:transition-[height] motion-safe:duration-500"
                    style={{
                      height: Math.max(2, (val(d) / max) * CHART_H),
                      backgroundColor: d.isToday ? colors.today : colors.other,
                    }}
                  />
                ) : (
                  <span
                    data-slot="week-empty"
                    className="mb-1 size-2 rounded-full border-[1.5px] border-text-neutral-400"
                  />
                )}
              </span>
              <span
                className={cn(
                  "py-1.5 text-[17px] leading-5",
                  d.isToday
                    ? "type-item-title text-text-primary"
                    : d.logged
                      ? "type-meta text-text-secondary"
                      : "type-meta text-text-neutral-500",
                )}
              >
                {d.weekday}
              </span>
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3">
        <p data-slot="week-caption" className="text-[17px] type-meta text-text-secondary">
          {caption}
        </p>
        <Link
          to={href}
          className="inline-flex min-h-11 items-center gap-1 text-[17px] type-button text-brand-navy underline-offset-2 hover:underline"
        >
          See insights
          <Icon name="chevronRight" size={13} color="currentColor" />
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Also today */

export interface SecondaryMetric {
  key: string;
  label: string;
  icon: IconName;
  value: string;
  unit: string;
  goal: string;
  spoken: string;
  to: string;
  progress: { value: number; goal: number };
  onQuick?: () => void;
  quickLabel?: string;
  quickText?: string;
}

export function AlsoToday({ metrics }: { metrics: SecondaryMetric[] }) {
  return (
    <ul
      data-slot="also-today"
      className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] gap-x-2 divide-y divide-border-divider border-y border-border-divider min-[360px]:gap-x-3"
    >
      {metrics.map((m) => {
        const pct = m.progress.goal > 0 ? Math.min(100, Math.max(0, (m.progress.value / m.progress.goal) * 100)) : 0;
        return (
          <li
            key={m.key}
            data-metric={m.key}
            className="col-span-4 grid grid-cols-subgrid items-center gap-x-2 min-[360px]:gap-x-3"
          >
            <Link
              to={m.to}
              aria-label={m.spoken}
              className={cn(
                "grid grid-cols-subgrid items-center gap-x-2 gap-y-1.5 py-3 transition-colors hover:bg-navy-soft min-[360px]:gap-x-3",
                m.onQuick ? "col-span-3" : "col-span-4",
              )}
            >
              <span className="col-start-1 flex max-[359px]:hidden">
                <Icon name={m.icon} size={16} color="var(--color-brand-navy)" />
              </span>
              <span className="col-start-2 min-w-0 truncate text-[17px] type-item-title text-text-primary">
                {m.label}
              </span>
              <span className="col-start-3 flex items-baseline gap-1 justify-self-end whitespace-nowrap">
                <span className="text-[21px] type-row-figure leading-6 tracking-[-0.2px] tabular-nums text-text-primary">
                  {m.value}
                </span>
                <span className="text-[17px] type-meta text-text-primary">{m.unit}</span>
                <span className="text-[17px] type-meta tabular-nums text-text-neutral-500">{m.goal}</span>
              </span>
              {!m.onQuick && (
                <span className="col-start-4 row-span-2 flex items-center justify-self-end">
                  <Icon name="chevronRight" size={14} color="var(--color-text-neutral-400)" />
                </span>
              )}
              <span className="col-span-2 col-start-2 min-w-0">
                <span
                  aria-hidden="true"
                  data-slot="metric-progress"
                  className="block h-1 w-full overflow-hidden rounded-full bg-brand-warm-gray"
                >
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: "var(--color-graphic)" }}
                  />
                </span>
              </span>
            </Link>
            {m.onQuick && (
              <span className="flex justify-end">
                <button
                  type="button"
                  aria-label={m.quickLabel}
                  onClick={m.onQuick}
                  className="tap-44 relative inline-flex h-8 items-center justify-center whitespace-nowrap rounded-full bg-brand-teal-soft px-3 text-[17px] type-button text-brand-navy transition-colors hover:bg-teal-100"
                >
                  {m.quickText ?? "+8 oz"}
                </button>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------ Today log */

const ADD_ID = (k: string) => `today-log-add-${k}`;
const focusAfter = (k: string) =>
  requestAnimationFrame(() => {
    (document.getElementById(ADD_ID(k)) ?? document.getElementById("today-log-heading"))?.focus();
  });
const LINK_BTN =
  "tap-44 relative inline-flex min-h-6 items-center gap-1 text-[17px] type-button text-brand-navy underline-offset-2 hover:underline";

function LogGroup({
  keyName,
  title,
  dot,
  entries,
  openId,
  onToggle,
  onRemove,
}: {
  keyName: string;
  title: string;
  dot: string;
  entries: TrackMeal[];
  openId: string | null;
  onToggle: (id: string) => void;
  onRemove: (m: TrackMeal) => void;
}) {
  const kcal = entries.reduce((s, m) => s + m.calories, 0);
  const prot = entries.reduce((s, m) => s + m.protein, 0);
  const sorted = [...entries].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  return (
    <li data-group={keyName} className="pt-4 first:pt-1">
      <div className="flex min-h-8 items-center gap-2">
        <span
          aria-hidden="true"
          data-slot="group-dot"
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: dot }}
        />
        <h3 data-slot="group-title" className="min-w-0 flex-1 truncate text-[17px] type-section-title text-text-secondary">
          {title === "Snack" ? "Snacks" : title}
          <span className="sr-only">
            : {fmt(kcal)} kcal, {prot} g protein
          </span>
        </h3>
        {entries.length > 1 && (
          <span
            aria-hidden="true"
            data-slot="group-subtotal"
            className="shrink-0 text-[17px] type-meta tabular-nums text-text-secondary"
          >
            {fmt(kcal)} kcal
          </span>
        )}
        <Link
          id={ADD_ID(keyName)}
          to={`/track/log-meal?meal=${keyName}`}
          aria-label={`Add ${keyName}`}
          className="tap-44 relative flex size-6 shrink-0 items-center justify-center rounded-full text-brand-navy transition-colors hover:bg-navy-soft"
        >
          <Icon name="plusSign" size={14} color="currentColor" />
        </Link>
      </div>
      <ul className="divide-y divide-border-divider">
        {sorted.map((m) => {
          const open = openId === m.id;
          const detailId = `today-log-entry-${m.id}`;
          return (
            <li key={m.id} data-entry={m.id}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={open ? detailId : undefined}
                aria-label={`${m.title}, ${fmt(m.calories)} kcal, ${timeOf(m.loggedAt)}`}
                onClick={() => onToggle(m.id)}
                className="flex min-h-11 w-full items-center gap-2 py-2 text-left transition-colors hover:bg-navy-soft"
              >
                <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
                  <span data-slot="entry-title" className="truncate text-[17px] type-item-title text-text-primary">
                    {m.title}
                  </span>
                </span>
                <span
                  data-slot="entry-figure"
                  className="shrink-0 text-[17px] type-row-figure tabular-nums text-text-primary"
                >
                  {fmt(m.calories)} kcal
                </span>
                <span className="flex w-6 shrink-0 justify-center">
                  <Icon
                    name="arrowDownSmall"
                    size={14}
                    color="var(--color-text-neutral-400)"
                    className={cn("transition-transform duration-200", open && "rotate-180")}
                  />
                </span>
              </button>
              {open && (
                <div id={detailId} data-slot="entry-details" className="flex min-h-11 items-center gap-3 pb-2">
                  <span className="min-w-0 flex-1 text-[17px] type-meta tabular-nums text-text-secondary">
                    {timeOf(m.loggedAt)} · {m.protein} g protein
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${m.title}, ${timeOf(m.loggedAt)}`}
                    onClick={() => onRemove(m)}
                    className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-[17px] type-button-secondary text-text-secondary transition-colors hover:bg-brand-warm-gray hover:text-text-primary"
                  >
                    <Icon name="trash" size={14} color="currentColor" />
                    Remove
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </li>
  );
}

export function TodayLog({
  day,
  title = "Today's log",
  titleClassName,
  history,
  onRemoveMeal,
}: {
  day: TrackDay;
  title?: string;
  titleClassName?: string;
  history?: { label: string; to: string };
  /** Resolves after the guest gate; returns void. */
  onRemoveMeal: (m: TrackMeal) => void;
}) {
  const now = useNow(60_000);
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId((c) => (c === id ? null : id));
  const groups = MEAL_TYPES.map((meal) => ({
    meal,
    entries: day.meals.filter((m) => m.mealType === meal),
  }));
  const logged = groups.filter((g) => g.entries.length > 0);
  const empty = groups.filter((g) => g.entries.length === 0).map((g) => g.meal);
  const h = now.getHours();
  const suggested = h < 11 ? "Breakfast" : h < 16 ? "Lunch" : h < 21 ? "Dinner" : "Snack";
  const remove = (m: TrackMeal) => {
    onRemoveMeal(m);
    focusAfter(mealApi(m.mealType));
  };
  return (
    <section aria-labelledby="today-log-heading" data-slot="today-log">
      <div className="flex min-h-11 items-center gap-3">
        <h2 id="today-log-heading" tabIndex={-1} className={cn(titleClassName, "min-w-0 flex-1 outline-none")}>
          {title}
        </h2>
        {history && (
          <Link
            to={history.to}
            className="inline-flex min-h-9 shrink-0 items-center gap-0.5 rounded-full border border-border-default bg-white px-3 text-[17px] type-button text-primary hover:border-text-neutral-400"
          >
            {history.label}
            <Icon name="chevronRight" size={14} color="var(--color-primary)" />
          </Link>
        )}
      </div>
      {logged.length === 0 ? (
        <div data-slot="log-empty" className="flex flex-col items-start gap-2 pt-1">
          <p className="text-[17px] type-meta text-text-secondary">Nothing logged yet today.</p>
          <Link
            id={ADD_ID(suggested.toLowerCase())}
            to={`/track/log-meal?meal=${suggested.toLowerCase()}`}
            className={LINK_BTN}
          >
            <Icon name="plusSign" size={12} color="currentColor" />
            Add {suggested.toLowerCase()}
          </Link>
        </div>
      ) : (
        <>
          <ol className="flex flex-col">
            {logged.map((g) => (
              <LogGroup
                key={g.meal}
                keyName={g.meal.toLowerCase()}
                title={g.meal}
                dot={MEAL_COLOR[g.meal]}
                entries={g.entries}
                openId={openId}
                onToggle={toggle}
                onRemove={remove}
              />
            ))}
          </ol>
          {empty.length > 0 && (
            <p data-slot="log-add-more" className="flex min-h-11 flex-wrap items-center gap-x-2 py-1">
              <Icon name="plusSign" size={12} color="var(--color-brand-navy)" />
              {empty.map((m, i) => (
                <span key={m} className="inline-flex items-center gap-2">
                  {i > 0 && (
                    <span aria-hidden="true" className="type-meta text-text-neutral-400">
                      ·
                    </span>
                  )}
                  <Link id={ADD_ID(m.toLowerCase())} to={`/track/log-meal?meal=${m.toLowerCase()}`} className={LINK_BTN}>
                    Add {m.toLowerCase()}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </>
      )}
    </section>
  );
}
