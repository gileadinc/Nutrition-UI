"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/lib/hooks";

const GAP = 0.03;

/** Single-colour progress ring (optionally with a shadowed second lap). */
export function MiniRing({
  value,
  goal,
  size,
  stroke,
  color,
  overlap = false,
  fluid = false,
  label,
  children,
}: {
  value: number;
  goal: number;
  size: number;
  stroke: number;
  color: string;
  overlap?: boolean;
  fluid?: boolean;
  label: string;
  children?: ReactNode;
}) {
  const filterId = useId();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const c = size / 2;
  const raw = goal <= 0 ? 0 : Math.max(0, value / goal);
  const capped = Math.min(overlap ? 2 : 1, raw);
  const shown = useCountUp(capped);
  const lap1 = Math.min(1, shown);
  const lap2 = overlap ? Math.max(0, shown - 1) : 0;
  const over = overlap ? Math.max(0, capped - 1) : 0;
  const transition = { transition: "stroke-dasharray 1s ease, transform 1s ease" };
  const arc = (frac: number, key: string) => (
    <circle
      key={key}
      cx={c}
      cy={c}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeDasharray={`${circ * frac} ${circ}`}
      transform={`rotate(-90 ${c} ${c})`}
      className="motion-reduce:!transition-none"
      style={transition}
    />
  );
  const gapFrac = GAP + (stroke / 2 / circ) * 2;
  const ghostFrac = Math.max(0, 1 - lap1 - gapFrac * 2);
  const showGhost = lap2 === 0 && lap1 > 0 && lap1 <= 0.9 && ghostFrac > 0;
  const angle = over * 2 * Math.PI - Math.PI / 2;
  const off = stroke * 0.35;
  const sx = c + r * Math.cos(angle) - Math.sin(angle) * off;
  const sy = c + r * Math.sin(angle) + Math.cos(angle) * off;
  return (
    <div
      className={fluid ? "relative aspect-square w-full" : "relative shrink-0"}
      style={fluid ? { maxWidth: size } : { width: size, height: size }}
    >
      <svg
        width={fluid ? "100%" : size}
        height={fluid ? "100%" : size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label}
        className={fluid ? "block" : undefined}
      >
        <defs>
          <filter id={filterId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={stroke * 0.28} />
          </filter>
        </defs>
        {showGhost ? (
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={color}
            strokeOpacity={0.22}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circ * ghostFrac} ${circ}`}
            className="motion-reduce:!transition-none"
            style={{
              ...transition,
              transform: `rotate(${-90 + (lap1 + gapFrac) * 360}deg)`,
              transformOrigin: `${c}px ${c}px`,
            }}
          />
        ) : (
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={color}
            strokeOpacity={0.22}
            strokeWidth={stroke}
          />
        )}
        {capped > 0 && arc(lap1, "first")}
        {over > 0 && (
          <>
            {lap2 > 0 && (
              <circle
                cx={sx}
                cy={sy}
                r={stroke * 0.5}
                fill="var(--color-text-primary)"
                fillOpacity={0.45}
                filter={`url(#${CSS.escape(filterId)})`}
                className="motion-safe:animate-[fade-in_300ms_ease-out_900ms_backwards]"
              />
            )}
            {arc(lap2, "second")}
          </>
        )}
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}

export interface MiniPoint {
  label: string;
  value: number;
}

function Tip({
  left,
  top,
  bottom,
  text,
}: {
  left: string;
  top?: number;
  bottom?: number;
  text: string;
}) {
  return (
    <span
      className="pointer-events-none absolute z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-text-primary px-1.5 py-0.5 text-[10px] type-row-figure tabular-nums text-text-on-dark"
      style={{ left, top, bottom }}
    >
      {text}
    </span>
  );
}

/** Tiny bar / line chart used on cards. */
export function MiniChart({
  points,
  color,
  variant = "bars",
  goal,
  height = 52,
  showLabels = true,
  format = (v) => String(Math.round(v)),
  label,
  className,
}: {
  points: MiniPoint[];
  color: string;
  variant?: "bars" | "line";
  goal?: number;
  height?: number;
  showLabels?: boolean;
  format?: (v: number) => string;
  label?: string;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const positives = points.filter((p) => p.value > 0).map((p) => p.value);
  const labelH = showLabels ? 14 : 0;
  const h = height - labelH;
  const aria = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true as const };
  const opacity = (i: number) =>
    hover === null
      ? i === points.length - 1
        ? 1
        : 0.45
      : i === hover
        ? 1
        : Math.abs(i - hover) === 1
          ? 0.55
          : 0.25;
  const active = hover !== null && points[hover]?.value > 0 ? points[hover] : null;

  if (variant === "line") {
    const min = positives.length ? Math.min(...positives) : 0;
    const max = positives.length ? Math.max(...positives) : 1;
    const pad = max - min < 0.5 ? 1 : (max - min) * 0.25;
    const lo = min - pad;
    const hi = max + pad;
    const px = (i: number) => (points.length === 1 ? 50 : (i / (points.length - 1)) * 100);
    const py = (v: number) => h - 6 - ((v - lo) / (hi - lo)) * (h - 12);
    const pts = points.map((p, i) => ({ ...p, i })).filter((p) => p.value > 0);
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${px(p.i)},${py(p.value)}`).join(" ");
    const area =
      pts.length > 1 ? `${line} L${px(pts[pts.length - 1].i)},${h} L${px(pts[0].i)},${h} Z` : "";
    return (
      <div
        data-slot="mini-chart"
        {...aria}
        className={cn("relative w-full", className)}
        style={{ height }}
        onMouseLeave={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 100 ${h}`}
          preserveAspectRatio="none"
          className="absolute inset-x-0 top-0 w-full"
          style={{ height: h }}
        >
          {area && <path d={area} fill={color} fillOpacity={0.12} />}
          {line && (
            <path
              d={line}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        {pts.map((p) => (
          <span
            key={p.i}
            className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white motion-safe:transition-transform motion-safe:duration-200"
            style={{
              left: `${px(p.i)}%`,
              top: py(p.value),
              backgroundColor: color,
              opacity: opacity(p.i),
              transform: `translate(-50%, -50%) scale(${hover === p.i ? 1.35 : 1})`,
            }}
          />
        ))}
        <div className="absolute inset-0 flex">
          {points.map((p, i) => (
            <span
              key={i}
              className="flex h-full flex-1 flex-col justify-end"
              onMouseEnter={() => setHover(i)}
            >
              {showLabels && (
                <span
                  className={cn(
                    "text-center text-[9px] type-meta leading-[14px]",
                    hover === i ? "text-text-primary" : "text-text-secondary",
                  )}
                >
                  {p.label}
                </span>
              )}
            </span>
          ))}
        </div>
        {active && hover !== null && (
          <Tip
            left={`${px(hover)}%`}
            top={Math.max(0, py(active.value) - 26)}
            text={format(active.value)}
          />
        )}
      </div>
    );
  }

  const max = Math.max(1, goal ?? 0, ...positives) * 1.15;
  return (
    <div
      data-slot="mini-chart"
      {...aria}
      className={cn("relative w-full", className)}
      style={{ height }}
      onMouseLeave={() => setHover(null)}
    >
      {goal !== undefined && goal > 0 && (
        <span
          className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-text-secondary/50"
          style={{ bottom: labelH + (goal / max) * h }}
        />
      )}
      <div className={cn("flex h-full items-end", points.length > 14 ? "gap-px" : "gap-1")}>
        {points.map((p, i) => (
          <span
            key={i}
            className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
            onMouseEnter={() => setHover(i)}
          >
            <span
              data-slot="mini-bar"
              className={cn(
                "w-full max-w-[12px] rounded-full motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-out",
                points.length > 14 && "rounded-[2px]",
              )}
              style={{
                height: p.value > 0 ? Math.max(3, (p.value / max) * h) : 0,
                backgroundColor: color,
                opacity: opacity(i),
                transform: hover === i ? "scaleX(1.15)" : undefined,
                transformOrigin: "bottom",
              }}
            />
            {showLabels && (
              <span
                className={cn(
                  "mt-0.5 h-[12px] text-[9px] type-meta leading-[12px]",
                  hover === i ? "text-text-primary" : "text-text-secondary",
                )}
              >
                {p.label}
              </span>
            )}
            {hover === i && p.value > 0 && (
              <Tip left="50%" bottom={labelH + (p.value / max) * h + 4} text={format(p.value)} />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
