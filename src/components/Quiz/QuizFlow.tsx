"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleCheck,
  Droplet,
  Dumbbell,
  Flame,
  Footprints,
  Leaf,
  Mail,
  Minus,
  Plus,
  Share2,
  Shield,
  SquarePen,
  Syringe,
  type LucideIcon,
} from "lucide-react";
import { AppImage } from "@/components/AppImage";
import { Logo } from "@/components/Logo";
import { SplitFrame } from "@/components/SplitFrame";
import { SyringeCheck } from "./SyringeCheck";
import { DeskIcon } from "./DeskIcon";
import { RunnerIcon } from "./RunnerIcon";
import { useCountUp } from "./useCountUp";
import { GoogleGlyph } from "@/components/SocialAuthButtons/GoogleGlyph";
import { useSocialSignIn } from "@/screens/public/useSocialSignIn";
import { getErrorMessage } from "@/lib/api";
import { saveDraft, submitQuestionnaire, toast } from "@/lib/store";
import { isQuestionStep } from "@/lib/store";
import { draftFromAnswers, STEP_FOR_QUESTION } from "./draftBridge";
import { ROUTES } from "@/lib/constants";
import {
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
  BMI_BANDS,
  BMI_FOOTNOTE,
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
  bmiBand,
  goalKeyFor,
  type GoalCardId,
  type HealthKey,
  type QuizAnswers,
  type StepKey,
} from "./quizData";
import styles from "./QuizFlow.module.css";

/** `ageFromDob` wants a zero-padded MM/DD/YYYY string. */
const dobString = (a: Pick<QuizAnswers, "month" | "day" | "year">) =>
  `${a.month.padStart(2, "0")}/${a.day.padStart(2, "0")}/${a.year}`;

/** Conversion factors (match `inchesToCm` / `lbToKg` in `@/lib/nutrition`). */
const IN_TO_CM = 2.54;
const LB_TO_KG = 0.453592;

type Position = "start" | (typeof STEPS)[number] | "analyzing" | "result" | "save" | "review";
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
  /** True while editing one answer from the review page, so Continue returns there. */
  const [fromReview, setFromReview] = useState(false);

  /** Set by `?returnTo=`: edit one answer, then go back where we came from. */
  const [returnTo, setReturnTo] = useState<string | null>(null);

  useEffect(() => {
    const saved = load();
    /* eslint-disable react-hooks/set-state-in-effect -- restore a client-only draft after mount */
    if (saved) {
      setAnswers({ ...EMPTY_ANSWERS, ...saved.answers });
      setPosition(saved.position === "analyzing" ? "result" : saved.position);
    }
    const params = new URLSearchParams(window.location.search);
    // Only same-origin relative targets, so `returnTo` can't be used to redirect off-site.
    const back = params.get("returnTo");
    if (back && back.startsWith("/") && !back.startsWith("//")) setReturnTo(back);
    // Deep link: `?step=goal` opens that screen. Accepts the quiz's own step names
    // and the questionnaire's (`height`/`weight`/`surgery`), which /you and /track link to.
    const step = params.get("step");
    const valid = ["start", ...STEPS, "analyzing", "result", "save", "review"];
    if (step && valid.includes(step)) setPosition(step as Position);
    else if (isQuestionStep(step)) {
      const mapped = STEP_FOR_QUESTION[step];
      if (mapped) setPosition(mapped);
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Mirror answers into the shared questionnaire draft, so the profile and the
  // rest of the app see them the same way the old questionnaire wrote them.
  useEffect(() => {
    if (!hydrated) return;
    saveDraft(draftFromAnswers(answers));
  }, [answers, hydrated]);

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

  // Persist to the backend session (and the profile, when signed in) as soon as
  // the plan is revealed, so `hasCompletedOnboarding()` is true from here on.
  const submitted = useRef(false);
  useEffect(() => {
    if (position !== "result" || submitted.current) return;
    submitted.current = true;
    void (async () => {
      try {
        await submitQuestionnaire(draftFromAnswers(answers));
      } catch (e) {
        submitted.current = false;
        toast.error(getErrorMessage(e));
      }
    })();
  }, [position, answers]);

  // An edit arriving from /you or /track returns there once the answer changes.
  const done = () => {
    if (returnTo) {
      window.location.assign(returnTo);
      return true;
    }
    return false;
  };

  const patch = (p: Partial<QuizAnswers>) => setAnswers((a) => ({ ...a, ...p }));
  const idx = STEPS.indexOf(position as (typeof STEPS)[number]);
  const next = () => {
    // Editing one answer from /you or /track: save and go straight back.
    if (returnTo) {
      void (async () => {
        try {
          await submitQuestionnaire(draftFromAnswers(answers));
        } catch (e) {
          toast.error(getErrorMessage(e));
          return;
        }
        done();
      })();
      return;
    }
    if (fromReview) {
      setFromReview(false);
      setPosition("review");
      return;
    }
    setPosition(idx === STEPS.length - 1 ? "analyzing" : STEPS[idx + 1]);
  };
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
          onReview={() => setPosition("review")}
          onSave={() => setPosition("save")}
        />
      </SplitFrame>
    );
  }

  if (position === "review") {
    return (
      <SplitFrame image={RESULT_IMAGE} variant="quizTall">
        <Review
          answers={answers}
          onBack={() => setPosition("result")}
          onEdit={(step) => {
            setFromReview(true);
            setPosition(step);
          }}
        />
      </SplitFrame>
    );
  }

  if (position === "save") {
    return (
      <SplitFrame image={RESULT_IMAGE} variant="quizCentered">
        <SavePlan onBack={() => setPosition("result")} />
      </SplitFrame>
    );
  }

  const copy = STEP_COPY[position];
  const age = ageFromDob(dobString(answers));
  const canContinue =
    position === "dob"
      ? age !== null && age >= 13
      : position === "goal"
        ? answers.goals.length > 0
        : position === "activity"
          ? answers.activity !== null
          : position === "health"
            ? answers.health.length > 0
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

          <div className={styles.body}>
            {position === "dob" && <DobStep answers={answers} patch={patch} age={age} />}
            {position === "goal" && <GoalStep answers={answers} patch={patch} />}
            {position === "measure" && <MeasureStep answers={answers} patch={patch} />}
            {position === "bmi" && <BmiStep answers={answers} />}
            {position === "activity" && <ActivityStep answers={answers} patch={patch} />}
            {position === "health" && <HealthStep answers={answers} patch={patch} />}
          </div>
        </div>

        <footer className={cn(styles.footer, styles.footerStacked)}>
          <button type="button" className={styles.primary} onClick={next} disabled={!canContinue}>
            {fromReview ? "Back to review" : "Continue"}
          </button>
          <button type="button" className={styles.skip} onClick={back}>
            Back
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
  const toggle = (g: GoalCardId) =>
    patch({
      goals: answers.goals.includes(g)
        ? answers.goals.filter((x) => x !== g)
        : [...answers.goals, g],
    });
  return (
    <div className={styles.goals}>
      {GOAL_OPTIONS.map((o) => {
        const on = answers.goals.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            className={cn(styles.goal, on && styles.goalOn)}
            onClick={() => toggle(o.id)}
          >
            <AppImage src={o.image} alt="" className={cn(styles.goalArt, o.id === "track" && styles.goalArtTrack)} />
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

/** Height and weight side by side — one step, as the review notes asked. */
function MeasureStep({ answers, patch }: StepProps) {
  return (
    <div className={styles.measurePair}>
      <div className={styles.measureCol}>
        <h2 className={styles.measureHeading}>Height</h2>
        <HeightStep answers={answers} patch={patch} />
      </div>
      <div className={styles.measureCol}>
        <h2 className={styles.measureHeading}>Weight</h2>
        <WeightStep answers={answers} patch={patch} />
      </div>
    </div>
  );
}

/** BMI on its own slide, with the bands shown so people place themselves. */
function BmiStep({ answers }: { answers: QuizAnswers }) {
  const lb = answers.weightLb ?? EXAMPLE_WEIGHT_LB;
  const inches = answers.heightIn ?? EXAMPLE_HEIGHT_IN;
  const bmi = (703 * lb) / (inches * inches);
  const band = bmiBand(bmi);

  return (
    <div className={styles.bmiStep}>
      <div className={styles.bmiHero}>
        <p className={styles.bmiHeroValue}>{bmi.toFixed(1)}</p>
        <p className={styles.bmiHeroMeta}>
          At {formatHeight(inches, answers.heightMetric)} and {formatWeight(lb, answers.weightMetric)}
        </p>
      </div>

      <ul className={styles.bmiBands} aria-label="BMI categories">
        {BMI_BANDS.map((b) => {
          const on = b.label === band.label;
          return (
            <li key={b.label} className={cn(styles.bmiBand, on && styles.bmiBandOn)}>
              <span className={styles.bmiBandLabel}>{b.label}</span>
              <span className={styles.bmiBandRange}>{b.range}</span>
              {on && (
                <span className={styles.bmiBandYou} aria-hidden="true">
                  You
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <p className={styles.bmiFootnote}>
        <span aria-hidden="true">*</span> {BMI_FOOTNOTE}
      </p>
    </div>
  );
}

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
    </div>
  );
}

type ShownActivity = (typeof ACTIVITY_ORDER)[number];

/** A lucide icon, or a local one drawn to the same grid (e.g. SyringeCheck). */
type OptionIcon = LucideIcon | typeof SyringeCheck;

const ACTIVITY_ICON: Record<ShownActivity, OptionIcon> = {
  veryActive: RunnerIcon,
  moderatelyActive: Dumbbell,
  lightlyActive: Footprints,
  mostlyInactive: DeskIcon,
};

const HEALTH_ICON: Record<HealthKey, OptionIcon> = {
  plastic: CalendarDays,
  bariatric: SyringeCheck,
  glp1: Syringe,
  peptide: Share2,
  none: Leaf,
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
  // "None of the above" is exclusive: picking it clears the rest, and picking
  // anything else clears it.
  const toggle = (v: HealthKey) => {
    if (v === "none") {
      patch({ health: answers.health.includes("none") ? [] : ["none"] });
      return;
    }
    const without = answers.health.filter((h) => h !== "none");
    patch({
      health: without.includes(v) ? without.filter((h) => h !== v) : [...without, v],
    });
  };

  return (
    <>
      <div className={cn(styles.options, styles.healthOptions)} role="group" aria-label="Health context">
        {HEALTH_OPTIONS.map((o) => (
          <Option
            key={o.value}
            multi
            selected={answers.health.includes(o.value)}
            Icon={HEALTH_ICON[o.value]}
            title={o.title}
            subtitle={o.subtitle}
            onSelect={() => toggle(o.value)}
          />
        ))}
      </div>
      <p className={styles.note}>
        <Shield size={16} aria-hidden="true" />
        <span>
          Private to you, and you can change it later. Choose{" "}
          <em className={styles.noteOption}>None of the above</em> and the app keeps
          recommendations general and hides surgery-specific resources.
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
  multi = false,
}: {
  selected: boolean;
  Icon: OptionIcon;
  title: string;
  subtitle: string;
  onSelect: () => void;
  /** Checkbox semantics instead of radio, for "click all that apply" steps. */
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
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
      <span className={cn(styles.radio, multi && styles.checkbox)} aria-hidden="true">
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

/** The plan figures shown on both the result and review screens. */
function planFrom(answers: QuizAnswers) {
  const age = ageFromDob(dobString(answers)) ?? 30;
  const lb = answers.weightLb ?? EXAMPLE_WEIGHT_LB;
  const inches = answers.heightIn ?? EXAMPLE_HEIGHT_IN;
  const base = {
    age,
    weightKg: lb * LB_TO_KG,
    heightCm: inches * IN_TO_CM,
    activityLevel: (answers.activity ?? "moderatelyActive") as ActivityKey,
  };
  const goal = goalKeyFor(answers.goals);
  const kcal = calorieTarget({ ...base, goal }) ?? tdee(base) ?? 2000;
  return {
    kcal,
    goal,
    protein: macroGrams(kcal).find((m) => m.key === "protein")?.grams ?? 0,
    water: Math.min(120, Math.max(48, Math.round(lb * 0.5))),
    tdee: tdee(base),
    bmi: (703 * lb) / (inches * inches),
  };
}


const HEALTH_LABEL: Record<HealthKey, string> = {
  plastic: "Preparing for or recovering from plastic surgery",
  bariatric: "History of bariatric surgery",
  glp1: "I’m on a GLP-1 agonist",
  peptide: "Peptides are part of my routine",
  none: "None of the above",
};

function formatHeight(inches: number | null, metric: boolean) {
  if (inches === null) return "Not set";
  return metric ? `${Math.round(inches * IN_TO_CM)} cm` : `${Math.floor(inches / 12)}'${inches % 12}"`;
}

function formatWeight(lb: number | null, metric: boolean) {
  if (lb === null) return "Not set";
  return metric ? `${Math.round(lb * LB_TO_KG)} kg` : `${lb} lbs`;
}

/** Every answer in one place, with an Edit link per row that returns here. */
function Review({
  answers,
  onBack,
  onEdit,
}: {
  answers: QuizAnswers;
  onBack: () => void;
  onEdit: (step: StepKey) => void;
}) {
  const plan = useMemo(() => planFrom(answers), [answers]);
  const age = ageFromDob(dobString(answers));
  const dob =
    answers.month && answers.day && answers.year
      ? `${answers.month}/${answers.day}/${answers.year}${age === null ? "" : ` (${age})`}`
      : "Not set";

  interface ReviewRow {
    label: string;
    value: string;
    step: StepKey;
    /** Rendered as a tick list rather than one line, for multi-select answers. */
    items?: string[];
  }

  const sections: { title: string; rows: ReviewRow[] }[] = [
    {
      title: "About you",
      rows: [
        { label: "Age", value: dob, step: "dob" },
        { label: "Height", value: formatHeight(answers.heightIn, answers.heightMetric), step: "measure" },
        { label: "Weight", value: formatWeight(answers.weightLb, answers.weightMetric), step: "measure" },
      ],
    },
    {
      title: "Your plan inputs",
      rows: [
        {
          label: "Goal",
          // Name the card the user picked, not the GoalKey it maps onto
          // (two cards share "maintain").
          value: answers.goals.length
            ? answers.goals
                .map((g) => GOAL_OPTIONS.find((o) => o.id === g)?.title.join(" ") ?? g)
                .join(", ")
            : "Not set",
          step: "goal",
        },
        {
          label: "Activity",
          value: answers.activity ? ACTIVITY_COPY[answers.activity as ShownActivity].title : "Not set",
          step: "activity",
        },
        {
          label: "Surgery",
          value: answers.health.length ? "" : "Not set",
          items: answers.health.map((h) => HEALTH_LABEL[h]),
          step: "health",
        },
      ],
    },
  ];

  return (
    <section className={cn(styles.result, styles.review)}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <BackButton onClick={onBack} />
          <Mark />
        </div>
        <div
          className={styles.progress}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={STEPS.length}
          aria-label="All steps complete"
        >
          <span style={{ width: "100%" }} />
        </div>
        <p className={styles.stepMeta}>All {STEPS.length} steps · Review</p>
      </header>

      <div className={styles.resultBody}>
        <h1 className={styles.reviewTitle}>Your answers</h1>
        <p className={styles.resultLead}>
          Please check your responses for accuracy so we can optimize your ForkThis! experience.
        </p>

        <section className={styles.planCard} aria-label="Your starting plan">
          <h2 className={styles.planCardTitle}>Your starting plan</h2>
          <dl className={styles.planFigures}>
            <div>
              <span className={styles.planIcon} aria-hidden="true">
                <Flame size={16} />
              </span>
              <dt>Calories</dt>
              <dd>
                {plan.kcal.toLocaleString("en-US")} <small>kcal</small>
              </dd>
            </div>
            <div>
              <span className={styles.planIcon} aria-hidden="true">
                <Dumbbell size={16} />
              </span>
              <dt>Protein</dt>
              <dd>
                {plan.protein} <small>g</small>
              </dd>
            </div>
            <div>
              <span className={styles.planIcon} aria-hidden="true">
                <Droplet size={16} />
              </span>
              <dt>Water</dt>
              <dd>
                {plan.water} <small>oz</small>
              </dd>
            </div>
          </dl>
          <p className={styles.planNote}>
            Water is a general guide — drink more on hot days and when you train.
          </p>
          <dl className={styles.planTotals}>
            <div>
              <dt>TDEE</dt>
              <dd>{plan.tdee === null ? "Not enough info" : `${plan.tdee.toLocaleString("en-US")} kcal/day`}</dd>
            </div>
            <div>
              <dt>BMI</dt>
              <dd>{plan.bmi.toFixed(1)}</dd>
            </div>
          </dl>
        </section>

        {sections.map((s) => (
          <section key={s.title} className={styles.reviewSection}>
            <h2 className={styles.reviewEyebrow}>{s.title}</h2>
            <div className={styles.reviewRows}>
              {s.rows.map((r) => (
                <div key={r.label} className={styles.reviewRow}>
                  <div>
                    <p className={styles.reviewLabel}>{r.label}</p>
                    {r.items?.length ? (
                      <ul className={styles.reviewChecklist}>
                        {r.items.map((item) => (
                          <li key={item}>
                            <Check size={14} aria-hidden="true" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.reviewValue}>{r.value}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.reviewEdit}
                    onClick={() => onEdit(r.step)}
                  >
                    Edit<span className={styles.srOnly}> {r.label}</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className={styles.footer}>
        <button type="button" className={cn(styles.primary, styles.reviewPrimary)} onClick={onBack}>
          Back to your plan
        </button>
      </footer>
    </section>
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
  const result = useMemo(() => planFrom(answers), [answers]);
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
          Based on the TDEE calculator, <span>your starting caloric goal is:</span>
        </h1>
        <p className={styles.kcal}>
          <span aria-hidden="true">{(shownKcal ?? result.kcal).toLocaleString("en-US")}</span>
          {/* Screen readers get the final number, not every frame of the count-up. */}
          <span className={styles.srOnly}>{result.kcal.toLocaleString("en-US")}</span>
          <small>
            kcal a day to <b>hit your goal</b>
          </small>
        </p>
        <dl className={styles.macros}>
          <div>
            <dt>Daily protein</dt>
            <dd>
              {result.protein} <small>g</small>
            </dd>
            <p>Protein should be about 30% of your calories to help maintain muscle mass.</p>
          </div>
          <div>
            <dt>Daily water</dt>
            <dd>
              {result.water} <small>oz</small>
            </dd>
            <p>This is a general recommendation to keep you hydrated.</p>
          </div>
        </dl>
      </div>
      <footer className={cn(styles.footer, styles.footerStacked)}>
        <button type="button" className={styles.primary} onClick={onSave}>
          Save your plan
        </button>
        <button type="button" className={styles.skip} onClick={onReview}>
          Review your answers
        </button>
      </footer>
    </section>
  );
}

/** Production's last step: keep the plan with an account, or carry on as a guest. */
function SavePlan({ onBack }: { onBack: () => void }) {
  const { start, busy, error } = useSocialSignIn(ROUTES.home);
  return (
    <section className={cn(styles.result, styles.save)}>
      <div className={cn(styles.headerRow, styles.headerCentered)}>
        <BackButton onClick={onBack} />
        <Mark />
      </div>
      <div className={styles.resultBody}>
        <h1 className={styles.resultTitle}>Save your plan</h1>
        <p className={styles.resultLead}>
          Create an account to keep your plan and progress on every device you use.
        </p>
        <div className={styles.saveOptions}>
          <button
            type="button"
            className={styles.saveOption}
            onClick={() => void start("google")}
            disabled={busy !== null}
          >
            <GoogleGlyph className={styles.saveGlyph} />
            {busy === "google" ? "Connecting…" : "Continue with Google"}
          </button>
          <Link href={ROUTES.signup} className={styles.saveOption}>
            <Mail size={20} aria-hidden="true" />
            Continue with email
          </Link>
          <Link href={ROUTES.home} className={styles.saveGuest}>
            Continue without an account
          </Link>
        </div>
        {error ? <p role="alert" className={styles.saveError}>{error}</p> : null}
      </div>
    </section>
  );
}
