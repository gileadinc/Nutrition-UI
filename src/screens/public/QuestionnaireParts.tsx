"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import { AppImage } from "@/components/AppImage";
import { PrimaryButton } from "@/components/Button";
import { CheckMark } from "@/components/Layout";
import { Icon, type IconName } from "@/components/Icon";
import { OnboardingSplit, QuizStepLayout, StatTile } from "@/components/Onboarding";
import { Logo } from "@/components/Shell/Logo";
import { SocialButton } from "@/components/Button";
import { AppleLogo, GoogleLogo } from "@/components/TextField";
import { ONB_SPACING, ONB_TYPE, SELECTED_CHIP } from "@/components/styles";
import { useReducedMotion } from "@/lib/hooks";
import { GOAL_CALORIE_DELTA, MACRO_SPLIT, type GoalKey } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------ focus utils */

const programmatic = new WeakSet<HTMLInputElement>();
const justFocused = new WeakSet<HTMLInputElement>();

/** Focus an input programmatically with the caret at the end (digits then replace the content). */
export function focusInput(el: HTMLInputElement | null) {
  if (!el) return;
  programmatic.add(el);
  try {
    el.focus();
  } finally {
    programmatic.delete(el);
  }
  const len = el.value.length;
  el.setSelectionRange(len, len);
  justFocused.add(el);
}

const onDigitKey = (e: KeyboardEvent<HTMLInputElement>) => {
  const el = e.currentTarget;
  if (justFocused.has(el)) {
    justFocused.delete(el);
    if (/^\d$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) el.select();
  }
};
const clearJustFocused = (e: { currentTarget: HTMLInputElement }) => {
  justFocused.delete(e.currentTarget);
};
const selectAll = (e: FocusEvent<HTMLInputElement> | PointerEvent<HTMLInputElement>) => {
  const el = e.currentTarget;
  if (programmatic.has(el)) return;
  const v = el.value;
  el.select();
  requestAnimationFrame(() => {
    if (document.activeElement === el && el.value === v) el.setSelectionRange(0, v.length);
  });
};
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* ------------------------------------------------------------- stepper */

export interface StepperField {
  id: string;
  label: string;
  unit: string;
  maxLength: number;
  value: string;
  onChange: (v: string) => void;
  inputRef?: Ref<HTMLInputElement>;
}

function RoundStep({
  kind,
  label,
  onPress,
  disabled,
}: {
  kind: "minus" | "plus";
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      disabled={disabled}
      className="tap-24 flex size-14 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-card text-brand-navy enabled:hover:bg-navy-soft disabled:opacity-40"
    >
      <Icon
        name={kind === "minus" ? "minusSign" : "plusSign"}
        size={24}
        strokeWidth={2}
        color="currentColor"
      />
    </button>
  );
}

/** Big numeric input(s) with +/- steppers (height, weight). */
export function NumberStepper({
  name,
  value,
  min,
  max,
  step = 1,
  onStep,
  fields,
  invalid = false,
  example = false,
  describedBy,
  labelledBy,
}: {
  name: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onStep: (v: number) => void;
  fields: StepperField[];
  invalid?: boolean;
  example?: boolean;
  describedBy?: string;
  labelledBy?: string;
}) {
  const reduced = useReducedMotion();
  const rounded = Math.round(value);
  const bump = (dir: number) => onStep(clamp(rounded + dir * step, min, max));
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    onDigitKey(e);
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      bump(e.key === "ArrowUp" ? 1 : -1);
    }
  };
  return (
    <div className="flex flex-col items-center">
      <div
        role="group"
        aria-labelledby={labelledBy}
        data-example={example || undefined}
        className={cn(
          "flex max-w-full items-baseline justify-center gap-x-1.5 rounded-2xl border-b-2 px-5 pb-2 pt-1.5 focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand-navy",
          invalid
            ? "border-solid border-error-red"
            : example
              ? "border-dashed border-border-default"
              : "border-transparent",
        )}
      >
        {fields.map((f, i) => (
          <span key={f.id} className={cn("flex items-baseline gap-1", i > 0 && "ml-3")}>
            <input
              ref={f.inputRef}
              id={f.id}
              aria-label={f.label}
              inputMode="numeric"
              autoComplete="off"
              value={f.value}
              maxLength={f.maxLength}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              onFocus={selectAll}
              onBlur={clearJustFocused}
              onPointerDown={clearJustFocused}
              onPointerUp={example ? selectAll : undefined}
              onKeyDown={onKey}
              onChange={(e) => f.onChange(e.target.value.replace(/\D/g, "").slice(0, f.maxLength))}
              className={cn(
                "min-w-0 bg-transparent text-center type-numeral tabular-nums outline-none selection:bg-teal-200",
                ONB_TYPE.display,
                example ? "text-text-secondary" : "text-text-primary",
                !reduced && "transition-colors",
              )}
              style={{ width: `${Math.max(1, f.value.length) + 0.2}ch` }}
            />
            <span aria-hidden className={cn("type-unit text-text-secondary", ONB_TYPE.body)}>
              {f.unit}
            </span>
          </span>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-6">
        <RoundStep
          kind="minus"
          label={`Decrease ${name}`}
          disabled={rounded <= min}
          onPress={() => bump(-1)}
        />
        <RoundStep
          kind="plus"
          label={`Increase ${name}`}
          disabled={rounded >= max}
          onPress={() => bump(1)}
        />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- DOB */

const DOB_PARTS = [
  { part: "month", label: "Month", placeholder: "MM", max: 2, autoComplete: "bday-month" },
  { part: "day", label: "Day", placeholder: "DD", max: 2, autoComplete: "bday-day" },
  { part: "year", label: "Year", placeholder: "YYYY", max: 4, autoComplete: "bday-year" },
] as const;

const splitDob = (v: string) => {
  const [month = "", day = "", year = ""] = v.split("/");
  return { month, day, year };
};
const joinDob = ({ month, day, year }: { month: string; day: string; year: string }) =>
  month || day || year ? `${month}/${day}/${year}` : "";
export const isDobComplete = (v: string) => {
  const d = splitDob(v);
  return d.month.length === 2 && d.day.length === 2 && d.year.length === 4;
};

export function DobInput({
  value,
  onChange,
  invalid = false,
  example = false,
  describedBy,
  labelledBy,
  firstInputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  example?: boolean;
  describedBy?: string;
  labelledBy?: string;
  firstInputRef?: { current: HTMLInputElement | null };
}) {
  const baseId = useId();
  const parts = splitDob(value);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focusAt = (i: number) => {
    const el = refs.current[i];
    if (el) {
      el.focus();
      el.select();
    }
  };
  const change = (i: number, raw: string) => {
    const { part, max } = DOB_PARTS[i];
    let digits = raw.replace(/\D/g, "").slice(0, max);
    if (digits.length === 1 && ((part === "month" && digits > "1") || (part === "day" && digits > "3"))) {
      digits = `0${digits}`;
    }
    onChange(joinDob({ ...parts, [part]: digits }));
    if (digits.length === max && i < DOB_PARTS.length - 1) focusAt(i + 1);
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "");
    if (digits.length < 5) return;
    e.preventDefault();
    onChange(
      joinDob({ month: digits.slice(0, 2), day: digits.slice(2, 4), year: digits.slice(4, 8) }),
    );
    focusAt(2);
  };
  const keyFor = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    onDigitKey(e);
    if (e.key === "Backspace" && e.currentTarget.value === "" && i > 0) {
      e.preventDefault();
      focusAt(i - 1);
    }
  };
  return (
    <div role="group" aria-labelledby={labelledBy} className="grid grid-cols-[1fr_1fr_2fr] gap-3">
      {DOB_PARTS.map((p, i) => {
        const id = `${baseId}-${p.part}`;
        return (
          <div key={p.part} className="flex min-w-0 flex-col gap-2">
            <label htmlFor={id} className={cn("type-item-title text-text-secondary", ONB_TYPE.meta)}>
              {p.label}
            </label>
            <input
              ref={(el) => {
                refs.current[i] = el;
                if (i === 0 && firstInputRef) firstInputRef.current = el;
              }}
              id={id}
              inputMode="numeric"
              autoComplete={p.autoComplete}
              placeholder={p.placeholder}
              value={parts[p.part]}
              maxLength={p.max}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              onFocus={selectAll}
              onBlur={clearJustFocused}
              onPointerDown={clearJustFocused}
              onPointerUp={example ? selectAll : undefined}
              onPaste={onPaste}
              onKeyDown={keyFor(i)}
              onChange={(e) => change(i, e.target.value)}
              className={cn(
                "panel h-16 w-full min-w-0 px-1 text-center type-numeral tabular-nums outline-none selection:bg-teal-200 focus:ring-2 focus:ring-inset focus:ring-brand-navy lg:h-[4.5rem]",
                ONB_TYPE.display,
                "placeholder:type-meta placeholder:text-text-neutral-500 placeholder:text-onb-body",
                invalid && "ring-2 ring-inset ring-error-red",
                example ? "border-dashed text-text-secondary" : "text-text-primary",
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------- option list */

export interface QuizOption<T extends string> {
  value: T;
  title: string;
  subtitle: string;
  icon: IconName;
  image?: { src: string; alt: string };
}

const SELECTED_CARD = "border-selected bg-brand-teal-soft";
const ARROW_NAV: Record<string, number | "first" | "last"> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
  Home: "first",
  End: "last",
};

export function OptionList<T extends string>({
  labelledBy,
  describedBy,
  options,
  value,
  onChange,
  className,
}: {
  labelledBy?: string;
  describedBy?: string;
  options: QuizOption<T>[];
  value: T | null;
  onChange: (v: T) => void;
  className?: string;
}) {
  const baseId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const withImages = options.some((o) => o.image);
  const tabbable = options.some((o) => o.value === value) ? value : options[0]?.value;
  const [popped, setPopped] = useState<T | null>(null);
  const pick = (v: T) => {
    setPopped(v);
    onChange(v);
  };
  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onKeyDown={(e) => {
        const dir = ARROW_NAV[e.key];
        if (dir === undefined || !ref.current) return;
        const radios = [...ref.current.querySelectorAll<HTMLElement>('[role="radio"]')];
        const current = radios.indexOf(document.activeElement as HTMLElement);
        if (current === -1) return;
        e.preventDefault();
        const n = radios.length;
        const next =
          dir === "first" ? 0 : dir === "last" ? n - 1 : (current + (dir as number) + n) % n;
        radios[next].focus();
        pick(options[next].value);
      }}
      className={cn(
        withImages ? "grid grid-cols-2 gap-3" : "flex flex-col",
        !withImages && ONB_SPACING.options,
        className,
      )}
    >
      {options.map((o, i) => {
        const selected = o.value === value;
        const titleId = `${baseId}-${i}-title`;
        const subId = `${baseId}-${i}-subtitle`;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-labelledby={titleId}
            aria-describedby={subId}
            tabIndex={o.value === tabbable ? 0 : -1}
            onClick={() => pick(o.value)}
            className={cn(
              withImages
                ? "group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border text-left"
                : "flex min-h-[4.75rem] w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left lg-short:min-h-17 lg-short:py-2.5",
              withImages
                ? [
                    !reduced &&
                      "transition-[border-color,background-color,scale] duration-200 ease-out active:scale-[0.98]",
                    selected ? SELECTED_CARD : "panel hover:border-brand-navy/40",
                  ]
                : [
                    !reduced && "transition-colors",
                    selected ? SELECTED_CHIP : "panel hover:border-brand-navy/30",
                  ],
            )}
          >
            {o.image ? (
              <span className="relative block aspect-[2/1] w-full overflow-hidden bg-brand-warm-gray sm:aspect-video">
                <AppImage
                  src={o.image.src}
                  alt={o.image.alt}
                  sizes="(min-width: 1280px) 14rem, (min-width: 1024px) 16rem, calc(50vw - 2rem)"
                  className={cn(
                    "absolute inset-0 size-full object-cover",
                    !reduced && "transition-[scale] duration-300 ease-out group-hover:scale-105",
                  )}
                />
              </span>
            ) : (
              <span
                aria-hidden
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-xl",
                  selected
                    ? "bg-surface-card text-icon-well-ink"
                    : "bg-navy-soft text-brand-navy",
                )}
              >
                <Icon name={o.icon} size={24} color="currentColor" />
              </span>
            )}
            <span className={cn("min-w-0 flex-1", withImages && "w-full p-3 sm:p-4")}>
              <span
                id={titleId}
                className={cn(
                  "block type-item-title",
                  ONB_TYPE.body,
                  selected && !withImages ? "text-on-selected" : "text-text-primary",
                )}
              >
                {o.title}
              </span>
              <span
                id={subId}
                className={cn(
                  "mt-0.5 block type-meta",
                  ONB_TYPE.meta,
                  selected && !withImages ? "text-on-selected" : "text-text-secondary",
                )}
              >
                {o.subtitle}
              </span>
            </span>
            {withImages && selected && (
              <span
                aria-hidden
                data-testid="selected-edge"
                className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-selected"
              />
            )}
            {selected ? (
              <span
                aria-hidden
                data-testid="selected-check"
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-on-selected",
                  withImages && "absolute right-2.5 top-2.5 bg-selected",
                  !reduced && popped === o.value && "onb-pop",
                )}
              >
                <CheckMark size={14} />
              </span>
            ) : (
              <span
                aria-hidden
                className={cn(
                  "size-7 shrink-0 rounded-full border-2 border-border-default bg-surface-card",
                  withImages && "absolute right-2.5 top-2.5",
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------- goal picker */

const GOAL_ORDER: GoalKey[] = (["lose", "gain", "maintain", "recomp"] as GoalKey[])
  .slice()
  .sort((a, b) => GOAL_CALORIE_DELTA[a] - GOAL_CALORIE_DELTA[b]);
const MAX_ADJUST = Math.max(...GOAL_ORDER.map((g) => Math.abs(GOAL_CALORIE_DELTA[g]))) * 1.25;
const PCT = (key: string) => MACRO_SPLIT.find((m) => m.key === key)!.pct;

const paceOf = (adj: number) => {
  const a = Math.abs(adj);
  return a === 0 ? "steady" : a < 300 ? "gentle" : "moderate";
};
const leanOf = (adj: number) => (adj < 0 ? "deficit" : adj > 0 ? "surplus" : "balance");
const headlineOf = (lean: string, pace: string) =>
  lean === "balance"
    ? "Stays in balance"
    : `Leans ${pace === "gentle" ? "slightly " : ""}toward a ${lean}`;
const targetText = (adj: number) => {
  const n = Math.abs(adj).toLocaleString("en-US");
  return adj === 0
    ? "Matches the energy you use each day."
    : `${n} kcal a day ${adj < 0 ? "below" : "above"} the energy you use.`;
};
const PROTEIN_WHY: Record<GoalKey, string> = {
  lose: "to help keep muscle while the target is lower",
  recomp: "to support training while the target is slightly lower",
  maintain: `alongside ${PCT("carbs")}% carbs and ${PCT("fat")}% fat`,
  gain: "to support muscle as the target rises",
};
const PACE_TEXT: Record<string, string> = {
  steady: "Steady: the plan aims to hold your weight where it is.",
  gentle: "Gentle: a small shift, so training can still build muscle.",
  moderate: "Moderate: a sustainable rate you can keep up week to week.",
};

function goalPreview(goal: GoalKey) {
  const adj = GOAL_CALORIE_DELTA[goal];
  const lean = leanOf(adj);
  const pace = paceOf(adj);
  return {
    adj,
    lean,
    position: Math.round(50 + (adj / MAX_ADJUST) * 50),
    headline: headlineOf(lean, pace),
    lines: [
      { key: "target", icon: "target" as IconName, label: "Daily target", text: targetText(adj) },
      {
        key: "protein",
        icon: "dumbbell" as IconName,
        label: "Protein",
        text: `${PCT("protein")}% of your calories, ${PROTEIN_WHY[goal]}.`,
      },
      { key: "pace", icon: "timer" as IconName, label: "Pace", text: PACE_TEXT[pace] },
    ],
  };
}

const EASE = "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";
const LEANS = [
  { lean: "deficit", label: "Deficit" },
  { lean: "balance", label: "Balance" },
  { lean: "surplus", label: "Surplus" },
];

export function GoalPicker({
  labelledBy,
  describedBy,
  options,
  value,
  onChange,
  className,
}: {
  labelledBy?: string;
  describedBy?: string;
  options: QuizOption<GoalKey>[];
  value: GoalKey | null;
  onChange: (v: GoalKey) => void;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const preview = value ? goalPreview(value) : null;
  const title = options.find((o) => o.value === value)?.title;
  const pos = preview?.position ?? 50;
  const left = preview && pos < 50 ? (50 - pos) / 50 : 0;
  const right = preview && pos > 50 ? (pos - 50) / 50 : 0;
  return (
    <div
      data-testid="goal-picker"
      className={cn(
        "flex flex-col gap-4",
        "xl:grid xl:grid-cols-[minmax(0,1fr)_17rem] xl:grid-rows-[auto_1fr] xl:gap-x-6 xl:gap-y-0",
        className,
      )}
    >
      <div
        aria-hidden
        data-testid="goal-scale"
        data-position={preview ? preview.position : "none"}
        data-lean={preview ? preview.lean : "none"}
        className="flex flex-col gap-2 xl:col-start-2 xl:row-start-1 xl:rounded-t-2xl xl:bg-navy-soft xl:px-5 xl:pt-5"
      >
        <p className={cn("flex flex-wrap items-baseline justify-between gap-x-3", ONB_TYPE.meta)}>
          <span className="type-meta text-text-secondary">Your daily target</span>
          <span data-testid="goal-headline" className="type-item-title text-text-primary">
            {preview ? preview.headline : "Choose a goal"}
          </span>
        </p>
        <div className="relative h-6">
          <span className="absolute inset-x-0 top-2.25 h-1.5 rounded-full bg-border-default" />
          <span
            data-testid="goal-fill-deficit"
            className={cn(
              "absolute right-1/2 top-2.25 h-1.5 w-1/2 origin-right rounded-l-full bg-graphic",
              !reduced && EASE,
            )}
            style={{ transform: `scaleX(${left})` }}
          />
          <span
            data-testid="goal-fill-surplus"
            className={cn(
              "absolute left-1/2 top-2.25 h-1.5 w-1/2 origin-left rounded-r-full bg-graphic",
              !reduced && EASE,
            )}
            style={{ transform: `scaleX(${right})` }}
          />
          <span className="absolute left-1/2 top-1.5 -ml-px h-3 w-0.5 rounded-full bg-text-secondary" />
          <span
            data-testid="goal-marker"
            className={cn("absolute inset-0", !reduced && EASE)}
            style={{ transform: `translateX(${pos}%)` }}
          >
            <span
              className={cn(
                "absolute left-0 top-0 -ml-3 size-6 rounded-full border-4 border-graphic bg-surface-card",
                preview ? "opacity-100" : "opacity-0",
              )}
            />
          </span>
        </div>
        <p className={cn("flex justify-between", ONB_TYPE.meta)}>
          {LEANS.map(({ lean, label }) => (
            <span
              key={lean}
              className={
                preview?.lean === lean
                  ? "type-item-title text-text-primary"
                  : "type-meta text-text-secondary"
              }
            >
              {label}
            </span>
          ))}
        </p>
      </div>
      <OptionList
        className="xl:col-start-1 xl:row-span-2 xl:row-start-1 xl:self-start"
        labelledBy={labelledBy}
        describedBy={describedBy}
        options={options}
        value={value}
        onChange={onChange}
      />
      <section
        data-testid="goal-preview"
        aria-label="What changes in your plan"
        className="rounded-2xl bg-navy-soft p-4 sm:p-5 xl:col-start-2 xl:row-start-2 xl:rounded-t-none xl:pt-4"
      >
        <div data-testid="goal-preview-live" aria-live="polite" aria-atomic="true">
          {preview ? (
            <>
              <span className="sr-only">{`${title}: ${preview.headline}.`}</span>
              <ul className="flex flex-col gap-3">
                {preview.lines.map((l) => (
                  <li key={l.key} data-line={l.key} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-navy-soft text-brand-navy"
                    >
                      <Icon name={l.icon} size={16} color="currentColor" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block type-item-title text-text-primary", ONB_TYPE.meta)}>
                        {l.label}
                      </span>
                      <span className={cn("block type-meta text-text-secondary", ONB_TYPE.meta)}>
                        {l.text}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className={cn("type-meta text-text-secondary", ONB_TYPE.meta)}>
              Choose a goal to see how it shapes your daily target, protein and pace.
            </p>
          )}
        </div>
        <p
          className={cn(
            "mt-3 border-t border-border-default pt-3 type-meta text-text-secondary",
            ONB_TYPE.meta,
          )}
        >
          Your exact numbers follow from your height, weight and activity.
        </p>
      </section>
    </div>
  );
}

/* ------------------------------------------------------ result screens */

const canAnimate = () =>
  typeof requestAnimationFrame === "function" &&
  !(
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

/** Counts 0 -> n with an ease-out cubic; returns null for a null input. */
function useCountTo(target: number | null, duration = 1200) {
  const ms = Math.min(duration, 1500);
  const [ratio, setRatio] = useState(() => (canAnimate() ? 0 : 1));
  useEffect(() => {
    if (target === null || !canAnimate()) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      setRatio(1 - (1 - p) ** 3);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  if (target === null) return null;
  return canAnimate() ? Math.round(target * ratio) : target;
}

const BUILDING_LINES = [
  "Reading your answers",
  "Setting your daily target",
  "Balancing protein and water",
];
const BUILDING_AT = [350, 750, 1150];
const BUILDING_DONE = 1500;
const COLUMN = "mx-auto w-full max-w-[32rem] lg:max-w-[34rem]";

function ResultShell({
  images,
  activeImage,
  onBack,
  children,
}: {
  images: string[];
  activeImage: number;
  onBack?: () => void;
  children: ReactNode;
}) {
  return (
    <OnboardingSplit images={images} activeImage={activeImage}>
      <div className="flex min-h-dvh flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] lg:justify-center lg:px-12 lg:py-10">
        <header className={cn(COLUMN, "flex h-11 shrink-0 items-center justify-between")}>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="flex size-11 items-center justify-center rounded-full border border-border-default bg-surface-card text-brand-navy transition-colors hover:bg-navy-soft"
            >
              <Icon name="arrowBack" size={20} />
            </button>
          ) : (
            <span className="size-11" aria-hidden />
          )}
          <Logo mark />
          <span className="size-11" aria-hidden />
        </header>
        <main className={cn(COLUMN, "flex flex-1 flex-col overflow-x-clip lg:flex-none lg:pt-10")}>
          {children}
        </main>
      </div>
    </OnboardingSplit>
  );
}

export function BuildingScreen({
  images,
  activeImage,
  headingRef,
  onDone,
}: {
  images: string[];
  activeImage: number;
  headingRef: Ref<HTMLHeadingElement>;
  onDone: () => void;
}) {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(0);
  const cb = useRef(onDone);
  const fired = useRef(false);
  useEffect(() => {
    cb.current = onDone;
  });
  useEffect(() => {
    const finish = () => {
      if (fired.current) return;
      fired.current = true;
      cb.current();
    };
    if (reduced) {
      finish();
      return;
    }
    const timers = BUILDING_AT.map((ms, i) => window.setTimeout(() => setDone(i + 1), ms));
    timers.push(window.setTimeout(finish, BUILDING_DONE));
    window.addEventListener("keydown", finish);
    window.addEventListener("pointerdown", finish);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("keydown", finish);
      window.removeEventListener("pointerdown", finish);
    };
  }, [reduced]);
  if (reduced) return null;
  return (
    <ResultShell images={images} activeImage={activeImage}>
      <div className="my-auto flex flex-col py-10 lg:my-0 lg:py-0">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className={cn("type-display text-brand-navy outline-none", ONB_TYPE.chapter)}
        >
          Building your plan
        </h1>
        <ul aria-live="polite" className="mt-8 flex flex-col gap-4">
          {BUILDING_LINES.map((line, i) => {
            const isDone = i < done;
            return (
              <li
                key={line}
                data-testid="building-step"
                data-done={isDone}
                className="flex items-center gap-3.5"
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border",
                    isDone
                      ? "onb-pop border-selected bg-selected"
                      : "border-border-default bg-surface-white",
                  )}
                >
                  {isDone && <CheckMark size={16} />}
                </span>
                <span
                  className={cn(isDone ? "text-text-primary" : "text-text-secondary", ONB_TYPE.body)}
                >
                  {line}
                  {isDone && <span className="sr-only"> — done</span>}
                </span>
              </li>
            );
          })}
        </ul>
        <p className={cn("mt-10 type-meta text-text-secondary", ONB_TYPE.meta)}>
          Tap anywhere or press any key to skip.
        </p>
      </div>
    </ResultShell>
  );
}

function RevealStat({
  label,
  value,
  unit,
  reason,
}: {
  label: string;
  value: string;
  unit: string;
  reason: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className={cn("type-item-title text-text-primary", ONB_TYPE.body)}>{label}</span>
      <span className="flex items-baseline gap-1 whitespace-nowrap">
        <span className={cn("type-row-figure tabular-nums text-brand-navy", ONB_TYPE.chapter)}>
          {value}
        </span>
        <span className={cn("type-unit text-text-secondary", ONB_TYPE.body)}>{unit}</span>
      </span>
      <span className={cn("text-text-secondary", ONB_TYPE.body)}>{reason}</span>
    </div>
  );
}

const fmt = (n: number) => n.toLocaleString("en-US");
export const COMPLETE_IMAGE = "/img/onboarding/generated/quiz-complete-v2";

export function RevealScreen({
  images,
  activeImage,
  headingRef,
  calories,
  proteinGrams,
  waterOz,
  primaryLabel,
  busy,
  onBack,
  onReview,
  onPrimary,
}: {
  images: string[];
  activeImage: number;
  headingRef: Ref<HTMLHeadingElement>;
  calories: number | null;
  proteinGrams: number | null;
  waterOz: number;
  primaryLabel: string;
  busy?: boolean;
  onBack: () => void;
  onReview: () => void;
  onPrimary: () => void;
}) {
  const reduced = useReducedMotion();
  const shown = useCountTo(calories);
  return (
    <QuizStepLayout
      images={images}
      activeImage={activeImage}
      stepKey="reveal"
      band={COMPLETE_IMAGE}
      bandSize="compact"
      onBack={onBack}
      onSubmit={onPrimary}
      actions={
        <>
          <button
            type="button"
            onClick={onReview}
            className={cn(
              "h-14 shrink-0 rounded-2xl px-3 type-button-secondary text-brand-navy hover:bg-navy-soft",
              ONB_TYPE.body,
            )}
          >
            Review your answers
          </button>
          <PrimaryButton
            type="submit"
            label={primaryLabel}
            disabled={busy}
            className="flex-1 lg:ml-auto lg:max-w-60"
          />
        </>
      }
    >
      <p className={cn("flex items-center gap-2 type-eyebrow text-eyebrow", ONB_TYPE.body)}>
        <span
          aria-hidden
          className={cn(
            "flex size-6 items-center justify-center rounded-full bg-selected",
            !reduced && "onb-pop",
          )}
        >
          <CheckMark size={14} />
        </span>
        Plan ready
      </p>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className={cn(
          ONB_SPACING.eyebrow,
          "type-display text-brand-navy outline-none",
          ONB_TYPE.chapter,
        )}
      >
        Your starting plan
      </h1>
      <p className={cn(ONB_SPACING.control, "flex flex-wrap items-baseline gap-x-2")}>
        <span
          aria-hidden
          data-testid="reveal-calories"
          className={cn("type-numeral tabular-nums text-brand-navy", ONB_TYPE.hero)}
        >
          {shown === null ? "—" : fmt(shown)}
        </span>
        <span aria-hidden className={cn("type-unit text-text-secondary", ONB_TYPE.body)}>
          kcal a day
        </span>
        <span className="sr-only">
          {calories === null ? "Calories not available" : `${fmt(calories)} calories a day`}
        </span>
      </p>
      <p className={cn(ONB_SPACING.line, "text-text-secondary", ONB_TYPE.body)}>
        Built from your height, weight, age and activity, then adjusted for your goal.
      </p>
      <div
        className={cn(
          ONB_SPACING.control,
          "grid grid-cols-2 gap-5 border-t border-border-divider pt-6",
        )}
      >
        <RevealStat
          label="Protein"
          value={proteinGrams === null ? "—" : fmt(proteinGrams)}
          unit="g"
          reason="About 30% of your calories, to help keep muscle."
        />
        <RevealStat
          label="Water"
          value={String(waterOz)}
          unit="oz"
          reason="A general guide. More on hot days."
        />
      </div>
    </QuizStepLayout>
  );
}

export function SaveScreen({
  images,
  activeImage,
  headingRef,
  busy,
  notice,
  onBack,
  onApple,
  onGoogle,
  onEmail,
  onGuest,
}: {
  images: string[];
  activeImage: number;
  headingRef: Ref<HTMLHeadingElement>;
  busy?: boolean;
  notice?: string;
  onBack: () => void;
  onApple: () => void;
  onGoogle: () => void;
  onEmail: () => void;
  onGuest: () => void;
}) {
  const reduced = useReducedMotion();
  return (
    <ResultShell images={images} activeImage={activeImage} onBack={onBack}>
      <div className={cn("my-auto flex flex-col py-8 lg:my-0 lg:py-0", !reduced && "onb-step-in")}>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className={cn("type-display text-brand-navy outline-none", ONB_TYPE.chapter)}
        >
          Save your plan
        </h1>
        <p className={cn("mt-3 text-text-secondary", ONB_TYPE.body)}>
          Create an account to keep your plan and progress on every device you use.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <SocialButton
            label="Continue with Apple"
            dark
            icon={<AppleLogo color="currentColor" />}
            onPress={onApple}
            className={cn("h-14", ONB_TYPE.body)}
          />
          <SocialButton
            label="Continue with Google"
            icon={<GoogleLogo />}
            onPress={onGoogle}
            className={cn("h-14", ONB_TYPE.body)}
          />
          <SocialButton
            label="Continue with email"
            icon={<Icon name="shareEmail" size={20} color="var(--color-brand-navy)" />}
            onPress={onEmail}
            className={cn("h-14 border-border-default text-brand-navy", ONB_TYPE.body)}
          />
        </div>
        {notice && (
          <p role="status" className={cn("mt-3 text-text-secondary", ONB_TYPE.meta)}>
            {notice}
          </p>
        )}
        <button
          type="button"
          onClick={onGuest}
          disabled={busy}
          className={cn(
            "mt-4 h-12 w-full rounded-2xl px-4 type-button-secondary text-brand-navy hover:bg-navy-soft disabled:opacity-60",
            ONB_TYPE.body,
          )}
        >
          Continue without an account
        </button>
      </div>
    </ResultShell>
  );
}

export { StatTile };
