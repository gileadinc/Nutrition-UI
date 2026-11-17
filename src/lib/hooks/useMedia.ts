"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

function mediaStore(query: string) {
  return {
    subscribe: (cb: () => void) => {
      const mql = window.matchMedia?.(query);
      mql?.addEventListener?.("change", cb);
      return () => mql?.removeEventListener?.("change", cb);
    },
    get: () => window.matchMedia?.(query).matches ?? false,
  };
}

const MD = mediaStore("(min-width: 768px)");
const LG = mediaStore("(min-width: 1024px)");
const REDUCED = mediaStore("(prefers-reduced-motion: reduce)");

/** `md` breakpoint (>= 768px): desktop nav rail instead of the bottom tab bar. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(MD.subscribe, MD.get, () => false);
}

/** `lg` breakpoint (>= 1024px). */
export function useIsLg(): boolean {
  return useSyncExternalStore(LG.subscribe, LG.get, () => false);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(REDUCED.subscribe, REDUCED.get, () => false);
}

/** Current time, refreshed every `intervalMs` (default 30s). */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Animates a number toward `target` (ease-out cubic). Returns `target`
 * immediately for reduced-motion users.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const reduced = useReducedMotion();
  const animate = !reduced && typeof requestAnimationFrame === "function";
  const [value, setValue] = useState(() => (animate ? 0 : target));
  const last = useRef(value);
  useEffect(() => {
    if (!animate) return;
    const from = last.current;
    if (from === target) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - (1 - p) ** 3;
      const v = p === 1 ? target : from + (target - from) * eased;
      last.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, animate, durationMs]);
  return animate ? value : target;
}

/**
 * Returns `initial` until two animation frames have passed, then `settled`.
 * Used to trigger CSS transitions on mount (e.g. progress rings). Settles
 * immediately when motion is reduced.
 */
export function useMountTransition<T>(settled: T, initial: T): T {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(reduced);
  useEffect(() => {
    if (ready || typeof requestAnimationFrame !== "function") return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [ready]);
  return reduced || ready || typeof requestAnimationFrame !== "function" ? settled : initial;
}

/** Scroll the window to the top on mount. */
export function useScrollToTopOnMount() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, []);
}
