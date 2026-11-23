"use client";

import { useCallback, useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { useDayBudget } from "@/lib/store";
import { cn } from "@/lib/utils";

type Key = "calories" | "protein" | "water";

const METRICS: { key: Key; label: string; icon: IconName; color: string; note: string }[] = [
  {
    key: "calories",
    label: "Calories",
    icon: "fire",
    color: "var(--color-accent-graphic)",
    note: "Left under your limit",
  },
  {
    key: "protein",
    label: "Protein",
    icon: "dumbbell",
    color: "var(--color-brand-navy)",
    note: "Left of your goal",
  },
  {
    key: "water",
    label: "Water",
    icon: "droplet",
    color: "var(--color-graphic)",
    note: "Left of your goal",
  },
];

const DEFAULT_KEYS: Key[] = ["calories", "protein"];
const STORE_KEY = "forkthis_budget_pills";

const isKey = (v: unknown): v is Key => METRICS.some((m) => m.key === v);

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};
const readRaw = () => {
  try {
    return window.localStorage.getItem(STORE_KEY);
  } catch {
    return null;
  }
};

function parseKeys(raw: string | null): Key[] {
  if (!raw) return DEFAULT_KEYS;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isKey) : DEFAULT_KEYS;
  } catch {
    return DEFAULT_KEYS;
  }
}

/** Which "left today" pills to show, remembered on this device. */
function useBudgetPillKeys() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const keys = useMemo(() => parseKeys(raw), [raw]);
  const save = useCallback((next: Key[]) => {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    listeners.forEach((l) => l());
  }, []);
  return {
    keys,
    toggle: (k: Key) => save(keys.includes(k) ? keys.filter((x) => x !== k) : [...keys, k]),
    reset: () => save(DEFAULT_KEYS),
  };
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

function Pill({ metric }: { metric: (typeof METRICS)[number] }) {
  const { budget } = useDayBudget();
  const line = budget[metric.key];
  const left = line.goal > 0 ? Math.max(0, line.goal - line.consumed) : 0;
  const fraction = line.goal > 0 ? left / line.goal : 0;
  const offset = fraction > 0 ? 100 - Math.round(fraction * 100) : 100;
  const noun = metric.key === "calories" ? "" : ` ${metric.label.toLowerCase()}`;
  return (
    <li className="flex min-w-0 items-center gap-2 rounded-full border border-border-divider bg-white py-1 pr-3 pl-1 transition-colors hover:border-text-neutral-400 sm:gap-2.5 sm:pr-4">
      <span
        role="img"
        aria-label={`${Math.round(fraction * 100)}% of ${metric.label.toLowerCase()} left`}
        className="relative flex size-10 shrink-0 items-center justify-center"
      >
        <svg viewBox="0 0 40 40" className="absolute inset-0 size-full -rotate-90" aria-hidden>
          <circle
            cx="20"
            cy="20"
            r="17"
            fill="none"
            stroke="var(--color-border-divider)"
            strokeWidth="3"
          />
          <circle
            cx="20"
            cy="20"
            r="17"
            pathLength="100"
            fill="none"
            stroke={metric.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="100 100"
            strokeDashoffset={offset}
          />
        </svg>
        <span
          className="flex size-7 items-center justify-center rounded-full"
          style={{ backgroundColor: `color-mix(in srgb, ${metric.color} 16%, white)` }}
        >
          <Icon name={metric.icon} size={15} color={metric.color} />
        </span>
      </span>
      <span className="min-w-0 truncate text-[14px] type-row-figure tabular-nums text-text-primary">
        {fmt(left)} {line.unit}
        {noun}
        <span className="ml-1 text-[12px] type-meta text-text-secondary">
          left<span className="hidden sm:inline"> today</span>
        </span>
      </span>
    </li>
  );
}

function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className="tap-44 relative flex h-11 w-14 shrink-0 items-center justify-end focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <span
        aria-hidden
        className={cn(
          "relative h-6 w-10 rounded-full transition-colors",
          on ? "bg-control-on" : "bg-border-default",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform motion-reduce:transition-none",
            on && "translate-x-4",
          )}
        />
      </span>
    </button>
  );
}

/** "1,661 kcal left today" style pills with a progress ring, plus an Add or edit button. */
export function BudgetPills() {
  const pills = useBudgetPillKeys();
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <ul
        aria-label="Left of today's goals"
        className="mt-3 flex flex-wrap items-center gap-2 max-sm:grid max-sm:grid-cols-2"
      >
        {METRICS.filter((m) => pills.keys.includes(m.key)).map((m) => (
          <Pill key={m.key} metric={m} />
        ))}
        <li className="max-sm:col-span-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="tap-44 relative flex h-11 items-center gap-2 rounded-full border border-dashed border-border-default px-4 text-[13px] type-button text-text-secondary transition-colors hover:border-brand-navy hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <Icon name="plusSign" size={15} color="currentColor" />
            Add or edit
          </button>
        </li>
      </ul>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            data-testid="customize-budget-pills"
            className="w-full max-w-md rounded-3xl bg-brand-cream p-5 shadow-raised"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] type-meta text-text-secondary">
                  Left of today, above the filters
                </p>
                <h2
                  id={titleId}
                  className="mt-1 text-xl type-section-title leading-7 tracking-[-0.9px] text-brand-navy"
                >
                  Choose your pills
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-warm-gray hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-focus"
              >
                <Icon name="close" size={16} color="var(--color-text-primary)" />
              </button>
            </header>
            <ul className="mt-4 divide-y divide-border-divider rounded-2xl border border-border-divider bg-white">
              {METRICS.map((m) => (
                <li key={m.key} className="flex items-center gap-3 py-1 pr-1 pl-3">
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `color-mix(in srgb, ${m.color} 16%, white)` }}
                  >
                    <Icon name={m.icon} size={18} color={m.color} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] type-item-title text-text-primary">
                      {m.label}
                    </span>
                    <span className="block text-[12px] type-meta text-text-secondary">
                      {m.note}
                    </span>
                  </span>
                  <Switch
                    on={pills.keys.includes(m.key)}
                    label={`Show ${m.label} left`}
                    onChange={() => pills.toggle(m.key)}
                  />
                </li>
              ))}
            </ul>
            <footer className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={pills.reset}
                className="tap-44 relative flex min-h-11 items-center text-[14px] type-button text-primary hover:underline focus-visible:outline-2 focus-visible:outline-focus"
              >
                Reset to default
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-[52px] w-32 rounded-full bg-primary text-sm type-button text-white transition-colors hover:bg-primary-hover"
              >
                Done
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
