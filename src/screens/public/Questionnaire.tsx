"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { PrimaryButton, SocialButton } from "@/components/Button";
import { Icon, type IconName } from "@/components/Icon";
import { GoalCards, OptionRadioGroup, type GoalChoice } from "@/components/Onboarding/OptionGroup";
import {
  D,
  DateField,
  E,
  ExampleHint,
  Heading,
  Message,
  Progress,
  Reassurance,
  ResultLayout,
  ReviewRow,
  StatTile,
  StepLayout,
  Stepper,
  UnitToggle,
  dobComplete,
} from "@/components/Onboarding/QuestionnaireParts";
import { AppleLogo, GoogleLogo } from "@/components/TextField";
import { RunnerIcon } from "@/components/Quiz/RunnerIcon";
import { goalKeyFor, type GoalCardId } from "@/components/Quiz/quizData";
import { getErrorMessage } from "@/lib/api";
import { APPLE_SIGN_IN_ENABLED } from "@/lib/auth";
import { Link, useNavigate, useSearchParams } from "@/lib/nav";
import {
  ACTIVITY_HINT,
  ACTIVITY_KEYS,
  ACTIVITY_LABEL,
  DEFAULT_TARGETS,
  GOAL_LABEL,
  ageFromDob,
  calorieTarget,
  isoToDob,
  macroGrams,
  tdee,
  type ActivityKey,
  type GoalKey,
  type SurgicalContext,
} from "@/lib/nutrition";
import {
  loadDraft,
  saveDraft,
  startGuestSession,
  submitQuestionnaire,
  toast,
  useAppSession,
  useProfile,
  type QuestionnaireDraft,
  type QuestionnairePosition,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import { useSocialSignIn } from "./useSocialSignIn";

/* ------------------------------------------------------------------ data */

const ONB = "/img/figma-2026-11/onboarding";
const STEPS = ["dob", "goal", "height", "activity", "surgery"] as const;
type Step = (typeof STEPS)[number];
const IMAGES = [
  `${ONB}/dob`,
  `${ONB}/goals`,
  `${ONB}/measurements`,
  `${ONB}/activity`,
  `${ONB}/surgery-figma`,
  `${ONB}/review`,
  `${ONB}/reveal-figma`,
];
const ANALYZING = [`${ONB}/intro-hack`];
const READY_INDEX = IMAGES.length - 1;
const AFTER = "/home?tour=1";

const COPY: Record<Step, { name: string; eyebrow: string; title: string; why: string }> = {
  dob: {
    name: "Date of birth",
    eyebrow: "About you",
    title: "What's your date of birth?",
    why: "Your age helps us estimate a starting plan. ForkThis is for people age 13 and older.",
  },
  goal: {
    name: "Goal",
    eyebrow: "Your goal",
    title: "What's your main goal?",
    why: "Choose what you want ForkThis to help you with. You can change this later.",
  },
  height: {
    name: "Measurements",
    eyebrow: "Your starting point",
    title: "What's your height and weight?",
    why: "height and weight together give your baseline energy — what your body uses at rest.",
  },
  activity: {
    name: "Activity",
    eyebrow: "Your week",
    title: "How active are you right now?",
    why: "activity multiplies your baseline. Pick a typical week, not your best one.",
  },
  surgery: {
    name: "Health context",
    eyebrow: "Your health",
    title: "Do any of these apply to you?",
    why: "your answer helps us show relevant guidance. It is private and you can change it later.",
  },
};

const CARD_FOR: Record<GoalChoice, GoalCardId> = {
  eatHealthier: "eatOut",
  freshIdeas: "recomp",
  lose: "lose",
  trackProgress: "track",
};
const INTEREST_LABEL: Record<GoalChoice, string> = {
  eatHealthier: "Eat healthier while you’re out",
  freshIdeas: "Fresh Ideas",
  lose: "Lose weight",
  trackProgress: "Track your progress",
};

const ACTIVITY_ICON: Record<ActivityKey, IconName> = {
  mostlyInactive: "person",
  lightlyActive: "walking",
  moderatelyActive: "dumbbell",
  veryActive: "runningShoes",
  extremelyActive: "dumbbell",
};

type Health = "plastic" | "bariatric" | "glp1" | "peptide" | "none" | "private";
const HEALTH: { value: Health; title: string; subtitle: string; icon: IconName }[] = [
  {
    value: "plastic",
    title: "Preparing for or recovering from plastic surgery",
    subtitle: "Show high-protein nutrition content",
    icon: "calendar",
  },
  {
    value: "bariatric",
    title: "History of bariatric surgery",
    subtitle: "Bariatric surgery",
    icon: "medication",
  },
  { value: "glp1", title: "I’m on a GLP-1", subtitle: "", icon: "injection" },
  { value: "peptide", title: "Peptides are part of my routine", subtitle: "", icon: "molecules" },
  {
    value: "none",
    title: "None of the above",
    subtitle: "Choose this if the other options do not describe you.",
    icon: "leaf",
  },
];
const CONTEXT_FOR: Record<Health, SurgicalContext> = {
  plastic: "Preparing for surgery",
  bariatric: "Recovering from surgery",
  glp1: "Prefer not to say",
  peptide: "Prefer not to say",
  none: "No surgery",
  private: "Prefer not to say",
};

const MIN_IN = 36;
const MAX_IN = 96;
const CM = 2.54;
const KG = 0.453592;
const MIN_CM = Math.ceil(MIN_IN * CM);
const MAX_CM = Math.floor(MAX_IN * CM);

const num = (s: string) => (s.trim() === "" ? null : Number(s));
const fmt = (n: number) => n.toLocaleString("en-US");
const safeNext = (v: string | null) => (v && v.startsWith("/") && !v.startsWith("//") ? v : null);

const heightFrom = (imperial: boolean, ft: string, inch: string, cm: string): number | null => {
  if (imperial) {
    const f = num(ft);
    const i = num(inch) ?? 0;
    if (f === null || i > 11) return null;
    const total = f * 12 + i;
    return total >= MIN_IN && total <= MAX_IN ? total : null;
  }
  const c = num(cm);
  if (c === null) return null;
  const inches = c / CM;
  return inches >= MIN_IN && inches <= MAX_IN ? inches : null;
};
const weightFrom = (imperial: boolean, v: string): number | null => {
  const n = num(v);
  if (n === null) return null;
  const lb = imperial ? n : n / KG;
  return lb > 0 ? lb : null;
};
const heightText = (inches: number, imperial: boolean) => {
  const n = Math.round(inches);
  return imperial ? `${Math.floor(n / 12)}'${n % 12}"` : `${Math.round(inches * CM)} cm`;
};
const weightText = (lb: number, imperial: boolean) =>
  imperial ? `${Math.round(lb)} lbs` : `${Math.round(lb * KG)} kg`;

const useMounted = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

/* ----------------------------------------------------------------- BMI */

const BMI_ROWS = [
  { label: "Underweight", min: 0, max: 18.5, range: "Below 18.5" },
  { label: "Healthy weight", min: 18.5, max: 25, range: "18.5 – <25" },
  { label: "Overweight", min: 25, max: 30, range: "25 – <30" },
  { label: "Obesity · Class 1", min: 30, max: 35, range: "30 – <35" },
  { label: "Obesity · Class 2", min: 35, max: 40, range: "35 – <40" },
  { label: "Obesity · Class 3", min: 40, max: Infinity, range: "40 or above" },
];

function BmiDetails({
  heightIn,
  weightLb,
  age,
}: {
  heightIn: number | null;
  weightLb: number | null;
  age: number | null;
}) {
  const bmi =
    heightIn !== null && weightLb !== null
      ? (weightLb * KG) / (((heightIn * CM) / 100) * ((heightIn * CM) / 100))
      : null;
  const adult = age !== null && age >= 20;
  const row = adult && bmi !== null ? BMI_ROWS.find((r) => bmi >= r.min && bmi < r.max) : null;
  return (
    <section aria-label="BMI details" className="mt-3 rounded-2xl bg-surface-card p-4">
      {bmi !== null && heightIn !== null && weightLb !== null ? (
        <details className="group">
          <summary className="flex min-h-18 cursor-pointer list-none items-center gap-4 rounded-xl focus-visible:outline-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
            <span
              aria-live="polite"
              aria-atomic="true"
              className="flex size-18 shrink-0 flex-col items-center justify-center rounded-full border-4 border-badge-gold text-brand-navy"
            >
              <span className="text-xl type-display tabular-nums">{bmi.toFixed(1)}</span>
              <span className="text-[11px] type-meta">kg/m²</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block type-section-title text-brand-navy">Your BMI</span>
              <span aria-live="polite" className="mt-1 block text-sm type-meta text-text-secondary">
                {row?.label ?? "Based on your height and weight"}
              </span>
              <span className="mt-1 block text-xs type-meta text-brand-navy">View BMI ranges</span>
            </span>
            <Icon
              name="chevronRight"
              size={20}
              className="shrink-0 text-brand-navy group-open:rotate-90 motion-safe:transition-transform"
            />
          </summary>
          <div className="mt-4 border-t border-border-default pt-4 text-sm type-meta text-text-secondary">
            <p aria-live="polite">
              {Math.round(heightIn * CM)} cm · {(weightLb * 0.45359237).toFixed(1)} kg
            </p>
            <h2 className="mt-4 type-section-title text-brand-navy">BMI ranges · adults 20+</h2>
            <dl className="mt-2 divide-y divide-border-default">
              {BMI_ROWS.map((r) => (
                <div
                  key={r.label}
                  aria-current={row === r ? "true" : undefined}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg px-3 py-2",
                    row === r && "bg-onboarding-choice text-brand-navy",
                  )}
                >
                  <dt className={cn(row === r && "type-section-title")}>
                    {r.label}
                    {row === r && <span className="ml-2 text-xs type-meta">Your range</span>}
                  </dt>
                  <dd className="tabular-nums">{r.range}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs">
              Ranges use your unrounded BMI. BMI is weight in kilograms divided by height in metres
              squared.
            </p>
            {!adult && (
              <p className="mt-3">
                {age === null
                  ? "Enter your date of birth to interpret your result. These reference ranges apply only to adults aged 20 and over."
                  : "Adult ranges do not apply under age 20. BMI for children and teens needs age- and sex-specific percentiles; discuss your result with a health professional."}
              </p>
            )}
            <a
              href="https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex min-h-11 items-center text-brand-navy underline underline-offset-2"
            >
              About CDC BMI ranges
            </a>
          </div>
        </details>
      ) : (
        <div role="status">
          <p className="type-section-title text-brand-navy">Your BMI</p>
          <p className="mt-1 text-sm type-meta text-text-secondary">
            Enter a valid height and weight to see your BMI.
          </p>
        </div>
      )}
      <p className="mt-4 border-t border-border-default pt-3 text-xs type-meta leading-relaxed text-text-secondary">
        BMI is a screening estimate, not a diagnosis or medical advice. It does not directly measure
        body fat or describe your overall health. A health professional can help you interpret your
        result.
      </p>
    </section>
  );
}

/* ------------------------------------------------------- result screens */

const BUILD_STEPS = [
  "Analyzing your answers",
  "Setting your macro goals based on the TDEE calculator",
  "Customizing your profile",
];

function Building({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(0);
  const cb = useRef(onDone);
  useEffect(() => {
    cb.current = onDone;
  });
  useEffect(() => {
    let fired = false;
    const finish = () => {
      if (fired) return;
      fired = true;
      cb.current();
    };
    const timers = [350, 750, 1150].map((ms, i) => window.setTimeout(() => setDone(i + 1), ms));
    timers.push(window.setTimeout(finish, 1500));
    window.addEventListener("keydown", finish);
    window.addEventListener("pointerdown", finish);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("keydown", finish);
      window.removeEventListener("pointerdown", finish);
    };
  }, []);
  return (
    <ResultLayout images={ANALYZING} active={0}>
      <div className="my-auto flex flex-col py-10 lg:my-0 lg:py-0">
        <h1 tabIndex={-1} className={cn("type-display text-brand-navy outline-none", E.chapter)}>
          We’re analyzing your answers!
        </h1>
        <ul aria-live="polite" className="mt-8 flex flex-col gap-4">
          {BUILD_STEPS.map((label, i) => {
            const ok = i < done;
            return (
              <li
                key={label}
                data-testid="building-step"
                data-done={ok}
                className="flex items-center gap-3.5"
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border",
                    ok
                      ? "onb-pop border-selected bg-selected"
                      : "border-border-default bg-surface-white",
                  )}
                >
                  {ok && <Icon name="tick" size={16} color="var(--color-on-selected)" />}
                </span>
                <span className={cn(ok ? "text-text-primary" : "text-text-secondary", E.body)}>
                  {label}
                  {ok && <span className="sr-only"> — done</span>}
                </span>
              </li>
            );
          })}
        </ul>
        <p className={cn("mt-10 type-meta text-text-secondary", E.meta)}>
          Tap anywhere or press any key to skip.
        </p>
      </div>
    </ResultLayout>
  );
}

function useCountUp(target: number | null, ms = 1200): number | null {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (target === null) return;
    let raf = 0;
    let t0: number | undefined;
    const tick = (t: number) => {
      t0 ??= t;
      const p = Math.min(1, Math.max(0, (t - t0) / Math.min(ms, 1500)));
      setV(1 - (1 - p) ** 3);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return target === null ? null : Math.round(target * v);
}

function Reveal({
  calories,
  protein,
  goalLabel,
  primaryLabel,
  onBack,
  onReview,
  onPrimary,
}: {
  calories: number | null;
  protein: number | null;
  goalLabel: string;
  primaryLabel: string;
  onBack: () => void;
  onReview: () => void;
  onPrimary: () => void;
}) {
  const shown = useCountUp(calories);
  return (
    <StepLayout
      images={IMAGES}
      active={READY_INDEX}
      header={<div />}
      stepKey="reveal"
      onBack={onBack}
      onSubmit={onPrimary}
      actions={
        <PrimaryButton
          type="submit"
          label={primaryLabel}
          className="flex-1 lg:ml-auto lg:max-w-60"
        />
      }
    >
      <p className="type-eyebrow uppercase tracking-[.1em] text-teal-800">Plan ready</p>
      <h1 tabIndex={-1} className={cn("mt-3 type-display text-brand-navy outline-none", E.chapter)}>
        Your starting plan
      </h1>
      <p className="mt-2 text-base leading-6 text-text-secondary">
        Start with these daily targets, then adjust them as you learn what works for you.
      </p>
      <section
        aria-label="Starting daily calorie target"
        className="mt-6 rounded-[20px] bg-navy-50 px-5 py-6 sm:px-6"
      >
        <p className="text-xs type-section-title uppercase tracking-[.1em] text-text-secondary">
          Daily calorie target
        </p>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            aria-hidden
            data-testid="reveal-calories"
            className={cn("type-numeral tabular-nums text-design-orange", E.hero)}
          >
            {shown === null ? "—" : fmt(shown)}
          </span>
          <span className="text-base text-text-secondary">kcal / day</span>
          <span className="sr-only">
            {calories === null ? "Calories not available" : `${fmt(calories)} calories a day`}
          </span>
        </p>
        <p className="mt-2 text-sm text-brand-navy">
          A starting point for <strong>{goalLabel.toLowerCase()}</strong>.
        </p>
      </section>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <PlanCard
          label="Protein"
          value={protein === null ? "—" : fmt(protein)}
          unit="g"
          reason="A daily target to support your goal."
        />
        <PlanCard
          label="Water"
          value={String(DEFAULT_TARGETS.waterOz)}
          unit="oz"
          reason="A general guide. More on hot days."
        />
      </div>
      <p className="mt-4 text-xs leading-5 text-text-secondary">
        Estimated from your answers using the TDEE calculator. Your needs may change over time.
      </p>
      <button
        type="button"
        onClick={onReview}
        className={cn(
          "mt-4 min-h-11 rounded-full px-3 type-button-secondary text-brand-navy underline underline-offset-4 hover:bg-navy-soft",
          E.body,
        )}
      >
        Review your details
      </button>
    </StepLayout>
  );
}

function PlanCard({
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
    <div className="flex min-w-0 flex-col gap-1.5 rounded-2xl border border-border-divider bg-white p-4">
      <span className={cn("type-item-title text-text-primary", E.body)}>{label}</span>
      <span className="flex items-baseline gap-1 whitespace-nowrap">
        <span className={cn("type-row-figure tabular-nums text-brand-navy", E.chapter)}>
          {value}
        </span>
        <span className={cn("type-unit text-text-secondary", E.body)}>{unit}</span>
      </span>
      <span className={cn("text-text-secondary", E.body)}>{reason}</span>
    </div>
  );
}

function SavePlan({
  calories,
  protein,
  busy,
  error,
  onBack,
  onApple,
  onGoogle,
  onEmail,
  onGuest,
}: {
  calories: number | null;
  protein: number | null;
  busy: boolean;
  error?: string;
  onBack: () => void;
  onApple: () => void;
  onGoogle: () => void;
  onEmail: () => void;
  onGuest: () => void;
}) {
  return (
    <ResultLayout images={IMAGES} active={READY_INDEX} onBack={onBack}>
      <div className="onb-step-in my-auto flex flex-col py-8 lg:my-0 lg:py-0">
        <p className="onb-eyebrow">Your starting plan is ready</p>
        <h1
          tabIndex={-1}
          className="mt-3 text-[clamp(2rem,3vw,3rem)] type-section-title leading-tight tracking-tight text-brand-navy outline-none"
        >
          Save your plan
        </h1>
        <p className={cn("mt-3 max-w-[42ch] text-text-secondary", E.body)}>
          Your daily starting targets are ready. Choose how you’d like to begin.
        </p>
        <section aria-label="Your starting plan" className="panel mt-7 overflow-hidden shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-border-divider px-5 py-4">
            <div>
              <p className="onb-eyebrow">Your daily plan</p>
              <p className="mt-1 text-sm type-meta text-text-secondary">
                A starting point you can adjust later
              </p>
            </div>
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-teal-soft"
            >
              <Icon name="track" size={19} color="var(--color-brand-navy)" />
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 p-5 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-xs type-meta text-text-secondary">Calories</dt>
              <dd className="mt-1 text-[28px] type-numeral tabular-nums text-brand-navy">
                {calories === null ? "—" : fmt(calories)}{" "}
                <span className="text-sm type-body text-text-secondary">kcal</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs type-meta text-text-secondary">Protein</dt>
              <dd className="mt-1 text-[24px] type-numeral tabular-nums text-brand-navy">
                {protein === null ? "—" : fmt(protein)}{" "}
                <span className="text-sm type-body text-text-secondary">g</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs type-meta text-text-secondary">Water</dt>
              <dd className="mt-1 text-[24px] type-numeral tabular-nums text-brand-navy">
                {DEFAULT_TARGETS.waterOz}{" "}
                <span className="text-sm type-body text-text-secondary">oz</span>
              </dd>
            </div>
          </dl>
        </section>
        <div className="mt-7 flex flex-col gap-3">
          <SocialButton
            label="Continue with email"
            icon={<Icon name="shareEmail" size={20} color="currentColor" />}
            onPress={onEmail}
            disabled={busy}
            className={cn("h-14 border-brand-navy bg-brand-navy text-white", E.body)}
          />
          <p className="py-1 text-center text-xs text-text-secondary">Or continue with</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <SocialButton
              label="Continue with Apple"
              dark
              icon={<AppleLogo color="currentColor" />}
              onPress={onApple}
              disabled={!APPLE_SIGN_IN_ENABLED || busy}
              title={APPLE_SIGN_IN_ENABLED ? undefined : "Apple sign-in is coming soon"}
              className={cn("h-14", E.body)}
            />
            <SocialButton
              label="Continue with Google"
              icon={<GoogleLogo />}
              onPress={onGoogle}
              disabled={busy}
              className={cn("h-14", E.body)}
            />
          </div>
        </div>
        {error && (
          <p role="status" className="mt-3 text-center text-xs text-text-secondary">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={onGuest}
          disabled={busy}
          className={cn(
            "mt-5 min-h-12 w-full rounded-full border border-border-default bg-white px-4 type-button-secondary text-brand-navy hover:bg-navy-soft disabled:opacity-60",
            E.body,
          )}
        >
          Continue without an account
        </button>
      </div>
    </ResultLayout>
  );
}

/* ------------------------------------------------------------- the flow */

type Screen = "setup" | "review" | "building" | "reveal" | "save";

interface Init {
  screen: Screen;
  step: Step;
  answered: Step[];
  dob: string;
  goals: GoalChoice[];
  activity: ActivityKey | null;
  health: Health[];
  heightIn: number;
  heightImperial: boolean;
  weightLb: number;
  weightImperial: boolean;
  editReturnTo: string | null;
}

const DEFAULTS = { heightIn: 67, weightLb: 165 };

const stepOf = (v: string | null): Step | null => {
  if (v === "encourage" || v === "weight") return "height";
  return (STEPS as readonly string[]).includes(v ?? "") ? (v as Step) : null;
};

const goalsFor = (goal: GoalKey | null): GoalChoice[] =>
  goal === "lose" ? ["lose"] : goal === "recomp" ? ["freshIdeas"] : goal ? ["trackProgress"] : [];

const healthFor = (c: SurgicalContext | null): Health[] =>
  c === "Preparing for surgery"
    ? ["plastic"]
    : c === "Recovering from surgery"
      ? ["bariatric"]
      : c === "No surgery"
        ? ["none"]
        : c
          ? ["private"]
          : [];

function initial(
  params: URLSearchParams,
  profile: ReturnType<typeof useProfile>["profile"],
  signedInDone: boolean,
): Init {
  const draft = loadDraft();
  const edit = safeNext(params.get("returnTo"));
  const asked = stepOf(params.get("step"));
  const fromProfile = () => {
    const imperial = profile?.isImperial ?? true;
    return {
      dob: isoToDob(profile?.dateOfBirth ?? null),
      goals: goalsFor(profile?.goal ?? null),
      activity: profile?.activityLevel ?? null,
      health: healthFor(profile?.surgicalContext ?? null),
      heightIn: profile?.heightCm ? profile.heightCm / CM : DEFAULTS.heightIn,
      heightImperial: imperial,
      weightLb: profile?.weightKg ? profile.weightKg / KG : DEFAULTS.weightLb,
      weightImperial: imperial,
    };
  };
  const base =
    edit || (!draft && signedInDone)
      ? fromProfile()
      : draft
        ? {
            dob: draft.dob,
            goals: goalsFor(draft.goal),
            activity: draft.activityLevel,
            health: healthFor(draft.surgicalContext),
            heightIn: draft.heightIn,
            heightImperial: draft.heightImperial,
            weightLb: draft.weightLb,
            weightImperial: draft.weightImperial,
          }
        : {
            dob: "",
            goals: [] as GoalChoice[],
            activity: null,
            health: [] as Health[],
            heightIn: DEFAULTS.heightIn,
            heightImperial: true,
            weightLb: DEFAULTS.weightLb,
            weightImperial: true,
          };
  const answered: Step[] = edit
    ? [...STEPS]
    : STEPS.filter((s) => draft?.answered.includes(s === "height" ? "weight" : (s as never)));
  const next = STEPS.find((s) => !answered.includes(s)) ?? null;
  const pos = (draft?.position ?? null) as QuestionnairePosition | null;
  let step: Step =
    asked ?? (pos && (STEPS as readonly string[]).includes(pos) ? (pos as Step) : (next ?? "dob"));
  let screen: Screen = "setup";
  if (!edit && !asked && (pos === "review" || (!next && pos !== "reveal" && pos !== "save")))
    screen = answered.length === STEPS.length ? "review" : "setup";
  if (!edit && !asked && (pos === "reveal" || pos === "save") && answered.length === STEPS.length)
    screen = pos;
  if (screen !== "setup") step = "surgery";
  return {
    screen,
    step: edit ? (asked ?? "goal") : step,
    answered,
    ...base,
    editReturnTo: edit,
  };
}

export function QuestionnaireScreen() {
  const ready = useMounted();
  const [params] = useSearchParams();
  const { isLoading } = useProfile();
  const editing = safeNext(params.get("returnTo")) !== null;
  // In edit mode the answers come from the saved profile, so wait for it.
  return ready && !(editing && isLoading) ? <Flow /> : null;
}

function Flow() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { profile } = useProfile();
  const session = useAppSession();
  const uid = useId();
  const [init] = useState(() => initial(params, profile, false));
  const edit = init.editReturnTo !== null;

  const [screen, setScreen] = useState<Screen>(init.screen);
  const [step, setStep] = useState<Step>(init.step);
  const [answered, setAnswered] = useState<Step[]>(init.answered);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [fromReview, setFromReview] = useState(false);
  const [seenReveal, setSeenReveal] = useState(init.screen === "reveal" || init.screen === "save");
  const [busy, setBusy] = useState(false);

  const [dob, setDob] = useState(init.dob);
  const [dobTouched, setDobTouched] = useState(false);
  const [goals, setGoals] = useState<GoalChoice[]>(init.goals);
  const [activity, setActivity] = useState<ActivityKey | null>(init.activity);
  const [health, setHealth] = useState<Health[]>(init.health);

  const [heightImperial, setHeightImperial] = useState(init.heightImperial);
  const [ft, setFt] = useState(String(Math.floor(Math.round(init.heightIn) / 12)));
  const [inch, setInch] = useState(String(Math.round(init.heightIn) % 12));
  const [cm, setCm] = useState(String(Math.round(init.heightIn * CM)));
  const [heightIn, setHeightIn] = useState(init.heightIn);
  const [weightImperial, setWeightImperial] = useState(init.weightImperial);
  const [weightText_, setWeightText] = useState(
    String(Math.round(init.weightImperial ? init.weightLb : init.weightLb * KG)),
  );
  const [weightLb, setWeightLb] = useState(init.weightLb);
  const [touched, setTouched] = useState({
    height: edit || Math.round(init.heightIn) !== DEFAULTS.heightIn,
    weight: edit || Math.round(init.weightLb) !== DEFAULTS.weightLb,
  });
  const firstRef = useRef<HTMLInputElement | null>(null);
  const weightRef = useRef<HTMLInputElement | null>(null);

  const age = ageFromDob(dob);
  const dobOk = dobComplete(dob) && age !== null && age >= 13 && age <= 100;
  const dobError = dobComplete(dob)
    ? age === null
      ? "Enter a real date as MM/DD/YYYY."
      : age > 100
        ? "Enter a realistic date of birth."
        : undefined
    : touchedDob(dobTouched, dob)
      ? "Enter your date of birth as MM/DD/YYYY."
      : undefined;
  const tooYoung = dobComplete(dob) && age !== null && age < 13;

  const H = heightFrom(heightImperial, ft, inch, cm);
  const W = weightFrom(weightImperial, weightText_);
  const goal: GoalKey = goals.length ? goalKeyFor(goals.map((g) => CARD_FOR[g])) : "maintain";
  const act: ActivityKey = activity ?? "moderatelyActive";
  const valid: Record<Step, boolean> = {
    dob: dobOk,
    goal: goals.length > 0,
    height: H !== null && W !== null,
    activity: activity !== null,
    surgery: health.length > 0,
  };
  const context: SurgicalContext = health.length ? CONTEXT_FOR[health[0]] : "No surgery";

  const kg = weightLb * KG;
  const cmH = heightIn * CM;
  const target = calorieTarget({ weightKg: kg, heightCm: cmH, age, activityLevel: act, goal });
  const energy = tdee({ weightKg: kg, heightCm: cmH, age, activityLevel: act });
  const protein = target
    ? (macroGrams(target).find((m) => m.key === "protein")?.grams ?? null)
    : null;
  const bmi = kg / ((cmH / 100) * (cmH / 100));

  const draftNow = (): QuestionnaireDraft => ({
    position: screen === "setup" ? step : screen,
    answered: answered.flatMap((s) =>
      s === "height" ? ["encourage", "height", "weight"] : [s],
    ) as QuestionnaireDraft["answered"],
    dob,
    goal: goals.length ? goal : null,
    activityLevel: activity,
    surgicalContext: health.length ? context : null,
    heightIn,
    heightImperial,
    weightLb,
    weightImperial,
  });
  const draftRef = useRef(draftNow);
  useEffect(() => {
    draftRef.current = draftNow;
  });
  useEffect(() => {
    if (!edit) saveDraft(draftRef.current());
  }, [
    edit,
    screen,
    step,
    answered,
    dob,
    goals,
    activity,
    health,
    heightIn,
    heightImperial,
    weightLb,
    weightImperial,
  ]);

  const social = useSocialSignIn(AFTER);

  const go = (s: Screen, st: Step = step, dir: "forward" | "back" = "forward") => {
    setDirection(dir);
    setScreen(s);
    setStep(st);
  };

  const syncHeight = (inches: number) => {
    const n = Math.round(inches);
    setFt(String(Math.floor(n / 12)));
    setInch(String(n % 12));
    setCm(String(Math.round(inches * CM)));
  };
  const heightChange = (f: string, i: string, c: string) => {
    setTouched((t) => (t.height ? t : { ...t, height: true }));
    setFt(f);
    setInch(i);
    setCm(c);
    const v = heightFrom(heightImperial, f, i, c);
    if (v !== null) setHeightIn(v);
  };
  const weightChange = (v: string) => {
    setTouched((t) => (t.weight ? t : { ...t, weight: true }));
    setWeightText(v);
    const lb = weightFrom(weightImperial, v);
    if (lb !== null) setWeightLb(lb);
  };

  const idx = STEPS.indexOf(step);

  const finish = async (): Promise<boolean> => {
    if (!STEPS.every((s) => valid[s])) {
      go("setup", STEPS.find((s) => !valid[s]) ?? "dob", "back");
      return false;
    }
    setBusy(true);
    try {
      await submitQuestionnaire(draftNow());
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const advance = async () => {
    setAnswered((a) => (a.includes(step) ? a : [...a, step]));
    if (fromReview) {
      setFromReview(false);
      go("review");
    } else if (edit) {
      if (await finish()) navigate(init.editReturnTo ?? "/you");
    } else if (idx < STEPS.length - 1) {
      go("setup", STEPS[idx + 1]);
    } else if (STEPS.every((s) => valid[s])) {
      setSeenReveal(false);
      go("review");
    } else {
      go("setup", "dob", "back");
    }
  };
  const submitStep = () => {
    if (!valid[step]) {
      if (step === "dob") {
        setDobTouched(true);
        firstRef.current?.focus();
      }
      return;
    }
    void advance();
  };
  const back = () => {
    if (fromReview) {
      setFromReview(false);
      go("review", step, "back");
    } else if (edit) navigate(init.editReturnTo ?? "/you");
    else if (idx > 0) go("setup", STEPS[idx - 1], "back");
    else navigate("/onboarding");
  };
  const editStep = (s: Step) => {
    setFromReview(true);
    go("setup", s, "back");
  };

  const isSignedIn = session.isSignedIn;
  const goalLabel = GOAL_LABEL[goal];

  /* ------------------------------------------------------------- screens */

  if (screen === "building") return <Building onDone={() => go("reveal")} />;

  if (screen === "reveal")
    return (
      <Reveal
        calories={target}
        protein={protein}
        goalLabel={goalLabel}
        primaryLabel={isSignedIn ? "Start using ForkThis" : "Save your plan"}
        onBack={() => go("setup", "surgery", "back")}
        onReview={() => {
          setSeenReveal(true);
          go("review");
        }}
        onPrimary={() => {
          if (isSignedIn) {
            void finish().then((ok) => ok && navigate(AFTER));
          } else go("save");
        }}
      />
    );

  if (screen === "save")
    return (
      <SavePlan
        calories={target}
        protein={protein}
        busy={busy || social.busy !== null}
        error={social.error}
        onBack={() => go("reveal", step, "back")}
        onApple={() => void social.start("apple", finish)}
        onGoogle={() => void social.start("google", finish)}
        onEmail={() =>
          void finish().then((ok) => ok && navigate(`/signup?next=${encodeURIComponent(AFTER)}`))
        }
        onGuest={() =>
          void finish().then(async (ok) => {
            if (!ok) return;
            try {
              await startGuestSession();
              navigate(AFTER);
            } catch (e) {
              toast.error(getErrorMessage(e));
            }
          })
        }
      />
    );

  if (screen === "review") {
    const about = [
      {
        label: "Date of birth",
        value: age === null ? dob : `${dob} (${age})`,
        step: "dob" as Step,
      },
      { label: "Height", value: heightText(heightIn, heightImperial), step: "height" as Step },
      { label: "Weight", value: weightText(weightLb, weightImperial), step: "height" as Step },
    ];
    const inputs = [
      {
        label: "Goal",
        value: goals.length ? goals.map((g) => INTEREST_LABEL[g]).join(" · ") : goalLabel,
        step: "goal" as Step,
      },
      { label: "Activity", value: ACTIVITY_LABEL[act], step: "activity" as Step },
      {
        label: "Health context",
        value: health.length
          ? health
              .map((h) => HEALTH.find((x) => x.value === h)?.title ?? "Prefer not to say")
              .join(" · ")
          : "None of the above",
        step: "surgery" as Step,
      },
    ];
    return (
      <StepLayout
        images={IMAGES}
        active={STEPS.length}
        stepKey="review"
        direction={direction}
        header={<Progress current={STEPS.length} total={STEPS.length} stepName="Review" complete />}
        onBack={() =>
          edit
            ? navigate(init.editReturnTo ?? "/you")
            : seenReveal
              ? go("reveal", step, "back")
              : go("setup", "surgery", "back")
        }
        onSubmit={() => {
          if (edit) void finish().then((ok) => ok && navigate(init.editReturnTo ?? "/you"));
          else {
            const bad = STEPS.find((s) => !valid[s]);
            if (bad) go("setup", bad, "back");
            else {
              setAnswered([...STEPS]);
              go(seenReveal ? "reveal" : "building");
            }
          }
        }}
        actions={
          <PrimaryButton
            type="submit"
            label={edit ? "Confirm and continue" : seenReveal ? "Back to your plan" : "Continue"}
            className="flex-1 lg:ml-auto lg:max-w-60"
          />
        }
      >
        <Heading
          size="chapter"
          eyebrow="Your plan summary"
          title="Review"
          helper="Check your details before continuing. Use Edit to change anything; your plan will update."
        />
        <section
          aria-labelledby={`${uid}-plan`}
          className="mt-6 rounded-2xl bg-onboarding-choice p-5"
        >
          <h2 id={`${uid}-plan`} className={cn("type-section-title text-brand-navy", E.body)}>
            Your starting plan
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <StatTile icon="fire" label="Calories" value={target ? fmt(target) : "—"} unit="kcal" />
            <StatTile
              icon="dumbbell"
              label="Protein"
              value={protein === null ? "—" : String(protein)}
              unit="g"
            />
            <StatTile
              icon="droplet"
              label="Water"
              value={String(DEFAULT_TARGETS.waterOz)}
              unit="oz"
            />
          </div>
          <p className={cn(D.notes, "type-meta text-text-secondary", E.meta)}>
            Water is a general guide — drink more on hot days and when you train.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-border-default pt-4">
            <div>
              <dt className={cn("type-meta text-text-secondary", E.meta)}>TDEE</dt>
              <dd className={cn("mt-0.5 type-row-figure text-text-primary", E.body)}>
                {energy === null ? "Not enough info" : `${fmt(energy)} kcal/day`}
              </dd>
            </div>
            <div>
              <dt className={cn("type-meta text-text-secondary", E.meta)}>BMI</dt>
              <dd className={cn("mt-0.5 type-row-figure text-text-primary", E.body)}>
                {Number.isFinite(bmi) ? bmi.toFixed(1) : "Not enough info"}
              </dd>
            </div>
          </dl>
        </section>
        {[
          { title: "About you", rows: about },
          { title: "Your plan inputs", rows: inputs },
        ].map((sec) => (
          <section key={sec.title} className="mt-6">
            <h2 className="onb-eyebrow">{sec.title}</h2>
            <div className="panel mt-2.5 px-4">
              {sec.rows.map((r) => (
                <ReviewRow
                  key={r.label}
                  label={r.label}
                  value={r.value}
                  onEdit={() => editStep(r.step)}
                />
              ))}
            </div>
          </section>
        ))}
      </StepLayout>
    );
  }

  const copy = COPY[step];
  const headingId = `${uid}-heading`;
  const whyId = `${uid}-why`;
  const heightValue = heightImperial ? (H ?? heightIn) : (num(cm) ?? Math.round(heightIn * CM));
  const weightValue = num(weightText_) ?? Math.round(weightImperial ? weightLb : weightLb * KG);

  return (
    <StepLayout
      images={IMAGES}
      active={idx}
      stepKey={`step-${step}`}
      direction={direction}
      header={
        <div className="flex flex-col gap-2">
          <Progress current={idx + 1} total={STEPS.length} stepName={copy.name} />
          {edit && (
            <p className="text-[13px] type-meta text-text-secondary">
              Editing one answer.{" "}
              <Link
                to="/onboarding"
                className="inline-flex min-h-6 items-center type-button text-primary underline underline-offset-2"
              >
                View full quiz
              </Link>
            </p>
          )}
        </div>
      }
      onBack={back}
      onSubmit={submitStep}
      actions={
        <PrimaryButton
          type="submit"
          label={fromReview ? "Back to review" : busy ? "Saving..." : "Continue"}
          disabled={(step !== "dob" && !valid[step]) || busy}
          className="flex-1 lg:ml-auto lg:max-w-60"
        />
      }
    >
      <Heading
        eyebrow={copy.eyebrow}
        title={copy.title}
        why={step === "goal" || step === "activity" || step === "dob" ? undefined : copy.why}
        helper={
          step === "goal"
            ? `${copy.why}\nSelect all that apply.`
            : step === "activity"
              ? "Choose the level that best describes a typical week."
              : undefined
        }
        headingId={headingId}
        lineId={whyId}
      />

      {step === "dob" && (
        <div className={D.control}>
          <p id={`${uid}-dob-label`} className="sr-only">
            Date of birth
          </p>
          <p className="mb-3 text-sm type-meta text-text-secondary">
            Enter your date of birth (MM/DD/YYYY).
          </p>
          <DateField
            value={dob}
            onChange={(v) => {
              setDobTouched(true);
              setDob(v);
            }}
            labelledBy={`${uid}-dob-label`}
            invalid={!!(dobError || tooYoung)}
            describedBy={`${uid}-dob-help ${uid}-dob-result`}
            firstInputRef={firstRef}
          />
          <details id={`${uid}-dob-help`} className="mt-3 text-sm text-text-secondary">
            <summary className="inline-flex min-h-8 cursor-pointer items-center gap-3 rounded-md text-lg type-section-title text-brand-navy marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy [&::-webkit-details-marker]:hidden">
              <Icon name="info" size={18} color="currentColor" /> Why we ask
            </summary>
            <p className="mt-1 pl-[1.875rem] leading-5">{copy.why}</p>
          </details>
          <div className="mt-8">
            <Reassurance large>
              Private to you. Your date of birth is never shown on your profile.
            </Reassurance>
          </div>
          <div className={cn("flex flex-col", D.notes, D.stack)}>
            <div id={`${uid}-dob-result`} aria-live="polite" className="min-h-14">
              {dobOk ? (
                <Message message={`${age} years old`} success />
              ) : dobError ? (
                <Message message={dobError} />
              ) : tooYoung ? (
                <div role="alert" className="rounded-2xl bg-error-soft p-4">
                  <p
                    className={cn(
                      "flex items-center gap-2 type-section-title text-text-primary",
                      E.body,
                    )}
                  >
                    <Icon name="alert" size={18} color="var(--color-status-low)" />
                    Age requirement not met
                  </p>
                  <p className={cn("mt-1.5 type-meta text-text-primary", E.meta)}>
                    You must be at least 13 years old to create an account. Please ask a parent or
                    guardian for help.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {step === "goal" && (
        <GoalCards
          value={goals}
          onChange={setGoals}
          labelledBy={headingId}
          describedBy={whyId}
          className={D.control}
        />
      )}

      {step === "height" && (
        <>
          <div
            className={cn(
              "flex w-full flex-col items-stretch rounded-2xl bg-surface-card p-4",
              D.control,
              D.siblings,
            )}
          >
            <p className="type-section-title text-brand-navy">Height</p>
            <UnitToggle
              label="Height units"
              left="ft/in"
              right="cm"
              leftSelected={heightImperial}
              onChange={(v) => {
                syncHeight(heightIn);
                setHeightImperial(v);
              }}
            />
            <Stepper
              name="height"
              value={heightValue}
              min={heightImperial ? MIN_IN : MIN_CM}
              max={heightImperial ? MAX_IN : MAX_CM}
              onStep={(v) => {
                setTouched((t) => ({ ...t, height: true }));
                const inches = heightImperial ? v : v / CM;
                setHeightIn(inches);
                syncHeight(inches);
              }}
              invalid={H === null}
              example={!touched.height}
              describedBy={`${whyId} ${uid}-height-hint`}
              fields={
                heightImperial
                  ? [
                      {
                        id: `${uid}-ft`,
                        label: "Height, feet",
                        unit: "ft",
                        maxLength: 1,
                        value: ft,
                        onChange: (v) => heightChange(v, inch, cm),
                        inputRef: firstRef,
                      },
                      {
                        id: `${uid}-in`,
                        label: "Height, inches",
                        unit: "in",
                        maxLength: 2,
                        value: inch,
                        onChange: (v) => heightChange(ft, v, cm),
                      },
                    ]
                  : [
                      {
                        id: `${uid}-cm`,
                        label: "Height, centimetres",
                        unit: "cm",
                        maxLength: 3,
                        value: cm,
                        onChange: (v) => heightChange(ft, inch, v),
                        inputRef: firstRef,
                      },
                    ]
              }
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              {!touched.height && (
                <ExampleHint
                  label="Example height — tap to enter yours"
                  onPress={() => {
                    firstRef.current?.focus();
                    firstRef.current?.select();
                  }}
                />
              )}
              <p
                id={`${uid}-height-hint`}
                aria-live="polite"
                className={cn(
                  "type-meta",
                  E.meta,
                  H === null ? "text-error-red" : "text-text-secondary",
                )}
              >
                {H === null
                  ? heightImperial
                    ? "Enter a height between 3 ft and 8 ft, with 0–11 inches."
                    : `Enter a height between ${MIN_CM} and ${MAX_CM} cm.`
                  : heightImperial
                    ? `That's ${Math.round(H * CM)} cm.`
                    : `That's ${heightText(H, true)}.`}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "mt-3 flex w-full flex-col items-stretch rounded-2xl bg-surface-card p-4",
              D.siblings,
            )}
          >
            <p className="type-section-title text-brand-navy">Weight</p>
            <UnitToggle
              label="Weight units"
              left="lbs"
              right="kg"
              leftSelected={weightImperial}
              onChange={(v) => {
                setWeightText(String(Math.round(v ? weightLb : weightLb * KG)));
                setWeightImperial(v);
              }}
            />
            <Stepper
              name="weight"
              value={weightValue}
              min={1}
              max={999}
              onStep={(v) => weightChange(String(v))}
              invalid={W === null}
              example={!touched.weight}
              describedBy={`${whyId} ${uid}-weight-hint`}
              fields={[
                {
                  id: `${uid}-weight`,
                  label: weightImperial ? "Weight, pounds" : "Weight, kilograms",
                  unit: weightImperial ? "lbs" : "kg",
                  maxLength: 3,
                  value: weightText_,
                  onChange: weightChange,
                  inputRef: weightRef,
                },
              ]}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              {!touched.weight && (
                <ExampleHint
                  label="Example weight — tap to enter yours"
                  onPress={() => {
                    weightRef.current?.focus();
                    weightRef.current?.select();
                  }}
                />
              )}
              <p
                id={`${uid}-weight-hint`}
                aria-live="polite"
                className={cn(
                  "type-meta",
                  E.meta,
                  W === null ? "text-error-red" : "text-text-secondary",
                )}
              >
                {W === null
                  ? "Enter your weight."
                  : weightImperial
                    ? `That's ${Math.round(W * KG)} kg.`
                    : `That's ${Math.round(W)} lbs.`}
              </p>
            </div>
          </div>
          <BmiDetails heightIn={H} weightLb={W} age={age} />
        </>
      )}

      {step === "activity" && (
        <OptionRadioGroup
          className={cn(D.control, "[&_button]:min-h-[110px]")}
          labelledBy={headingId}
          describedBy={whyId}
          options={ACTIVITY_KEYS.filter((k) => k !== "extremelyActive" || activity === k).map(
            (k) => ({
              value: k,
              title: ACTIVITY_LABEL[k],
              subtitle: ACTIVITY_HINT[k],
              icon: ACTIVITY_ICON[k],
              glyph: k === "veryActive" ? <RunnerIcon size={36} /> : undefined,
            }),
          )}
          value={activity}
          onChange={setActivity}
        />
      )}

      {step === "surgery" && (
        <div className={cn("flex flex-col", D.control, D.notesGap)}>
          <div
            role="group"
            aria-labelledby={headingId}
            aria-describedby={whyId}
            className="flex flex-col gap-3"
          >
            {HEALTH.map((o) => {
              const on = health.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() =>
                    setHealth((cur) =>
                      o.value === "none"
                        ? ["none"]
                        : on
                          ? cur.filter((h) => h !== o.value)
                          : [...cur.filter((h) => h !== "none" && h !== "private"), o.value],
                    )
                  }
                  className={cn(
                    "flex min-h-[92px] items-center justify-between rounded-2xl border border-border-default px-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                    on ? "bg-onboarding-choice" : "bg-white hover:bg-navy-soft",
                  )}
                >
                  <span>
                    <span className="block text-base type-item-title text-text-primary">
                      {o.title}
                    </span>
                    {o.subtitle && (
                      <span className="mt-1 block text-sm text-text-secondary">{o.subtitle}</span>
                    )}
                  </span>
                  <Icon
                    name={o.icon}
                    size={25}
                    color={on ? "var(--color-brand-navy)" : "var(--color-navy-300)"}
                  />
                </button>
              );
            })}
          </div>
          <Reassurance icon="shield">
            Private to you, and you can change it later. Choose{" "}
            <button
              type="button"
              onClick={() => setHealth(["private"])}
              className="min-h-6 underline"
            >
              Prefer not to say
            </button>{" "}
            and the app keeps recommendations general and hides surgery-specific resources.
          </Reassurance>
        </div>
      )}
    </StepLayout>
  );
}

function touchedDob(touched: boolean, dob: string): boolean {
  return touched && dob.length > 0;
}
