"use client";

import { useId, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import {
  ChartBox,
  CURSOR,
  GOAL_STROKE,
  GRID_STROKE,
  TICK,
  TipCard,
  clock,
  compact,
  dimmed,
  hourTick,
  limitColor,
  num,
} from "./chartKit";

interface TipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: Record<string, unknown> }>;
}
const first = (p: TipProps) => p.payload?.[0]?.payload as Record<string, unknown> | undefined;

/* ------------------------------------------------------------ overflow lap */

/** The darker lap drawn when a value goes past 100% of its goal. */
export function OverflowLap({
  value,
  target,
  size,
  stroke,
  color,
  radius = (size - stroke) / 2,
  startAngle = -90,
  sweep = 360,
  viewHeight = size,
}: {
  value: number;
  target: number;
  size: number;
  stroke: number;
  color: string;
  radius?: number;
  startAngle?: number;
  sweep?: number;
  viewHeight?: number;
}) {
  const id = `overflow-${useId().replace(/:/g, "")}`;
  const ratio = target > 0 ? Math.max(0, value / target) : 0;
  const over = Math.min(1, Math.max(0, ratio - 1));
  if (over <= 0) return null;
  const c = size / 2;
  const circ = 2 * Math.PI * radius;
  const dash = circ * over * (sweep / 360);
  const a = ((startAngle + over * sweep) * Math.PI) / 180;
  const off = stroke * 0.35;
  const sx = c + radius * Math.cos(a) - Math.sin(a) * off;
  const sy = c + radius * Math.sin(a) + Math.cos(a) * off;
  return (
    <svg
      aria-hidden
      data-slot="overflow-lap"
      viewBox={`0 0 ${size} ${viewHeight}`}
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
    >
      <defs>
        <filter id={id} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={stroke * 0.28} />
        </filter>
      </defs>
      <circle
        cx={sx}
        cy={sy}
        r={stroke * 0.5}
        fill="var(--color-text-primary)"
        fillOpacity={0.42}
        filter={`url(#${id})`}
      />
      <circle
        cx={c}
        cy={c}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform={`rotate(${startAngle} ${c} ${c})`}
      />
      {over < 0.995 && (
        <circle
          cx={c + radius * Math.cos(a)}
          cy={c + radius * Math.sin(a)}
          r={stroke / 2}
          fill={color}
          stroke="white"
          strokeWidth={Math.max(2, stroke * 0.18)}
        />
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------- donut */

export interface Part {
  key: string;
  value: number;
  fill: string;
}

/** A donut of parts with a centre slot; hover dims the others. */
export function DonutChart({
  parts,
  size = 140,
  thickness = 16,
  label,
  children,
  className,
  overflow,
  unit = "",
  partName = (k: string) => k,
}: {
  parts: Part[];
  size?: number;
  thickness?: number;
  label: string;
  children?: ReactNode;
  className?: string;
  overflow?: { value: number; target: number; color: string };
  unit?: string;
  partName?: (key: string) => string;
}) {
  const motion = !useReducedMotion();
  const [hover, setHover] = useState<number | undefined>();
  const live = parts.filter((p) => p.value > 0);
  const data = live.length
    ? live
    : [{ key: "empty", value: 1, fill: "var(--color-border-divider)" }];
  const total = live.reduce((s, p) => s + p.value, 0);
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("relative mx-auto shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <ChartBox height={size} fallbackWidth={size}>
        <PieChart accessibilityLayer={false}>
          <Tooltip
            isAnimationActive={false}
            allowEscapeViewBox={{ x: true, y: true }}
            content={(p: TipProps) => {
              const d = first(p) as Part | undefined;
              if (!p.active || !d || d.key === "empty") return null;
              return (
                <TipCard
                  label={partName(d.key)}
                  rows={[
                    {
                      key: d.key,
                      name: `${total > 0 ? Math.round((d.value / total) * 100) : 0}% of the total`,
                      value: `${num(d.value)} ${unit}`.trim(),
                      color: d.fill,
                    },
                  ]}
                />
              );
            }}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="key"
            startAngle={90}
            endAngle={-270}
            innerRadius={size / 2 - thickness}
            outerRadius={size / 2}
            cornerRadius={thickness / 2}
            paddingAngle={data.length > 1 ? 3 : 0}
            stroke="none"
            isAnimationActive={motion}
            onMouseEnter={(_, i) => setHover(i)}
            onMouseLeave={() => setHover(undefined)}
          >
            {data.map((d, i) => (
              <Cell key={d.key} fill={d.fill} fillOpacity={dimmed(hover, i)} />
            ))}
          </Pie>
        </PieChart>
      </ChartBox>
      {overflow && (
        <OverflowLap
          value={overflow.value}
          target={overflow.target}
          size={size}
          stroke={thickness}
          radius={size / 2 - thickness / 2}
          color={overflow.color}
        />
      )}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- rings */

export interface RingRow {
  key: string;
  name: string;
  value: number;
  target: number;
  fill: string;
}

/** Concentric rings, one per goal. */
export function RingsChart({
  rows,
  label,
  size = 190,
}: {
  rows: RingRow[];
  label: string;
  size?: number;
}) {
  const motion = !useReducedMotion();
  const [hover, setHover] = useState<number | undefined>();
  const data = rows.map((r) => ({
    ...r,
    pct: Math.min(100, r.target > 0 ? (r.value / r.target) * 100 : 0),
  }));
  const hole = size * 0.14;
  const c = size / 2;
  const band = rows.length > 0 ? (c - hole) / rows.length : 0;
  const tip = Math.min(14, band * 0.82);
  return (
    <div
      role="img"
      aria-label={label}
      className="relative mx-auto shrink-0"
      style={{ width: size, height: size }}
    >
      <ChartBox height={size} fallbackWidth={size}>
        <RadialBarChart
          data={data}
          innerRadius="28%"
          outerRadius="100%"
          barSize={14}
          startAngle={90}
          endAngle={-270}
          accessibilityLayer={false}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip
            cursor={false}
            isAnimationActive={false}
            allowEscapeViewBox={{ x: true, y: true }}
            content={(p: TipProps) => {
              const d = first(p) as (RingRow & { pct: number }) | undefined;
              if (!p.active || !d) return null;
              return (
                <TipCard
                  label={d.name}
                  rows={[
                    {
                      key: d.key,
                      name: `${d.target > 0 ? Math.round((d.value / d.target) * 100) : 0}% of goal`,
                      value: `${num(d.value)} of ${num(d.target)}`,
                      color: d.fill,
                    },
                  ]}
                />
              );
            }}
          />
          <RadialBar
            dataKey="pct"
            cornerRadius={7}
            background={{ fill: "var(--color-border-divider)", fillOpacity: 0.6 }}
            isAnimationActive={motion}
            animationDuration={600}
            onMouseEnter={(_, i) => setHover(i)}
            onMouseLeave={() => setHover(undefined)}
          >
            {data.map((d, i) => (
              <Cell key={d.key} fill={d.fill} fillOpacity={dimmed(hover, i)} />
            ))}
          </RadialBar>
        </RadialBarChart>
      </ChartBox>
      <svg
        aria-hidden
        viewBox={`0 0 ${size} ${size}`}
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
      >
        {rows.map((r, i) => {
          const f = r.target > 0 ? Math.min(1, Math.max(0, r.value / r.target)) : 0;
          if (f <= 0 || f >= 0.995) return null;
          const rad = hole + band * (i + 0.5);
          const a = f * Math.PI * 2 - Math.PI / 2;
          return (
            <circle
              key={r.key}
              data-slot="ring-tip"
              cx={size / 2 + rad * Math.cos(a)}
              cy={size / 2 + rad * Math.sin(a)}
              r={tip / 2}
              fill={r.fill}
              stroke="white"
              strokeWidth={Math.max(2, tip * 0.18)}
            />
          );
        })}
      </svg>
      {rows.map((r, i) => (
        <OverflowLap
          key={r.key}
          value={r.value}
          target={r.target}
          size={size}
          stroke={tip}
          radius={hole + band * (i + 0.5)}
          color={r.fill}
        />
      ))}
    </div>
  );
}

/* --------------------------------------------------------------------- pie */

export interface Slice {
  key: string;
  name: string;
  value: number;
  fill: string;
  text: string;
}

/** A pie with a words legend beside it. */
export function PieSlices({
  slices,
  label,
  size = 120,
  share = true,
}: {
  slices: Slice[];
  label: string;
  size?: number;
  share?: boolean;
}) {
  const motion = !useReducedMotion();
  const [hover, setHover] = useState<number | undefined>();
  const total = slices.reduce((s, x) => s + x.value, 0);
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);
  return (
    <div className="flex h-full min-w-0 flex-wrap items-center justify-center gap-x-5 gap-y-3">
      <div
        role="img"
        aria-label={label}
        className="relative shrink-0"
        style={{ width: size, height: size }}
      >
        <ChartBox height={size} fallbackWidth={size}>
          <PieChart accessibilityLayer={false}>
            <Tooltip
              isAnimationActive={false}
              allowEscapeViewBox={{ x: true, y: true }}
              content={(p: TipProps) => {
                const d = first(p) as Slice | undefined;
                if (!p.active || !d) return null;
                return (
                  <TipCard
                    label={d.name}
                    rows={[
                      {
                        key: d.key,
                        name: share ? `${pct(d.value)}% of the total` : "Status",
                        value: d.text,
                        color: d.fill,
                      },
                    ]}
                  />
                );
              }}
            />
            <Pie
              data={slices}
              dataKey="value"
              nameKey="key"
              startAngle={90}
              endAngle={-270}
              outerRadius={size / 2 - 2}
              innerRadius={0}
              paddingAngle={slices.length > 1 ? 1 : 0}
              stroke="white"
              strokeWidth={2}
              isAnimationActive={motion}
              animationDuration={600}
              onMouseEnter={(_, i) => setHover(i)}
              onMouseLeave={() => setHover(undefined)}
            >
              {slices.map((s, i) => (
                <Cell key={s.key} fill={s.fill} fillOpacity={dimmed(hover, i)} />
              ))}
            </Pie>
          </PieChart>
        </ChartBox>
      </div>
      <ul
        aria-label={`${label}, in words`}
        className="flex min-w-0 flex-1 basis-32 flex-col gap-1.5"
      >
        {slices.map((s, i) => (
          <li
            key={s.key}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(undefined)}
            className="flex min-w-0 items-center gap-2 text-[12px]"
          >
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.fill }}
            />
            <span className="min-w-0 flex-1 truncate type-item-title text-text-primary">
              {s.name}
            </span>
            <span className="shrink-0 tabular-nums text-text-secondary">
              {s.text}
              {share && total > 0 ? ` · ${pct(s.value)}%` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ----------------------------------------------------------- running total */

export interface MealEvent {
  t: number;
  amount: number;
  fill: string;
}

/** Calories as a running total after each meal, over the day. */
export function RunningTotalChart({
  events,
  start,
  end,
  goal,
  color,
  label,
  unit,
}: {
  events: MealEvent[];
  start: number;
  end: number;
  goal?: number;
  color: string;
  label: string;
  unit: string;
}) {
  const motion = !useReducedMotion();
  const [hover, setHover] = useState<number | undefined>();
  const sorted = [...events].sort((a, b) => a.t - b.t);
  const data = sorted.map((e, i) => ({
    ...e,
    total: sorted.slice(0, i + 1).reduce((s, x) => s + x.amount, 0),
  }));
  const last = data[data.length - 1]?.total ?? 0;
  const max = Math.max(goal ?? 0, last, 1) * 1.12;
  const lo = Math.floor(start / 3) * 3;
  const hi = Math.min(24, Math.max(lo + 3, Math.ceil(end / 3) * 3));
  const ticks = Array.from({ length: Math.floor((hi - lo) / 3) + 1 }, (_, i) => lo + i * 3);
  const yTicks = [0, 1, 2, 3].map((i) => Math.round((max / 1.12 / 3) * i));
  return (
    <div role="img" aria-label={label} className="size-full">
      <ChartBox>
        <BarChart data={data} margin={{ top: 10, right: 0, left: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis
            type="number"
            dataKey="t"
            domain={[lo, hi]}
            ticks={ticks}
            tickFormatter={hourTick}
            tickLine={false}
            axisLine={false}
            tick={TICK}
            allowDataOverflow
          />
          <YAxis
            orientation="right"
            width={36}
            domain={[0, max]}
            ticks={yTicks}
            tickLine={false}
            axisLine={false}
            tick={{ ...TICK, textAnchor: "start", dx: 6 }}
            tickFormatter={compact}
          />
          <Tooltip
            cursor={CURSOR}
            isAnimationActive={false}
            content={(p: TipProps) => {
              const d = first(p) as (MealEvent & { total: number }) | undefined;
              if (!p.active || !d) return null;
              return (
                <TipCard
                  label={clock(d.t)}
                  rows={[
                    {
                      key: "this",
                      name: "This one",
                      value: `${num(d.amount)} ${unit}`,
                      color: d.fill,
                    },
                    { key: "total", name: "Total so far", value: `${num(d.total)} ${unit}` },
                  ]}
                />
              );
            }}
          />
          {goal ? (
            <ReferenceLine
              y={goal}
              stroke={GOAL_STROKE}
              strokeOpacity={0.5}
              strokeDasharray="4 4"
              label={{
                value: `Goal ${num(goal)} ${unit}`,
                position: "insideTopLeft",
                fill: "var(--color-text-secondary)",
                fontSize: 10,
              }}
            />
          ) : null}
          <Bar
            dataKey="total"
            maxBarSize={28}
            radius={[7, 7, 0, 0]}
            isAnimationActive={motion}
            fill={color}
            onMouseEnter={(_, i) => setHover(i)}
            onMouseLeave={() => setHover(undefined)}
          >
            {data.map((d, i) => (
              <Cell key={`${d.t}-${i}`} fill={d.fill} fillOpacity={dimmed(hover, i)} />
            ))}
          </Bar>
        </BarChart>
      </ChartBox>
    </div>
  );
}

/* ------------------------------------------------------------- weight line */

export interface LinePoint {
  label: string;
  value: number | null;
}

/** A week of readings with the average line. */
export function WeightLineChart({
  data,
  color,
  label,
  unit,
}: {
  data: LinePoint[];
  color: string;
  label: string;
  unit: string;
}) {
  const motion = !useReducedMotion();
  const known = data.filter((d) => d.value !== null) as { label: string; value: number }[];
  const avg = known.reduce((s, d) => s + d.value, 0) / Math.max(1, known.length);
  return (
    <div role="img" aria-label={label} className="size-full">
      <ChartBox>
        <LineChart data={data} margin={{ top: 12, right: 0, left: 14, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={TICK} />
          <YAxis
            orientation="right"
            width={36}
            domain={["dataMin - 1", "dataMax + 1"]}
            tickCount={4}
            tickLine={false}
            axisLine={false}
            tick={{ ...TICK, textAnchor: "start", dx: 6 }}
            tickFormatter={(v: number) => String(Math.round(v * 10) / 10)}
          />
          <Tooltip
            cursor={CURSOR}
            isAnimationActive={false}
            content={(p: TipProps) => {
              const d = first(p) as LinePoint | undefined;
              if (!p.active || !d) return null;
              return (
                <TipCard
                  label={d.label}
                  rows={[
                    {
                      key: "w",
                      name: "Weight",
                      value: d.value === null ? "Not recorded" : `${d.value} ${unit}`,
                      color,
                    },
                  ]}
                />
              );
            }}
          />
          {known.length > 1 && (
            <ReferenceLine
              y={avg}
              stroke={GOAL_STROKE}
              strokeOpacity={0.5}
              strokeDasharray="4 4"
              label={{
                value: `Avg ${Math.round(avg * 10) / 10} ${unit}`,
                position: "insideTopLeft",
                fill: "var(--color-text-secondary)",
                fontSize: 10,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            connectNulls
            isAnimationActive={motion}
            dot={{ r: 4, fill: "var(--color-on-primary)", stroke: color, strokeWidth: 2.5 }}
            activeDot={{ r: 6, fill: color, stroke: "var(--color-on-primary)", strokeWidth: 2 }}
          />
        </LineChart>
      </ChartBox>
    </div>
  );
}

/* ----------------------------------------------------------- insight chart */

export interface InsightReading {
  key: string;
  label: string;
  value: number | null;
  prev: number | null;
}

type DotProps = { cx?: number; cy?: number; index?: number; payload?: { value: number | null } };
function dotWith(selected: number, r: number, rSelected: number, fill: (v: number) => string) {
  function Dot({ cx, cy, index = 0, payload }: DotProps) {
    if (cx === undefined || cy === undefined || payload?.value == null) return <g key={index} />;
    return (
      <circle
        key={index}
        cx={cx}
        cy={cy}
        r={index === selected ? rSelected : r}
        fill={fill(payload.value)}
        stroke="white"
        strokeWidth={2}
      />
    );
  }
  return Dot;
}

/** The metric page's main chart: bars, lollipops or a line, with goal/limit, selection and compare. */
export function InsightChart({
  data,
  kind,
  direction,
  accent,
  target,
  unit,
  selected,
  onSelect,
  compare,
  manyDays,
}: {
  data: InsightReading[];
  kind: "bars" | "line" | "lollipop";
  direction: "limit" | "target" | "floor" | "none";
  accent: string;
  target: number | null;
  unit: string;
  selected: number;
  onSelect: (i: number) => void;
  compare: boolean;
  manyDays: boolean;
}) {
  const motion = !useReducedMotion();
  const hatch = `hatch-${useId().replace(/:/g, "")}`;
  const values = data.flatMap((d) => [d.value, d.prev]).filter((v): v is number => v !== null);
  const top = Math.max(1, target ?? 0, ...values) * 1.18;
  const lineLow = (() => {
    if (kind !== "line" || values.length === 0) return 0;
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    return Math.max(0, Math.floor(lo - Math.max(1, (hi - lo) * 0.3)));
  })();
  const lineHigh =
    kind === "line" && values.length
      ? Math.ceil(
          Math.max(...values) + Math.max(1, (Math.max(...values) - Math.min(...values)) * 0.3),
        )
      : top;
  const over = (v: number | null) =>
    direction === "limit" && target !== null && v !== null && v > target;
  const pick = (s: { activeTooltipIndex?: number | string | null } | undefined) => {
    if (typeof s?.activeTooltipIndex === "number") onSelect(s.activeTooltipIndex);
  };
  const zone =
    direction === "limit"
      ? "url(#" + hatch + ")"
      : "color-mix(in srgb, var(--color-teal-500) 10%, transparent)";
  const selKey = data[selected]?.key;
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <ChartBox>
          <ComposedChart
            data={data}
            margin={{ top: 16, right: 0, bottom: 0, left: 0 }}
            accessibilityLayer={false}
            onMouseMove={pick}
            onClick={pick}
          >
            <defs>
              <pattern
                id={hatch}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect
                  width="6"
                  height="6"
                  fill="color-mix(in srgb, var(--color-error-red) 6%, transparent)"
                />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="6"
                  stroke="var(--color-error-red)"
                  strokeOpacity="0.28"
                  strokeWidth="2"
                />
              </pattern>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            {(direction === "limit" || direction === "target") &&
              kind === "line" &&
              target !== null && (
                <ReferenceArea
                  y1={target}
                  y2={lineHigh}
                  fill={zone}
                  stroke="none"
                  ifOverflow="hidden"
                />
              )}
            <XAxis
              dataKey="key"
              tickLine={false}
              axisLine={false}
              interval={manyDays ? Math.ceil(data.length / 6) - 1 : 0}
              tick={TICK}
              tickFormatter={(_: string, i: number) => data[i]?.label ?? ""}
            />
            <YAxis
              width={36}
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ ...TICK, textAnchor: "start", dx: 6 }}
              domain={kind === "line" ? [lineLow, lineHigh] : [0, top]}
              tickFormatter={compact}
            />
            {target !== null && (
              <ReferenceLine
                y={target}
                stroke={GOAL_STROKE}
                strokeOpacity={0.55}
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
                label={{
                  value: `${direction === "limit" ? "Limit" : "Goal"} ${num(target)} ${unit}`,
                  position: "insideTopLeft",
                  fill: "var(--color-text-secondary)",
                  fontSize: 10,
                }}
              />
            )}
            {selKey && <ReferenceLine x={selKey} {...CURSOR} />}
            {kind === "bars" && (
              <Bar
                dataKey="value"
                barSize={14}
                radius={[5, 5, 0, 0]}
                isAnimationActive={motion}
                animationDuration={500}
              >
                {data.map((d, i) => (
                  <Cell
                    key={d.key}
                    fill={over(d.value) ? limitColor : accent}
                    fillOpacity={i === selected ? 0.95 : 0.6}
                  />
                ))}
              </Bar>
            )}
            {kind === "lollipop" && (
              <Bar
                dataKey="value"
                barSize={3}
                radius={2}
                isAnimationActive={motion}
                animationDuration={500}
              >
                {data.map((d, i) => (
                  <Cell
                    key={d.key}
                    fill={over(d.value) ? limitColor : accent}
                    fillOpacity={i === selected ? 0.9 : 0.55}
                  />
                ))}
              </Bar>
            )}
            {kind === "lollipop" && (
              <Line
                dataKey="value"
                stroke="none"
                isAnimationActive={motion}
                activeDot={false}
                dot={dotWith(selected, 5, 7, (v) => (over(v) ? limitColor : accent))}
              />
            )}
            {kind === "line" && (
              <Line
                dataKey="value"
                stroke={accent}
                strokeWidth={2.5}
                connectNulls
                dot={dotWith(selected, 3.5, 6, () => accent)}
                activeDot={false}
                isAnimationActive={motion}
              />
            )}
            {compare && (
              <Line
                dataKey="prev"
                stroke="var(--color-text-secondary)"
                strokeOpacity={0.7}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                activeDot={false}
                connectNulls
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ChartBox>
      </div>
      {compare && (
        <p
          aria-hidden
          className="mt-1 flex flex-wrap gap-x-4 text-[12px] type-meta text-text-secondary"
        >
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm" style={{ backgroundColor: accent }} />
            This period
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-text-secondary" />
            The period before
          </span>
        </p>
      )}
    </div>
  );
}
