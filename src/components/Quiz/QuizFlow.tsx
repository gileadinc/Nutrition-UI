"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Minus, Plus } from "lucide-react";
import { AppImage } from "@/components/AppImage";
import { SplitFrame } from "@/components/SplitFrame";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import {
  ACTIVITY_HINT,
  ACTIVITY_LABEL,
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
  type QuizAnswers,
} from "./quizData";
import styles from "./QuizFlow.module.css";

type Position = "start" | (typeof STEPS)[number] | "analyzing" | "result";
const STORAGE_KEY = "forkthis.quiz";

function load(): { answers: QuizAnswers; position: Position } | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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
        <div className={styles.center}>
          <h1 className={styles.startTitle}>Start Your ForkThis! Quiz</h1>
          <p className={styles.lead}>Take a short quiz to optimise ForkThis! to fit your goals.</p>
          <Button className={styles.primary} onClick={() => setPosition("dob")}>
            Start Here
          </Button>
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
        <Result answers={answers} onReview={() => setPosition("dob")} />
      </SplitFrame>
    );
  }

  const copy = STEP_COPY[position];
  const age = ageFromDob(+answers.month, +answers.day, +answers.year);
  const canContinue = position === "dob" ? age !== null && age >= 13 : true;

  return (
    <SplitFrame image={copy.image} variant="quiz">
      <section className={styles.step}>
        <header className={styles.top}>
          <button type="button" className={styles.back} onClick={back} aria-label="Back">
            <ArrowLeft size={16} />
          </button>
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
        </header>
        <p className={styles.stepMeta}>
          Step {idx + 1} of {STEPS.length} · {copy.name}
        </p>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.why}>
          <strong>Why we ask:</strong> {copy.why}
        </p>

        <div className={styles.body}>
          {position === "dob" && <DobStep answers={answers} patch={patch} age={age} />}
          {position === "goal" && <GoalStep answers={answers} patch={patch} />}
          {position === "height" && <HeightStep answers={answers} patch={patch} />}
          {position === "weight" && <WeightStep answers={answers} patch={patch} />}
          {position === "activity" && <ActivityStep answers={answers} patch={patch} />}
          {position === "health" && <HealthStep answers={answers} patch={patch} />}
        </div>

        <footer className={styles.footer}>
          {copy.optional ? (
            <button type="button" className={styles.skip} onClick={next}>
              Skip for now
            </button>
          ) : (
            <span />
          )}
          <Button className={styles.primary} onClick={next} disabled={!canContinue}>
            Continue
          </Button>
        </footer>
      </section>
    </SplitFrame>
  );
}

interface StepProps {
  answers: QuizAnswers;
  patch: (p: Partial<QuizAnswers>) => void;
}

function Hint({ children }: { children: ReactNode }) {
  return (
    <p className={styles.hint}>
      <Check size={14} aria-hidden="true" /> {children}
    </p>
  );
}

function DobStep({ answers, patch, age }: StepProps & { age: number | null }) {
  const filled = answers.month && answers.day && answers.year.length === 4;
  const digits = (v: string) => v.replace(/\D/g, "");
  return (
    <>
      <div className={styles.dob}>
        <label>
          <span>Month</span>
          <input
            inputMode="numeric"
            maxLength={2}
            placeholder="MM"
            value={answers.month}
            onChange={(e) => patch({ month: digits(e.target.value) })}
          />
        </label>
        <label>
          <span>Day</span>
          <input
            inputMode="numeric"
            maxLength={2}
            placeholder="DD"
            value={answers.day}
            onChange={(e) => patch({ day: digits(e.target.value) })}
          />
        </label>
        <label>
          <span>Year</span>
          <input
            inputMode="numeric"
            maxLength={4}
            placeholder="YYYY"
            value={answers.year}
            onChange={(e) => patch({ year: digits(e.target.value) })}
          />
        </label>
      </div>
      {age !== null && age >= 13 ? (
        <p className={styles.agePill} role="status">
          {age} years old
        </p>
      ) : filled ? (
        <p className={styles.error} role="alert">
          {age === null
            ? "Enter a valid date of birth."
            : "ForkThis! can’t be used by anyone under 13."}
        </p>
      ) : null}
      <Hint>Private to you; your date of birth is never shown on your profile.</Hint>
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
    <>
      <p className={styles.hintPlain}>Tap all that apply.</p>
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
              <AppImage
                src={o.image}
                alt={o.alt}
                sizes="(min-width: 1024px) 14rem, 45vw"
                className={styles.goalImg}
              />
              <span className={styles.goalTitle}>{o.title}</span>
              <span className={styles.goalSub}>{o.subtitle}</span>
            </button>
          );
        })}
      </div>
    </>
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
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={16} />
      </button>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={16} />
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
          {labels[m ? 1 : 0]}
        </button>
      ))}
    </div>
  );
}

function HeightStep({ answers, patch }: StepProps) {
  const touched = answers.heightIn !== null;
  const inches = answers.heightIn ?? EXAMPLE_HEIGHT_IN;
  return (
    <>
      <UnitToggle
        metric={answers.heightMetric}
        labels={["ft / in", "cm"]}
        onChange={(m) => patch({ heightMetric: m })}
      />
      <p className={cn(styles.value, !touched && styles.valueDim)} aria-live="polite">
        {answers.heightMetric ? (
          <>
            {Math.round(inches * IN_TO_CM)} <small>cm</small>
          </>
        ) : (
          <>
            {Math.floor(inches / 12)} <small>ft</small> {inches % 12} <small>in</small>
          </>
        )}
      </p>
      <Stepper
        value={inches}
        min={MIN_IN}
        max={MAX_IN}
        label="height"
        onChange={(v) => patch({ heightIn: v })}
      />
      {!touched && <Hint>Example — tap to enter yours</Hint>}
      <p className={styles.sub}>That&apos;s {Math.round(inches * IN_TO_CM)} cm.</p>
    </>
  );
}

function WeightStep({ answers, patch }: StepProps) {
  const touched = answers.weightLb !== null;
  const lb = answers.weightLb ?? EXAMPLE_WEIGHT_LB;
  return (
    <>
      <UnitToggle
        metric={answers.weightMetric}
        labels={["lbs", "kg"]}
        onChange={(m) => patch({ weightMetric: m })}
      />
      <p className={cn(styles.value, !touched && styles.valueDim)} aria-live="polite">
        {answers.weightMetric ? Math.round(lb * LB_TO_KG) : lb}{" "}
        <small>{answers.weightMetric ? "kg" : "lbs"}</small>
      </p>
      <Stepper
        value={lb}
        min={MIN_LB}
        max={MAX_LB}
        label="weight"
        onChange={(v) => patch({ weightLb: v })}
      />
      {!touched && <Hint>Example — tap to enter yours</Hint>}
      <p className={styles.sub}>That&apos;s {Math.round(lb * LB_TO_KG)} kg.</p>
    </>
  );
}

function ActivityStep({ answers, patch }: StepProps) {
  return (
    <div className={styles.options} role="radiogroup" aria-label="Activity level">
      {ACTIVITY_ORDER.map((k) => (
        <Option
          key={k}
          selected={answers.activity === k}
          title={ACTIVITY_LABEL[k]}
          subtitle={ACTIVITY_HINT[k]}
          onSelect={() => patch({ activity: k })}
        />
      ))}
    </div>
  );
}

function HealthStep({ answers, patch }: StepProps) {
  return (
    <>
      <div className={styles.options} role="radiogroup" aria-label="Health context">
        {HEALTH_OPTIONS.map((o) => (
          <Option
            key={o.value}
            selected={answers.health === o.value}
            title={o.title}
            subtitle={o.subtitle}
            onSelect={() => patch({ health: o.value })}
          />
        ))}
      </div>
      <Hint>
        Private to you, and you can change it later. Choose Prefer not to say and the app keeps
        recommendations general.
      </Hint>
    </>
  );
}

function Option({
  selected,
  title,
  subtitle,
  onSelect,
}: {
  selected: boolean;
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
      <span className={styles.optionText}>
        <span className={styles.optionTitle}>{title}</span>
        <span className={styles.optionSub}>{subtitle}</span>
      </span>
      <span className={styles.radio} aria-hidden="true">
        {selected && <Check size={12} />}
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
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);
  return (
    <button type="button" className={styles.analyzing} onClick={onSkip}>
      <h1 className={styles.analyzingTitle}>We&apos;re analyzing your answers!</h1>
      <ul className={styles.checks}>
        {ANALYZING_STEPS.map((s, i) => (
          <li key={s} className={cn(i < done && styles.checkOn)}>
            <span aria-hidden="true">{i < done && <Check size={12} />}</span>
            {s}
          </li>
        ))}
      </ul>
      <span className={styles.tap}>Tap anywhere to skip</span>
    </button>
  );
}

function Result({ answers, onReview }: { answers: QuizAnswers; onReview: () => void }) {
  const result = useMemo(() => {
    const age = ageFromDob(+answers.month, +answers.day, +answers.year) ?? 30;
    const lb = answers.weightLb ?? EXAMPLE_WEIGHT_LB;
    const base = {
      age,
      weightKg: lb * LB_TO_KG,
      heightCm: (answers.heightIn ?? EXAMPLE_HEIGHT_IN) * IN_TO_CM,
      activity: (answers.activity ?? "moderatelyActive") as ActivityKey,
    };
    const goal = answers.goals[0] ?? "maintain";
    const kcal = calorieTarget({ ...base, goal }) ?? tdee(base) ?? 2000;
    return {
      kcal,
      goal,
      protein: macroGrams(kcal).protein,
      water: Math.min(120, Math.max(48, Math.round(lb * 0.5))),
    };
  }, [answers]);

  return (
    <section className={styles.result}>
      <p className={styles.ready}>
        <Check size={12} aria-hidden="true" /> Plan ready
      </p>
      <h1 className={styles.resultTitle}>
        Based on the TDEE calculator, <span>you should start here</span>
      </h1>
      <p className={styles.sub}>Based on your answers, your starting calorie goal is</p>
      <p className={styles.kcal}>
        {result.kcal.toLocaleString("en-US")}{" "}
        <small>kcal a day to {GOAL_LABEL[result.goal]}</small>
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
      <footer className={styles.footer}>
        <button type="button" className={styles.skip} onClick={onReview}>
          Review your answers
        </button>
        <Link href={ROUTES.dashboard} className={styles.primaryLink}>
          Start using ForkThis!
        </Link>
      </footer>
    </section>
  );
}
