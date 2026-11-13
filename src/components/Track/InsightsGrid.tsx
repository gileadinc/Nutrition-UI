"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { MiniChart, MiniRing } from "@/components/Charts";
import { DeltaPill } from "@/components/Track/MetricCharts";
import { Link } from "@/lib/nav";
import { doseStatus, timeToMinutes, type Medication, type WeightReading } from "@/lib/store";
import { TRACK_METRICS, metricAverage, type TrackDay, type TrackMetric } from "@/lib/track";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export const INSIGHT_CATEGORIES = [
  "Nutrition",
  "Limits",
  "Movement",
  "Hydration",
  "Body",
  "Sleep & wellbeing",
  "Routine",
] as const;
export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];

type Kind = "ring" | "spark" | "limit" | "plain";

interface Def {
  id: string;
  label: string;
  category: InsightCategory;
  icon: IconName;
  unit: string;
  kind: Kind;
  /** Label of the logged metric behind this card; absent = nothing in the API / app records it yet. */
  metric?: TrackMetric["label"];
  /** Goal / limit line for metrics without logged data. */
  target?: string;
}

/** Every metric the design lists. Cards without `metric` show "Not recorded" rather than made-up numbers. */
const DEFS: Def[] = [
  { id: "calories", label: "Calories", category: "Nutrition", icon: "fire", unit: "kcal a day", kind: "spark", metric: "Calories" },
  { id: "protein", label: "Protein", category: "Nutrition", icon: "dumbbell", unit: "g a day", kind: "ring", metric: "Protein" },
  { id: "carbs", label: "Carbs", category: "Nutrition", icon: "apple", unit: "g a day", kind: "ring", metric: "Carbs" },
  { id: "fat", label: "Fat", category: "Nutrition", icon: "leaf", unit: "g a day", kind: "ring", metric: "Fat" },
  { id: "fibre", label: "Fibre", category: "Nutrition", icon: "leaf", unit: "g a day", kind: "ring", target: "Goal 28 g" },
  { id: "sugar", label: "Sugar", category: "Limits", icon: "apple", unit: "g a day", kind: "limit", target: "Limit 50 g" },
  { id: "sodium", label: "Sodium", category: "Limits", icon: "bolt", unit: "mg a day", kind: "limit", target: "Limit 2,300 mg" },
  { id: "satfat", label: "Saturated fat", category: "Limits", icon: "leaf", unit: "g a day", kind: "limit", target: "Limit 20 g" },
  { id: "addedsugar", label: "Added sugar", category: "Limits", icon: "apple", unit: "g a day", kind: "limit", target: "Limit 25 g" },
  { id: "active", label: "Active minutes", category: "Movement", icon: "activity", unit: "min a day", kind: "ring", metric: "Active minutes" },
  { id: "steps", label: "Steps", category: "Movement", icon: "walking", unit: "a day", kind: "ring", target: "Goal 8,000 steps" },
  { id: "water", label: "Water", category: "Hydration", icon: "droplet", unit: "oz a day", kind: "ring", metric: "Water" },
  { id: "weight", label: "Weight", category: "Body", icon: "weightScale", unit: "lb", kind: "spark" },
  { id: "bodyfat", label: "Body fat", category: "Body", icon: "weightScale", unit: "%", kind: "plain", target: "Latest reading" },
  { id: "sleep", label: "Sleep", category: "Sleep & wellbeing", icon: "moon", unit: "h a day", kind: "plain", target: "Goal 8 h" },
  { id: "mood", label: "How you feel", category: "Sleep & wellbeing", icon: "faceSmile", unit: "out of 5", kind: "plain", target: "Not rated yet" },
];

/* ------------------------------------------------------------- pieces */

type Tone = "good" | "warn" | "muted";

function StatusChip({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] type-meta",
        tone === "good" && "bg-positive text-positive-ink",
        tone === "warn" && "bg-accent-soft text-accent-ink",
        tone === "muted" && "bg-brand-warm-gray text-text-secondary",
      )}
    >
      <Icon
        name={tone === "good" ? "checkCircle" : tone === "warn" ? "alert" : "info"}
        size={12}
        color="currentColor"
      />
      {children}
    </span>
  );
}

/** One pill per day (last 7): filled = goal met, outlined = logged, empty = nothing. */
function PillStrip({ states, accent }: { states: ("met" | "logged" | "none")[]; accent: string }) {
  return (
    <span aria-hidden="true" className="mt-3 grid auto-cols-fr grid-flow-col gap-1.5">
      {states.map((s, i) => (
        <span
          key={i}
          className="h-3.5 rounded-full border"
          style={{
            borderColor: s === "none" ? "var(--color-border-default)" : accent,
            backgroundColor:
              s === "met" ? accent : s === "logged" ? `color-mix(in srgb, ${accent} 16%, white)` : "transparent",
          }}
        />
      ))}
    </span>
  );
}

function CardShell({
  def,
  onSelect,
  to,
  children,
}: {
  def: Def;
  onSelect?: () => void;
  to?: string;
  children: ReactNode;
}) {
  const cls =
    "flex h-full w-full min-w-0 flex-col rounded-[18px] border border-border-default bg-white p-4 text-left shadow-card";
  const interactive = "hover:shadow-card-hover motion-safe:transition-shadow";
  const head = (
    <span className="flex items-center gap-2">
      <Icon name={def.icon} size={15} color="var(--color-graphic)" />
      <span className="min-w-0 flex-1 truncate text-[13px] type-item-title tracking-[-0.585px] text-text-primary">
        {def.label}
      </span>
      <Icon name="info" size={14} color="var(--color-text-neutral-400)" />
    </span>
  );
  if (onSelect)
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-label={`${def.label}. Open details`}
        className={cn(cls, interactive)}
      >
        {head}
        {children}
      </button>
    );
  if (to)
    return (
      <Link to={to} className={cn(cls, interactive)}>
        {head}
        {children}
      </Link>
    );
  return (
    <div className={cls}>
      {head}
      {children}
    </div>
  );
}

const Value = ({ value, size = 28 }: { value: string; size?: number }) => (
  <span
    className="type-numeral leading-none tabular-nums text-brand-navy"
    style={{ fontSize: size, letterSpacing: `${(size * -0.04).toFixed(2)}px` }}
  >
    {value}
  </span>
);

/* ------------------------------------------------------- logged metric */

function LoggedCard({
  def,
  metric,
  days,
  previous,
  compare,
  onSelect,
}: {
  def: Def;
  metric: TrackMetric;
  days: TrackDay[];
  previous: TrackDay[];
  compare: boolean;
  onSelect: () => void;
}) {
  const last = days[days.length - 1] ?? null;
  const goal = metric.goalOf(last);
  const logged = days.filter((d) => metric.valueOf(d) > 0);
  const avg = metricAverage(metric, days);
  const frac = goal > 0 ? avg / goal : 0;
  const prevAvg = metricAverage(metric, previous);
  const prevLogged = previous.filter((d) => metric.valueOf(d) > 0).length;
  const delta =
    compare && prevAvg > 0 && prevLogged >= Math.ceil(previous.length / 2) ? ((avg - prevAvg) / prevAvg) * 100 : null;
  const met = (d: TrackDay) => {
    const v = metric.valueOf(d);
    return metric.moreIsBetter ? v >= metric.goalOf(d) : v > 0 && v <= metric.goalOf(d);
  };
  const states = days.slice(-7).map((d) => (met(d) ? "met" : metric.valueOf(d) > 0 ? "logged" : "none") as "met" | "logged" | "none");

  let tone: Tone = "muted";
  let status = "Not recorded";
  if (logged.length > 0) {
    if (metric.moreIsBetter) {
      tone = frac >= 1 ? "good" : frac >= 0.6 ? "muted" : "warn";
      status = frac >= 1 ? "On track" : frac >= 0.6 ? "Building" : "Below goal";
    } else {
      tone = frac <= 1.1 ? "good" : "warn";
      status = frac <= 1.1 ? "On target" : "Over goal";
    }
  }
  const latest = [...days].reverse().find((d) => metric.valueOf(d) > 0);
  const value = logged.length === 0 ? "–" : fmt(avg);
  const goalLine = `Goal ${fmt(goal)} ${metric.unit === "kcal" ? "kcal" : metric.unit}`;

  return (
    <CardShell def={def} onSelect={onSelect}>
      {def.kind === "spark" ? (
        <span className="mt-3 flex items-end gap-3">
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-1.5">
              <Value value={value} />
              <span className="text-[13px] type-meta text-text-secondary">{def.unit}</span>
            </span>
            <span className="mt-1 block text-[13px] type-meta text-text-secondary">{goalLine}</span>
          </span>
          {delta !== null && <DeltaPill delta={delta} moreIsBetter={metric.moreIsBetter} label={metric.label} />}
        </span>
      ) : (
        <span className="mt-3 flex items-center gap-3">
          <MiniRing
            value={logged.length === 0 ? 0 : avg}
            goal={goal}
            size={52}
            stroke={6}
            color={metric.accent}
            overlap
            label={`${metric.label} ${Math.round(frac * 100)}% of goal`}
          >
            <span className="text-[13px] type-row-figure tabular-nums text-brand-navy">
              {logged.length === 0 ? "–" : `${Math.round(frac * 100)}%`}
            </span>
          </MiniRing>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline gap-x-1.5">
              <Value value={value} />
              <span className="text-[13px] type-meta text-text-secondary">{def.unit}</span>
            </span>
            <span className="mt-1 block text-[13px] type-meta text-text-secondary">{goalLine}</span>
          </span>
          {delta !== null && <DeltaPill delta={delta} moreIsBetter={metric.moreIsBetter} label={metric.label} />}
        </span>
      )}
      {def.kind === "spark" && (
        <span className="mt-2 block">
          <MiniChart
            variant="line"
            color={metric.accent}
            height={56}
            showLabels={false}
            points={days.map((d) => ({ label: d.date, value: metric.valueOf(d) }))}
            format={(v) => `${fmt(v)} ${metric.unit}`}
          />
          {latest && (
            <span className="block text-right text-[13px] type-meta tabular-nums text-text-neutral-500">
              Latest {fmt(metric.valueOf(latest))}
            </span>
          )}
        </span>
      )}
      <PillStrip states={states} accent={metric.accent} />
      <span className="mt-3 block">
        <StatusChip tone={tone}>{status}</StatusChip>
      </span>
    </CardShell>
  );
}

/* ----------------------------------------------------- not-recorded card */

function EmptyCard({ def }: { def: Def }) {
  return (
    <CardShell def={def}>
      <span className="mt-3 flex items-center gap-3">
        {def.kind === "ring" && (
          <MiniRing value={0} goal={1} size={52} stroke={6} color="var(--color-border-default)" label={`${def.label} not recorded`}>
            <span className="text-[13px] type-row-figure text-text-neutral-400">–</span>
          </MiniRing>
        )}
        <span className="min-w-0 flex-1">
          <Value value="–" />
          {def.kind === "plain" && def.unit !== "%" && (
            <span className="ml-1.5 text-[13px] type-meta text-text-secondary">{def.unit}</span>
          )}
          <span className="mt-1 block text-[13px] type-meta text-text-secondary">{def.target}</span>
        </span>
      </span>
      {def.kind === "limit" && (
        <span aria-hidden="true" className="relative mt-3 block h-2 rounded-full bg-border-divider">
          <span className="absolute inset-y-[-3px] left-[78%] w-0.5 rounded-full bg-text-primary" />
        </span>
      )}
      {def.kind !== "plain" && (
        <PillStrip states={Array<"none">(7).fill("none")} accent="var(--color-graphic)" />
      )}
      <span className="mt-3 block">
        <StatusChip tone="muted">Not recorded</StatusChip>
      </span>
    </CardShell>
  );
}

/* ----------------------------------------------------------- weight card */

function WeightCard({
  def,
  days,
  readings,
}: {
  def: Def;
  days: TrackDay[];
  readings: WeightReading[];
}) {
  const from = days[0]?.date ?? "";
  const to = days[days.length - 1]?.date ?? "";
  const inRange = readings.filter((r) => r.date >= from && r.date <= to).sort((a, b) => a.date.localeCompare(b.date));
  const latest = inRange[inRange.length - 1];
  const change = inRange.length > 1 ? latest.pounds - inRange[0].pounds : null;
  const byDate = new Map(inRange.map((r) => [r.date, r.pounds]));
  return (
    <CardShell def={def} to="/track/weight">
      <span className="mt-3 block">
        <span className="flex items-baseline gap-1.5">
          <Value value={latest ? latest.pounds.toFixed(1) : "–"} />
          <span className="text-[13px] type-meta text-text-secondary">lb</span>
        </span>
        <span className="mt-1 block text-[13px] type-meta text-text-secondary">
          {change === null
            ? latest
              ? "Latest reading"
              : "No weigh-ins this period"
            : change === 0
              ? "No change this period"
              : `${change > 0 ? "Up" : "Down"} ${Math.abs(change).toFixed(1)} lb this period`}
        </span>
      </span>
      <span className="mt-2 block">
        <MiniChart
          variant="line"
          color="var(--color-brand-navy)"
          height={56}
          showLabels={false}
          points={days.map((d) => ({ label: d.date, value: byDate.get(d.date) ?? 0 }))}
          format={(v) => `${v.toFixed(1)} lb`}
        />
      </span>
      <span className="mt-3 block">
        <StatusChip tone="muted">
          Recorded on {inRange.length} of {days.length} {days.length === 1 ? "day" : "days"}
        </StatusChip>
      </span>
    </CardShell>
  );
}

/* ------------------------------------------------------------ next dose */

function NextDoseCard({ meds }: { meds: Medication[] }) {
  const next = [...meds].filter((m) => !m.taken).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))[0];
  const taken = meds.filter((m) => m.taken).length;
  const due = next && doseStatus(next) === "Missed";
  return (
    <Link
      to="/track/medication"
      className="flex items-center gap-3 rounded-[18px] border border-border-default bg-white p-4 shadow-card hover:shadow-card-hover motion-safe:transition-shadow"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[13px] type-item-title text-text-neutral-500">
          <Icon name="medication" size={15} color="var(--color-graphic)" />
          Next dose
        </span>
        {meds.length === 0 ? (
          <span className="mt-2 block text-[13px] type-meta text-text-secondary">
            No medication scheduled. Add one to track doses here.
          </span>
        ) : (
          <>
            <span className="mt-2 flex items-center gap-1.5 text-[24px] type-numeral leading-none tracking-[-0.9px] text-brand-navy">
              {due && <Icon name="alert" size={18} color="var(--color-accent-ink)" />}
              {next ? (due ? "Due now" : next.time) : "All taken"}
            </span>
            <span className="mt-1.5 block text-[13px] type-meta text-text-secondary">
              {next ? `${next.name}${next.dose ? ` ${next.dose}` : ""} · ${next.time}` : "Every dose is logged for today"}
            </span>
            <span className="mt-0.5 block text-[13px] type-meta text-text-neutral-500">
              {taken} of {meds.length} taken today
            </span>
          </>
        )}
      </span>
      <Icon name="chevronRight" size={14} color="var(--color-text-neutral-400)" />
    </Link>
  );
}

/* ----------------------------------------------------------------- grid */

export function InsightsGrid({
  days,
  previous,
  compare,
  category,
  weight,
  meds,
  onSelect,
}: {
  days: TrackDay[];
  previous: TrackDay[];
  compare: boolean;
  category: InsightCategory | null;
  weight: WeightReading[];
  meds: Medication[];
  onSelect: (label: string) => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-6">
      {INSIGHT_CATEGORIES.filter((c) => category === null || c === category).map((cat) => {
        const defs = DEFS.filter((d) => d.category === cat);
        return (
          <section key={cat} aria-label={cat}>
            <h3 className="text-[13px] type-meta text-text-secondary">{cat}</h3>
            {cat === "Routine" ? (
              <div className="mt-2">
                <NextDoseCard meds={meds} />
              </div>
            ) : (
              <ul className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {defs.map((def) => {
                  const metric = def.metric ? TRACK_METRICS.find((m) => m.label === def.metric) : undefined;
                  return (
                    <li key={def.id} className="min-w-0">
                      {metric ? (
                        <LoggedCard
                          def={def}
                          metric={metric}
                          days={days}
                          previous={previous}
                          compare={compare}
                          onSelect={() => onSelect(metric.label)}
                        />
                      ) : def.id === "weight" ? (
                        <WeightCard def={def} days={days} readings={weight} />
                      ) : (
                        <EmptyCard def={def} />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
