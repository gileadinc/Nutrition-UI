"use client";

import { cloneElement, useEffect, useRef, useState, type ReactElement } from "react";
import { cn } from "@/lib/utils";

/** Shared chart styling and primitives (the deployed app's chart kit). */
export const TICK = { fill: "var(--color-text-secondary)", fontSize: 10, fontWeight: 400 } as const;
export const GRID_STROKE = "var(--color-border-divider)";
export const GOAL_STROKE = "var(--color-text-secondary)";
export const CURSOR = {
  stroke: "var(--color-text-secondary)",
  strokeOpacity: 0.5,
  strokeWidth: 1,
} as const;
export const DIM = 0.35;
export const limitColor = "var(--color-error-red)";

/** 1,200 -> "1.2k"; everything else rounds. */
export const compact = (n: number) =>
  n >= 1000 ? `${(Math.round(n / 100) / 10).toString()}k` : String(Math.round(n));
export const num = (n: number) => Math.round(n).toLocaleString("en-US");

/** Opacity for a slice/bar while another one is hovered. */
export const dimmed = (hover: number | undefined, i: number) =>
  hover === undefined || hover === i ? 1 : DIM;

function useSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const next = { width: Math.round(r.width), height: Math.round(r.height) };
      setSize((s) => (s.width === next.width && s.height === next.height ? s : next));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** Measures its box and hands the chart a width/height (Recharts charts take them as props). */
export function ChartBox({
  height,
  fallbackWidth = 320,
  fallbackHeight = 200,
  className,
  children,
}: {
  height?: number;
  fallbackWidth?: number;
  fallbackHeight?: number;
  className?: string;
  children: ReactElement<{ width?: number; height?: number }>;
}) {
  const [ref, size] = useSize();
  const w = size.width > 0 ? size.width : fallbackWidth;
  const h = height ?? (size.height > 0 ? size.height : fallbackHeight);
  return (
    <div
      ref={ref}
      data-slot="chart"
      className={cn(
        "relative w-full min-w-0 text-xs type-meta [&_.recharts-layer]:outline-none [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
        className,
      )}
      style={{ height: height ?? "100%" }}
    >
      {cloneElement(children, { width: w, height: h })}
    </div>
  );
}

export interface TipRow {
  key: string;
  name: string;
  value: string;
  color?: string;
}

/** The small white tooltip card. */
export function TipCard({
  label,
  rows,
  className,
}: {
  label?: string;
  rows: TipRow[];
  className?: string;
}) {
  return (
    <div
      data-slot="chart-tooltip"
      className={cn(
        "grid min-w-[7.5rem] gap-1.5 rounded-lg border border-border-default bg-white px-2.5 py-1.5 text-xs type-meta shadow-raised",
        className,
      )}
    >
      {label && <div className="type-section-title text-text-primary">{label}</div>}
      <div className="grid gap-1">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-2">
            {r.color && (
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[4px]"
                style={{ backgroundColor: r.color }}
              />
            )}
            <span className="min-w-0 flex-1 text-text-secondary">{r.name}</span>
            <span className="type-row-figure tabular-nums text-text-primary">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** "6:30a" from an hour-of-day number. */
export const clock = (h: number) => {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${hh % 12 === 0 ? 12 : hh % 12}:${String(mm).padStart(2, "0")}${hh < 12 ? "a" : "p"}`;
};
export const hourTick = (h: number) =>
  h === 24 || h === 0 ? "12a" : h === 12 ? "12p" : h < 12 ? `${h}a` : `${h - 12}p`;
