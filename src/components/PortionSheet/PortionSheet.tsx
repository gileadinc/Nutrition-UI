"use client";

import { lockBodyScroll } from "@/lib/hooks/scrollLock";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { PrimaryButton } from "@/components/Button";
import { CheckMark } from "@/components/Layout";
import { SELECTED_CHIP } from "@/components/styles";
import { getErrorMessage } from "@/lib/api";
import { useIsDesktop, useReducedMotion } from "@/lib/hooks";
import { Link, useNavigate } from "@/lib/nav";
import {
  MEAL_TYPES,
  budgetFromSummary,
  mealApi,
  mealForTime,
  PORTION_STEPS,
  portionGlyph,
  portionLabel,
  portionText,
  scaleMacros,
  type MealLabel,
} from "@/lib/nutrition";
import {
  getAppSession,
  toast,
  useDailySummary,
  useProfile,
  useRequireAccount,
  useTrackingActions,
} from "@/lib/store";

/** What can be logged through the portion sheet. */
export interface PortionItem {
  /** Catalogue id (recipe id or fast-hack id). */
  id: string;
  title: string;
  subtitle: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Tracking `sourceType`. */
  sourceType: "recipe" | "fast_hack" | "menu_item";
}

type Context = "fork" | "cook" | "log";

interface Outcome {
  tone: "success" | "error";
  context: Context;
  item: PortionItem;
  servings: number;
  mealType: MealLabel;
  added?: { calories: number; protein: number };
  undo?: () => void;
  retry?: () => void;
}

const EYEBROW: Record<Context, string> = {
  fork: "Forked it",
  cook: "Cooked and logged",
  log: "Logged",
};

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SURGERY_TITLE = "Recovering from surgery? Portions matter";

/** True when the user's profile says they are recovering from surgery. */
export function useRecoveringFromSurgery() {
  const { profile } = useProfile();
  return profile?.surgicalContext === "Recovering from surgery";
}

/** Small teal note about portions for post-surgery users. */
export function SurgeryNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2.5 rounded-2xl bg-brand-teal-soft px-4 py-3 text-[13px] leading-5 text-text-primary type-meta",
        className,
      )}
    >
      <span className="mt-0.5 shrink-0">
        <Icon name="info" size={16} color="var(--color-brand-navy)" />
      </span>
      <span>
        <span className="type-item-title">{SURGERY_TITLE}.</span> {children}
      </span>
    </p>
  );
}

/** Pill-group single select (used for Meal in the sheet). */
export function SegmentedChoice<T extends string | number>({
  label,
  options,
  value,
  onChange,
  format = (v) => String(v),
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
}) {
  return (
    <fieldset>
      <legend className="text-sm type-item-title text-text-primary">{label}</legend>
      <div
        className={cn(
          "mt-2 gap-2",
          options.length <= 4 ? "grid grid-cols-4 sm:flex sm:flex-wrap" : "flex flex-wrap",
        )}
      >
        {options.map((o) => (
          <button
            key={String(o)}
            type="button"
            aria-pressed={value === o}
            onClick={() => onChange(o)}
            className={cn(
              "tap-44 relative flex h-9 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-1 text-[14px] transition-colors sm:px-3.5 sm:text-[14px]",
              value === o
                ? cn(SELECTED_CHIP, "type-button")
                : "type-button-secondary border-border-default bg-white text-text-secondary hover:border-text-neutral-400",
            )}
          >
            {value === o && <CheckMark size={12} />}
            {format(o)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Traps focus, locks body scroll and closes on Escape while mounted. */
function useModal(ref: React.RefObject<HTMLElement | null>, onClose: () => void, active = true) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!active) return;
    const prevFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const f = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      const cur = document.activeElement;
      if (e.shiftKey && (cur === first || cur === ref.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && cur === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const unlockScroll = lockBodyScroll();
    window.addEventListener("keydown", onKey, true);
    ref.current?.focus();
    return () => {
      unlockScroll();
      window.removeEventListener("keydown", onKey, true);
      if (prevFocus?.isConnected) prevFocus.focus();
    };
  }, [active, ref]);
}

function Readout({ value, unit, className }: { value: number; unit: string; className?: string }) {
  return (
    <span>
      <span className={cn("text-[26px] type-row-figure tabular-nums tracking-[-0.6px]", className)}>
        {value.toLocaleString("en-US")}
      </span>{" "}
      {unit}
    </span>
  );
}

function PortionPicker({
  labelledBy,
  value,
  onChange,
}: {
  labelledBy: string;
  value: number | null;
  onChange: (n: number) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = value === null ? 0 : PORTION_STEPS.indexOf(value as (typeof PORTION_STEPS)[number]);
  const go = (i: number) => {
    const t = (i + PORTION_STEPS.length) % PORTION_STEPS.length;
    onChange(PORTION_STEPS[t]);
    refs.current[t]?.focus();
  };
  const onKey = (i: number) => (e: React.KeyboardEvent) => {
    const map: Record<string, number> = {
      ArrowRight: i + 1,
      ArrowDown: i + 1,
      ArrowLeft: i - 1,
      ArrowUp: i - 1,
      Home: 0,
      End: PORTION_STEPS.length - 1,
    };
    if (e.key in map) {
      e.preventDefault();
      go(map[e.key]);
    }
  };
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="mt-2 grid grid-cols-[repeat(4,minmax(0,1fr))] gap-2"
    >
      {PORTION_STEPS.map((p, i) => {
        const on = value === p;
        return (
          <button
            key={p}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={portionLabel(p)}
            tabIndex={i === idx ? 0 : -1}
            onClick={() => onChange(p)}
            onKeyDown={onKey(i)}
            className={cn(
              "flex h-12 min-w-0 items-center justify-center gap-1 rounded-full border text-[21px] tabular-nums transition-colors",
              on
                ? cn(SELECTED_CHIP, "type-button")
                : "type-button-secondary border-border-default bg-white text-text-primary hover:border-text-neutral-400",
            )}
          >
            {on && <CheckMark size={14} />}
            {portionGlyph(p)}
          </button>
        );
      })}
    </div>
  );
}

function PortionDialog({
  item,
  defaultMeal,
  onClose,
  onLog,
}: {
  item: PortionItem;
  defaultMeal: MealLabel;
  onClose: () => void;
  onLog: (servings: number, meal: MealLabel) => void;
}) {
  const titleId = useId();
  const portionId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const surgery = useRecoveringFromSurgery();
  const [servings, setServings] = useState<number | null>(surgery ? null : 1);
  const [meal, setMeal] = useState<MealLabel>(defaultMeal);
  useModal(ref, onClose);
  const scaled = servings === null ? null : scaleMacros(item, servings);
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-8">
      <button
        type="button"
        aria-label="Close portion picker"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 size-full cursor-default bg-black/50 motion-safe:animate-[fade-in_200ms_ease-out]"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid="portion-sheet"
        className="drawer-panel relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] focus:outline-none md:max-w-md md:rounded-[24px] md:border md:border-border-default md:px-7 md:pb-7"
      >
        <span aria-hidden className="mx-auto mt-3 block h-1 w-9 rounded-full bg-border-default md:hidden" />
        <header className="flex items-start gap-3 pt-3 md:pt-7">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] type-meta text-text-secondary">How much did you have?</p>
            <h2
              id={titleId}
              className="mt-1 text-xl type-section-title leading-7 tracking-[-0.9px] text-brand-navy"
            >
              {item.title}
            </h2>
            <p className="mt-0.5 truncate text-[13px] type-meta text-text-secondary">
              {item.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-warm-gray"
          >
            <Icon name="close" size={16} color="var(--color-text-primary)" />
          </button>
        </header>
        {surgery && (
          <SurgeryNote className="mt-4">Choose the amount you actually had.</SurgeryNote>
        )}
        <p id={portionId} className="mt-5 text-sm type-item-title text-text-primary">
          Portion
        </p>
        <PortionPicker labelledBy={portionId} value={servings} onChange={setServings} />
        <div
          className="mt-4 rounded-2xl bg-brand-warm-gray px-4 py-3"
          aria-live="polite"
          data-testid="portion-readout"
        >
          {scaled === null ? (
            <p className="text-[13px] type-meta text-text-secondary">
              Choose a portion to see what it adds.
            </p>
          ) : (
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px] type-meta text-text-secondary">
              <Readout value={scaled.calories} unit="kcal" className="text-accent-ink" />
              <Readout value={scaled.protein} unit="g protein" className="text-text-primary" />
              <span className="sr-only">for {portionLabel(servings!)}</span>
            </p>
          )}
        </div>
        <div className="mt-5">
          <SegmentedChoice label="Meal" options={MEAL_TYPES} value={meal} onChange={setMeal} />
        </div>
        <PrimaryButton
          className="mt-6"
          label="Log it"
          disabled={servings === null}
          onPress={() => servings !== null && onLog(servings, meal)}
        />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- outcome sheet */

function useTween(from: number, to: number, reduce: boolean, delay = 0, duration = 800) {
  const animate = !reduce && typeof requestAnimationFrame === "function";
  const [v, setV] = useState(animate ? from : to);
  useEffect(() => {
    if (!animate) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      start ||= now + delay;
      const p = Math.min(1, Math.max(0, (now - start) / duration));
      setV(from + (to - from) * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, animate, delay, duration]);
  return animate ? v : to;
}

const BURST = [
  { angle: 0, color: "var(--color-teal-400)", size: 8 },
  { angle: 45, color: "var(--color-badge-gold)", size: 6 },
  { angle: 90, color: "var(--color-primary)", size: 7 },
  { angle: 135, color: "var(--color-teal-300)", size: 6 },
  { angle: 180, color: "var(--color-teal-500)", size: 8 },
  { angle: 225, color: "var(--color-badge-gold)", size: 7 },
  { angle: 270, color: "var(--color-teal-300)", size: 6 },
  { angle: 315, color: "var(--color-primary)", size: 6 },
];

const EASE_OUT = [0.215, 0.61, 0.355, 1] as const;

function SuccessMark({ reduce }: { reduce: boolean }) {
  return (
    <span aria-hidden className="relative flex size-20 items-center justify-center">
      {!reduce && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-teal-300"
            initial={{ scale: 0.8, opacity: 0.9 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ delay: 0.12, duration: 0.7, ease: "easeOut" }}
          />
          {BURST.map((b) => {
            const a = (b.angle * Math.PI) / 180;
            return (
              <motion.span
                key={b.angle}
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: b.size,
                  height: b.size,
                  marginLeft: -b.size / 2,
                  marginTop: -b.size / 2,
                  backgroundColor: b.color,
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(a) * 58,
                  y: Math.sin(a) * 58,
                  scale: [0, 1.2, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{ delay: 0.16, duration: 0.75, ease: EASE_OUT }}
              />
            );
          })}
        </>
      )}
      <motion.span
        className="relative flex size-20 items-center justify-center rounded-full bg-teal-700"
        initial={reduce ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 16 }}
      >
        <svg viewBox="0 0 24 24" className="size-10" fill="none">
          <motion.path
            d="M5.5 12.5 10 17 18.5 7.5"
            stroke="white"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={reduce ? { duration: 0 } : { delay: 0.14, duration: 0.36, ease: "easeOut" }}
          />
        </svg>
      </motion.span>
    </span>
  );
}

function Rise({
  reduce,
  delay,
  className,
  children,
  hidden,
}: {
  reduce: boolean;
  delay: number;
  className?: string;
  children: ReactNode;
  hidden?: boolean;
}) {
  return (
    <motion.div
      aria-hidden={hidden}
      className={className}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { delay, duration: 0.32, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

function AddedTile({
  value,
  unit,
  reduce,
  className,
}: {
  value: number;
  unit: string;
  reduce: boolean;
  className?: string;
}) {
  const n = Math.round(useTween(0, value, reduce, 300, 700));
  return (
    <div className="rounded-2xl bg-brand-warm-gray px-4 py-3 text-left">
      <p className="text-[13px] type-meta text-text-secondary">
        <span className={cn("text-[26px] type-row-figure tabular-nums tracking-[-0.6px]", className)}>
          +{n.toLocaleString("en-US")}
        </span>{" "}
        {unit}
      </p>
    </div>
  );
}

function TodayBar({
  before,
  after,
  goal,
  reduce,
}: {
  before: number;
  after: number;
  goal: number;
  reduce: boolean;
}) {
  const total = Math.max(goal, after, 1);
  const base = (before / total) * 100;
  const add = ((after - before) / total) * 100;
  const shown = Math.round(useTween(before, after, reduce, 420, 800));
  return (
    <div className="rounded-2xl border border-border-default px-4 py-3 text-left">
      <div className="flex items-baseline justify-between gap-3 text-[13px] type-meta">
        <span className="type-item-title text-text-primary">Today</span>
        <span className="tabular-nums text-text-secondary">
          <span className="type-row-figure text-text-primary">{shown.toLocaleString("en-US")}</span>{" "}
          of {goal.toLocaleString("en-US")} kcal
        </span>
      </div>
      <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-brand-warm-gray">
        <span className="h-full shrink-0 bg-accent-graphic opacity-40" style={{ width: `${base}%` }} />
        <motion.span
          className="h-full shrink-0 bg-accent-graphic"
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${add}%` }}
          transition={reduce ? { duration: 0 } : { delay: 0.42, duration: 0.8, ease: EASE_OUT }}
        />
      </div>
    </div>
  );
}

function SuccessBody({
  outcome,
  eyebrowId,
  titleId,
  bodyId,
  reduce,
  consumedBefore,
  goal,
  onClose,
  onViewTrack,
}: {
  outcome: Outcome;
  eyebrowId: string;
  titleId: string;
  bodyId: string;
  reduce: boolean;
  consumedBefore: number;
  goal: number;
  onClose: () => void;
  onViewTrack?: () => void;
}) {
  const added = outcome.added ?? { calories: outcome.item.calories, protein: outcome.item.protein };
  const after = consumedBefore + added.calories;
  return (
    <motion.div
      {...swap(reduce)}
      className="flex flex-col items-center pt-3 text-center md:pt-7"
    >
      <SuccessMark reduce={reduce} />
      <Rise reduce={reduce} delay={0.18} className="mt-5">
        <p id={eyebrowId} className="eyebrow">
          {EYEBROW[outcome.context]}
        </p>
        <h2
          id={titleId}
          className="mt-1.5 text-[26px] type-section-title leading-7 tracking-[-0.9px] text-brand-navy"
        >
          {outcome.item.title}
        </h2>
        <p className="mt-1 text-[13px] type-meta text-text-secondary">
          Added to {outcome.mealType} · {portionText(outcome.servings)}
        </p>
      </Rise>
      <p id={bodyId} className="sr-only">
        Added {added.calories} kcal and {added.protein} g protein to {outcome.mealType}. Today:{" "}
        {after.toLocaleString("en-US")} of {goal.toLocaleString("en-US")} kcal.
      </p>
      <Rise reduce={reduce} delay={0.26} className="mt-5 grid w-full grid-cols-2 gap-2" hidden>
        <AddedTile value={added.calories} unit="kcal" reduce={reduce} className="text-accent-ink" />
        <AddedTile value={added.protein} unit="g protein" reduce={reduce} className="text-text-primary" />
      </Rise>
      <Rise reduce={reduce} delay={0.34} className="mt-3 w-full" hidden>
        <TodayBar before={consumedBefore} after={after} goal={goal} reduce={reduce} />
      </Rise>
      <Rise reduce={reduce} delay={0.4} className="mt-6 flex w-full flex-col gap-3">
        <PrimaryButton label="Done" onPress={onClose} />
        {onViewTrack && (
          <Link
            to="/track"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              onViewTrack();
            }}
            className="panel flex h-14 w-full items-center justify-center text-sm type-button-secondary tracking-[-0.63px] text-primary"
          >
            View in Track
          </Link>
        )}
        {outcome.undo && (
          <p className="text-[13px] type-meta text-text-secondary">
            Logged by mistake?{" "}
            <button
              type="button"
              onClick={outcome.undo}
              className="tap-44 relative type-button text-primary underline-offset-2 hover:underline"
            >
              Undo
            </button>
          </p>
        )}
      </Rise>
    </motion.div>
  );
}

const swap = (reduce: boolean) =>
  reduce
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0 } } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
        exit: { opacity: 0, y: -6, transition: { duration: 0.12 } },
      };

function ErrorBody({
  outcome,
  titleId,
  bodyId,
  reduce,
  onClose,
}: {
  outcome: Outcome;
  titleId: string;
  bodyId: string;
  reduce: boolean;
  onClose: () => void;
}) {
  return (
    <motion.div {...swap(reduce)} className="flex flex-col items-center pt-3 text-center md:pt-7">
      <motion.span
        aria-hidden
        className="flex size-20 items-center justify-center rounded-full bg-error-soft"
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={reduce ? undefined : { scale: 1, opacity: 1, x: [0, -9, 8, -6, 4, -2, 0] }}
        transition={
          reduce
            ? { duration: 0 }
            : {
                scale: { type: "spring", stiffness: 420, damping: 16 },
                opacity: { duration: 0.15 },
                x: { delay: 0.22, duration: 0.5, ease: "easeInOut" },
              }
        }
      >
        <Icon name="alert" size={36} color="var(--color-error-red)" />
      </motion.span>
      <Rise reduce={reduce} delay={0.12} className="mt-5">
        <h2
          id={titleId}
          className="text-[26px] type-section-title leading-7 tracking-[-0.9px] text-brand-navy"
        >
          Couldn&apos;t log that
        </h2>
        <p id={bodyId} className="mt-1.5 text-onb-body text-text-secondary">
          {outcome.item.title} wasn&apos;t added to {outcome.mealType}. Nothing in today changed, so
          it is safe to try again.
        </p>
      </Rise>
      <Rise reduce={reduce} delay={0.2} className="mt-6 flex w-full flex-col gap-3">
        {outcome.retry && (
          <button
            type="button"
            data-autofocus
            onClick={outcome.retry}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base type-button tracking-[-0.48px] text-white transition-colors hover:bg-primary-hover"
          >
            <Icon name="refresh" size={18} color="currentColor" />
            Try again
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="h-14 w-full rounded-2xl border border-border-default bg-white text-sm type-button-secondary text-primary"
          style={{ letterSpacing: "-0.63px" }}
        >
          Not now
        </button>
      </Rise>
    </motion.div>
  );
}

function OutcomeDialog({
  outcome,
  onClose,
  onViewTrack,
}: {
  outcome: Outcome;
  onClose: () => void;
  onViewTrack?: () => void;
}) {
  const eyebrowId = useId();
  const titleId = useId();
  const bodyId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const desktop = useIsDesktop();
  const drag = useDragControls();
  const error = outcome.tone === "error";
  const { data: summary } = useDailySummary();
  // The summary refetches after logging; keep the pre-log figure from first render.
  const [snapshot] = useState(() => budgetFromSummary(summary).calories);
  const consumedBefore = Math.max(0, snapshot.consumed);
  useModal(ref, onClose);
  useEffect(() => {
    const el = error ? ref.current?.querySelector<HTMLElement>("[data-autofocus]") : null;
    (el ?? ref.current)?.focus();
  }, [error]);
  const enter = reduce
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } }
    : desktop
      ? {
          initial: { opacity: 0, y: 24, scale: 0.96 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.16, ease: "easeIn" as const } },
          transition: { type: "spring" as const, stiffness: 400, damping: 22 },
        }
      : {
          initial: { y: "100%" },
          animate: { y: 0 },
          exit: { y: "100%", transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as const } },
          transition: { type: "spring" as const, stiffness: 380, damping: 34, mass: 0.9 },
        };
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-8"
      data-testid="outcome-layer"
    >
      <motion.button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 size-full cursor-default bg-black/50"
        initial={{ opacity: reduce ? 1 : 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.2 }}
      />
      <motion.div
        ref={ref}
        role={error ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={error ? titleId : `${eyebrowId} ${titleId}`}
        aria-describedby={bodyId}
        tabIndex={-1}
        data-testid="outcome-sheet"
        data-tone={outcome.tone}
        drag={desktop || reduce ? false : "y"}
        dragListener={false}
        dragControls={drag}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.05, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 110 || info.velocity.y > 600) onClose();
        }}
        {...enter}
        className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] focus:outline-none md:max-w-md md:rounded-[24px] md:border md:border-border-default md:px-7 md:pb-7"
      >
        <div
          aria-hidden
          onPointerDown={(e) => {
            if (!reduce) drag.start(e);
          }}
          className="-mx-5 flex h-7 cursor-grab touch-none items-end justify-center active:cursor-grabbing md:hidden"
        >
          <span className="block h-1 w-9 rounded-full bg-border-default" />
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {error ? (
            <ErrorBody
              key="error"
              outcome={outcome}
              titleId={titleId}
              bodyId={bodyId}
              reduce={reduce}
              onClose={onClose}
            />
          ) : (
            <SuccessBody
              key="success"
              outcome={outcome}
              eyebrowId={eyebrowId}
              titleId={titleId}
              bodyId={bodyId}
              reduce={reduce}
              consumedBefore={consumedBefore}
              goal={snapshot.goal}
              onClose={onClose}
              onViewTrack={onViewTrack}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/**
 * Portion picker + success/error outcome sheet for logging a recipe or hack.
 * `const ps = usePortionSheet({ context: "fork" }); ps.open(item); ... {ps.sheet}`
 */
export function usePortionSheet({
  defaultMealType,
  context = "log",
}: { defaultMealType?: MealLabel; context?: Context } = {}) {
  const requireAccount = useRequireAccount();
  const { log, remove } = useTrackingActions();
  const navigate = useNavigate();
  const [item, setItem] = useState<PortionItem | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const submit = async (it: PortionItem, servings: number, meal: MealLabel) => {
    const base = { context, item: it, servings, mealType: meal };
    const m = scaleMacros(it, servings);
    try {
      const entry = await log({
        mealType: mealApi(meal),
        sourceType: it.sourceType,
        sourceItemId: it.id,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        notes: `${it.title} · ${portionText(servings)}`,
      });
      setOutcome({
        ...base,
        tone: "success",
        added: { calories: m.calories, protein: m.protein },
        undo: () => {
          void remove(entry.entryId)
            .then(() => {
              setOutcome(null);
              toast.success(`${it.title} removed`, { body: `Taken back out of ${meal}.` });
            })
            .catch((err) => toast.error("Couldn't undo", { body: getErrorMessage(err) }));
        },
      });
    } catch {
      setOutcome({
        ...base,
        tone: "error",
        retry: () => {
          setOutcome(null);
          void submit(it, servings, meal);
        },
      });
    }
  };

  const open = (it: PortionItem) => {
    if (!requireAccount("Tracking")) return;
    setItem(it);
  };

  const sheet = mounted
    ? createPortal(
        <>
          {item && (
            <PortionDialog
              key={item.id}
              item={item}
              defaultMeal={defaultMealType ?? mealForTime()}
              onClose={() => setItem(null)}
              onLog={(servings, meal) => {
                const it = item;
                setItem(null);
                if (!getAppSession().isSignedIn) return;
                void submit(it, servings, meal);
              }}
            />
          )}
          <AnimatePresence>
            {!item && outcome && (
              <OutcomeDialog
                key="outcome"
                outcome={outcome}
                onClose={() => setOutcome(null)}
                onViewTrack={() => {
                  setOutcome(null);
                  navigate("/track");
                }}
              />
            )}
          </AnimatePresence>
        </>,
        document.body,
      )
    : null;

  return { open, sheet };
}
