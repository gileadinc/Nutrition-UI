"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { ChartBox, DIM, GOAL_STROKE, GRID_STROKE, TICK, TipCard, num } from "./chartKit";

interface TipProps {
  active?: boolean;
  payload?: ReadonlyArray<{
    payload?: Record<string, unknown>;
    dataKey?: unknown;
    value?: unknown;
    color?: string;
  }>;
}
const first = (p: TipProps) => p.payload?.[0]?.payload;
const TRACK_FILL = "var(--color-border-divider)";

/* ------------------------------------------------------------- daily goals */

export interface GoalRow {
  key: string;
  label: string;
  /** Percent of goal, capped at 100 for the ring. */
  share: number;
  /** Percent of goal, or null when nothing is logged. */
  pct: number | null;
  fill: string;
  read: { value: number; goal: number; unit: string } | null;
}

/** One ring per goal, with a list that highlights the matching ring. */
export function DailyGoalsChart({ rows }: { rows: GoalRow[] }) {
  const motion = !useReducedMotion();
  const [on, setOn] = useState<string | null>(null);
  const active = rows.find((r) => r.key === on);
  const reached = rows.filter((r) => r.pct !== null && r.pct >= 100).length;
  return (
    <div className="flex h-full flex-wrap items-center justify-center gap-x-4 gap-y-3">
      <div className="relative size-[10.5rem] shrink-0">
        <div aria-hidden className="absolute inset-0">
          <ChartBox height={168} fallbackWidth={168}>
            <RadialBarChart
              data={rows}
              innerRadius="40%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              barSize={7}
              accessibilityLayer={false}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar
                dataKey="share"
                background={{ fill: TRACK_FILL }}
                cornerRadius={5}
                isAnimationActive={motion}
                animationDuration={700}
              >
                {rows.map((r) => (
                  <Cell
                    key={r.key}
                    fill={r.fill}
                    fillOpacity={on === null || on === r.key ? 1 : DIM}
                  />
                ))}
              </RadialBar>
            </RadialBarChart>
          </ChartBox>
        </div>
        <div
          aria-live="polite"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          <span className="text-[22px] leading-6 type-row-figure tabular-nums text-brand-navy">
            {active ? (active.pct === null ? "–" : `${active.pct}%`) : `${reached}/${rows.length}`}
          </span>
          <span className="text-[11px] type-meta text-text-secondary">
            {active ? active.label : "reached"}
          </span>
        </div>
      </div>
      <ul
        aria-label="Today against each goal"
        className="flex min-w-[10rem] flex-1 flex-col gap-0.5 text-[12px]"
      >
        {rows.map((r) => (
          <li key={r.key}>
            <button
              type="button"
              aria-pressed={on === r.key}
              onClick={() => setOn(r.key)}
              onMouseEnter={() => setOn(r.key)}
              onMouseLeave={() => setOn(null)}
              onFocus={() => setOn(r.key)}
              onBlur={() => setOn(null)}
              className={cn(
                "tap-44 relative flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors",
                on === r.key ? "bg-brand-warm-gray" : "hover:bg-brand-warm-gray/50",
              )}
            >
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: r.fill }}
              />
              <span className="min-w-0 flex-1 truncate text-text-primary">{r.label}</span>
              <span className="shrink-0 tabular-nums text-text-secondary">
                {r.read
                  ? `${num(r.read.value)} / ${num(r.read.goal)} ${r.read.unit}`
                  : "Not logged"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------- nutrient balance */

export interface NutrientRow {
  key: string;
  label: string;
  unit: string;
  kind: "limit" | "goal";
  value: number | null;
  target: number;
  pct: number;
  status: string;
  fill: string;
}
const CAP = 160;

/** Goals and limits as a share of each, one bar per nutrient. */
export function NutrientBalanceChart({ rows }: { rows: NutrientRow[] }) {
  const motion = !useReducedMotion();
  const words = rows
    .map(
      (r) =>
        `${r.label}: ${r.value === null ? "not recorded" : `${num(r.value)} of ${num(r.target)} ${r.unit}, ${r.status.toLowerCase()}`}`,
    )
    .join(". ");
  return (
    <div role="img" aria-label={`Nutrient goals and limits. ${words}`} className="h-full">
      <ChartBox className="h-full">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
          barCategoryGap="26%"
          accessibilityLayer={false}
        >
          <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
          <XAxis
            type="number"
            domain={[0, CAP]}
            ticks={[0, 50, 100, 150]}
            tickLine={false}
            axisLine={false}
            height={20}
            tick={TICK}
            tickFormatter={(v: number) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={86}
            tickLine={false}
            axisLine={false}
            tick={{ ...TICK, fontSize: 11 }}
          />
          <ReferenceLine x={100} stroke={GOAL_STROKE} strokeOpacity={0.5} strokeDasharray="4 4" />
          <Tooltip
            cursor={{ fill: "var(--color-brand-warm-gray)", fillOpacity: 0.6 }}
            isAnimationActive={false}
            content={(p: TipProps) => {
              const d = first(p) as unknown as NutrientRow | undefined;
              if (!p.active || !d) return null;
              return (
                <TipCard
                  label={d.label}
                  rows={[
                    {
                      key: "v",
                      name: d.kind === "limit" ? "So far" : "Reached",
                      value: d.value === null ? "Not recorded" : `${num(d.value)} ${d.unit}`,
                    },
                    {
                      key: "t",
                      name: d.kind === "limit" ? "Limit" : "Goal",
                      value: `${num(d.target)} ${d.unit}`,
                    },
                    {
                      key: "s",
                      name: "Status",
                      value:
                        d.kind === "limit" && d.value !== null && d.value > d.target
                          ? `Over limit by ${num(d.value - d.target)} ${d.unit}`
                          : d.status,
                    },
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="pct"
            radius={[0, 4, 4, 0]}
            maxBarSize={14}
            background={{ fill: TRACK_FILL, fillOpacity: 0.5, radius: 4 }}
            isAnimationActive={motion}
            animationDuration={600}
          >
            {rows.map((r) => (
              <Cell key={r.key} fill={r.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartBox>
    </div>
  );
}

/* ---------------------------------------------------------- macros by meal */

export interface MealMacros {
  meal: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}
const MACROS = [
  { key: "protein", label: "Protein", color: "var(--color-graphic)" },
  { key: "carbs", label: "Carbs", color: "var(--color-accent-graphic)" },
  { key: "fat", label: "Fat", color: "var(--color-badge-gold)" },
] as const;

/** Stacked grams per meal, with toggles for which macros show. */
export function MacrosByMealChart({ data }: { data: MealMacros[] }) {
  const motion = !useReducedMotion();
  const [shown, setShown] = useState<Set<string>>(new Set(["protein", "carbs", "fat"]));
  const toggle = (k: string) =>
    setShown((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  return (
    <div className="flex h-full flex-col gap-2">
      <div role="group" aria-label="Macros shown" className="flex flex-wrap gap-1.5">
        {MACROS.map((m) => {
          const on = shown.has(m.key);
          return (
            <button
              key={m.key}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(m.key)}
              className={cn(
                "tap-44 relative flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px]",
                on
                  ? "border-transparent bg-selected text-on-selected type-button"
                  : "border-border-default bg-white text-text-secondary type-button-secondary",
              )}
            >
              {!on && (
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: m.color }}
                />
              )}
              {m.label}
            </button>
          );
        })}
      </div>
      <div
        role="img"
        aria-label={`Macros by meal, in grams. ${data.map((d) => `${d.meal}: ${d.protein} protein, ${d.carbs} carbs, ${d.fat} fat`).join(". ")}`}
        className="min-h-0 flex-1"
      >
        <ChartBox className="h-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
            barCategoryGap="28%"
            accessibilityLayer={false}
          >
            <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              height={20}
              tick={TICK}
              tickCount={4}
              tickFormatter={(v: number) => `${v}g`}
            />
            <YAxis
              type="category"
              dataKey="meal"
              width={66}
              tickLine={false}
              axisLine={false}
              tick={{ ...TICK, fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "var(--color-brand-warm-gray)", fillOpacity: 0.6 }}
              isAnimationActive={false}
              content={(p: TipProps) => {
                const d = first(p) as unknown as MealMacros | undefined;
                if (!p.active || !d || !p.payload) return null;
                return (
                  <TipCard
                    label={d.meal}
                    rows={[
                      ...p.payload.map((e) => ({
                        key: String(e.dataKey),
                        name: MACROS.find((m) => m.key === e.dataKey)?.label ?? String(e.dataKey),
                        value: `${num(Number(e.value ?? 0))} g`,
                        color: e.color,
                      })),
                      { key: "k", name: "Calories", value: `${num(d.calories)} kcal` },
                    ]}
                  />
                );
              }}
            />
            {MACROS.filter((m) => shown.has(m.key)).map((m) => (
              <Bar
                key={m.key}
                dataKey={m.key}
                stackId="m"
                fill={m.color}
                maxBarSize={16}
                stroke="white"
                strokeWidth={1}
                isAnimationActive={motion}
                animationDuration={600}
              />
            ))}
          </BarChart>
        </ChartBox>
      </div>
    </div>
  );
}
