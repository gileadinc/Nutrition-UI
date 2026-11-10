"use client";

import { useEffect, useState } from "react";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function canAnimate() {
  return typeof requestAnimationFrame === "function" && !prefersReducedMotion();
}

/**
 * Counts up to `target` with a cubic ease-out, as the plan reveal does in the
 * design. Returns `target` straight away when motion is reduced or on the
 * server, so the number is never missing.
 */
export function useCountUp(target: number | null, durationMs = 1200) {
  const duration = Math.min(durationMs, 1500);
  const [progress, setProgress] = useState(() => (canAnimate() ? 0 : 1));

  useEffect(() => {
    if (target === null || !canAnimate()) return;
    let frame = 0;
    let start: number | undefined;
    const step = (now: number) => {
      start ??= now;
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      setProgress(1 - (1 - t) ** 3);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  if (target === null) return null;
  return canAnimate() ? Math.round(target * progress) : target;
}
