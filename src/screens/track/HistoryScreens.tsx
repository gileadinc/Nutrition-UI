"use client";

import { lockBodyScroll } from "@/lib/hooks/scrollLock";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { CheckMark, PageContainer, TwoColumn } from "@/components/Layout";
import { PrimaryButton } from "@/components/Button";
import { AdvancedFilters, FacetGroup } from "@/components/Filters";
import { MacroDonut, MiniRing } from "@/components/Charts";
import { TrackSwitch } from "@/components/Track/Dashboard";
import {
  BigNumber,
  DeltaPill,
  MetricCard,
  MetricChart,
  shortDate,
} from "@/components/Track/MetricCharts";
import { Link, useBack, useNavigate, useSearchParams } from "@/lib/nav";
import { useFilterParams } from "@/lib/hooks";
import { isoDate } from "@/lib/nutrition";
import {
  MEAL_COLOR,
  TRACK_METRICS,
  dayCalories,
  dayLogged,
  dayProtein,
  dayWaterOz,
  metricAverage,
  metricByLabel,
  shiftDate,
  useTrackDays,
  type TrackDay,
  type TrackMetric,
} from "@/lib/track";
import { MEAL_TYPES } from "@/lib/nutrition";
import { doseStatus, useMedications, type Medication } from "@/lib/store";
import { META_TEXT, PAGE_TITLE, SECTION_TITLE, SELECTED_CHIP } from "@/components/styles";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const pct = (a: number, b: number) => (b === 0 ? 0 : (a / b) * 100);
const mdOf = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

/* ---------------------------------------------------------- CategoryBar */

interface Segment {
  key: string;
  label: string;
  color: string;
  value: number;
}

function CategoryBar({
  title,
  total,
  unit,
  caption,
  segments,
}: {
  title: string;
  total: number;
  unit: string;
  caption?: string;
  segments: Segment[];
}) {
  const [hot, setHot] = useState<string | null>(null);
  const live = segments.filter((s) => s.value > 0);
  const sum = live.reduce((s, x) => s + x.value, 0);
  const share = (v: number) => (sum === 0 ? 0 : Math.round((v / sum) * 100));
  const biggest = live.reduce<Segment | undefined>((a, s) => (!a || s.value > a.value ? s : a), undefined);
  const active = live.find((s) => s.key === hot) ?? biggest;
  const aria = `${title}: ${live.map((s) => `${s.label} ${fmt(s.value)} ${unit}, ${share(s.value)}%`).join("; ")}.`;
  return (
    <section
      aria-label={title}
      data-slot="category-bar"
      className="flex h-full min-w-0 flex-col rounded-[18px] border border-border-default bg-white p-4 shadow-card"
    >
      <h3 className="text-[17px] type-item-title tracking-[-0.585px] text-text-neutral-500">{title}</h3>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-[30px] type-numeral leading-none tabular-nums tracking-[-1.1px] text-text-primary">
          {fmt(total)}
        </span>
        <span className="text-xs type-meta text-text-secondary">{unit}</span>
        {caption && <span className="text-[15px] type-meta text-text-neutral-500">{caption}</span>}
      </p>
      {sum === 0 ? (
        <p className="mt-4 text-[17px] type-meta text-text-secondary">Nothing logged in this range.</p>
      ) : (
        <>
          <p aria-hidden="true" className="mt-4 h-4 truncate text-[15px] type-meta text-text-secondary">
            {active && (
              <>
                {active.label} ·{" "}
                <span className="tabular-nums text-text-primary">
                  {fmt(active.value)} {unit}
                </span>{" "}
                · {share(active.value)}%
              </>
            )}
          </p>
          <div
            role="img"
            aria-label={aria}
            className="mt-1.5 flex h-[34px] gap-1"
            onMouseLeave={() => setHot(null)}
          >
            {live.map((s) => (
              <span
                key={s.key}
                onMouseEnter={() => setHot(s.key)}
                className="h-full min-w-1.5 rounded-[6px] motion-safe:transition-[width,opacity] motion-safe:duration-500 motion-safe:ease-out"
                style={{
                  width: `${(s.value / sum) * 100}%`,
                  backgroundColor: s.color,
                  opacity: hot === null || hot === s.key ? 1 : 0.4,
                }}
              />
            ))}
          </div>
          <ul className="mt-3 grid gap-y-1.5">
            {live.map((s) => (
              <li
                key={s.key}
                onMouseEnter={() => setHot(s.key)}
                onMouseLeave={() => setHot(null)}
                className="flex min-w-0 items-center gap-1.5"
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: s.color }}
                />
                <span className="min-w-0 flex-1 truncate text-[15px] type-meta text-text-secondary">
                  {s.label}
                </span>
                <span className="text-[15px] type-meta tabular-nums text-text-primary">
                  {fmt(s.value)} · {share(s.value)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/* -------------------------------------------------------- InsightsPanel */

interface Insight {
  id: string;
  title: string;
  detail: string;
  tone: "good" | "note" | "watch";
  action?: { label: string; to: string };
}

function InsightsPanel({ insights, title }: { insights: Insight[]; title: string }) {
  if (insights.length === 0)
    return (
      <section aria-label={title} className="panel px-4 pb-4 pt-4">
        <h2 className="eyebrow">{title}</h2>
        <p className="mt-2 text-[17px] type-meta leading-5 text-text-secondary">
          Nothing to read into yet. Log a meal or some water and what stands out will show up here.
        </p>
      </section>
    );
  const watch = insights.filter((i) => i.tone === "watch").length;
  return (
    <section aria-label={title} className="panel px-4 pb-2 pt-4">
      <div className="flex items-baseline gap-2">
        <h2 className="eyebrow flex-1">{title}</h2>
        <span className="text-[15px] type-meta text-text-secondary">
          {watch === 0 ? "All on track" : `${watch} to look at`}
        </span>
      </div>
      <ul className="mt-1 divide-y divide-border-divider">
        {insights.map((i) => (
          <li key={i.id} className="flex gap-3 py-3">
            <span
              aria-hidden="true"
              className={cn(
                "mt-[7px] size-2 shrink-0 rounded-full",
                i.tone === "good" ? "bg-graphic" : i.tone === "note" ? "bg-border-default" : "bg-primary",
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[17px] type-item-title leading-5 text-text-primary">{i.title}</p>
              <p className="mt-0.5 text-[16px] type-meta leading-[22px] text-text-secondary">{i.detail}</p>
              {i.action && (
                <Link
                  to={i.action.to}
                  className="tap-24 tap-44 relative mt-0.5 gap-0.5 text-[16px] type-button text-primary"
                >
                  {i.action.label}
                  <Icon name="chevronRight" size={12} color="var(--color-primary)" />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function buildInsights(days: TrackDay[], medHistory: { date: string; meds: Medication[] }[]): Insight[] {
  const out = buildNutritionInsights(days);
  const dates = new Set(days.map((d) => d.date));
  const todayIso = isoDate(new Date());
  let unlogged = 0;
  for (const h of medHistory) {
    if (!dates.has(h.date)) continue;
    for (const m of h.meds) {
      if (m.taken) continue;
      if (h.date !== todayIso || doseStatus(m) === "Missed") unlogged += 1;
    }
  }
  if (unlogged > 0)
    out.push({
      id: "medication",
      title: `${unlogged} ${unlogged === 1 ? "dose" : "doses"} went unlogged`,
      detail: "Adherence is the one signal here where a gap in the log is a gap in the record.",
      tone: "watch",
      action: { label: "Review medication", to: "/track/medication" },
    });
  return out;
}

function buildNutritionInsights(days: TrackDay[]): Insight[] {
  const logged = days.filter(dayLogged);
  if (logged.length === 0) return [];
  const out: Insight[] = [];
  const share = pct(logged.length, days.length);
  if (days.length > 1)
    out.push(
      share >= 80
        ? {
            id: "consistency",
            title: `You logged ${logged.length} of ${days.length} days`,
            detail: "Enough of the period is covered for the rest of this to mean something.",
            tone: "good",
          }
        : {
            id: "consistency",
            title: `Logged on ${logged.length} of ${days.length} days`,
            detail:
              "The averages below are drawn from those days alone, so read them as a sample of the period.",
            tone: "note",
          },
    );
  const lowProtein = logged.filter((d) => dayProtein(d) < d.proteinGoal);
  if (lowProtein.length > 0) {
    const frac = pct(lowProtein.length, logged.length);
    const avgShort = Math.round(
      lowProtein.reduce((s, d) => s + (d.proteinGoal - dayProtein(d)), 0) / lowProtein.length,
    );
    if (frac >= 50)
      out.push({
        id: "protein",
        title: `Protein came up short on ${lowProtein.length} of ${logged.length} days`,
        detail: `An average of ${avgShort}g under on those days.`,
        tone: "watch",
        action: { label: "High-protein options", to: "/fast-hacks?protein=30" },
      });
  } else
    out.push({
      id: "protein",
      title: "Protein met its goal every logged day",
      detail: "The steadiest of your signals this period.",
      tone: "good",
    });
  const over = logged.filter((d) => dayCalories(d) > d.calorieGoal);
  if (over.length > 0) {
    const worst = [...over].sort(
      (a, b) => dayCalories(b) - b.calorieGoal - (dayCalories(a) - a.calorieGoal),
    )[0];
    out.push({
      id: "calories",
      title: `Over the calorie goal on ${over.length} of ${logged.length} days`,
      detail: `The largest was ${Math.round(dayCalories(worst) - worst.calorieGoal)} kcal over, on ${mdOf(worst.date)}.`,
      tone: "watch",
      action: { label: "Lighter options", to: "/fast-hacks?fits=1" },
    });
  }
  const wet = logged.filter((d) => dayWaterOz(d) >= d.waterGoalOz);
  if (wet.length < logged.length / 2)
    out.push({
      id: "water",
      title: `Hydration hit its goal on ${wet.length} of ${logged.length} days`,
      detail: "Water is the goal most often missed by a small margin rather than a large one.",
      tone: "watch",
      action: { label: "Log water", to: "/track/water" },
    });
  return out;
}

/* ------------------------------------------------------ DateRangePicker */

type Range =
  | { kind: "day" | "week" | "month" }
  | { kind: "custom"; start: string; end: string };

const PRESETS = [
  { kind: "day" as const, label: "Today", days: 1 },
  { kind: "week" as const, label: "Last 7 days", days: 7 },
  { kind: "month" as const, label: "Last 30 days", days: 30 },
];
const span = (a: string, b: string) =>
  Math.round(
    (new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000,
  ) + 1;
const rangeLabel = (r: Range) =>
  r.kind === "custom" ? "Custom range" : (PRESETS.find((p) => p.kind === r.kind)?.label ?? "");

function DateRangePicker({
  value,
  onChange,
  today,
}: {
  value: Range;
  onChange: (r: Range) => void;
  today: string;
}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(value.kind === "custom" ? value.start : today);
  const [end, setEnd] = useState(value.kind === "custom" ? value.end : today);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  const n = start && end ? span(start, end) : 0;
  const error = !start || !end
    ? "Pick both dates."
    : n < 1
      ? "The start date must be on or before the end date."
      : n > 90
        ? "Pick 90 days or fewer."
        : undefined;
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="tap-44 relative flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border-default bg-white pl-3 pr-2.5 text-[17px] type-button-secondary text-text-primary transition-colors hover:border-text-neutral-400 sm:gap-2 sm:pl-3.5 sm:pr-3"
      >
        <span className="hidden sm:inline-flex">
          <Icon name="calendar" size={15} color="var(--color-text-secondary)" />
        </span>
        {rangeLabel(value)}
        <Icon name="arrowDownSmall" size={14} color="var(--color-text-secondary)" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Choose a date range"
          className="panel absolute right-0 top-12 z-30 w-[17rem] overflow-hidden"
        >
          <ul className="py-1.5">
            {PRESETS.map((p) => {
              const on = value.kind === p.kind;
              return (
                <li key={p.kind}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      onChange({ kind: p.kind });
                      setOpen(false);
                    }}
                    className="flex h-11 w-full items-center gap-3 px-4 text-left text-sm text-text-primary hover:bg-brand-warm-gray/70"
                  >
                    <span className={cn("flex-1", on ? "type-button" : "type-button-secondary")}>
                      {p.label}
                    </span>
                    {on && <Icon name="tick" size={16} color="var(--color-primary)" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <form
            className="border-t border-border-divider px-4 pb-4 pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!error) {
                onChange({ kind: "custom", start, end });
                setOpen(false);
              }
            }}
          >
            <p className="flex items-center gap-2 text-[16px] type-section-title text-text-secondary">
              Custom range
              {value.kind === "custom" && <Icon name="tick" size={14} color="var(--color-primary)" />}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  ["From", start, setStart],
                  ["To", end, setEnd],
                ] as const
              ).map(([label, val, set]) => (
                <label key={label} className="text-[15px] type-item-title text-text-neutral-500">
                  {label}
                  <input
                    type="date"
                    value={val}
                    max={today}
                    onChange={(e) => set(e.target.value)}
                    className="mt-1 block h-11 w-full rounded-lg border border-border-default bg-white px-2 text-[17px] text-text-primary"
                  />
                </label>
              ))}
            </div>
            <p className={cn("mt-2 text-[15px] type-meta", error ? "text-text-secondary" : "text-text-neutral-500")}>
              {error ?? `${n} ${n === 1 ? "day" : "days"}`}
            </p>
            <button
              type="submit"
              disabled={!!error}
              className="mt-2.5 h-11 w-full rounded-full bg-primary text-[17px] type-button text-white disabled:cursor-not-allowed disabled:bg-primary-soft disabled:text-text-secondary"
            >
              Apply range
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------- Metric detail */

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]';

const avgOf = metricAverage;
const deltaOf = (m: TrackMetric, cur: TrackDay[], prev: TrackDay[]) => {
  const prevAvg = avgOf(m, prev);
  const logged = prev.filter((d) => m.valueOf(d) > 0).length;
  return prevAvg === 0 || logged < Math.ceil(prev.length / 2)
    ? null
    : ((avgOf(m, cur) - prevAvg) / prevAvg) * 100;
};
const fmtValue = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n)}`);

function MetricDetail({
  metric,
  days,
  labels,
  periodLabel,
  periodNoun,
  previousDays,
  goalDay,
  onClose,
}: {
  metric: TrackMetric;
  days: TrackDay[];
  labels: string[];
  periodLabel: string;
  periodNoun: string;
  previousDays: TrackDay[];
  goalDay: TrackDay;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const values = days.map((d) => metric.valueOf(d));
  const lastLogged = values.reduce((acc, v, i) => (v > 0 ? i : acc), days.length - 1);
  const [sel, setSel] = useState(lastLogged);
  const goal = metric.goalOf(goalDay);
  const avg = avgOf(metric, days);
  const delta = deltaOf(metric, days, previousDays);
  const met = (v: number, g: number) => (metric.moreIsBetter ? v >= g : v > 0 && v <= g);
  const metCount = days.filter((d) => met(metric.valueOf(d), metric.goalOf(d))).length;
  const loggedCount = values.filter((v) => v > 0).length;
  const highest = Math.max(0, ...values);
  const pos = values.filter((v) => v > 0);
  const lowest = pos.length === 0 ? 0 : Math.min(...pos);
  const cur = days[sel] ?? days[days.length - 1];
  const curVal = metric.valueOf(cur);
  const curGoal = metric.goalOf(cur);
  const curPct = curGoal === 0 ? 0 : Math.round((curVal / curGoal) * 100);
  const withUnit = (v: number) => `${fmt(v)} ${metric.unit}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !panel.current) return;
      const f = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (f.length === 0) {
        e.preventDefault();
        panel.current.focus();
        return;
      }
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const unlockScroll = lockBodyScroll();
    document.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => {
      unlockScroll();
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-8">
      <button
        type="button"
        aria-label="Close metric details"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 size-full bg-black/50 motion-safe:animate-[fade-in_200ms_ease-out]"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={`${metric.label} detail`}
        tabIndex={0}
        className="drawer-panel relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-white focus:outline-none md:max-h-[min(860px,calc(100dvh-4rem))] md:max-w-5xl md:rounded-[24px] md:border md:border-border-default"
      >
        <span aria-hidden="true" className="mx-auto mt-3 block h-1 w-9 rounded-full bg-border-default md:hidden" />
        <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-5 pb-3 pt-3 md:px-8 md:pt-6">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `color-mix(in srgb, ${metric.accent} 18%, white)` }}
          >
            <Icon name={metric.icon} size={19} color="var(--color-brand-navy)" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl type-section-title leading-7 tracking-[-0.9px] text-brand-navy md:text-2xl">
              {metric.label} details
            </h2>
            <p className="text-[17px] type-meta text-text-secondary">{periodLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-warm-gray"
          >
            <Icon name="close" size={16} color="var(--color-text-primary)" />
          </button>
        </header>
        <div className="px-5 pb-8 md:px-8 md:pb-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-8">
            <section aria-label={`${metric.label} this ${periodNoun}`} className="min-w-0">
              <div className="flex items-end gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] type-meta text-text-secondary">
                    {days.length > 1 ? "Daily average" : "Today"}
                  </p>
                  <BigNumber value={fmt(avg)} unit={metric.unit} size={40} />
                  <p className="mt-1 text-[17px] type-meta text-text-secondary">
                    Goal {withUnit(goal)}
                    {days.length > 1 && loggedCount > 0 && (
                      <>
                        {" · "}
                        <span className="type-row-figure text-text-primary">
                          met on {metCount} of {loggedCount}{" "}
                          {loggedCount === days.length ? "days" : "logged days"}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                {delta !== null && (
                  <div className="shrink-0 pb-1 text-right">
                    <DeltaPill delta={delta} moreIsBetter={metric.moreIsBetter} label={metric.label} />
                    <p className="mt-1 text-[15px] type-meta text-text-secondary">vs previous {periodNoun}</p>
                  </div>
                )}
              </div>
              <div aria-live="polite" className="mt-5 flex items-center gap-3 rounded-2xl bg-navy-50 px-4 py-3">
                {metric.chart === "ringsByDay" ? (
                  <MiniRing value={curVal} goal={curGoal} size={36} stroke={5} color={metric.accent} overlap label="" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="relative h-9 w-1.5 shrink-0 overflow-hidden rounded-full bg-border-default"
                  >
                    <span
                      className="absolute inset-x-0 bottom-0 rounded-full"
                      style={{ height: `${Math.min(100, curPct)}%`, backgroundColor: metric.accent }}
                    />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] type-meta text-text-secondary">
                    {shortDate(cur.date)}
                    {sel === days.length - 1 && days.length > 1 ? " · latest" : ""}
                  </p>
                  <p className="text-base type-row-figure text-text-primary">{withUnit(curVal)}</p>
                </div>
                <p className="shrink-0 text-right">
                  <span className="block text-base type-row-figure text-text-primary">{curPct}%</span>
                  <span className="block text-[15px] type-meta text-text-secondary">of goal</span>
                </p>
              </div>
              <div
                className={cn(
                  "mt-3 rounded-2xl border border-border-default bg-white px-3 pb-3 pt-6 md:px-4",
                  metric.chart === "ringsByDay" ? "min-h-[180px]" : "h-[240px] md:h-[280px]",
                )}
              >
                <MetricChart metric={metric} days={days} labels={labels} selected={sel} onSelect={setSel} />
              </div>
              <p className="mt-2 text-center text-[15px] type-meta text-text-secondary">
                Tap or hover a day to see its reading.
              </p>
            </section>
            <div className="min-w-0">
              <section aria-labelledby="period-summary-heading">
                <h3 id="period-summary-heading" className="eyebrow text-[17px]">
                  Period summary
                </h3>
                <dl className="mt-2.5 grid grid-cols-2 overflow-hidden rounded-2xl border border-border-default">
                  {[
                    ["Average", withUnit(avg)],
                    ["Highest", withUnit(highest)],
                    ["Lowest logged", loggedCount === 0 ? "–" : withUnit(lowest)],
                    ["Days logged", `${loggedCount} of ${days.length}`],
                  ].map(([k, v], i) => (
                    <div
                      key={k}
                      className={cn(
                        "px-4 py-3",
                        i % 2 === 1 && "border-l border-border-divider",
                        i > 1 && "border-t border-border-divider",
                      )}
                    >
                      <dt className="text-[15px] type-meta text-text-secondary">{k}</dt>
                      <dd className="mt-0.5 text-[19px] type-row-figure tabular-nums text-text-primary">{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              <section className="mt-6" aria-labelledby="period-readings-heading">
                <div className="flex items-baseline gap-3">
                  <h3 id="period-readings-heading" className="eyebrow min-w-0 flex-1 text-[17px]">
                    Period readings
                  </h3>
                  <span className="text-xs type-meta text-text-secondary">{days.length} days</span>
                </div>
                <div className="mt-2.5 overflow-hidden rounded-2xl border border-border-default">
                  <table className="w-full border-collapse text-left text-sm">
                    <caption className="sr-only">{metric.label} by day, newest first</caption>
                    <thead className="bg-brand-warm-gray text-[15px] text-text-secondary">
                      <tr>
                        <th scope="col" className="px-4 py-2 type-meta">
                          Day
                        </th>
                        <th scope="col" className="px-2 py-2 text-right type-meta">
                          Reading
                        </th>
                        <th scope="col" className="w-24 px-4 py-2 text-right type-meta">
                          Goal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {days
                        .map((d, index) => ({ d, index }))
                        .reverse()
                        .map(({ d, index }) => {
                          const r = values[index] ?? 0;
                          const g = metric.goalOf(d);
                          const p = g === 0 ? 0 : Math.round((r / g) * 100);
                          const on = index === sel;
                          return (
                            <tr
                              key={d.date}
                              className={cn("border-t border-border-divider first:border-t-0", on && "bg-navy-50")}
                            >
                              <td className="px-4 py-0">
                                <button
                                  type="button"
                                  onClick={() => setSel(index)}
                                  className={cn(
                                    "flex h-11 w-full items-center text-left text-text-primary",
                                    on ? "type-button" : "type-button-secondary",
                                  )}
                                >
                                  {shortDate(d.date)}
                                </button>
                              </td>
                              <td className="px-2 text-right type-row-figure tabular-nums text-text-primary">
                                {r === 0 ? <span className="text-text-neutral-400">–</span> : withUnit(r)}
                              </td>
                              <td className="px-4">
                                <span className="flex items-center justify-end gap-2">
                                  <span
                                    aria-hidden="true"
                                    className="h-1.5 w-10 overflow-hidden rounded-full bg-border-divider"
                                  >
                                    <span
                                      className="block h-full rounded-full"
                                      style={{
                                        width: `${Math.min(100, p)}%`,
                                        backgroundColor: met(r, g)
                                          ? metric.accent
                                          : "var(--color-text-neutral-400)",
                                      }}
                                    />
                                  </span>
                                  <span className="w-9 text-right text-xs type-meta tabular-nums text-text-secondary">
                                    {r === 0 ? <span className="text-text-neutral-400">–</span> : `${p}%`}
                                  </span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </section>
              <p className="mt-4 text-[15px] type-meta leading-4 text-text-neutral-500">
                These describe what you logged. They are not medical advice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* --------------------------------------------------------- Breakdown */

function Breakdown({ days, periodNoun }: { days: TrackDay[]; periodNoun: string }) {
  void periodNoun;
  const logged = days.filter((d) => d.meals.length > 0);
  const avg = (v: number) => (logged.length === 0 ? 0 : v / logged.length);
  const meals = logged.flatMap((d) => d.meals);
  const segs: Segment[] = MEAL_TYPES.map((m) => ({
    key: m,
    label: m === "Snack" ? "Snacks" : m,
    color: MEAL_COLOR[m],
    value: avg(meals.filter((x) => x.mealType === m).reduce((s, x) => s + x.calories, 0)),
  }));
  const total = segs.reduce((s, x) => s + x.value, 0);
  const macros = {
    protein: avg(meals.reduce((s, x) => s + x.protein, 0)),
    carbs: avg(meals.reduce((s, x) => s + x.carbs, 0)),
    fat: avg(meals.reduce((s, x) => s + x.fat, 0)),
  };
  const hasMacros = macros.protein + macros.carbs + macros.fat > 0;
  if (total === 0 && !hasMacros) return null;
  const perDay = logged.length > 1 ? "avg/day" : undefined;
  return (
    <section aria-labelledby="breakdown-heading" className="mt-6">
      <h2 id="breakdown-heading" className={SECTION_TITLE}>
        Breakdown
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {total > 0 && (
          <CategoryBar title="Calories by meal" total={total} unit="kcal" caption={perDay} segments={segs} />
        )}
        {hasMacros && (
          <section
            aria-label="Macro split"
            className="flex min-w-0 flex-col rounded-[18px] border border-border-default bg-white p-4 shadow-card"
          >
            <h3 className="text-[17px] type-item-title tracking-[-0.585px] text-text-neutral-500">Macro split</h3>
            <p className="mt-1 text-[15px] type-meta text-text-neutral-500">
              Share of calories{perDay ? ", per logged day" : ""}
            </p>
            <MacroDonut
              macros={macros}
              total={total || undefined}
              size={132}
              className="mt-3"
              totalUnit={perDay ? "kcal/day" : "kcal"}
            />
          </section>
        )}
      </div>
    </section>
  );
}

/* ----------------------------------------------------- ActivityLog */

type LogKind = "all" | "meals" | "water";
const KINDS: { kind: LogKind; label: string }[] = [
  { kind: "all", label: "All" },
  { kind: "meals", label: "Meals" },
  { kind: "water", label: "Water" },
];
const dayHeading = (date: string, today: string) => {
  if (date === today) return "Today";
  const y = new Date(`${today}T12:00:00`);
  y.setDate(y.getDate() - 1);
  return new Date(`${date}T12:00:00`).toDateString() === y.toDateString()
    ? "Yesterday"
    : new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
};

function ActivityLog({ days, todayKey }: { days: TrackDay[]; todayKey: string }) {
  const [kind, setKind] = useState<LogKind>("all");
  const [shown, setShown] = useState(3);
  const counts = {
    meals: days.reduce((s, d) => s + d.meals.length, 0),
    water: days.reduce((s, d) => s + d.hydration.length, 0),
    all: 0,
  };
  counts.all = counts.meals + counts.water;
  const groups = [...days]
    .reverse()
    .map((d) => {
      const rows: { id: string; kind: LogKind; icon: "forkSpoon" | "droplet"; title: string; meta: string; at: string }[] = [];
      if (kind === "all" || kind === "meals")
        rows.push(
          ...d.meals.map((m) => ({
            id: `meal-${m.id}`,
            kind: "meals" as const,
            icon: "forkSpoon" as const,
            title: m.title,
            meta: `${m.mealType} · ${m.calories} kcal`,
            at: m.loggedAt,
          })),
        );
      if (kind === "water")
        rows.push(
          ...d.hydration.map((w) => ({
            id: `water-${w.id}`,
            kind: "water" as const,
            icon: "droplet" as const,
            title: "Water",
            meta: `${w.ounces} oz`,
            at: w.loggedAt,
          })),
        );
      else if (kind === "all" && d.hydration.length > 0) {
        const latest = [...d.hydration].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))[0];
        rows.push({
          id: `water-${d.date}`,
          kind: "water",
          icon: "droplet",
          title: d.hydration.length === 1 ? "Water" : `Water · ${d.hydration.length} drinks`,
          meta: `${dayWaterOz(d)} oz`,
          at: latest.loggedAt,
        });
      }
      rows.sort((a, b) => b.at.localeCompare(a.at));
      const totals = [
        dayCalories(d) > 0 && `${fmt(dayCalories(d))} kcal`,
        dayWaterOz(d) > 0 && `${dayWaterOz(d)} oz`,
      ].filter(Boolean);
      return { date: d.date, rows, totals };
    })
    .filter((g) => g.rows.length > 0);
  const visible = groups.slice(0, shown);
  const more = groups.length - visible.length;
  return (
    <section aria-labelledby="activity-log-heading" className="mt-8">
      <div className="flex min-h-11 items-center gap-3">
        <h2 id="activity-log-heading" className={cn(SECTION_TITLE, "min-w-0 flex-1")}>
          Logged activity
        </h2>
        <span className="shrink-0 text-[17px] type-meta text-text-secondary">
          {counts.all} {counts.all === 1 ? "entry" : "entries"}
        </span>
      </div>
      <div role="group" aria-label="Filter logged activity" className="mt-1 flex flex-wrap gap-x-2">
        {KINDS.map(({ kind: k, label }) => {
          const on = kind === k;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              disabled={counts[k] === 0 && k !== "all"}
              onClick={() => {
                setKind(k);
                setShown(3);
              }}
              className="group flex min-h-11 items-center disabled:cursor-not-allowed"
            >
              <span
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-full border px-3 text-[17px] transition-colors",
                  on
                    ? cn(SELECTED_CHIP, "type-button")
                    : "type-button-secondary border-border-default bg-white text-text-secondary group-hover:border-text-neutral-400",
                  "group-disabled:border-border-divider group-disabled:text-text-neutral-500 group-disabled:group-hover:border-border-divider",
                )}
              >
                {on && <CheckMark size={13} />}
                {label}
                <span className={cn("type-meta tabular-nums", on ? "text-on-selected/80" : "text-text-neutral-400")}>
                  {counts[k]}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {visible.length === 0 ? (
        <p className="panel mt-2 p-4 text-[17px] type-meta text-text-secondary">
          {days.length === 1 ? "Nothing logged yet today." : "Nothing logged in this range yet."}
        </p>
      ) : (
        <div className="mt-2 flex flex-col gap-4">
          {visible.map((g) => (
            <div key={g.date}>
              <div className="flex items-baseline gap-2 px-1">
                <h3 className="flex-1 text-[17px] type-section-title text-text-primary">
                  {dayHeading(g.date, todayKey)}
                </h3>
                <span className="text-[17px] type-meta tabular-nums text-text-secondary">
                  {g.totals.join(" · ")}
                </span>
              </div>
              <ul className="panel mt-1.5 divide-y divide-border-divider px-4">
                {g.rows.map((r) => (
                  <li key={r.id} className="flex min-h-11 items-center gap-3 py-2 sm:py-0">
                    <span className="w-[58px] shrink-0 text-[17px] type-meta tabular-nums text-text-neutral-500">
                      {timeOf(r.at)}
                    </span>
                    <Icon
                      name={r.icon}
                      size={15}
                      color={r.kind === "meals" ? "var(--color-accent-ink)" : "var(--color-brand-navy)"}
                    />
                    <span className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-3">
                      <span className="min-w-0 truncate text-[17px] type-item-title text-text-primary sm:flex-1">
                        {r.title}
                      </span>
                      <span className="truncate text-[17px] type-meta tabular-nums text-text-secondary sm:shrink-0">
                        {r.meta}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {more > 0 && (
        <button
          type="button"
          onClick={() => setShown((s) => s + 4)}
          className="mt-1 flex min-h-11 w-full items-center justify-center rounded-2xl border border-border-default bg-white text-[17px] type-button text-primary"
        >
          Show earlier days ({more})
        </button>
      )}
    </section>
  );
}

/* ------------------------------------------------------ Insights screen */

export function TrackInsightsScreen() {
  const [range, setRange] = useState<Range>({ kind: "week" });
  const [offset, setOffset] = useState(0);
  const [params, setParams] = useSearchParams();
  const metricParam = params.get("metric");
  const selected = TRACK_METRICS.some((m) => m.label === metricParam) ? metricParam : null;
  const setMetric = (label: string | null) => {
    const next = new URLSearchParams(params);
    if (label) next.set("metric", label);
    else next.delete("metric");
    setParams(next, { replace: true });
  };
  const today = isoDate(new Date());
  const count =
    range.kind === "custom" ? span(range.start, range.end) : (PRESETS.find((p) => p.kind === range.kind)?.days ?? 7);
  const end = (() => {
    const base = range.kind === "custom" ? new Date(`${range.end}T12:00:00`) : new Date();
    base.setDate(base.getDate() + offset * count);
    return base;
  })();
  const { history: medHistory } = useMedications({ history: true });
  const { days, isLoading } = useTrackDays(count, end);
  const { days: previous } = useTrackDays(count, shiftDate(end, -count));
  const canNext = isoDate(end) < today;
  const labels = days.map((d) => DOW[new Date(`${d.date}T12:00:00`).getDay()]);
  const periodLabel =
    days.length === 1 ? mdOf(days[0].date) : `${mdOf(days[0].date)} – ${mdOf(days[days.length - 1].date)}`;
  const noun = count === 1 ? "day" : count === 7 ? "week" : count === 30 ? "month" : "period";
  const heading = offset === 0 && range.kind !== "custom" ? rangeLabel(range) : periodLabel;
  const last = days[days.length - 1];

  return (
    <PageContainer className="max-w-[1680px]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <header className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:justify-start lg:gap-6">
          <div className="min-w-0">
            <h1 className={PAGE_TITLE}>History &amp; insights</h1>
            <p className={cn(META_TEXT, "mt-1")}>Every logged health signal, by range.</p>
          </div>
          <TrackSwitch current="insights" />
        </header>
        <div role="toolbar" aria-label="Date range" className="flex items-center gap-2">
          <div className="flex h-10 min-w-0 flex-1 items-center rounded-full border border-border-default bg-white lg:flex-none">
            <button
              type="button"
              aria-label="Previous range"
              onClick={() => setOffset((o) => o - 1)}
              className="tap-44 relative flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-brand-warm-gray/70 sm:size-10"
            >
              <Icon name="chevronLeft" size={16} color="var(--color-text-primary)" />
            </button>
            <p
              aria-live="polite"
              className="min-w-0 flex-1 whitespace-nowrap text-center text-[16px] type-item-title tabular-nums text-text-primary sm:text-[17px] lg:min-w-[9.5rem]"
            >
              {periodLabel}
            </p>
            <button
              type="button"
              aria-label="Next range"
              disabled={!canNext}
              onClick={() => setOffset((o) => o + 1)}
              className="tap-44 relative flex size-9 shrink-0 items-center justify-center rounded-full text-text-primary hover:bg-brand-warm-gray/70 disabled:cursor-not-allowed disabled:text-text-neutral-400 disabled:hover:bg-transparent sm:size-10"
            >
              <Icon name="chevronRight" size={16} color="currentColor" />
            </button>
          </div>
          <DateRangePicker
            value={range}
            today={today}
            onChange={(r) => {
              setRange(r);
              setOffset(0);
            }}
          />
          {offset !== 0 && (
            <button
              type="button"
              onClick={() => setOffset(0)}
              className="tap-24 tap-44 relative shrink-0 px-1 text-[17px] type-button text-primary"
            >
              Latest
            </button>
          )}
        </div>
      </div>
      <div
        role="group"
        aria-label="Metric"
        className="rail-scroll -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 pt-1 md:mx-0 md:px-0"
      >
        {["All", ...TRACK_METRICS.map((m) => m.label)].map((label) => {
          const on = label === "All" ? selected === null : selected === label;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={on}
              onClick={() => setMetric(label === "All" ? null : label)}
              className={cn(
                "tap-44 relative flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[17px] tracking-[-0.585px]",
                on
                  ? cn(SELECTED_CHIP, "type-button")
                  : "type-button-secondary border-border-default bg-white text-text-secondary",
              )}
            >
              {on && <CheckMark />}
              {label}
            </button>
          );
        })}
      </div>
      <div className="mt-6">
        <TwoColumn
          sidebarLabel="What this period says"
          mobileSidebar="before"
          sidebar={<InsightsPanel insights={buildInsights(days, medHistory)} title={heading} />}
        >
          <h2 className="text-[22px] type-section-title leading-6 tracking-[-0.81px] text-brand-navy">
            Recent Activity
          </h2>
          {isLoading && days.every((d) => !dayLogged(d)) ? (
            <p className="panel mt-3 p-4 text-[17px] type-meta text-text-secondary">Loading…</p>
          ) : (
            <div
              className={cn(
                "mt-3 grid gap-3",
                days.length > 7
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-[repeat(auto-fill,minmax(min(100%,10rem),1fr))]",
              )}
            >
              {TRACK_METRICS.map((m) => (
                <MetricCard
                  key={m.label}
                  metric={m}
                  icon={m.icon}
                  days={days}
                  labels={labels}
                  latest={fmtValue(avgOf(m, days))}
                  caption={days.length > 1 ? "avg/day" : "today"}
                  delta={deltaOf(m, days, previous)}
                  onSelect={() => setMetric(m.label)}
                />
              ))}
            </div>
          )}
          <Breakdown days={days} periodNoun={noun} />
          <ActivityLog days={days} todayKey={today} />
          <p className="mt-4 text-xs type-meta italic text-text-secondary">
            These are descriptions of what you logged, not medical advice.
          </p>
        </TwoColumn>
      </div>
      <p className="sr-only">
        Showing {last.date} against a {last.calorieGoal} kcal goal.
      </p>
      {selected && (
        <MetricDetail
          metric={metricByLabel(selected)}
          days={days}
          labels={labels}
          periodLabel={periodLabel}
          periodNoun={noun}
          previousDays={previous}
          goalDay={last}
          onClose={() => setMetric(null)}
        />
      )}
    </PageContainer>
  );
}

/* ------------------------------------------------- Entry history screen */

const KIND = {
  meals: { title: "Meal History", icon: "forkSpoon" as const, color: "var(--color-accent-ink)" },
  water: { title: "Water History", icon: "droplet" as const, color: "var(--color-graphic)" },
};
const longDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
};

export function TrackEntryHistoryScreen({ kind }: { kind: "meals" | "water" }) {
  const { days } = useTrackDays(7);
  const back = useBack("/track");
  const navigate = useNavigate();
  const cfg = KIND[kind];
  const f = useFilterParams({}, ["adv"]);
  const adv = f.get("adv") === "1";
  const day = f.get("day");
  const of = f.get("of");
  const newest = [...days].reverse();
  const all = newest.flatMap((d) =>
    kind === "meals"
      ? d.meals.map((m) => ({
          id: m.id,
          title: m.title,
          meta: `${m.mealType} · ${m.calories} kcal`,
          date: d.date,
          bucket: m.mealType as string,
        }))
      : d.hydration.map((w) => ({
          id: w.id,
          title: `${longDay(d.date)} · ${timeOf(w.loggedAt)}`,
          meta: `${w.ounces} oz logged`,
          date: d.date,
          bucket: w.ounces >= 16 ? "Large" : "Small",
        })),
  );
  const shown = all.filter((e) => (!day || e.date === day) && (!of || e.bucket === of));
  const dayOpts = newest.map((d) => ({
    value: d.date,
    label: longDay(d.date),
    count: all.filter((e) => e.date === d.date && (!of || e.bucket === of)).length,
  }));
  const bucketOpts = [...new Set(all.map((e) => e.bucket))].sort().map((b) => ({
    value: b,
    label: b,
    count: all.filter((e) => e.bucket === b && (!day || e.date === day)).length,
  }));
  return (
    <PageContainer variant="focused" pathname={kind === "meals" ? "/track/meals" : "/track/water/history"}>
      <header className="flex items-start gap-3">
        <button
          type="button"
          aria-label="Go back"
          onClick={back}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-white"
        >
          <Icon name="arrowBack" size={20} color="var(--color-text-primary)" />
        </button>
        <div>
          <h1 className="text-2xl type-display text-brand-navy" style={{ letterSpacing: "-1.08px" }}>
            {cfg.title}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">Review your recent tracking activity.</p>
        </div>
      </header>
      <div className="mt-4">
        <AdvancedFilters
          open={adv}
          onOpenChange={(o) => f.set("adv", o ? "1" : null)}
          activeCount={[!!day, !!of].filter(Boolean).length}
        >
          <FacetGroup
            label="Day"
            options={dayOpts}
            selected={day ? [day] : []}
            onToggle={(v) => f.set("day", day === v ? null : v)}
            onClear={() => f.set("day", null)}
          />
          <FacetGroup
            label={kind === "meals" ? "Meal" : "Kind"}
            options={bucketOpts}
            selected={of ? [of] : []}
            onToggle={(v) => f.set("of", of === v ? null : v)}
            onClear={() => f.set("of", null)}
          />
        </AdvancedFilters>
      </div>
      <p className="mt-4 text-[17px] type-meta text-text-secondary">
        <span className="type-row-figure text-text-primary">{shown.length}</span>
        {shown.length === 1 ? " entry" : " entries"}
        {shown.length !== all.length && ` of ${all.length}`}
      </p>
      {shown.length === 0 ? (
        <div className="panel mt-6 p-6 text-center">
          <Icon name="database" size={24} color="var(--color-text-secondary)" />
          <p className="mt-2 text-sm type-section-title text-text-primary">
            {all.length === 0 ? "Nothing logged yet" : "Nothing matches those filters"}
          </p>
          <div className="mt-4">
            <PrimaryButton label="Log something" onPress={() => navigate("/track")} />
          </div>
        </div>
      ) : (
        <ul className="mt-[18px] flex flex-col gap-2.5">
          {shown.map((e) => (
            <li key={e.id} className="panel flex items-center gap-3 p-3.5">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `color-mix(in srgb, ${cfg.color} 12%, transparent)` }}
              >
                <Icon name={cfg.icon} size={18} color={cfg.color} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm type-item-title tracking-[-0.63px] text-text-primary">
                  {e.title}
                </span>
                <span className="block truncate text-xs type-meta leading-4 tracking-[-0.54px] text-text-secondary">
                  {e.meta}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
