"use client";

import { useId, type ReactNode } from "react";
import { useCountUp } from "@/lib/hooks";

export interface RingPart {
  key: string;
  value: number;
  color: string;
}

/** Multi-part progress ring (calories by meal, protein, ...). Port of the deployed SegmentedRing. */
export function SegmentedRing({
  parts,
  goal,
  size,
  stroke,
  trackColor,
  label,
  fluid = false,
  children,
}: {
  parts: RingPart[];
  goal: number;
  size: number;
  stroke: number;
  trackColor: string;
  label: string;
  fluid?: boolean;
  children?: ReactNode;
}) {
  const filterId = useId();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const c = size / 2;
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0);
  const frac = goal <= 0 ? 0 : Math.min(2, total / goal);
  const shown = useCountUp(frac, 900);
  const share = (p: RingPart) => (goal <= 0 ? 0 : Math.max(0, p.value) / goal);
  const spans = parts.map((p, i) => {
    const start = parts.slice(0, i).reduce((s, q) => s + share(q), 0);
    return { ...p, start: Math.min(2, start), end: Math.min(2, start + share(p)) };
  });
  const visible = spans.filter((s) => s.end > s.start);
  const lastEnd = visible.length ? visible[visible.length - 1].end : 0;
  const gap = stroke / 2 + 1;
  const pieces: { key: string; color: string; from: number; to: number; lap: number }[] = [];
  for (const s of visible) {
    const upTo = Math.min(s.end, shown);
    if (upTo <= s.start) continue;
    for (const lap of [1, 2]) {
      const lo = Math.max(s.start, lap - 1);
      const hi = Math.min(upTo, lap);
      if (hi <= lo) continue;
      let from = (lo - (lap - 1)) * circ;
      let to = (hi - (lap - 1)) * circ;
      if (s.start > 0 && lo === s.start) from += gap;
      if (hi === s.end && s.end !== lastEnd) to -= gap;
      if (to <= from) {
        const mid = (from + to) / 2;
        from = mid;
        to = mid + 0.01;
      }
      pieces.push({ key: `${s.key}-${lap}`, color: s.color, from, to, lap });
    }
  }
  const over = Math.max(0, frac - 1);
  const angle = over * 2 * Math.PI - Math.PI / 2;
  const off = stroke * 0.35;
  const sx = c + r * Math.cos(angle) - Math.sin(angle) * off;
  const sy = c + r * Math.sin(angle) + Math.cos(angle) * off;
  const showShadow = over > 0 && shown > 1;
  const piece = (p: (typeof pieces)[number]) => (
    <circle
      key={p.key}
      data-piece={p.key}
      cx={c}
      cy={c}
      r={r}
      fill="none"
      stroke={p.color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeDasharray={`${p.to - p.from} ${circ}`}
      transform={`rotate(${-90 + (p.from / circ) * 360} ${c} ${c})`}
    />
  );
  return (
    <div
      role="img"
      aria-label={label}
      data-slot="segmented-ring"
      className={fluid ? "relative aspect-square w-full" : "relative shrink-0"}
      style={fluid ? { maxWidth: size } : { width: size, height: size }}
    >
      <svg
        aria-hidden="true"
        width={fluid ? "100%" : size}
        height={fluid ? "100%" : size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
      >
        <defs>
          <filter id={filterId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={stroke * 0.28} />
          </filter>
        </defs>
        <circle
          data-slot="ring-track"
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        {pieces.filter((p) => p.lap === 1).map(piece)}
        {showShadow && (
          <circle
            cx={sx}
            cy={sy}
            r={stroke * 0.5}
            fill="var(--color-text-primary)"
            fillOpacity={0.45}
            filter={`url(#${CSS.escape(filterId)})`}
          />
        )}
        {pieces.filter((p) => p.lap === 2).map(piece)}
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}
