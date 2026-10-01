"use client";

import { Cell, Pie, PieChart } from "recharts";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/hooks";

const KCAL = { protein: 4, carbs: 4, fat: 9 } as const;
const LABEL = { protein: "Protein", carbs: "Carbs", fat: "Fat" } as const;
const COLOR = {
  protein: "var(--color-graphic)",
  carbs: "var(--color-accent-graphic)",
  fat: "var(--color-badge-gold)",
} as const;
const KEYS = ["protein", "carbs", "fat"] as const;

export interface MacroGrams {
  protein: number;
  carbs: number;
  fat: number;
}

function slices(m: MacroGrams) {
  const kcal = KEYS.map((k) => Math.max(0, m[k]) * KCAL[k]);
  const sum = kcal.reduce((a, b) => a + b, 0);
  return KEYS.map((key, i) => ({
    key,
    label: LABEL[key],
    grams: Math.round(m[key]),
    kcal: kcal[i],
    pct: sum === 0 ? 0 : Math.round((kcal[i] / sum) * 100),
    color: COLOR[key],
  }));
}

/** Small colour-keyed legend list. */
export function ChartLegend({
  items,
  className,
  textClassName = "text-[11px]",
}: {
  items: { key: string; label: string; color: string; detail?: string }[];
  className?: string;
  textClassName?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-x-3 gap-y-1", className)}>
      {items.map((e) => (
        <li key={e.key} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-[3px]"
            style={{ backgroundColor: e.color }}
          />
          <span className={cn(textClassName, "type-meta text-text-secondary")}>{e.label}</span>
          {e.detail && (
            <span className={cn(textClassName, "type-row-figure tabular-nums text-text-primary")}>
              {e.detail}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Protein / carbs / fat donut with centre total and legend. */
export function MacroDonut({
  macros,
  total,
  totalUnit = "kcal",
  size = 148,
  title = "Macro split",
  variant = "chart",
  className,
}: {
  macros: MacroGrams;
  total?: number;
  totalUnit?: string;
  size?: number;
  title?: string;
  variant?: "chart" | "detail";
  className?: string;
}) {
  const reduced = useReducedMotion();
  const detail = variant === "detail";
  const data = slices(macros);
  const sum = data.reduce((a, b) => a + b.kcal, 0);
  if (sum === 0) return null;
  const center = Math.round(total ?? sum);
  const aria = `${title}: ${data.map((d) => `${d.label} ${d.pct}% (${d.grams} g)`).join(", ")}.`;
  return (
    <figure
      data-slot="macro-donut"
      role="img"
      aria-label={aria}
      className={cn("flex flex-wrap items-center gap-x-5 gap-y-3", className)}
    >
      <div aria-hidden className="relative shrink-0" style={{ width: size, height: size }}>
        <PieChart width={size} height={size} accessibilityLayer={false}>
          <Pie
            data={data}
            dataKey="kcal"
            nameKey="label"
            innerRadius={size * 0.32}
            outerRadius={size * 0.48}
            cornerRadius={6}
            paddingAngle={3}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={!reduced}
            animationDuration={700}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className={cn(
              "type-numeral leading-none tabular-nums tracking-[-0.9px] text-brand-navy",
              detail ? "text-2xl" : "text-[22px]",
            )}
          >
            {center.toLocaleString("en-US")}
          </span>
          <span
            className={cn(
              "mt-0.5 type-meta text-text-secondary",
              detail ? "text-onb-meta" : "text-[11px]",
            )}
          >
            {totalUnit}
          </span>
        </div>
      </div>
      <figcaption className="min-w-0 flex-1">
        <ChartLegend
          className="flex-col gap-y-2"
          textClassName={detail ? "text-onb-meta" : undefined}
          items={data.map((d) => ({
            key: d.key,
            label: d.label,
            color: d.color,
            detail: `${d.grams} g · ${d.pct}%`,
          }))}
        />
      </figcaption>
    </figure>
  );
}
