"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { MiniChart, MiniRing } from "@/components/Charts";
import { useReducedMotion } from "@/lib/hooks";
import type { TrackDay, TrackMetric } from "@/lib/track";
import { ICON_WELL } from "@/components/styles";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
export const shortDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
const monthDay = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Thin the x labels when the period is long. */
function tickLabels(days: TrackDay[], labels: string[]) {
  if (days.length <= 14) return labels;
  const step = Math.ceil(days.length / 5);
  const last = days.length - 1;
  return days.map((d, i) => {
    const hit = (last - i) % step === 0;
    const first = i === 0 && last % step >= step / 2;
    return hit || first ? monthDay(d.date) : "";
  });
}

const ariaFor = (m: TrackMetric, days: TrackDay[], labels: string[]) => {
  if (days.length === 0) return `${m.label}: nothing logged.`;
  const values = days.map((d) => m.valueOf(d));
  const goal = m.goalOf(days[days.length - 1] ?? null);
  const met = values.filter((v) => v >= goal).length;
  return (
    `${m.label} in ${m.unit}, goal ${fmt(goal)}. ${met} of ${days.length} ${days.length === 1 ? "day" : "days"} met it. ` +
    values.map((v, i) => `${labels[i] ?? i + 1}: ${fmt(v)}`).join(", ")
  );
};

/* ----------------------------------------------------- Rings by day */

export function RingsByDay({
  values,
  goal,
  labels,
  compact = false,
  highlightLast = false,
  selected,
  onSelect,
  names,
  color = "var(--color-graphic)",
}: {
  values: number[];
  goal: number;
  labels: string[];
  compact?: boolean;
  highlightLast?: boolean;
  selected?: number;
  onSelect?: (i: number) => void;
  names?: string[];
  color?: string;
}) {
  const many = values.length > 7;
  const lots = values.length > 31;
  const size = compact ? (lots ? 18 : many ? 24 : 26) : many ? 28 : 38;
  const stroke = compact ? (lots ? 2.5 : many ? 3 : 4) : many ? 4 : 5;
  return (
    <ul
      aria-hidden={!onSelect || undefined}
      className={cn(
        "grid gap-x-1",
        compact && lots
          ? "grid-cols-15 gap-y-1"
          : compact && many
            ? "grid-cols-10 gap-y-1.5"
            : compact
              ? "grid-cols-7 gap-y-1"
              : "grid-cols-7 gap-y-3",
      )}
    >
      {values.map((v, i) => {
        const on = selected === undefined ? highlightLast && i === values.length - 1 : i === selected;
        const content = (
          <>
            <MiniRing value={v} goal={goal} size={size} stroke={stroke} color={color} overlap fluid={compact} label="" />
            {!compact && (
              <>
                <span
                  className={cn(
                    "mt-1.5 text-[10px]",
                    on ? "type-button text-text-primary" : "type-button-secondary text-text-secondary",
                  )}
                >
                  {labels[i] || " "}
                </span>
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    on ? "type-row-figure text-text-primary" : "type-meta text-text-neutral-500",
                  )}
                >
                  {v > 0 ? Math.round(v) : "–"}
                </span>
              </>
            )}
          </>
        );
        return (
          <li key={i} className="flex min-w-0 flex-col items-center">
            {onSelect ? (
              <button
                type="button"
                aria-label={names?.[i]}
                aria-pressed={selected === i}
                onClick={() => onSelect(i)}
                onMouseEnter={() => onSelect(i)}
                onFocus={() => onSelect(i)}
                className={cn(
                  "flex flex-col items-center rounded-xl px-1 py-1.5 transition-colors",
                  selected === i ? "bg-brand-warm-gray" : "hover:bg-brand-warm-gray/60",
                )}
              >
                {content}
              </button>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------ Columns chart */

function niceTicks(max: number) {
  const t = max / 3;
  const mag = 10 ** Math.floor(Math.log10(t));
  const step = [1, 2, 2.5, 5, 10].map((x) => x * mag).find((x) => x >= t) ?? t;
  return [0, step, step * 2, step * 3];
}

const Y_W = 34;
const X_H = 22;
const TOP = 18;

function Overlay({
  count,
  names,
  selected,
  onSelect,
}: {
  count: number;
  names: string[];
  selected?: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="absolute inset-y-0 right-0 z-0 flex" style={{ left: Y_W }}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={names[i]}
          aria-pressed={selected === i}
          onClick={() => onSelect(i)}
          onMouseEnter={() => onSelect(i)}
          onFocus={() => onSelect(i)}
          className={cn(
            "relative flex h-full min-w-0 flex-1 flex-col items-center justify-end rounded-md transition-colors",
            selected === i ? "bg-brand-warm-gray/70" : "hover:bg-brand-warm-gray/40",
          )}
        />
      ))}
    </div>
  );
}

function Columns({
  metric,
  days,
  labels,
  compact,
  goal,
  selected,
  onSelect,
}: {
  metric: TrackMetric;
  days: TrackDay[];
  labels: string[];
  compact: boolean;
  goal: number;
  selected?: number;
  onSelect?: (i: number) => void;
}) {
  const animate = !useReducedMotion();
  const values = days.map((d) => metric.valueOf(d));
  const ticks = niceTicks(Math.max(1, goal, ...values) * 1.18);
  const top = ticks[ticks.length - 1];
  if (compact) {
    return (
      <MiniChart
        points={values.map((v, i) => ({ label: labels[i] ?? "", value: v }))}
        color={metric.accent}
        goal={goal}
        showLabels={false}
        height={days.length > 7 ? 132 : 88}
        format={(v) => `${fmt(v)} ${metric.unit}`}
        className="h-full"
      />
    );
  }
  const data = days.map((d, i) => ({ key: d.date, label: labels[i] ?? "", value: values[i] }));
  const sel = selected === undefined ? undefined : data[selected];
  const tick = { fontSize: 10, fill: "var(--color-text-secondary)" };
  return (
    <div className="relative h-full" data-slot="goal-columns">
      {onSelect && (
        <Overlay
          count={data.length}
          names={data.map((d) => `${shortDate(d.key)}: ${fmt(d.value)} ${metric.unit}`)}
          selected={selected}
          onSelect={onSelect}
        />
      )}
      <ResponsiveContainer
        width="100%"
        height="100%"
        className={cn("z-10", onSelect && "pointer-events-none")}
        initialDimension={{ width: 320, height: 240 }}
      >
        <BarChart
          data={data}
          margin={{ top: TOP, right: 0, bottom: 0, left: 0 }}
          barCategoryGap={days.length > 31 ? 1 : days.length > 7 ? "18%" : "28%"}
          accessibilityLayer={false}
        >
          <CartesianGrid vertical={false} stroke="var(--color-border-divider)" />
          <XAxis
            dataKey="key"
            tickLine={false}
            axisLine={false}
            height={X_H}
            interval={0}
            tick={tick}
            tickFormatter={(_, i) => labels[i] ?? ""}
          />
          <YAxis
            width={Y_W}
            orientation="left"
            tickLine={false}
            axisLine={false}
            tick={tick}
            ticks={ticks}
            domain={[0, top]}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)))}
          />
          {goal > 0 && (
            <ReferenceLine
              y={goal}
              stroke="var(--color-text-secondary)"
              strokeOpacity={0.5}
              ifOverflow="extendDomain"
              label={{
                value: `Goal ${fmt(goal)} ${metric.unit}`,
                position: "insideTopLeft",
                fill: "var(--color-text-secondary)",
                fontSize: 10,
              }}
            />
          )}
          <Bar
            dataKey="value"
            name={metric.label}
            fill={metric.accent}
            radius={days.length > 31 ? [1, 1, 0, 0] : days.length > 7 ? [2, 2, 0, 0] : [4, 4, 0, 0]}
            maxBarSize={20}
            isAnimationActive={animate}
            animationDuration={600}
          />
        </BarChart>
      </ResponsiveContainer>
      {sel && selected !== undefined && sel.value > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-20"
          style={{ left: Y_W }}
        >
          <div
            className="absolute"
            style={{
              left: `${((selected + 0.5) / data.length) * 100}%`,
              transform:
                selected < data.length / 3
                  ? "translateX(-12px)"
                  : selected >= (data.length * 2) / 3
                    ? "translateX(calc(-100% + 12px))"
                    : "translateX(-50%)",
              bottom: `calc(${X_H}px + ${sel.value / top} * (100% - 40px) + 6px)`,
            }}
          >
            <div className="min-w-0 whitespace-nowrap rounded-lg border border-border-default bg-white px-2.5 py-1.5 shadow-card">
              <p className="text-[10px] type-meta text-text-secondary">{shortDate(sel.key)}</p>
              <p className="flex items-center gap-1.5 text-[12px] type-row-figure tabular-nums text-text-primary">
                <span className="size-2 rounded-full" style={{ backgroundColor: metric.accent }} />
                {metric.label} {fmt(sel.value)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------- MetricChart */

export function MetricChart({
  metric,
  days,
  labels,
  compact = false,
  selected,
  onSelect,
}: {
  metric: TrackMetric;
  days: TrackDay[];
  labels: string[];
  compact?: boolean;
  selected?: number;
  onSelect?: (i: number) => void;
}) {
  if (days.length === 0) {
    return (
      <p className="flex h-full items-center justify-center text-center text-[15px] tracking-[-0.675px] text-text-secondary">
        Nothing logged yet.
      </p>
    );
  }
  const goal = metric.goalOf(days[days.length - 1] ?? null);
  const shown = tickLabels(days, labels);
  const aria = ariaFor(metric, days, labels);
  const wrap = (child: ReactNode) =>
    onSelect ? (
      <div className="h-full" role="group" aria-label={aria}>
        {child}
      </div>
    ) : (
      <div className="h-full" role="img" aria-label={aria}>
        {child}
      </div>
    );
  if (metric.chart === "ringsByDay") {
    return wrap(
      <div className="flex h-full flex-col justify-center">
        <RingsByDay
          color={metric.accent}
          values={days.map((d) => metric.valueOf(d))}
          goal={goal}
          labels={shown}
          compact={compact}
          highlightLast={selected === undefined}
          selected={selected}
          onSelect={onSelect}
          names={days.map((d) => `${shortDate(d.date)}: ${fmt(metric.valueOf(d))} ${metric.unit}`)}
        />
        {!compact && (
          <p className="mt-3 text-center text-[11px] type-meta text-text-secondary">
            A full ring is the {fmt(goal)} {metric.unit} goal; a shadowed second lap means over it.
          </p>
        )}
      </div>,
    );
  }
  return wrap(
    <Columns
      metric={metric}
      days={days}
      labels={shown}
      compact={compact}
      goal={goal}
      selected={selected}
      onSelect={onSelect}
    />,
  );
}

/* -------------------------------------------------------- DeltaPill etc */

export function DeltaPill({
  delta,
  moreIsBetter = true,
  label,
}: {
  delta: number;
  moreIsBetter?: boolean;
  label?: string;
}) {
  const r = Math.round(delta);
  const flat = r === 0;
  const good = flat ? true : r > 0 === moreIsBetter;
  return (
    <span
      title={label ? `${label}, versus the previous period` : undefined}
      className={cn(
        "shrink-0 rounded-full px-[9px] py-1.5 text-xs type-meta tracking-[-0.54px]",
        flat
          ? "bg-brand-warm-gray text-text-secondary"
          : good
            ? "bg-positive text-positive-ink"
            : "bg-primary-soft text-primary",
      )}
    >
      <span className="sr-only">
        {label ? `${label} ` : ""}
        {flat ? "unchanged" : good ? "improved" : "worsened"}{" "}
      </span>
      {r >= 0 ? "+" : ""}
      {r}%
    </span>
  );
}

export function BigNumber({ value, unit, size = 30 }: { value: string; unit: string; size?: number }) {
  return (
    <p className="flex items-baseline gap-1">
      <span
        className="type-numeral text-text-primary"
        style={{ fontSize: `${size}px`, lineHeight: 1.05, letterSpacing: `${(size * -0.045).toFixed(2)}px` }}
      >
        {value}
      </span>
      <span className="text-xs type-meta tracking-[-0.54px] text-text-secondary">{unit}</span>
    </p>
  );
}

export function MetricCard({
  metric,
  icon,
  days,
  labels,
  latest,
  caption,
  delta,
  onSelect,
}: {
  metric: TrackMetric;
  icon: IconName;
  days: TrackDay[];
  labels: string[];
  latest: string;
  caption?: string;
  delta: number | null;
  onSelect: () => void;
}) {
  const goal = metric.goalOf(days[days.length - 1] ?? null);
  const met = days.filter((d) => {
    const v = metric.valueOf(d);
    return metric.moreIsBetter ? v >= metric.goalOf(d) : v > 0 && v <= metric.goalOf(d);
  }).length;
  const logged = days.filter((d) => metric.valueOf(d) > 0).length;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${metric.label}: ${latest} ${metric.unit} ${caption ?? ""}. Open details`}
      className="flex h-full w-full min-w-0 flex-col rounded-[18px] border border-border-default bg-white p-4 text-left shadow-card motion-safe:transition-shadow motion-safe:duration-300 hover:shadow-card-hover"
    >
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", ICON_WELL)}
        >
          <Icon name={icon} size={14} color="var(--color-icon-well-ink)" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] type-item-title tracking-[-0.585px] text-text-neutral-500">
          {metric.label}
        </span>
        <Icon name="chevronRight" size={14} color="var(--color-text-neutral-400)" />
      </span>
      <span className="mt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
        <span className="text-[26px] type-numeral leading-none tabular-nums tracking-[-1.1px] text-text-primary">
          {latest}
        </span>
        <span className="text-xs type-meta text-text-secondary">{metric.unit}</span>
        {caption && <span className="text-[11px] type-meta text-text-neutral-500">{caption}</span>}
        {delta !== null && (
          <span className="ml-auto">
            <DeltaPill delta={delta} moreIsBetter={metric.moreIsBetter} label={metric.label} />
          </span>
        )}
      </span>
      <span className="mt-1.5 block text-[11px] type-meta leading-4 text-text-secondary">
        Goal {fmt(goal)} {metric.unit}
        {days.length > 1 && logged > 0 && (
          <>
            {" · "}
            <span className="text-text-primary">
              {met}/{logged} {logged === days.length ? "days" : "logged days"}
            </span>
          </>
        )}
      </span>
      <span
        className={cn(
          "mt-auto block w-full pt-3",
          metric.chart === "ringsByDay" ? "" : days.length > 7 ? "h-[132px]" : "h-[88px]",
        )}
      >
        <MetricChart metric={metric} days={days} labels={labels} compact />
      </span>
      {days.length > 7 && (
        <span
          aria-hidden="true"
          className="mt-1.5 flex justify-between text-[10px] type-meta tabular-nums text-text-neutral-500"
        >
          <span>{monthDay(days[0].date)}</span>
          <span>{monthDay(days[days.length - 1].date)}</span>
        </span>
      )}
    </button>
  );
}
