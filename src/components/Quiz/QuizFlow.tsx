"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bike,
  CalendarDays,
  Check,
  CircleCheck,
  Footprints,
  Leaf,
  Minus,
  PersonStanding,
  Share2,
  Plus,
  Shield,
  SquarePen,
  Syringe,
  User,
  type LucideIcon,
} from "lucide-react";
import { AppImage } from "@/components/AppImage";
import { Logo } from "@/components/Logo";
import { SplitFrame } from "@/components/SplitFrame";
import { SyringeCheck } from "./SyringeCheck";
import { useCountUp } from "./useCountUp";
import { SocialAuthDialog, type SocialProvider } from "@/components/SocialAuthButtons/SocialAuthDialog";
import { ROUTES } from "@/lib/constants";
import {
  GOAL_LABEL,
  IN_TO_CM,
  LB_TO_KG,
  ageFromDob,
  calorieTarget,
  macroGrams,
  tdee,
  type ActivityKey,
} from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_COPY,
  ACTIVITY_ORDER,
  ANALYZING_IMAGE,
  EMPTY_ANSWERS,
  EXAMPLE_HEIGHT_IN,
  EXAMPLE_WEIGHT_LB,
  GOAL_OPTIONS,
  HEALTH_OPTIONS,
  MAX_IN,
  MAX_LB,
  MIN_IN,
  MIN_LB,
  RESULT_IMAGE,
  START_IMAGE,
  STEPS,
  STEP_COPY,
  type HealthKey,
  type QuizAnswers,
} from "./quizData";
import styles from "./QuizFlow.module.css";

type Position = "start" | (typeof STEPS)[number] | "analyzing" | "result" | "save";
const STORAGE_KEY = "forkthis.quiz";

function load(): { answers: QuizAnswers; position: Position } | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.back} onClick={onClick} aria-label="Back">
      <ArrowLeft size={20} />
    </button>
  );
}

function Mark() {
  return <Logo mark small />;
}

export function QuizFlow() {
  const [answers, setAnswers] = useState<QuizAnswers>(EMPTY_ANSWERS);
  const [position, setPosition] = useState<Position>("start");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = load();
    /* eslint-disable react-hooks/set-state-in-effect -- restore a client-only draft after mount */
    if (saved) {
      setAnswers({ ...EMPTY_ANSWERS, ...saved.answers });
      setPosition(saved.position === "analyzing" ? "result" : saved.position);
    }
    // Deep link: /onboarding?step=goal opens that screen (used for QA and sharing).
    const step = new URLSearchParams(window.location.search).get("step");
    const valid = ["start", ...STEPS, "analyzing", "result", "save"];
    if (step && valid.includes(step)) setPosition(step as Position);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, position }));
    } catch {
      /* storage unavailable — the quiz still works in memory */
    }
  }, [answers, position, hydrated]);

  useEffect(() => {
    if (position !== "analyzing") return;
    const t = window.setTimeout(() => setPosition("result"), 3200);
    return () => window.clearTimeout(t);
  }, [position]);

  const patch = (p: Partial<QuizAnswers>) => setAnswers((a) => ({ ...a, ...p }));
  const idx = STEPS.indexOf(position as (typeof STEPS)[number]);
  const next = () => setPosition(idx === STEPS.length - 1 ? "analyzing" : STEPS[idx + 1]);
  const back = () => setPosition(idx <= 0 ? "start" : STEPS[idx - 1]);

  if (position === "start") {
    return (
      <SplitFrame image={START_IMAGE} variant="quiz">
        <div className={styles.intro}>
          <h1 className={styles.introTitle}>Start Your ForkThis! Quiz</h1>
          <p className={styles.introLead}>Take a short quiz to optimize ForkThis! to fit your goals.</p>
          <button type="button" className={cn(styles.primary, styles.introButton)} onClick={() => setPosition("dob")}>
            Start Here
          </button>
        </div>
      </SplitFrame>
    );
  }

  if (position === "analyzing") {
    return (
      <SplitFrame image={ANALYZING_IMAGE} variant="quiz">
        <Analyzing onSkip={() => setPosition("result")} />
      </SplitFrame>
    );
  }

  if (position === "result") {
    return (
      <SplitFrame image={RESULT_IMAGE} variant="quiz">
        <Result
          answers={answers}
          onBack={() => setPosition("health")}
          onReview={() => setPosition("dob")}
          onSave={() => setPosition("save")}
        />
      </SplitFrame>
    );
  }

  if (position === "save") {
    return (
      <SplitFrame image={RESULT_IMAGE} variant="quiz">
        <SavePlan onBack={() => setPosition("result")} />
      </SplitFrame>
    );
  }

  const copy = STEP_COPY[position];
  const age = ageFromDob(+answers.month, +answers.day, +answers.year);
  const canContinue =
    position === "dob"
      ? age !== null && age >= 13
      : position === "goal"
        ? answers.goals.length > 0
        : position === "activity"
          ? answers.activity !== null
          : position === "health"
            ? answers.health !== null
            : true;
  const first = idx === 0;
  const progress = (
    <div
      className={styles.progress}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={STEPS.length}
      aria-valuenow={idx + 1}
      aria-label={`Step ${idx + 1} of ${STEPS.length}`}
    >
      <span style={{ width: `${((idx + 1) / STEPS.length) * 100}%` }} />
    </div>
  );
  const stepLabel = (
    <p className={cn(styles.stepMeta, first && styles.stepMetaRight)}>
      Step {idx + 1} of {STEPS.length} · {copy.name}
    </p>
  );

  return (
    <SplitFrame image={copy.image} variant="quiz">
      <section className={cn(styles.step, first && styles.stepFirst)}>
        {first ? (
          <header className={styles.headerInline}>
            <BackButton onClick={back} />
            <div className={styles.progressCol}>
              {progress}
              {stepLabel}
            </div>
          </header>
        ) : (
          <header className={styles.header}>
            <div className={styles.headerRow}>
              <BackButton onClick={back} />
              <Mark />
            </div>
            <div className={styles.progressCol}>
              {progress}
              {stepLabel}
            </div>
          </header>
        )}

        <div className={styles.main}>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1 className={styles.title}>{copy.title}</h1>
          {copy.intro?.map((line) => (
            <p key={line} className={styles.copy}>
              {line}
            </p>
          ))}
          {copy.why && (
            <p className={styles.copy}>
              <strong>Why we ask:</strong> {copy.why}
            </p>
          )}

          <div className={styles.body}>
            {position === "dob" && <DobStep answers={answers} patch={patch} age={age} />}
            {position === "goal" && <GoalStep answers={answers} patch={patch} />}
            {position === "height" && <HeightStep answers={answers} patch={patch} />}
            {position === "weight" && <WeightStep answers={answers} patch={patch} />}
            {position === "activity" && <ActivityStep answers={answers} patch={patch} />}
            {position === "health" && <HealthStep answers={answers} patch={patch} />}
          </div>
        </div>

        <footer className={styles.footer}>
          {copy.optional ? (
            <button type="button" className={styles.skip} onClick={next}>
              Skip for now
            </button>
          ) : (
            <span />
          )}
          <button type="button" className={styles.primary} onClick={next} disabled={!canContinue}>
            Continue
          </button>
        </footer>
      </section>
    </SplitFrame>
  );
}

interface StepProps {
  answers: QuizAnswers;
  patch: (p: Partial<QuizAnswers>) => void;
}

function ExampleHint({ centered = false, onPress }: { centered?: boolean; onPress?: () => void }) {
  if (onPress) {
    return (
      <button type="button" className={styles.exampleButton} onClick={onPress}>
        <SquarePen size={16} aria-hidden="true" /> Example — tap to enter yours
      </button>
    );
  }
  return (
    <p className={cn(styles.exampleHint, centered && styles.exampleCentered)}>
      <SquarePen size={16} aria-hidden="true" /> Example — tap to enter yours
    </p>
  );
}

function DobStep({ answers, patch, age }: StepProps & { age: number | null }) {
  const filled = answers.month && answers.day && answers.year.length === 4;
  const dayRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const digits = (v: string) => v.replace(/\D/g, "");

  // Reject values that can never be valid, and move on as soon as a part is complete.
  function onMonth(raw: string) {
    let v = digits(raw);
    if (v.length === 1 && +v > 1) v = `0${v}`; // "3" can only mean March
    if (v.length === 2 && (+v < 1 || +v > 12)) return;
    patch({ month: v });
    if (v.length === 2) dayRef.current?.focus();
  }
  function onDay(raw: string) {
    let v = digits(raw);
    if (v.length === 1 && +v > 3) v = `0${v}`; // "5" can only mean the 5th
    if (v.length === 2 && (+v < 1 || +v > 31)) return;
    patch({ day: v });
    if (v.length === 2) yearRef.current?.focus();
  }
  return (
    <>
      <div className={styles.dob}>
        <label>
          <span>Month</span>
          <input
            inputMode="numeric"
            maxLength={2}
            placeholder="03"
            value={answers.month}
            onChange={(e) => onMonth(e.target.value)}
          />
        </label>
        <label>
          <span>Day</span>
          <input
            inputMode="numeric"
            maxLength={2}
            placeholder="15"
            value={answers.day}
            ref={dayRef}
            onChange={(e) => onDay(e.target.value)}
          />
        </label>
        <label>
          <span>Year</span>
          <input
            inputMode="numeric"
            maxLength={4}
            placeholder="1993"
            value={answers.year}
            ref={yearRef}
            onChange={(e) => patch({ year: digits(e.target.value) })}
          />
        </label>
      </div>
      {!filled && <ExampleHint />}
      {age !== null && age >= 13 ? (
        <p className={styles.agePill} role="status">
          <CircleCheck size={18} aria-hidden="true" /> {age} years old
        </p>
      ) : filled ? (
        <p className={styles.error} role="alert">
          {age === null
            ? "Enter a valid date of birth."
            : "ForkThis! can’t be used by anyone under 13."}
        </p>
      ) : null}
      <p className={styles.note}>
        <Shield size={16} aria-hidden="true" /> Private to you. Your date of birth is never shown on
        your profile.
      </p>
    </>
  );
}

function GoalStep({ answers, patch }: StepProps) {
  const toggle = (g: (typeof GOAL_OPTIONS)[number]["value"]) =>
    patch({
      goals: answers.goals.includes(g)
        ? answers.goals.filter((x) => x !== g)
        : [...answers.goals, g],
    });
  return (
    <div className={styles.goals}>
      {GOAL_OPTIONS.map((o) => {
        const on = answers.goals.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            className={cn(styles.goal, on && styles.goalOn)}
            onClick={() => toggle(o.value)}
          >
            <AppImage src={o.image} alt="" className={cn(styles.goalArt, o.value === "track" && styles.goalArtTrack)} />
            <span className={styles.goalText}>
              <span className={styles.goalTitle}>
                {o.title.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </span>
              <span className={styles.goalSub} style={{ maxWidth: o.subtitleWidth }}>
                {o.subtitle}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className={styles.stepper}>
      <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus size={24} />
      </button>
      <button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus size={24} />
      </button>
    </div>
  );
}

function UnitToggle({
  metric,
  labels,
  onChange,
}: {
  metric: boolean;
  labels: [string, string];
  onChange: (m: boolean) => void;
}) {
  return (
    <div className={styles.units} role="group" aria-label="Units">
      {[false, true].map((m) => (
        <button
          key={String(m)}
          type="button"
          aria-pressed={metric === m}
          className={cn(metric === m && styles.unitOn)}
          onClick={() => onChange(m)}
        >
          {metric === m && <Check size={14} aria-hidden="true" />}
          {labels[m ? 1 : 0]}
        </button>
      ))}
    </div>
  );
}

interface MeasureField {
  id: string;
  label: string;
  unit: string;
  maxLength: number;
  value: string;
  onChange: (digits: string) => void;
}

/** Editable value box: tap to type, focus ring while editing, dashed underline for the example. */
function MeasureBox({
  fields,
  example,
  invalid,
  boxRef,
}: {
  fields: MeasureField[];
  example: boolean;
  invalid: boolean;
  boxRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  return (
    <div
      ref={boxRef}
      role="group"
      className={cn(
        styles.valueBox,
        example && styles.valueBoxExample,
        invalid && styles.valueBoxInvalid,
      )}
    >
      {fields.map((f) => {
        const shown = drafts[f.id] ?? f.value;
        return (
          <span key={f.id} className={styles.valueField}>
            <input
              aria-label={f.label}
              inputMode="numeric"
              autoComplete="off"
              maxLength={f.maxLength}
              value={shown}
              aria-invalid={invalid || undefined}
              className={cn(example && styles.valueInputDim)}
              style={{ width: `${Math.max(1, shown.length) + 0.2}ch` }}
              onFocus={(e) => e.currentTarget.select()}
              onBlur={() =>
                setDrafts((d) => {
                  const rest = { ...d };
                  delete rest[f.id];
                  return rest;
                })
              }
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "").slice(0, f.maxLength);
                setDrafts((d) => ({ ...d, [f.id]: v }));
                f.onChange(v);
              }}
            />
            <span aria-hidden="true">{f.unit}</span>
          </span>
        );
      })}
    </div>
  );
}

const CM_MIN = Math.ceil(MIN_IN * IN_TO_CM);
const CM_MAX = Math.floor(MAX_IN * IN_TO_CM);
const KG_MIN = Math.ceil(MIN_LB * LB_TO_KG);
const KG_MAX = Math.floor(MAX_LB * LB_TO_KG);

function HeightStep({ answers, patch }: StepProps) {
  const touched = answers.heightIn !== null;
  const inches = answers.heightIn ?? EXAMPLE_HEIGHT_IN;
  const boxRef = useRef<HTMLDivElement>(null);
  const [invalid, setInvalid] = useState(false);
  const commit = (total: number | null) => {
    const ok = total !== null && total >= MIN_IN && total <= MAX_IN;
    setInvalid(!ok);
    if (ok) patch({ heightIn: total });
  };
  const fields: MeasureField[] = answers.heightMetric
    ? [
        {
          id: "cm",
          label: "Height, centimetres",
          unit: "cm",
          maxLength: 3,
          value: String(Math.round(inches * IN_TO_CM)),
          onChange: (v) => commit(v ? Math.round(+v / IN_TO_CM) : null),
        },
      ]
    : [
        {
          id: "ft",
          label: "Height, feet",
          unit: "ft",
          maxLength: 1,
          value: String(Math.floor(inches / 12)),
          onChange: (v) => commit(v ? +v * 12 + (inches % 12) : null),
        },
        {
          id: "in",
          label: "Height, inches",
          unit: "in",
          maxLength: 2,
          value: String(inches % 12),
          onChange: (v) => commit(v && +v <= 11 ? Math.floor(inches / 12) * 12 + +v : null),
        },
      ];
  return (
    <div className={styles.measure}>
      <UnitToggle
        metric={answers.heightMetric}
        labels={["ft/in", "cm"]}
        onChange={(m) => {
          setInvalid(false);
          patch({ heightMetric: m });
        }}
      />
      <MeasureBox fields={fields} example={!touched} invalid={invalid} boxRef={boxRef} />
      <Stepper
        value={inches}
        min={MIN_IN}
        max={MAX_IN}
        label="height"
        onChange={(v) => {
          setInvalid(false);
          patch({ heightIn: v });
        }}
      />
      <div className={styles.hintGroup}>
        {!touched && (
          <ExampleHint centered onPress={() => boxRef.current?.querySelector("input")?.focus()} />
        )}
        <p className={cn(styles.sub, invalid && styles.subError)} aria-live="polite">
          {invalid
            ? answers.heightMetric
              ? `Enter a height between ${CM_MIN} and ${CM_MAX} cm.`
              : "Enter a height between 3 ft and 8 ft, with 0–11 inches."
            : answers.heightMetric
              ? `That’s ${Math.floor(inches / 12)}'${inches % 12}".`
              : `That’s ${Math.round(inches * IN_TO_CM)} cm.`}
        </p>
      </div>
    </div>
  );
}

function WeightStep({ answers, patch }: StepProps) {
  const touched = answers.weightLb !== null;
  const lb = answers.weightLb ?? EXAMPLE_WEIGHT_LB;
  const inches = answers.heightIn ?? EXAMPLE_HEIGHT_IN;
  const bmi = (703 * lb) / (inches * inches);
  const boxRef = useRef<HTMLDivElement>(null);
  const [invalid, setInvalid] = useState(false);
  const metric = answers.weightMetric;
  const fields: MeasureField[] = [
    {
      id: "weight",
      label: metric ? "Weight, kilograms" : "Weight, pounds",
      unit: metric ? "kg" : "lbs",
      maxLength: 3,
      value: String(metric ? Math.round(lb * LB_TO_KG) : lb),
      onChange: (v) => {
        const pounds = v ? (metric ? Math.round(+v / LB_TO_KG) : +v) : null;
        const ok = pounds !== null && pounds >= MIN_LB && pounds <= MAX_LB;
        setInvalid(!ok);
        if (ok) patch({ weightLb: pounds });
      },
    },
  ];
  return (
    <div className={styles.measure}>
      <UnitToggle
        metric={metric}
        labels={["lbs", "kg"]}
        onChange={(m) => {
          setInvalid(false);
          patch({ weightMetric: m });
        }}
      />
      <MeasureBox fields={fields} example={!touched} invalid={invalid} boxRef={boxRef} />
      <Stepper
        value={lb}
        min={MIN_LB}
        max={MAX_LB}
        label="weight"
        onChange={(v) => {
          setInvalid(false);
          patch({ weightLb: v });
        }}
      />
      <div className={styles.hintGroup}>
        {!touched && (
          <ExampleHint centered onPress={() => boxRef.current?.querySelector("input")?.focus()} />
        )}
        <p className={cn(styles.sub, invalid && styles.subError)} aria-live="polite">
          {invalid
            ? metric
              ? `Enter a weight between ${KG_MIN} and ${KG_MAX} kg.`
              : `Enter a weight between ${MIN_LB} and ${MAX_LB} lbs.`
            : metric
              ? `That’s ${lb} lbs.`
              : `That’s ${Math.round(lb * LB_TO_KG)} kg.`}
        </p>
      </div>
      <div className={styles.bmi}>
        <div>
          <p className={styles.bmiLabel}>Your BMI</p>
          <p className={styles.bmiValue}>{bmi.toFixed(1)}</p>
        </div>
        <p className={styles.bmiNote}>
          At {Math.floor(inches / 12)}&apos;{inches % 12}&quot;. One signal among many, used for
          context only.
        </p>
      </div>
    </div>
  );
}

type ShownActivity = (typeof ACTIVITY_ORDER)[number];

const ACTIVITY_ICON: Record<ShownActivity, LucideIcon> = {
  mostlyInactive: User,
  lightlyActive: PersonStanding,
  moderatelyActive: Bike,
  veryActive: Footprints,
};

/** A lucide icon, or a local one drawn to the same grid (e.g. SyringeCheck). */
type OptionIcon = LucideIcon | typeof SyringeCheck;

const HEALTH_ICON: Record<HealthKey, OptionIcon> = {
  none: Leaf,
  plastic: CalendarDays,
  bariatric: SyringeCheck,
  glp1: Syringe,
  peptide: Share2,
};

function ActivityStep({ answers, patch }: StepProps) {
  return (
    <div className={styles.options} role="radiogroup" aria-label="Activity level">
      {ACTIVITY_ORDER.map((k) => (
        <Option
          key={k}
          selected={answers.activity === k}
          Icon={ACTIVITY_ICON[k]}
          title={ACTIVITY_COPY[k].title}
          subtitle={ACTIVITY_COPY[k].subtitle}
          onSelect={() => patch({ activity: k })}
        />
      ))}
    </div>
  );
}

function HealthStep({ answers, patch }: StepProps) {
  return (
    <>
      <div className={cn(styles.options, styles.healthOptions)} role="radiogroup" aria-label="Health context">
        {HEALTH_OPTIONS.map((o) => (
          <Option
            key={o.value}
            selected={answers.health === o.value}
            Icon={HEALTH_ICON[o.value]}
            title={o.title}
            subtitle={o.subtitle}
            onSelect={() => patch({ health: o.value })}
          />
        ))}
      </div>
      <p className={styles.note}>
        <Shield size={16} aria-hidden="true" />
        <span>
          Private to you, and you can change it later. Choose{" "}
          <em className={styles.noteOption}>No surgery</em> and the app keeps recommendations
          general and hides surgery-specific resources.
        </span>
      </p>
    </>
  );
}

function Option({
  selected,
  Icon,
  title,
  subtitle,
  onSelect,
}: {
  selected: boolean;
  Icon: OptionIcon;
  title: string;
  subtitle: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={cn(styles.option, selected && styles.optionOn)}
      onClick={onSelect}
    >
      <span className={styles.iconTile} aria-hidden="true">
        <Icon size={24} />
      </span>
      <span className={styles.optionText}>
        <span className={styles.optionTitle}>{title}</span>
        {subtitle && <span className={styles.optionSub}>{subtitle}</span>}
      </span>
      <span className={styles.radio} aria-hidden="true">
        {selected && <Check size={14} />}
      </span>
    </button>
  );
}

const ANALYZING_STEPS = [
  "Analyzing your answers",
  "Setting your macro goals based on the TDEE calculator",
  "Customizing your profile",
];

function Analyzing({ onSkip }: { onSkip: () => void }) {
  const [done, setDone] = useState(1);
  useEffect(() => {
    const a = window.setTimeout(() => setDone(2), 1000);
    const b = window.setTimeout(() => setDone(3), 2000);
    const onKey = () => onSkip();
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
      window.removeEventListener("keydown", onKey);
    };
  }, [onSkip]);
  return (
    <button type="button" className={styles.analyzing} onClick={onSkip}>
      <h1 className={styles.analyzingTitle}>We’re analyzing your answers!</h1>
      <ul className={styles.checks}>
        {ANALYZING_STEPS.map((s, i) => (
          <li key={s} className={cn(i < done && styles.checkOn)}>
            <span aria-hidden="true">{i < done && <Check size={16} />}</span>
            {s}
          </li>
        ))}
      </ul>
      <span className={styles.tap}>Tap anywhere or press any key to skip.</span>
    </button>
  );
}

function Result({
  answers,
  onBack,
  onReview,
  onSave,
}: {
  answers: QuizAnswers;
  onBack: () => void;
  onReview: () => void;
  onSave: () => void;
}) {
  const result = useMemo(() => {
    const age = ageFromDob(+answers.month, +answers.day, +answers.year) ?? 30;
    const lb = answers.weightLb ?? EXAMPLE_WEIGHT_LB;
    const base = {
      age,
      weightKg: lb * LB_TO_KG,
      heightCm: (answers.heightIn ?? EXAMPLE_HEIGHT_IN) * IN_TO_CM,
      activity: (answers.activity ?? "moderatelyActive") as ActivityKey,
    };
    const goal = answers.goals[0] ?? "track";
    const kcal = calorieTarget({ ...base, goal }) ?? tdee(base) ?? 2000;
    return {
      kcal,
      goal,
      protein: macroGrams(kcal).protein,
      water: Math.min(120, Math.max(48, Math.round(lb * 0.5))),
    };
  }, [answers]);
  const shownKcal = useCountUp(result.kcal);

  return (
    <section className={styles.result}>
      <div className={styles.headerRow}>
        <BackButton onClick={onBack} />
        <Mark />
      </div>
      <div className={styles.resultBody}>
        <p className={styles.ready}>
          <span aria-hidden="true">
            <Check size={14} />
          </span>
          Plan ready
        </p>
        <h1 className={styles.resultTitle}>
          Based on the TDEE calculator, <span>you should start here</span>
        </h1>
        <p className={styles.resultLead}>Based on your answers, your starting caloric goal is</p>
        <p className={styles.kcal}>
          <span aria-hidden="true">{(shownKcal ?? result.kcal).toLocaleString("en-US")}</span>
          {/* Screen readers get the final number, not every frame of the count-up. */}
          <span className={styles.srOnly}>{result.kcal.toLocaleString("en-US")}</span>
          <small>
            kcal a day to <b>{GOAL_LABEL[result.goal]}</b>
          </small>
        </p>
        <dl className={styles.macros}>
          <div>
            <dt>Protein</dt>
            <dd>
              {result.protein} <small>g</small>
            </dd>
            <p>About 30% of your calories, to help keep muscle.</p>
          </div>
          <div>
            <dt>Water</dt>
            <dd>
              {result.water} <small>oz</small>
            </dd>
            <p>A general guide. More on hot days.</p>
          </div>
        </dl>
      </div>
      <footer className={styles.footer}>
        <button type="button" className={styles.skip} onClick={onReview}>
          Review your answers
        </button>
        <button type="button" className={styles.primary} onClick={onSave}>
          Save your plan
        </button>
      </footer>
    </section>
  );
}

/** Production's last step: keep the plan with an account, or carry on as a guest. */
function SavePlan({ onBack }: { onBack: () => void }) {
  const [provider, setProvider] = useState<SocialProvider | null>(null);
  return (
    <section className={styles.result}>
      <div className={styles.headerRow}>
        <BackButton onClick={onBack} />
        <Mark />
      </div>
      <div className={styles.resultBody}>
        <h1 className={styles.resultTitle}>Save your plan</h1>
        <p className={styles.resultLead}>
          Create an account to keep your plan and progress on every device you use.
        </p>
        <div className={styles.saveOptions}>
          <button type="button" className={styles.saveOption} onClick={() => setProvider("google")}>
            Continue with Google
          </button>
          <Link href={ROUTES.register} className={styles.saveOption}>
            Continue with email
          </Link>
          <Link href={ROUTES.dashboard} className={styles.saveGuest}>
            Continue without an account
          </Link>
        </div>
      </div>
      <SocialAuthDialog
        provider={provider}
        onOpenChange={(open) => {
          if (!open) setProvider(null);
        }}
      />
    </section>
  );
}
