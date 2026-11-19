"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Golden-angle spiral of dots: the same scattered, swirling look as the ForkThis! assistant mark. */
const DOTS = Array.from({ length: 26 }, (_, i) => {
  const a = i * 2.399963;
  const r = 4 + Math.sqrt(i + 1) * 5.2;
  return {
    x: 50 + Math.cos(a) * r,
    y: 50 + Math.sin(a) * r,
    r: 1.2 + ((i * 7) % 5) * 0.55,
    o: 0.35 + ((i * 3) % 6) * 0.11,
  };
});

/**
 * The assistant's animated mark: orange dots swirling in a round tile.
 * `onDark` = white tile (used inside the orange floating button).
 */
export function AssistantMark({
  size = 40,
  animated = false,
  onDark = false,
  className,
}: {
  size?: number;
  animated?: boolean;
  onDark?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <span
      aria-hidden
      data-assistant-mark
      data-animated={animated}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        onDark ? "bg-white" : "bg-accent-soft",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size * 0.86}
        height={size * 0.86}
        className={cn(animated && "motion-safe:animate-[assistant-swirl_14s_linear_infinite]")}
      >
        <defs>
          <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.9" />
          </filter>
        </defs>
        <g filter={`url(#${id}-soft)`} fill="var(--color-design-orange)">
          {DOTS.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} opacity={d.o} />
          ))}
        </g>
      </svg>
    </span>
  );
}
