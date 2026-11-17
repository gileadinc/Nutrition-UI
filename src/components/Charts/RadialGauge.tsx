"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/lib/hooks";

export interface RadialGaugeProps {
  value: number;
  min: number;
  max: number;
  decimals?: number;
  color: string;
  size?: number;
  stroke?: number;
  status?: string;
  /** Accessible name (omit with `decorative`). */
  label?: string;
  valueText?: string;
  decorative?: boolean;
  /** Draw only the ring, no centre text. */
  bare?: boolean;
  children?: ReactNode;
  className?: string;
}

const ease = (t: number) => 1 - (1 - t) ** 3;

/** Dotted-track radial progress ring with a count-up centre value. */
export function RadialGauge({
  value,
  min,
  max,
  decimals = 0,
  color,
  size = 160,
  stroke,
  status,
  label,
  valueText,
  decorative = false,
  bare = false,
  children,
  className,
}: RadialGaugeProps) {
  const sw = stroke ?? Math.max(4, Math.round(size * 0.075));
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const c = size / 2;
  const frac = max === min ? 0 : Math.min(1, Math.max(0, (value - min) / (max - min)));
  const eased = ease(frac);
  const counted = useCountUp(value, 1200);
  const dash = circ / (size < 64 ? 14 : 40);
  const fontSize = Math.round(size * 0.26);
  const a11y = decorative
    ? ({ "aria-hidden": true } as const)
    : ({
        role: "meter",
        "aria-label": label,
        "aria-valuemin": min,
        "aria-valuemax": max,
        "aria-valuenow": Number(value.toFixed(decimals)),
        "aria-valuetext": valueText,
      } as const);
  return (
    <div
      data-slot="radial-gauge"
      {...a11y}
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
        className="-rotate-90"
      >
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={color}
          strokeOpacity={0.16}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={`${dash * 0.4} ${dash * 0.6}`}
        />
        {frac > 0 && (
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={circ * (1 - eased)}
            className="transition-[stroke-dashoffset] duration-[1400ms] ease-[cubic-bezier(0.43,0.13,0.23,0.96)] motion-reduce:transition-none"
          />
        )}
      </svg>
      {!bare && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children ?? (
            <span
              className="type-numeral leading-none tabular-nums text-brand-navy"
              style={{ fontSize, letterSpacing: `${(fontSize * -0.04).toFixed(2)}px` }}
            >
              {counted.toFixed(decimals) === value.toFixed(decimals) ? (
                value.toFixed(decimals)
              ) : (
                <>
                  <span aria-hidden>{counted.toFixed(decimals)}</span>
                  <span className="sr-only">{value.toFixed(decimals)}</span>
                </>
              )}
            </span>
          )}
          {status && (
            <span
              className="mt-1 max-w-[80%] truncate type-meta text-text-secondary"
              style={{ fontSize: Math.max(10, Math.round(size * 0.075)) }}
            >
              {status}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
