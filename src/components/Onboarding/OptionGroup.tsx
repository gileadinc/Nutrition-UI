"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { AppImage } from "@/components/AppImage";
import { Icon, type IconName } from "@/components/Icon";
import { useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const ONB = "/img/figma-2026-11/onboarding";

export type GoalChoice = "eatHealthier" | "freshIdeas" | "lose" | "trackProgress";

const GOALS: {
  value: GoalChoice;
  title: string;
  description: string;
  image: string;
  crop: string;
}[] = [
  {
    value: "eatHealthier",
    title: "Eat healthier while you’re out",
    description: "Low cal, high protein fast food and restaurant hacks",
    image: `${ONB}/goal-eat-out`,
    crop: "md:left-[0.01%] md:top-[-29.74%] md:h-[133.51%] md:w-[99.95%]",
  },
  {
    value: "freshIdeas",
    title: "Fresh Ideas",
    description: "Looking for healthier recipes to cook at home!",
    image: `${ONB}/goal-cook`,
    crop: "!inset-auto !bottom-0 !left-[7%] !h-auto !w-[86%]",
  },
  {
    value: "lose",
    title: "Lose weight",
    description: "Goal oriented advice to help you reach your target weight",
    image: `${ONB}/goal-lose`,
    crop: "",
  },
  {
    value: "trackProgress",
    title: "Track your progress",
    description:
      "Move at your own pace. Track meals, movement, and the habits that matter most to you",
    image: `${ONB}/goal-track`,
    crop: "md:left-[-0.13%] md:top-[-46.95%] md:h-[163.13%] md:w-full",
  },
];

/** Multi-select goal cards (photo cards with an orange selected state). */
export function GoalCards({
  value,
  onChange,
  labelledBy,
  describedBy,
  className,
}: {
  value: GoalChoice[];
  onChange: (next: GoalChoice[]) => void;
  labelledBy?: string;
  describedBy?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const uid = useId();
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={cn("grid grid-cols-1 gap-4 min-[360px]:grid-cols-2", className)}
    >
      {GOALS.map((g) => {
        const on = value.includes(g.value);
        return (
          <button
            key={g.value}
            type="button"
            role="checkbox"
            aria-checked={on}
            aria-label={g.title}
            aria-describedby={`${uid}-${g.value}`}
            onClick={() => onChange(on ? value.filter((v) => v !== g.value) : [...value, g.value])}
            className={cn(
              "relative flex min-h-[199px] w-full min-w-0 flex-col justify-start overflow-hidden rounded-2xl border border-border-default bg-surface-card p-4 text-left focus-visible:-outline-offset-2 md:aspect-[264/214.25]",
              !reduced && "transition-colors duration-200",
              on && "border-2 border-design-orange p-[15px]",
            )}
          >
            <AppImage
              src={g.image}
              alt=""
              priority
              sizes="(min-width: 1024px) 264px, 50vw"
              className={cn("absolute inset-0 size-full max-w-none object-cover", g.crop)}
            />
            <span className="relative max-w-full">
              <span className="block max-w-[13rem] type-section-title text-[16px] leading-5 tracking-[-1px] text-text-primary">
                {g.value === "eatHealthier" ? (
                  <>
                    Eat healthier
                    <br />
                    while you’re out!
                  </>
                ) : (
                  g.title
                )}
              </span>
              <span
                id={`${uid}-${g.value}`}
                className="mt-1 block max-w-[190px] type-extra-light text-[11px] leading-[13px] tracking-[-0.176px] text-text-secondary"
              >
                {g.description}
              </span>
            </span>
            {on && (
              <span
                aria-hidden
                className="absolute bottom-3 right-3 flex size-5 items-center justify-center rounded-full bg-design-orange"
              >
                <Icon name="tick" size={12} color="var(--color-on-selected)" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface RadioOption<T extends string> {
  value: T;
  title: string;
  subtitle?: string;
  icon: IconName;
  /** Custom glyph that replaces `icon` (e.g. the runner for "Very active"). */
  glyph?: ReactNode;
}

const KEYS: Record<string, number | "first" | "last"> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
  Home: "first",
  End: "last",
};

/** Single-select list of large option rows with a leading text and a trailing icon. */
export function OptionRadioGroup<T extends string>({
  options,
  value,
  onChange,
  labelledBy,
  describedBy,
  className,
}: {
  options: RadioOption<T>[];
  value: T | null;
  onChange: (next: T) => void;
  labelledBy?: string;
  describedBy?: string;
  className?: string;
}) {
  const uid = useId();
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [, setTouched] = useState<T | null>(null);
  const tabbable = options.some((o) => o.value === value) ? value : options[0]?.value;
  const pick = (v: T) => {
    setTouched(v);
    onChange(v);
  };
  return (
    <div
      ref={root}
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onKeyDown={(e) => {
        const step = KEYS[e.key];
        if (step === undefined || !root.current) return;
        const nodes = [...root.current.querySelectorAll<HTMLElement>('[role="radio"]')];
        const at = nodes.indexOf(document.activeElement as HTMLElement);
        if (at === -1) return;
        e.preventDefault();
        const n = nodes.length;
        const next = step === "first" ? 0 : step === "last" ? n - 1 : (at + step + n) % n;
        nodes[next].focus();
        pick(options[next].value);
      }}
      className={cn("flex flex-col gap-3", className)}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-labelledby={`${uid}-${i}-title`}
            aria-describedby={`${uid}-${i}-subtitle`}
            tabIndex={o.value === tabbable ? 0 : -1}
            onClick={() => pick(o.value)}
            className={cn(
              "relative flex min-h-[113px] w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-left focus-visible:-outline-offset-2",
              !reduced && "transition-colors",
              on
                ? "border-selected bg-onboarding-choice"
                : "bg-surface-card hover:border-border-default",
            )}
          >
            <span className="min-w-0 flex-1">
              <span
                id={`${uid}-${i}-title`}
                className="block text-[20px] type-section-title leading-6 tracking-[-1px] text-text-primary"
              >
                {o.title}
              </span>
              <span
                id={`${uid}-${i}-subtitle`}
                className="mt-0.5 block type-meta text-onb-meta text-text-secondary empty:hidden"
              >
                {o.subtitle}
              </span>
            </span>
            <span
              aria-hidden
              className={cn(
                "relative flex size-16 shrink-0 items-center justify-center",
                on ? "text-brand-navy" : "text-text-neutral-500",
              )}
            >
              {o.glyph ?? <Icon name={o.icon} size={36} color="currentColor" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
