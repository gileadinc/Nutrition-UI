"use client";

import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "@/components/Icon";
import { PrimaryButton } from "@/components/Button";
import { AppTextField } from "@/components/TextField";
import { FoodThumb } from "./FoodThumb";
import { useNavigate, useSearchParams } from "@/lib/nav";
import { mealApi, mealLabel, type MealLabel } from "@/lib/nutrition";
import {
  ACTIVE_MINUTES_GOAL,
  toast,
  useActivity,
  useFastHacks,
  useRecipes,
  useRequireAccount,
  useTrackingActions,
  useWeight,
} from "@/lib/store";
import { dayCalories, dayWaterOz, useTrackDays } from "@/lib/track";
import { cn } from "@/lib/utils";
import { useBodyLog } from "./bodyLog";

/* --------------------------------------------------------------- routing */

export type LogTab =
  | "meal"
  | "macros"
  | "water"
  | "activity"
  | "steps"
  | "weight"
  | "body"
  | "sleep"
  | "feelings"
  | "medication";

const TABS: LogTab[] = [
  "meal",
  "macros",
  "water",
  "activity",
  "steps",
  "weight",
  "body",
  "sleep",
  "feelings",
  "medication",
];
const PARAM = "log";

const asTab = (v: string | null): LogTab | "home" | null =>
  v === "home" ? "home" : v && (TABS as string[]).includes(v) ? (v as LogTab) : null;

/** Open / switch / close the log sheet through the `?log=` query param (works over any page). */
export function useLogSheet() {
  const [params, setParams] = useSearchParams();
  const tab = asTab(params.get(PARAM));
  const set = useCallback(
    (next: string | null) => {
      const p = new URLSearchParams(params);
      if (next) p.set(PARAM, next);
      else {
        p.delete(PARAM);
        p.delete("logMeal");
        p.delete("portion");
      }
      setParams(p, { replace: true });
    },
    [params, setParams],
  );
  return {
    tab,
    open: (t: LogTab | "home") => set(t),
    switchTo: (t: LogTab | "home") => set(t),
    close: () => set(null),
  };
}

/* ------------------------------------------------------------- flow data */

interface Flow {
  key: LogTab;
  label: string;
  group: string;
  icon: IconName;
}

const FLOWS: Flow[] = [
  { key: "meal", label: "Meal or snack", group: "Food & drink", icon: "forkSpoon" },
  { key: "macros", label: "Macros", group: "Food & drink", icon: "chartBar" },
  { key: "water", label: "Water", group: "Food & drink", icon: "droplet" },
  { key: "activity", label: "Activity", group: "Move", icon: "walking" },
  { key: "steps", label: "Steps", group: "Move", icon: "runningShoes" },
  { key: "weight", label: "Weight", group: "Body", icon: "weightScale" },
  { key: "body", label: "Measurements", group: "Body", icon: "ruler" },
  { key: "sleep", label: "Sleep", group: "Sleep & feelings", icon: "moon" },
  { key: "feelings", label: "How you feel", group: "Sleep & feelings", icon: "faceSmile" },
  { key: "medication", label: "Medication", group: "Medication", icon: "medication" },
];

const SECTIONS: { label: string; keys: LogTab[] }[] = [
  { label: "Food & drink", keys: ["meal", "water"] },
  { label: "Move", keys: ["activity", "steps"] },
  { label: "Body", keys: ["weight", "body"] },
  { label: "Sleep & feelings", keys: ["sleep", "feelings"] },
  { label: "Medication", keys: ["medication"] },
];

const TONE: Partial<Record<LogTab, { bg: string; ink: string }>> = {
  meal: { bg: "var(--color-plan-fat)", ink: "var(--color-accent-ink)" },
  macros: { bg: "var(--color-plan-calories)", ink: "var(--color-brand-navy)" },
  water: { bg: "var(--color-plan-protein)", ink: "var(--color-teal-800)" },
  activity: { bg: "var(--color-brand-warm-gray)", ink: "var(--color-brand-navy)" },
  steps: { bg: "var(--color-plan-fat)", ink: "var(--color-accent-ink)" },
  weight: { bg: "var(--color-plan-protein)", ink: "var(--color-teal-800)" },
  body: { bg: "var(--color-brand-warm-gray)", ink: "var(--color-brand-navy)" },
  sleep: { bg: "var(--color-brand-warm-gray)", ink: "var(--color-brand-navy)" },
  feelings: { bg: "var(--color-plan-fat)", ink: "var(--color-accent-ink)" },
  medication: { bg: "var(--color-plan-protein)", ink: "var(--color-teal-800)" },
};

const OZ_ML = 29.5735;
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/* ------------------------------------------------------------------ shell */

export function SheetFrame({
  labelledBy,
  onClose,
  className,
  children,
}: {
  labelledBy: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    panel.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [onClose, mounted]);
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-8">
      <button
        type="button"
        aria-label="Close log"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 size-full cursor-default bg-black/50 motion-safe:animate-[fade-in_200ms_ease-out]"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        data-testid="log-sheet"
        className={cn(
          "drawer-panel relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] focus:outline-none md:max-w-md md:rounded-[24px] md:border md:border-border-default md:px-7 md:pb-7",
          className,
        )}
      >
        <span
          aria-hidden
          className="mx-auto mt-3 block h-1 w-9 rounded-full bg-border-default md:hidden"
        />
        {children}
      </div>
    </div>,
    document.body,
  );
}

const CIRCLE_BTN =
  "flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-warm-gray transition-colors hover:bg-primary-soft";

/** Mounted once in the app shell: shows the sheet whenever `?log=` is set. */
export function LogSheetHost() {
  const { tab, switchTo, close } = useLogSheet();
  const [params] = useSearchParams();
  if (!tab) return null;
  return (
    <LogSheet tab={tab} initialMeal={params.get("logMeal")} switchTo={switchTo} onClose={close} />
  );
}

interface Result {
  title: string;
  hero?: { value: string; unit: string };
  chips?: string[];
  progress?: { value: number; goal: number; label: string };
  milestone?: string;
  undo?: () => void;
}

const AGAIN: Partial<Record<LogTab, string>> = {
  meal: "Log another meal",
  activity: "Log another activity",
  weight: "Log another weigh-in",
  body: "Log more measurements",
  sleep: "Log sleep again",
  feelings: "Check in again",
  steps: "Update steps",
};

function LogSheet({
  tab,
  initialMeal,
  switchTo,
  onClose,
}: {
  tab: LogTab | "home";
  initialMeal: string | null;
  switchTo: (t: LogTab | "home") => void;
  onClose: () => void;
}) {
  const id = useId();
  const navigate = useNavigate();
  const [result, setResult] = useState<Result | null>(null);
  const [round, setRound] = useState(0);
  const [byHand, setByHand] = useState(tab === "macros");
  const flow = tab === "macros" ? "meal" : tab;
  const meta =
    flow === "home" ? null : FLOWS.find((f) => f.key === (tab === "macros" ? "meal" : tab));

  useEffect(() => {
    if (tab === "medication") {
      onClose();
      navigate("/track/medication");
    }
  }, [tab, navigate, onClose]);

  const goHome = () => {
    setResult(null);
    setByHand(false);
    switchTo("home");
  };
  const back = () => (byHand && flow === "meal" ? setByHand(false) : goHome());
  const title =
    flow === "home" ? "What are you logging?" : byHand ? "Enter by hand" : (meta?.label ?? "");

  return (
    <SheetFrame labelledBy={id} onClose={onClose} className="md:max-w-2xl">
      <header className="flex items-center gap-2 pt-3 md:pt-7">
        {flow !== "home" && (
          <button
            type="button"
            onClick={back}
            aria-label={byHand ? "Back to search meals" : "Back to all logs"}
            className={CIRCLE_BTN}
          >
            <Icon name="arrowBack" size={18} color="var(--color-text-primary)" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[12px] type-meta text-text-secondary">
            {flow === "home" ? "Log today" : meta?.group}
          </p>
          <h2
            id={id}
            className="truncate text-xl type-section-title leading-6 tracking-[-0.9px] text-brand-navy"
          >
            {title}
          </h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className={CIRCLE_BTN}>
          <Icon name="close" size={16} color="var(--color-text-primary)" />
        </button>
      </header>
      <div role="region" aria-label={title} className="mt-5 overflow-x-clip">
        {flow === "home" ? (
          <HomePanel onPick={(t) => switchTo(t)} />
        ) : result ? (
          <ResultCard
            icon={meta?.icon ?? "tick"}
            category={flow === "meal" ? "Meal" : (meta?.label ?? "")}
            result={{
              ...result,
              undo: result.undo
                ? () => {
                    result.undo?.();
                    setResult(null);
                    setRound((n) => n + 1);
                  }
                : undefined,
            }}
            againLabel={AGAIN[flow] ?? "Log another"}
            onAgain={() => {
              setResult(null);
              setRound((n) => n + 1);
            }}
            onDone={onClose}
          />
        ) : (
          <div key={`${tab}-${byHand}-${round}`}>
            {flow === "meal" && !byHand && (
              <MealPanel
                initialMeal={initialMeal}
                report={setResult}
                onMacros={() => setByHand(true)}
              />
            )}
            {flow === "meal" && byHand && (
              <ByHandPanel initialMeal={initialMeal} report={setResult} />
            )}
            {flow === "water" && <WaterPanel />}
            {flow === "activity" && <ActivityPanel report={setResult} />}
            {flow === "weight" && <WeightPanel report={setResult} />}
            {(flow === "steps" || flow === "sleep" || flow === "feelings" || flow === "body") && (
              <BodyPanel kind={flow} report={setResult} />
            )}
          </div>
        )}
      </div>
    </SheetFrame>
  );
}

/* ------------------------------------------------------------------- home */

function Ring({ progress, done }: { progress: number | null; done: boolean }) {
  if (done)
    return (
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-positive">
        <Icon name="tick" size={16} color="var(--color-positive-ink)" />
      </span>
    );
  if (progress === null)
    return (
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-divider">
        <Icon name="chevronRight" size={15} color="var(--color-text-secondary)" />
      </span>
    );
  const pct = Math.round(progress * 100);
  const r = 14;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative flex size-9 shrink-0 items-center justify-center">
      <svg viewBox="0 0 36 36" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--color-navy-100)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="var(--color-brand-navy)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${c * progress} ${c}`}
        />
      </svg>
      <span className="relative text-[10px] type-row-figure tabular-nums text-brand-navy">
        {pct}
      </span>
    </span>
  );
}

function useStatus() {
  const { days } = useTrackDays(1);
  const day = days[days.length - 1];
  const activity = useActivity();
  const weight = useWeight();
  const body = useBodyLog();
  const water = day ? dayWaterOz(day) : 0;
  const waterGoal = day?.waterGoalOz ?? 64;
  const eaten = day ? dayCalories(day) : 0;
  const goal = day?.calorieGoal ?? 2100;
  const meals = day?.meals.length ?? 0;
  const min = (a: number, b: number) => (b > 0 ? Math.min(1, a / b) : null);
  const line: Record<string, { line: string; progress: number | null; done?: boolean }> = {
    meal: {
      line: meals === 0 ? "Nothing yet" : `${meals} logged · ${fmt(eaten)} kcal`,
      progress: meals === 0 ? null : min(eaten, goal),
    },
    water: { line: `${fmt(water)} of ${fmt(waterGoal)} oz`, progress: min(water, waterGoal) },
    activity: {
      line: activity.todayMinutes === 0 ? "Nothing yet" : `${activity.todayMinutes} min today`,
      progress:
        activity.todayMinutes === 0 ? null : min(activity.todayMinutes, ACTIVE_MINUTES_GOAL),
      done: activity.todayMinutes >= ACTIVE_MINUTES_GOAL,
    },
    steps: {
      line: body.today.steps ? `${fmt(body.today.steps)} steps` : "Not logged",
      progress: body.today.steps ? min(body.today.steps, 8000) : null,
    },
    weight: {
      line: weight.todayReading ? "Weighed today" : "Not weighed",
      progress: null,
      done: !!weight.todayReading,
    },
    body: {
      line: body.today.measurements ? "Measured today" : "Optional",
      progress: null,
      done: !!body.today.measurements,
    },
    sleep: {
      line: body.today.sleepHours ? `${body.today.sleepHours} h` : "Not logged",
      progress: null,
      done: !!body.today.sleepHours,
    },
    feelings: {
      line: body.today.feeling ? "Checked in" : "Not checked in",
      progress: null,
      done: !!body.today.feeling,
    },
    medication: { line: "Open schedule", progress: null },
  };
  return { line, water, waterGoal };
}

function HomePanel({ onPick }: { onPick: (t: LogTab) => void }) {
  const { line, water, waterGoal } = useStatus();
  const left = Math.max(0, waterGoal - water);
  return (
    <div className="flex flex-col gap-6">
      {left > 0 && (
        <section aria-label="Next up">
          <h3 className="eyebrow text-[12px]">Next up</h3>
          <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
            <button
              type="button"
              onClick={() => onPick("water")}
              className="tap-44 group relative flex items-center gap-3 rounded-2xl bg-navy-50 p-3 text-left transition-colors hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: TONE.water!.bg, color: TONE.water!.ink }}
              >
                <Icon name="droplet" size={19} color="currentColor" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] leading-5 type-item-title text-text-primary">
                  Add some water
                </span>
                <span className="block truncate text-[12px] type-meta text-text-secondary">
                  {Math.min(8, left)} oz to your goal
                </span>
              </span>
              <Icon name="chevronRight" size={15} color="var(--color-text-secondary)" />
            </button>
          </div>
        </section>
      )}
      {SECTIONS.map((s) => (
        <section key={s.label} aria-label={s.label}>
          <h3 className="eyebrow text-[12px]">{s.label}</h3>
          <ul className="mt-2 grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {s.keys.map((k) => {
              const f = FLOWS.find((x) => x.key === k)!;
              const st = line[k];
              const tone = TONE[k] ?? TONE.activity!;
              return (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => onPick(k)}
                    aria-label={`${f.label}. ${st.line}`}
                    className="tap-44 group relative flex w-full items-center gap-3.5 rounded-2xl border border-border-divider bg-white p-3 text-left transition-colors hover:border-brand-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    <span
                      aria-hidden
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: tone.bg, color: tone.ink }}
                    >
                      <Icon name={f.icon} size={21} color="currentColor" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] leading-5 type-item-title text-text-primary">
                        {f.label}
                      </span>
                      <span className="block truncate text-[13px] type-meta text-text-secondary">
                        {st.line}
                      </span>
                    </span>
                    <Ring progress={st.progress} done={!!st.done} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <p className="pb-1 text-center text-[12px] type-meta text-text-secondary">
        Everything you log shows up in Track straight away.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- results */

function ResultCard({
  icon,
  category,
  result,
  againLabel,
  onAgain,
  onDone,
}: {
  icon: IconName;
  category: string;
  result: Result;
  againLabel: string;
  onAgain: () => void;
  onDone: () => void;
}) {
  const pct = result.progress
    ? Math.min(100, Math.round((result.progress.value / Math.max(1, result.progress.goal)) * 100))
    : 0;
  return (
    <div
      className="flex flex-col items-center gap-5 pb-2 text-center"
      role="status"
      aria-live="polite"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-positive">
        <Icon name="tick" size={26} color="var(--color-positive-ink)" />
      </span>
      <div>
        <p className="text-[12px] type-meta uppercase tracking-[0.08em] text-text-secondary">
          {category} logged
        </p>
        <h3 className="mt-1 text-xl type-section-title text-brand-navy">{result.title}</h3>
      </div>
      {result.hero && (
        <p className="flex items-center justify-center gap-2 text-brand-navy">
          <Icon name={icon} size={22} color="currentColor" />
          <span className="text-[48px] leading-none type-numeral tabular-nums tracking-[-2px]">
            {result.hero.value}
          </span>
          <span className="text-[16px] text-text-secondary">{result.hero.unit}</span>
        </p>
      )}
      {result.chips && (
        <ul className="flex flex-wrap items-center justify-center gap-2">
          {result.chips.map((c) => (
            <li
              key={c}
              className="rounded-full border border-border-default px-3 py-1 text-[12px] type-meta text-text-secondary"
            >
              {c}
            </li>
          ))}
        </ul>
      )}
      {result.progress && (
        <div className="w-full max-w-xs">
          <div className="h-2 overflow-hidden rounded-full bg-navy-100">
            <div className="h-full rounded-full bg-brand-navy" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-[12px] type-meta text-text-secondary">
            {fmt(result.progress.value)} {result.progress.label}
          </p>
        </div>
      )}
      {result.milestone && (
        <p className="rounded-full bg-positive px-3 py-1 text-[12px] type-button text-positive-ink">
          {result.milestone}
        </p>
      )}
      <div className="flex w-full flex-col gap-2.5">
        <PrimaryButton label="Done" onPress={onDone} />
        <button
          type="button"
          onClick={onAgain}
          className="tap-44 relative h-12 rounded-full border border-border-default text-[14px] type-button-secondary text-primary"
        >
          {againLabel}
        </button>
        {result.undo && (
          <button
            type="button"
            onClick={result.undo}
            className="tap-44 relative text-[13px] type-button text-primary"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ small parts */

const CHIP_BASE =
  "tap-44 relative flex h-10 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-colors";
const chipTone = (on: boolean) =>
  on
    ? "border-selected bg-brand-teal-soft text-brand-navy type-button"
    : "border-border-default bg-white text-text-primary type-button-secondary hover:border-text-neutral-400";
const pillTone = (on: boolean) =>
  on
    ? "border-brand-navy bg-brand-navy text-white type-button"
    : "border-border-default bg-white text-text-secondary type-button-secondary hover:border-text-neutral-400";

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid auto-cols-fr grid-flow-col rounded-full bg-brand-warm-gray p-1"
    >
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={cn(
            "tap-44 relative h-9 rounded-full text-[13px] transition-colors",
            value === o
              ? "border border-brand-navy bg-white type-button text-brand-navy"
              : "type-button-secondary text-text-secondary",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Footer({ note, children }: { note?: string; children: ReactNode }) {
  return (
    <div className="border-t border-border-divider pt-3">
      {note && (
        <p className="mb-3 text-center text-[12px] type-meta tabular-nums text-text-secondary">
          {note}
        </p>
      )}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ water */

export function WaterBottle({
  value,
  goal,
  size = 168,
  showValue = true,
}: {
  value: number;
  goal: number;
  size?: number;
  showValue?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const frac = goal > 0 ? Math.min(1, Math.max(0, value / goal)) : 0;
  const y = 204 - 140 * frac;
  const d =
    "M74 28h32v14c0 8 4 13 12 20 11 9 16 20 16 34v86c0 13-10 22-22 22H68c-12 0-22-9-22-22V96c0-14 5-25 16-34 8-7 12-12 12-20V28Z";
  return (
    <div
      role="img"
      aria-label={`${Math.round(value)} of ${Math.round(goal)} ounces today`}
      className="relative mx-auto shrink-0"
      style={{ width: size, height: size * 1.22 }}
    >
      <svg aria-hidden viewBox="0 0 180 220" className="size-full overflow-visible">
        <defs>
          <clipPath id={`${uid}-c`}>
            <path d={d} />
          </clipPath>
          <linearGradient id={`${uid}-f`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-graphic)" stopOpacity="0.72" />
            <stop offset="1" stopColor="var(--color-graphic)" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect x="68" y="8" width="44" height="20" rx="6" fill="var(--color-brand-navy)" />
        <path
          d="M78 14v8M90 14v8M102 14v8"
          stroke="white"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d={d} fill="var(--color-navy-soft)" />
        <g clipPath={`url(#${uid}-c)`}>
          <g
            className="transition-transform duration-1000 ease-out motion-reduce:transition-none"
            style={{ transform: `translateY(${y}px)` }}
          >
            <rect x="40" y="0" width="100" height="240" fill={`url(#${uid}-f)`} />
            {frac > 0 && (
              <path
                d="M40 2 C58 -5, 75 7, 92 1 S124 -5, 140 2 V12 H40Z"
                fill="white"
                fillOpacity="0.28"
              />
            )}
          </g>
          <path
            d="M58 100v78"
            stroke="white"
            strokeOpacity="0.55"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
        <path
          d={d}
          fill="none"
          stroke="var(--color-brand-navy)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {[1, 0.75, 0.5, 0.25].map((f) => {
          const ty = 204 - 140 * f;
          return (
            <g key={f}>
              <path
                d={`M139 ${ty}h7`}
                stroke="var(--color-brand-navy)"
                strokeOpacity="0.4"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <text
                x="150"
                y={ty + 3.5}
                fontSize="10"
                fill="var(--color-text-secondary)"
                className="tabular-nums"
              >
                {Math.round(goal * f)}
              </text>
            </g>
          );
        })}
      </svg>
      {showValue && (
        <span className="pointer-events-none absolute left-[26%] right-[26%] top-[64%] flex -translate-y-1/2 flex-col items-center rounded-xl bg-white/90 py-1 text-center">
          <span className="text-[26px] leading-none type-row-figure tabular-nums text-brand-navy">
            {Math.round(value)}
          </span>
          <span className="text-[11px] type-meta text-text-secondary">
            of {Math.round(goal)} oz
          </span>
        </span>
      )}
    </div>
  );
}

const WATER_PRESETS = [
  { oz: 8, name: "Glass" },
  { oz: 16, name: "Bottle" },
  { oz: 24, name: "Large" },
];

function WaterPanel() {
  const requireAccount = useRequireAccount();
  const { addWater, remove } = useTrackingActions();
  const { days } = useTrackDays(1);
  const day = days[days.length - 1];
  const total = day ? dayWaterOz(day) : 0;
  const goal = day?.waterGoalOz ?? 64;
  const [custom, setCustom] = useState("");
  const [open, setOpen] = useState(false);
  const n = Number(custom);
  const valid = Number.isInteger(n) && n > 0 && n <= 128;

  const add = async (oz: number) => {
    if (!requireAccount("Tracking")) return;
    try {
      const entry = await addWater(Math.round(oz * OZ_ML));
      const after = total + oz;
      toast.success(`+${oz} oz water`, {
        body:
          total < goal && after >= goal
            ? "Daily goal reached. Well done."
            : `${fmt(after)} of ${goal} oz.`,
        action: { label: "Undo", run: () => void remove(entry.entryId) },
      });
    } catch {
      toast.error("That did not log", { body: "Nothing was added. Please try again." });
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 pb-2">
      <WaterBottle value={total} goal={goal} />
      <div role="group" aria-label="Add water" className="flex items-start justify-center gap-5">
        {WATER_PRESETS.map((p) => (
          <button
            key={p.oz}
            type="button"
            aria-label={`Add ${p.oz} oz of water`}
            onClick={() => void add(p.oz)}
            className="tap-44 relative flex flex-col items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          >
            <span className="flex size-[72px] items-center justify-center rounded-full border border-border-default bg-white text-[20px] type-row-figure tabular-nums text-brand-navy transition-colors hover:border-brand-navy hover:bg-navy-soft">
              +{p.oz}
            </span>
            <span className="text-[12px] type-meta text-text-secondary">{p.name}</span>
          </button>
        ))}
      </div>
      {open ? (
        <form
          className="flex w-full items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) {
              void add(n);
              setCustom("");
            }
          }}
        >
          <AppTextField
            label="Another amount (oz)"
            type="number"
            value={custom}
            onChange={setCustom}
            className="flex-1"
          />
          <PrimaryButton
            type="submit"
            label="Add"
            disabled={!valid}
            className="h-12 w-24 shrink-0"
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="tap-44 relative text-[13px] type-button text-primary"
        >
          Another amount
        </button>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- activity */

const ACTIVITIES: {
  title: string;
  minutes: number;
  calories: number;
  icon: IconName;
  kind: string;
}[] = [
  { title: "Brisk walk", minutes: 25, calories: 140, icon: "walking", kind: "Everyday" },
  { title: "Strength workout", minutes: 35, calories: 210, icon: "dumbbell", kind: "Strength" },
  { title: "Easy run", minutes: 20, calories: 190, icon: "runningShoes", kind: "Cardio" },
  { title: "Cycling", minutes: 30, calories: 240, icon: "bicycle", kind: "Cardio" },
  { title: "Yoga", minutes: 30, calories: 110, icon: "activity", kind: "Flexibility" },
];
const INTENSITY = { Light: 0.8, Moderate: 1, Hard: 1.25 } as const;
const KINDS = ["Cardio", "Strength", "Flexibility", "Sport", "Everyday"];

function ActivityPanel({ report }: { report: (r: Result) => void }) {
  const activity = useActivity();
  const [name, setName] = useState(ACTIVITIES[0].title);
  const [minutes, setMinutes] = useState(ACTIVITIES[0].minutes);
  const [else_, setElse] = useState(false);
  const [kind, setKind] = useState(ACTIVITIES[0].kind);
  const [hard, setHard] = useState<keyof typeof INTENSITY>("Moderate");
  const cur = ACTIVITIES.find((a) => a.title === name);
  const perMin = cur ? cur.calories / cur.minutes : 6;
  const kcal = Math.round(perMin * minutes * INTENSITY[hard]);
  const after = activity.todayMinutes + minutes;
  const goal = ACTIVE_MINUTES_GOAL;
  const step = (d: number) => setMinutes((m) => Math.min(240, Math.max(5, m + d)));

  const submit = () => {
    const title = name.trim();
    if (!title) return;
    const before = activity.todayMinutes;
    const entry = activity.add({ name: title, minutes, calories: kcal });
    report({
      title,
      hero: { value: String(minutes), unit: "min" },
      chips: [`≈ ${kcal} kcal`, hard, kind],
      progress: { value: after, goal, label: `of ${goal} active min today` },
      milestone:
        before < goal && after >= goal
          ? "Daily active goal reached"
          : before === 0
            ? "First log of the day"
            : undefined,
      undo: () => activity.remove(entry.id),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Activity" className="flex flex-wrap gap-2">
        {ACTIVITIES.map((a) => {
          const on = !else_ && name === a.title;
          return (
            <button
              key={a.title}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setElse(false);
                setName(a.title);
                setMinutes(a.minutes);
                setKind(a.kind);
              }}
              className={cn(CHIP_BASE, chipTone(on))}
            >
              <Icon name={a.icon} size={16} color="currentColor" />
              {a.title}
            </button>
          );
        })}
        <button
          type="button"
          role="radio"
          aria-checked={else_}
          onClick={() => {
            setElse(true);
            setName("");
          }}
          className={cn(CHIP_BASE, "border-dashed", chipTone(else_))}
        >
          <Icon name="plusSign" size={15} color="currentColor" />
          Something else
        </button>
      </div>
      {else_ && <AppTextField label="What did you do?" value={name} onChange={setName} />}
      <section aria-label="How long" className="flex flex-col items-center gap-3 py-2">
        <div className="flex w-full items-center justify-center gap-6">
          <button
            type="button"
            aria-label="5 minutes less"
            onClick={() => step(-5)}
            className="tap-44 relative flex size-12 items-center justify-center rounded-full border border-border-default text-brand-navy hover:bg-brand-warm-gray"
          >
            <Icon name="minusSign" size={18} color="currentColor" />
          </button>
          <p aria-live="polite" className="min-w-[8.5rem] text-center">
            <span className="text-[72px] leading-none type-numeral tabular-nums tracking-[-3px] text-brand-navy">
              {minutes}
            </span>
            <span className="ml-1.5 text-[16px] text-text-secondary">min</span>
          </p>
          <button
            type="button"
            aria-label="5 minutes more"
            onClick={() => step(5)}
            className="tap-44 relative flex size-12 items-center justify-center rounded-full border border-border-default text-brand-navy hover:bg-brand-warm-gray"
          >
            <Icon name="plusSign" size={18} color="currentColor" />
          </button>
        </div>
        <div
          role="group"
          aria-label="Common durations"
          className="flex items-center justify-center gap-1.5"
        >
          {[15, 30, 45, 60].map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={minutes === m}
              onClick={() => setMinutes(m)}
              className={cn(
                "tap-44 relative h-8 rounded-full border px-3.5 text-[12px] tabular-nums",
                pillTone(minutes === m),
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </section>
      <div className="flex flex-col gap-3">
        <Segmented
          label="How hard"
          value={hard}
          options={Object.keys(INTENSITY) as (keyof typeof INTENSITY)[]}
          onChange={setHard}
        />
        <div>
          <p className="mb-2 text-[14px] type-item-title text-text-primary">Type</p>
          <div role="radiogroup" aria-label="Type" className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => setKind(k)}
                className={cn(
                  "tap-44 relative h-9 rounded-full border px-3.5 text-[13px]",
                  pillTone(kind === k),
                )}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Footer
        note={`≈ ${fmt(kcal)} kcal · ${after >= goal ? `past today’s ${goal} min goal` : `${after} of ${goal} active min today`}`}
      >
        <PrimaryButton label={`Log ${minutes} min`} onPress={submit} disabled={!name.trim()} />
      </Footer>
    </div>
  );
}

/* ----------------------------------------------------------------- weight */

function WeightPanel({ report }: { report: (r: Result) => void }) {
  const weight = useWeight();
  const start = weight.todayReading?.pounds ?? weight.previous?.pounds ?? 160;
  const [lb, setLb] = useState(Math.round(start * 10) / 10);
  const step = (d: number) =>
    setLb((v) => Math.min(999, Math.max(20, Math.round((v + d) * 10) / 10)));
  const submit = () => {
    const before = weight.todayReading?.pounds ?? null;
    const prev = weight.previous;
    const delta = prev ? lb - prev.pounds : null;
    weight.setToday(lb);
    report({
      title: "Weigh-in saved",
      hero: { value: lb.toFixed(1), unit: "lb" },
      chips: [
        delta === null
          ? "Your first weigh-in"
          : Math.abs(delta) < 0.05
            ? "No change since last time"
            : `${delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)} lb since last time`,
      ],
      milestone: before === null ? "First log of the day" : undefined,
      undo: () => weight.setToday(before),
    });
  };
  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Weight" className="flex flex-col items-center gap-3 py-2">
        <div className="flex w-full items-center justify-center gap-6">
          <button
            type="button"
            aria-label="0.1 pounds less"
            onClick={() => step(-0.1)}
            className="tap-44 relative flex size-12 items-center justify-center rounded-full border border-border-default text-brand-navy hover:bg-brand-warm-gray"
          >
            <Icon name="minusSign" size={18} color="currentColor" />
          </button>
          <p aria-live="polite" className="min-w-[10rem] text-center">
            <span className="text-[64px] leading-none type-numeral tabular-nums tracking-[-3px] text-brand-navy">
              {lb.toFixed(1)}
            </span>
            <span className="ml-1.5 text-[16px] text-text-secondary">lb</span>
          </p>
          <button
            type="button"
            aria-label="0.1 pounds more"
            onClick={() => step(0.1)}
            className="tap-44 relative flex size-12 items-center justify-center rounded-full border border-border-default text-brand-navy hover:bg-brand-warm-gray"
          >
            <Icon name="plusSign" size={18} color="currentColor" />
          </button>
        </div>
        <div role="group" aria-label="Adjust" className="flex items-center justify-center gap-1.5">
          {[-1, -0.5, 0.5, 1].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => step(d)}
              className="tap-44 relative h-8 rounded-full border border-border-default px-3.5 text-[12px] tabular-nums text-text-secondary hover:border-text-neutral-400"
            >
              {d > 0 ? `+${d}` : `−${Math.abs(d)}`}
            </button>
          ))}
        </div>
      </section>
      <Footer
        note={
          weight.previous
            ? `Last weigh-in ${weight.previous.pounds.toFixed(1)} lb`
            : "Your first weigh-in"
        }
      >
        <PrimaryButton label={`Log ${lb.toFixed(1)} lb`} onPress={submit} />
      </Footer>
    </div>
  );
}

/* ------------------------------------------------- steps, sleep & others */

const FEELINGS: { key: string; label: string; icon: IconName }[] = [
  { key: "rough", label: "Rough", icon: "faceSad" },
  { key: "low", label: "Low", icon: "faceNeutral" },
  { key: "okay", label: "Okay", icon: "faceSmile" },
  { key: "good", label: "Good", icon: "faceSmilePlus" },
  { key: "great", label: "Great", icon: "faceGrinning" },
];

function BodyPanel({
  kind,
  report,
}: {
  kind: "steps" | "sleep" | "feelings" | "body";
  report: (r: Result) => void;
}) {
  const log = useBodyLog();
  const [steps, setSteps] = useState(String(log.today.steps ?? ""));
  const [sleep, setSleep] = useState(log.today.sleepHours ?? 7.5);
  const [feel, setFeel] = useState<string | null>(log.today.feeling ?? null);
  const [m, setM] = useState({ waist: "", hips: "", chest: "" });

  if (kind === "steps") {
    const n = Number(steps);
    const ok = Number.isFinite(n) && n > 0 && n <= 100000;
    return (
      <div className="flex flex-col gap-5">
        <AppTextField
          label="Steps today"
          type="number"
          value={steps}
          onChange={setSteps}
          hint="From your phone or watch."
        />
        <Footer>
          <PrimaryButton
            label="Save steps"
            disabled={!ok}
            onPress={() => {
              const prev = log.today.steps ?? null;
              log.set({ steps: Math.round(n) });
              report({
                title: "Steps saved",
                hero: { value: fmt(n), unit: "steps" },
                undo: () => log.set({ steps: prev }),
              });
            }}
          />
        </Footer>
      </div>
    );
  }
  if (kind === "sleep") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-center gap-6 py-2">
          <button
            type="button"
            aria-label="Half an hour less"
            onClick={() => setSleep((h) => Math.max(1, h - 0.5))}
            className="tap-44 relative flex size-12 items-center justify-center rounded-full border border-border-default text-brand-navy hover:bg-brand-warm-gray"
          >
            <Icon name="minusSign" size={18} color="currentColor" />
          </button>
          <p aria-live="polite" className="min-w-[9rem] text-center">
            <span className="text-[64px] leading-none type-numeral tabular-nums tracking-[-3px] text-brand-navy">
              {sleep}
            </span>
            <span className="ml-1.5 text-[16px] text-text-secondary">h</span>
          </p>
          <button
            type="button"
            aria-label="Half an hour more"
            onClick={() => setSleep((h) => Math.min(16, h + 0.5))}
            className="tap-44 relative flex size-12 items-center justify-center rounded-full border border-border-default text-brand-navy hover:bg-brand-warm-gray"
          >
            <Icon name="plusSign" size={18} color="currentColor" />
          </button>
        </div>
        <Footer>
          <PrimaryButton
            label={`Log ${sleep} h`}
            onPress={() => {
              const prev = log.today.sleepHours ?? null;
              log.set({ sleepHours: sleep });
              report({
                title: "Sleep saved",
                hero: { value: String(sleep), unit: "h" },
                undo: () => log.set({ sleepHours: prev }),
              });
            }}
          />
        </Footer>
      </div>
    );
  }
  if (kind === "feelings") {
    return (
      <div className="flex flex-col gap-6">
        <div role="radiogroup" aria-label="How you feel" className="grid grid-cols-5 gap-2">
          {FEELINGS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="radio"
              aria-checked={feel === f.key}
              onClick={() => setFeel(f.key)}
              className={cn(
                "tap-44 relative flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-[12px]",
                feel === f.key
                  ? "border-selected bg-brand-teal-soft text-brand-navy"
                  : "border-border-default text-text-secondary",
              )}
            >
              <Icon name={f.icon} size={26} color="currentColor" />
              {f.label}
            </button>
          ))}
        </div>
        <Footer>
          <PrimaryButton
            label="Save check-in"
            disabled={!feel}
            onPress={() => {
              const prev = log.today.feeling ?? null;
              log.set({ feeling: feel });
              report({
                title: "Checked in",
                chips: [FEELINGS.find((f) => f.key === feel)?.label ?? ""],
                undo: () => log.set({ feeling: prev }),
              });
            }}
          />
        </Footer>
      </div>
    );
  }
  const any = [m.waist, m.hips, m.chest].some((v) => Number(v) > 0);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <AppTextField
          label="Waist (in)"
          type="number"
          value={m.waist}
          onChange={(v) => setM({ ...m, waist: v })}
        />
        <AppTextField
          label="Hips (in)"
          type="number"
          value={m.hips}
          onChange={(v) => setM({ ...m, hips: v })}
        />
        <AppTextField
          label="Chest (in)"
          type="number"
          value={m.chest}
          onChange={(v) => setM({ ...m, chest: v })}
        />
      </div>
      <Footer>
        <PrimaryButton
          label="Save measurements"
          disabled={!any}
          onPress={() => {
            const prev = log.today.measurements ?? null;
            log.set({
              measurements: {
                waist: Number(m.waist) || 0,
                hips: Number(m.hips) || 0,
                chest: Number(m.chest) || 0,
              },
            });
            report({ title: "Measurements saved", undo: () => log.set({ measurements: prev }) });
          }}
        />
      </Footer>
    </div>
  );
}

/* ------------------------------------------------------------------- meals */

const MEAL_TYPES: MealLabel[] = ["Breakfast", "Lunch", "Dinner", "Snack"];
const mealForNow = (): MealLabel => {
  const h = new Date().getHours();
  return h < 11 ? "Breakfast" : h < 15 ? "Lunch" : h < 21 ? "Dinner" : "Snack";
};

interface CatalogItem {
  key: string;
  title: string;
  source: string;
  image?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sourceType: "fast_hack" | "recipe";
  sourceItemId: string;
}

function useCatalogue(): { items: CatalogItem[]; loading: boolean } {
  const hacks = useFastHacks({ limit: 30 });
  const recipes = useRecipes({ limit: 30 });
  const items = useMemo<CatalogItem[]>(
    () => [
      ...(hacks.data?.items ?? []).map((h) => ({
        key: `hack-${h.id}`,
        title: h.title,
        source: String(h.restaurantName ?? h.restaurant ?? "Fast hack"),
        image: h.imageUrl,
        calories: Math.round(h.calories ?? 0),
        protein: Math.round(h.protein ?? 0),
        carbs: Math.round(Number(h.carbs ?? 0)),
        fat: Math.round(Number(h.fat ?? 0)),
        sourceType: "fast_hack" as const,
        sourceItemId: h.id,
      })),
      ...(recipes.data?.items ?? []).map((r) => ({
        key: `recipe-${r.id}`,
        title: r.title,
        source: `${r.prepTimeMinutes} min`,
        image: r.imageUrl,
        calories: Math.round(r.calories),
        protein: Math.round(r.protein),
        carbs: Math.round(r.carbs),
        fat: Math.round(r.fat),
        sourceType: "recipe" as const,
        sourceItemId: r.id,
      })),
    ],
    [hacks.data, recipes.data],
  );
  return { items, loading: hacks.isLoading || recipes.isLoading };
}

function MealPanel({
  initialMeal,
  report,
  onMacros,
}: {
  initialMeal: string | null;
  report: (r: Result) => void;
  onMacros: () => void;
}) {
  const requireAccount = useRequireAccount();
  const { log, remove } = useTrackingActions();
  const { days } = useTrackDays(1);
  const day = days[days.length - 1];
  const eaten = day ? dayCalories(day) : 0;
  const goal = day?.calorieGoal ?? 2100;
  const left = Math.max(0, goal - eaten);
  const { items, loading } = useCatalogue();
  const [q, setQ] = useState("");
  const [meal, setMeal] = useState<MealLabel>(
    (initialMeal && MEAL_TYPES.find((m) => m.toLowerCase() === initialMeal.toLowerCase())) ||
      mealForNow(),
  );
  const [tabKey, setTabKey] = useState<"Fits your day" | "Recent" | "All">("Fits your day");
  const recent = useMemo(() => {
    const seen = new Set<string>();
    const out: CatalogItem[] = [];
    for (const m of [...(day?.meals ?? [])].reverse()) {
      const hit = items.find((i) => i.sourceItemId === m.sourceItemId);
      if (hit && !seen.has(hit.key)) {
        seen.add(hit.key);
        out.push(hit);
      }
    }
    return out;
  }, [day, items]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = items;
    if (tabKey === "Fits your day")
      list = items
        .filter((i) => i.calories <= left || left === 0)
        .sort((a, b) => b.protein - a.protein);
    if (tabKey === "Recent") list = recent;
    if (term) list = items.filter((i) => `${i.title} ${i.source}`.toLowerCase().includes(term));
    return list.slice(0, 12);
  }, [items, q, tabKey, left, recent]);

  const pick = async (it: CatalogItem) => {
    if (!requireAccount("Tracking")) return;
    try {
      const entry = await log({
        mealType: mealApi(meal),
        sourceType: it.sourceType,
        sourceItemId: it.sourceItemId,
        calories: it.calories,
        protein: it.protein,
        carbs: it.carbs,
        fat: it.fat,
        notes: it.title,
      });
      report({
        title: it.title,
        hero: { value: fmt(it.calories), unit: "kcal" },
        chips: [meal, `${it.protein} g protein`],
        progress: { value: eaten + it.calories, goal, label: `of ${fmt(goal)} kcal today` },
        undo: () => void remove(entry.entryId),
      });
    } catch {
      toast.error("That did not log", { body: "Nothing was added. Please try again." });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <label className="relative flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full border border-border-default bg-white px-4 focus-within:border-focus">
          <Icon name="search" size={18} color="var(--color-text-secondary)" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search meals"
            aria-label="Search meals"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-neutral-500"
          />
        </label>
        <button
          type="button"
          onClick={onMacros}
          aria-label="Enter by hand"
          title="Enter by hand"
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border-default bg-white hover:border-text-neutral-400"
        >
          <Icon name="pencilEdit" size={18} color="var(--color-primary)" />
        </button>
      </div>
      <div>
        <p className="mb-2 text-[14px] type-item-title text-text-primary">What are you logging?</p>
        <div role="radiogroup" aria-label="Meal" className="flex flex-wrap gap-2">
          {MEAL_TYPES.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={meal === m}
              onClick={() => setMeal(m)}
              className={cn(
                "tap-44 relative h-9 rounded-full border px-4 text-[13px]",
                pillTone(meal === m),
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <Segmented
        label="Show"
        value={tabKey}
        options={["Fits your day", "Recent", "All"]}
        onChange={setTabKey}
      />
      {tabKey === "Fits your day" && !q && (
        <p className="-mt-2 text-[12px] type-meta text-text-secondary">
          {fmt(left)} kcal left today. Most protein first.
        </p>
      )}
      {loading && items.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-text-secondary">Loading meals…</p>
      ) : shown.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-text-secondary">
          {tabKey === "Recent" && !q ? "Meals you log will show up here." : "No meals match that."}
        </p>
      ) : (
        <ul className="-mt-1 flex flex-col">
          {shown.map((it) => (
            <li key={it.key}>
              <button
                type="button"
                onClick={() => void pick(it)}
                className="tap-44 flex w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left hover:bg-brand-warm-gray/60"
              >
                <FoodThumb src={it.image} seed={it.title} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] type-item-title text-text-primary">
                    {it.title}
                  </span>
                  <span className="block truncate text-[12px] type-meta text-text-secondary">
                    {it.source} · {it.protein}g protein
                  </span>
                </span>
                <span className="shrink-0 text-[15px] type-row-figure tabular-nums text-brand-navy">
                  {fmt(it.calories)}{" "}
                  <span className="text-[11px] type-body text-text-secondary">kcal</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ByHandPanel({
  initialMeal,
  report,
}: {
  initialMeal: string | null;
  report: (r: Result) => void;
}) {
  const requireAccount = useRequireAccount();
  const { log, remove } = useTrackingActions();
  const { days } = useTrackDays(1);
  const day = days[days.length - 1];
  const eaten = day ? dayCalories(day) : 0;
  const goal = day?.calorieGoal ?? 2100;
  const [meal, setMeal] = useState<MealLabel>(
    (initialMeal && MEAL_TYPES.find((m) => m.toLowerCase() === initialMeal.toLowerCase())) ||
      mealLabel(mealForNow()),
  );
  const [name, setName] = useState("");
  const [f, setF] = useState({ calories: "", protein: "", carbs: "", fat: "" });
  const kcal = Math.round(Number(f.calories));
  const ok = Number.isFinite(kcal) && kcal > 0 && kcal <= 5000;

  const submit = async () => {
    if (!ok || !requireAccount("Tracking")) return;
    try {
      const entry = await log({
        mealType: mealApi(meal),
        sourceType: "custom",
        calories: kcal,
        protein: Number(f.protein) || 0,
        carbs: Number(f.carbs) || 0,
        fat: Number(f.fat) || 0,
        notes: name.trim() || "Meal",
      });
      report({
        title: name.trim() || "Meal",
        hero: { value: fmt(kcal), unit: "kcal" },
        chips: [meal],
        progress: { value: eaten + kcal, goal, label: `of ${fmt(goal)} kcal today` },
        undo: () => void remove(entry.entryId),
      });
    } catch {
      toast.error("That did not log", { body: "Nothing was added. Please try again." });
    }
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div role="radiogroup" aria-label="Meal" className="flex flex-wrap gap-2">
        {MEAL_TYPES.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={meal === m}
            onClick={() => setMeal(m)}
            className={cn(
              "tap-44 relative h-9 rounded-full border px-4 text-[13px]",
              pillTone(meal === m),
            )}
          >
            {m}
          </button>
        ))}
      </div>
      <AppTextField
        label="What did you eat? (optional)"
        value={name}
        onChange={setName}
        placeholder="e.g. Protein bar"
      />
      <AppTextField
        label="Calories (kcal)"
        type="number"
        value={f.calories}
        onChange={(v) => setF({ ...f, calories: v })}
      />
      <div className="grid grid-cols-3 gap-3">
        <AppTextField
          label="Protein (g)"
          type="number"
          value={f.protein}
          onChange={(v) => setF({ ...f, protein: v })}
        />
        <AppTextField
          label="Carbs (g)"
          type="number"
          value={f.carbs}
          onChange={(v) => setF({ ...f, carbs: v })}
        />
        <AppTextField
          label="Fat (g)"
          type="number"
          value={f.fat}
          onChange={(v) => setF({ ...f, fat: v })}
        />
      </div>
      <Footer
        note={ok ? `Today: ${fmt(eaten)} → ${fmt(eaten + kcal)} of ${fmt(goal)} kcal` : undefined}
      >
        <PrimaryButton
          type="submit"
          label={ok ? `Log ${fmt(kcal)} kcal` : "Log meal"}
          disabled={!ok}
        />
      </Footer>
    </form>
  );
}
