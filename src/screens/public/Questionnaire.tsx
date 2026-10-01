"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PrimaryButton } from "@/components/Button";
import { Skeleton } from "@/components/Feedback";
import {
  ExampleHint,
  InlineMessage,
  QuestionHeading,
  QuizStepLayout,
  Reassurance,
  ReviewRow,
  StatTile,
  StepIntro,
  StepProgress,
  UnitToggle,
} from "@/components/Onboarding";
import { Icon } from "@/components/Icon";
import { ONB_SPACING, ONB_TYPE } from "@/components/styles";
import { ageGateApi, getErrorMessage } from "@/lib/api";
import { useNavigate, useSearchParams } from "@/lib/nav";
import {
  ACTIVITY_HINT,
  ACTIVITY_KEYS,
  ACTIVITY_LABEL,
  DEFAULT_TARGETS,
  GOAL_LABEL,
  SURGICAL_CONTEXTS,
  ageFromDob,
  calorieTarget,
  dobToIso,
  isoToDob,
  macroGrams,
  tdee,
  type ActivityKey,
  type GoalKey,
  type SurgicalContext,
} from "@/lib/nutrition";
import {
  QUESTION_STEPS,
  RESULT_STEPS,
  isQuestionStep,
  isResultStep,
  loadDraft,
  saveDraft,
  startGuestSession,
  submitQuestionnaire,
  toast,
  useAppSession,
  useProfile,
  type QuestionStep,
  type QuestionnaireDraft,
  type QuestionnairePosition,
} from "@/lib/store";
import { getAppSession } from "@/lib/store";
import { cn } from "@/lib/utils";
import { safeNext } from "./Login";
import {
  BuildingScreen,
  COMPLETE_IMAGE,
  DobInput,
  GoalPicker,
  NumberStepper,
  OptionList,
  RevealScreen,
  SaveScreen,
  focusInput,
  isDobComplete,
  type QuizOption,
} from "./QuestionnaireParts";

/* ----------------------------------------------------------- constants */

const PROGRESS_STEPS = ["dob", "goal", "height", "weight", "activity", "surgery"] as const;
const TOTAL = PROGRESS_STEPS.length;
const STEP_IMAGES = [
  "/img/onboarding/generated/quiz-private-profile-v2",
  "/img/onboarding/tour-personalized-plan-v2",
  "/img/onboarding/generated/quiz-height-v2",
  "/img/onboarding/generated/quiz-weight-v2",
  "/img/onboarding/generated/quiz-activity-v2",
  "/img/onboarding/tour-clinical-support-v2",
];
const REVIEW_IMAGE = "/img/onboarding/generated/quiz-review-v2";
const IMAGES = [...STEP_IMAGES, REVIEW_IMAGE, COMPLETE_IMAGE];
const LAST_IMAGE = IMAGES.length - 1;
const TOUR_URL = "/home?tour=1";
const ENCOURAGE_IMAGE = "/img/onboarding/tour-personalized-plan-v2";
const imageFor = (s: QuestionStep) =>
  PROGRESS_STEPS.indexOf((s === "encourage" ? "goal" : s) as (typeof PROGRESS_STEPS)[number]);

const STEP_COPY: Record<
  Exclude<QuestionStep, "encourage">,
  { name: string; eyebrow: string; title: string; why: string; optional: boolean }
> = {
  dob: {
    name: "Date of birth",
    eyebrow: "About you",
    title: "How old are you?",
    why: "age shapes your energy needs, and ForkThis can’t be used by anyone under 13.",
    optional: false,
  },
  goal: {
    name: "Goal",
    eyebrow: "Your goal",
    title: "What's your main goal?",
    why: "it decides whether your daily target leans toward a deficit, a surplus or balance.",
    optional: true,
  },
  height: {
    name: "Height",
    eyebrow: "Your starting point",
    title: "What's your height?",
    why: "height and weight together give your baseline energy — what your body uses at rest.",
    optional: true,
  },
  weight: {
    name: "Weight",
    eyebrow: "Your starting point",
    title: "What's your weight?",
    why: "it completes your baseline energy estimate, and shows your BMI for context.",
    optional: true,
  },
  activity: {
    name: "Activity",
    eyebrow: "Your week",
    title: "How active are you right now?",
    why: "activity multiplies your baseline. Pick a typical week, not your best one.",
    optional: true,
  },
  surgery: {
    name: "Surgery",
    eyebrow: "Your health",
    title: "Any upcoming or recent surgery?",
    why: "it surfaces the right nutrition guidance before or after surgery, and stays private to you.",
    optional: false,
  },
};

const GOAL_OPTIONS: QuizOption<GoalKey>[] = [
  {
    value: "lose",
    title: "Lose weight",
    subtitle: "Sustainable fat loss with muscle preservation",
    icon: "weightScale",
    image: {
      src: "/img/onboarding/goals/goal-lose-v2",
      alt: "Balanced chicken grain bowl beside walking shoes and a fitness watch",
    },
  },
  {
    value: "gain",
    title: "Gain muscle",
    subtitle: "Build physical strength and energetic support",
    icon: "dumbbell",
    image: {
      src: "/img/onboarding/goals/goal-gain-v2",
      alt: "Athlete lifting a dumbbell beside a protein-rich meal",
    },
  },
  {
    value: "maintain",
    title: "Maintain weight",
    subtitle: "Focus on longevity, metabolism and vitality",
    icon: "target",
    image: {
      src: "/img/onboarding/goals/goal-maintain-v2",
      alt: "Salmon grain bowl with vegetables and lemon water in warm sunlight",
    },
  },
  {
    value: "recomp",
    title: "Body recomposition",
    subtitle: "Lose fat and build muscle at the same time",
    icon: "chartIncrease",
    image: {
      src: "/img/onboarding/goals/goal-recomp-v2",
      alt: "Athlete holding a resistance band beside a high-protein grain bowl",
    },
  },
];

const SURGERY_META: Record<SurgicalContext, [string, "leaf" | "calendar" | "medication" | "shield"]> = {
  "No surgery": ["Use everyday nutrition guidance", "leaf"],
  "Preparing for surgery": ["Show pre-op nutrition context", "calendar"],
  "Recovering from surgery": ["Show gentle portion and protein context", "medication"],
  "Prefer not to say": ["Keep recommendations general", "shield"],
};
const ACTIVITY_ICON = {
  mostlyInactive: "person",
  lightlyActive: "walking",
  moderatelyActive: "bicycle",
  veryActive: "runningShoes",
  extremelyActive: "dumbbell",
} as const;
const ACTIVITY_OPTIONS: QuizOption<ActivityKey>[] = ACTIVITY_KEYS.map((k) => ({
  value: k,
  title: ACTIVITY_LABEL[k],
  subtitle: ACTIVITY_HINT[k],
  icon: ACTIVITY_ICON[k],
}));
const SURGERY_OPTIONS: QuizOption<SurgicalContext>[] = SURGICAL_CONTEXTS.map((s) => ({
  value: s,
  title: s,
  subtitle: SURGERY_META[s][0],
  icon: SURGERY_META[s][1],
}));

// Neutral starting values for the "Example — tap to enter yours" steppers (display only;
// they are never sent to the backend unless the user enters them).
const EXAMPLE_HEIGHT_IN = 67;
const EXAMPLE_WEIGHT_LB = 165;
const FALLBACK_GOAL: GoalKey = "maintain";
const FALLBACK_ACTIVITY: ActivityKey = "moderatelyActive";
const FALLBACK_SURGERY: SurgicalContext = "No surgery";
const MIN_IN = 36;
const MAX_IN = 96;
const MIN_LB = 60;
const MAX_LB = 500;
const CM = 2.54;
const KG = 0.453592;
const MIN_CM = Math.ceil(MIN_IN * CM);
const MAX_CM = Math.floor(MAX_IN * CM);
const MIN_KG = Math.ceil(MIN_LB * KG);
const MAX_KG = Math.floor(MAX_LB * KG);

const num = (s: string) => (s.trim() === "" ? null : Number(s));
function parseHeight(imperial: boolean, ft: string, inch: string, cm: string) {
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
}
function parseWeight(imperial: boolean, v: string) {
  const n = num(v);
  if (n === null) return null;
  const lb = imperial ? n : n / KG;
  return lb >= MIN_LB && lb <= MAX_LB ? lb : null;
}
const showHeight = (inches: number, imperial: boolean) => {
  const n = Math.round(inches);
  return imperial ? `${Math.floor(n / 12)}'${n % 12}"` : `${Math.round(inches * CM)} cm`;
};
const showWeight = (lb: number, imperial: boolean) =>
  imperial ? `${Math.round(lb)} lbs` : `${Math.round(lb * KG)} kg`;
const bmiOf = (inches: number, lb: number) => (703 * lb) / (inches * inches);

/* ---------------------------------------------------------- initial state */

interface Init {
  draft: QuestionnaireDraft;
  position: QuestionnairePosition;
  editReturnTo: string | null;
  completionReturnTo: string | null;
}

const emptyDraft = (): QuestionnaireDraft => ({
  position: null,
  answered: [],
  dob: "",
  goal: null,
  activityLevel: null,
  surgicalContext: null,
  heightIn: EXAMPLE_HEIGHT_IN,
  heightImperial: true,
  weightLb: EXAMPLE_WEIGHT_LB,
  weightImperial: true,
});

const isPos = (v: string | null): v is QuestionnairePosition =>
  v === "review" || isQuestionStep(v) || isResultStep(v);

export function QuestionnaireScreen() {
  const [params] = useSearchParams();
  const session = useAppSession();
  const { profile, isLoading, update } = useProfile();
  const editing = safeNext(params.get("returnTo")) !== null;
  const ready = session.ready && (!editing || (!isLoading && profile !== null));
  if (!ready) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-5 py-10">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </main>
    );
  }
  return <InitialisedQuestionnaire profile={profile} update={update} />;
}

function InitialisedQuestionnaire({
  profile,
  update,
}: {
  profile: ReturnType<typeof useProfile>["profile"];
  update: ReturnType<typeof useProfile>["update"];
}) {
  const [params] = useSearchParams();
  const [init] = useState<Init>(() => {
    const editReturnTo = safeNext(params.get("returnTo"));
    const completionReturnTo = safeNext(params.get("next"));
    const stepParam = params.get("step") ?? params.get("state");
    if (editReturnTo && profile) {
      const d = emptyDraft();
      d.dob = isoToDob(profile.dateOfBirth);
      d.goal = profile.goal;
      d.activityLevel = profile.activityLevel;
      d.surgicalContext = profile.surgicalContext;
      d.heightImperial = d.weightImperial = profile.isImperial;
      if (profile.heightCm) d.heightIn = profile.heightCm / CM;
      if (profile.weightKg) d.weightLb = profile.weightKg / KG;
      return {
        draft: d,
        position: isQuestionStep(stepParam) ? stepParam : "goal",
        editReturnTo,
        completionReturnTo: null,
      };
    }
    const draft = loadDraft() ?? emptyDraft();
    const firstOpen = QUESTION_STEPS.find((s) => !draft.answered.includes(s)) ?? "review";
    let pos: QuestionnairePosition = isPos(stepParam) ? stepParam : (draft.position ?? firstOpen);
    if (isResultStep(pos)) {
      if (QUESTION_STEPS.some((s) => !draft.answered.includes(s))) pos = firstOpen;
      else if (pos === "building" && stepParam !== "building") pos = "reveal";
    }
    return { draft, position: pos, editReturnTo: null, completionReturnTo };
  });
  return <QuestionnaireFlow init={init} updateProfile={update} />;
}

/* ------------------------------------------------------------------ flow */

function QuestionnaireFlow({
  init,
  updateProfile,
}: {
  init: Init;
  updateProfile: ReturnType<typeof useProfile>["update"];
}) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const uid = useId();
  const { editReturnTo, completionReturnTo } = init;
  const editing = editReturnTo !== null;
  const d = init.draft;
  const session = useAppSession();

  const startView = init.position === "review" || isResultStep(init.position);
  const [view, setView] = useState<"setup" | "review" | (typeof RESULT_STEPS)[number]>(
    startView ? (init.position as "review") : "setup",
  );
  const [step, setStep] = useState<QuestionStep>(
    startView ? QUESTION_STEPS[QUESTION_STEPS.length - 1] : (init.position as QuestionStep),
  );
  const [answered, setAnswered] = useState<QuestionStep[]>(d.answered);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [fromReview, setFromReview] = useState(false);
  const [dob, setDob] = useState(d.dob);
  const [goal, setGoal] = useState<GoalKey | null>(d.goal);
  const [surgery, setSurgery] = useState<SurgicalContext | null>(d.surgicalContext);
  const [activity, setActivity] = useState<ActivityKey | null>(d.activityLevel);
  const [heightIn, setHeightIn] = useState(d.heightIn);
  const [heightImp, setHeightImp] = useState(d.heightImperial);
  const [ft, setFt] = useState(String(Math.floor(Math.round(d.heightIn) / 12)));
  const [inch, setInch] = useState(String(Math.round(d.heightIn) % 12));
  const [cm, setCm] = useState(String(Math.round(d.heightIn * CM)));
  const [weightLb, setWeightLb] = useState(d.weightLb);
  const [weightImp, setWeightImp] = useState(d.weightImperial);
  const [weightText, setWeightText] = useState(
    String(Math.round(d.weightImperial ? d.weightLb : d.weightLb * KG)),
  );
  const [touched, setTouched] = useState({
    dob: editing || d.dob !== "",
    height: editing || Math.round(d.heightIn) !== EXAMPLE_HEIGHT_IN,
    weight: editing || Math.round(d.weightLb) !== EXAMPLE_WEIGHT_LB,
  });
  const [busy, setBusy] = useState(false);
  const [gateError, setGateError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const markTouched = (k: keyof typeof touched) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));

  const current = view === "setup" ? step : view;

  // Keep the URL in sync with the position.
  useEffect(() => {
    const next = new URLSearchParams();
    next.set(isResultStep(current) ? "state" : "step", current);
    if (editReturnTo) next.set("returnTo", editReturnTo);
    if (completionReturnTo) next.set("next", completionReturnTo);
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [current, editReturnTo, completionReturnTo, params, setParams]);

  // Persist the in-progress draft (not while editing, not once completed).
  const finished = useRef(false);
  useEffect(() => {
    if (editing || finished.current) return;
    saveDraft({
      position: current,
      answered,
      dob,
      goal,
      activityLevel: activity,
      surgicalContext: surgery,
      heightIn,
      heightImperial: heightImp,
      weightLb,
      weightImperial: weightImp,
    });
  }, [editing, current, answered, dob, goal, activity, surgery, heightIn, heightImp, weightLb, weightImp]);

  // Focus management after step changes.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const focusReason = useRef<"initial" | "step" | null>("initial");
  useEffect(() => {
    const reason = focusReason.current;
    if (!reason) return;
    focusReason.current = null;
    const fine = window.matchMedia?.("(pointer: fine)").matches ?? false;
    if (firstInputRef.current && fine) focusInput(firstInputRef.current);
    else if (reason === "step") headingRef.current?.focus();
  });

  /* derived values */
  const age = ageFromDob(dob);
  const dobDone = isDobComplete(dob);
  const dobOk = age !== null && age >= 13 && age <= 100;
  const dobError = dobDone
    ? age === null
      ? "Enter a real date as MM/DD/YYYY."
      : age > 100
        ? "Enter a realistic date of birth."
        : undefined
    : undefined;
  const tooYoung = dobDone && age !== null && age < 13;
  const parsedHeight = parseHeight(heightImp, ft, inch, cm);
  const parsedWeight = parseWeight(weightImp, weightText);
  const goalNow = goal ?? FALLBACK_GOAL;
  const activityNow = activity ?? FALLBACK_ACTIVITY;
  const surgeryNow = surgery ?? FALLBACK_SURGERY;
  const valid: Record<QuestionStep, boolean> = {
    dob: dobOk,
    goal: goal !== null,
    encourage: true,
    height: parsedHeight !== null,
    weight: parsedWeight !== null,
    activity: activity !== null,
    surgery: surgery !== null,
  };

  const syncHeightFields = (inches: number) => {
    const n = Math.round(inches);
    setFt(String(Math.floor(n / 12)));
    setInch(String(n % 12));
    setCm(String(Math.round(inches * CM)));
  };
  const changeHeight = (nf: string, ni: string, nc: string) => {
    markTouched("height");
    setFt(nf);
    setInch(ni);
    setCm(nc);
    const v = parseHeight(heightImp, nf, ni, nc);
    if (v !== null) setHeightIn(v);
  };
  const toggleHeightUnit = (imp: boolean) => {
    syncHeightFields(heightIn);
    setHeightImp(imp);
  };
  const stepHeight = (v: number) => {
    markTouched("height");
    const inches = heightImp ? v : v / CM;
    setHeightIn(inches);
    syncHeightFields(inches);
    if (!heightImp) setCm(String(v));
  };
  const changeWeight = (text: string) => {
    markTouched("weight");
    setWeightText(text);
    const v = parseWeight(weightImp, text);
    if (v !== null) setWeightLb(v);
  };
  const toggleWeightUnit = (imp: boolean) => {
    setWeightText(String(Math.round(imp ? weightLb : weightLb * KG)));
    setWeightImp(imp);
  };

  const go = (view2: typeof view, step2: QuestionStep = step, dir: "forward" | "back" = "forward") => {
    focusReason.current = "step";
    setDirection(dir);
    setView(view2);
    setStep(step2);
  };

  const stepIdx = QUESTION_STEPS.indexOf(step);
  const omit = (): ("height" | "weight")[] => {
    const o: ("height" | "weight")[] = [];
    if (!touched.height) o.push("height");
    if (!touched.weight) o.push("weight");
    return o;
  };
  const buildDraft = (): QuestionnaireDraft => ({
    position: null,
    answered: [...QUESTION_STEPS],
    dob,
    goal,
    activityLevel: activity,
    surgicalContext: surgery,
    heightIn,
    heightImperial: heightImp,
    weightLb,
    weightImperial: weightImp,
  });

  /** Persist an edit made from /you: PATCH the profile (or guest onboarding session). */
  const saveEdits = async () => {
    const iso = dobToIso(dob);
    await updateProfile({
      dateOfBirth: iso ?? undefined,
      age: age ?? undefined,
      goal: goal ?? undefined,
      activityLevel: activity ?? undefined,
      surgicalContext: surgery ?? undefined,
      heightCm: touched.height ? Math.round(heightIn * CM) : undefined,
      weightKg: touched.weight ? Math.round(weightLb * KG * 10) / 10 : undefined,
      unitsPreference: heightImp && weightImp ? "imperial" : "metric",
    });
  };

  const finishEdit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await saveEdits();
      navigate(editReturnTo ?? "/you");
    } catch (e) {
      toast.error(getErrorMessage(e));
      setBusy(false);
    }
  };

  const advance = async () => {
    if (busy) return;
    if (step === "dob" && !editing) {
      // Server-side age gate (13+).
      setBusy(true);
      setGateError(undefined);
      try {
        const res = await ageGateApi.verifyAgeGate({
          age: age ?? 0,
          isAgeConfirmed: true,
          sessionId: getAppSession().guestSessionId ?? undefined,
        });
        if (!res.allowed) {
          setGateError(`You must be at least ${res.minimumAge} years old to use ForkThis.`);
          setBusy(false);
          return;
        }
      } catch (e) {
        setGateError(getErrorMessage(e));
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    if (!answered.includes(step)) setAnswered([...answered, step]);
    if (fromReview) {
      setFromReview(false);
      go("review");
    } else if (editing) {
      void finishEdit();
    } else if (stepIdx < QUESTION_STEPS.length - 1) {
      go("setup", QUESTION_STEPS[stepIdx + 1]);
    } else if (dobOk) {
      go("building");
    } else {
      go("setup", "dob", "back");
    }
  };
  const onContinue = () => {
    if (!valid[step]) return;
    if (step === "height" || step === "weight") markTouched(step);
    void advance();
  };
  const onSkip = () => {
    if (step === "height") syncHeightFields(heightIn);
    if (step === "weight") setWeightText(String(Math.round(weightImp ? weightLb : weightLb * KG)));
    void advance();
  };
  const onBackStep = () => {
    if (fromReview) {
      setFromReview(false);
      go("review", step, "back");
    } else if (editing) navigate(editReturnTo ?? "/you");
    else if (stepIdx > 0) go("setup", QUESTION_STEPS[stepIdx - 1], "back");
    else navigate(-1);
  };

  /* estimates */
  const weightKg = weightLb * KG;
  const heightCm = heightIn * CM;
  const calories = calorieTarget({ weightKg, heightCm, age, activityLevel: activityNow, goal: goalNow });
  const baseline = tdee({ weightKg, heightCm, age, activityLevel: activityNow });
  const proteinG = calories ? (macroGrams(calories).find((m) => m.key === "protein")?.grams ?? null) : null;
  const waterOz = DEFAULT_TARGETS.waterOz;

  /* completion */
  const complete = async (mode: "next" | "email" | "guest"): Promise<boolean> => {
    if (!dobOk) {
      go("setup", "dob", "back");
      return false;
    }
    setBusy(true);
    try {
      if (mode === "guest") await startGuestSession();
      await submitQuestionnaire(buildDraft(), { omit: omit() });
      finished.current = true;
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e));
      setBusy(false);
      return false;
    }
  };
  const onRevealPrimary = async () => {
    if (!session.isSignedIn) return go("save");
    if (await complete("next")) navigate(completionReturnTo ?? TOUR_URL);
  };

  /* ------------------------------------------------------------ views */
  if (view === "building") {
    return (
      <BuildingScreen
        images={IMAGES}
        activeImage={LAST_IMAGE}
        headingRef={headingRef}
        onDone={() => go("reveal")}
      />
    );
  }
  if (view === "reveal") {
    return (
      <RevealScreen
        images={IMAGES}
        activeImage={LAST_IMAGE}
        headingRef={headingRef}
        calories={calories}
        proteinGrams={proteinG}
        waterOz={waterOz}
        busy={busy}
        primaryLabel={session.isSignedIn ? "Start using ForkThis" : "Save your plan"}
        onBack={() => go("setup", QUESTION_STEPS[QUESTION_STEPS.length - 1], "back")}
        onReview={() => go("review")}
        onPrimary={onRevealPrimary}
      />
    );
  }
  if (view === "save") {
    return (
      <SaveScreen
        images={IMAGES}
        activeImage={LAST_IMAGE}
        headingRef={headingRef}
        busy={busy}
        notice={notice}
        onBack={() => go("reveal", step, "back")}
        onApple={() => setNotice("Apple sign-in is not available yet. Continue with email instead.")}
        onGoogle={() => setNotice("Google sign-in is not available yet. Continue with email instead.")}
        onEmail={async () => {
          if (await complete("email")) navigate(`/signup?next=${encodeURIComponent(TOUR_URL)}`);
        }}
        onGuest={async () => {
          if (await complete("guest")) navigate(TOUR_URL);
        }}
      />
    );
  }

  const planTiles = (
    <>
      <StatTile icon="fire" label="Calories" value={calories ? calories.toLocaleString("en-US") : "—"} unit="kcal" />
      <StatTile icon="dumbbell" label="Protein" value={proteinG === null ? "—" : String(proteinG)} unit="g" />
      <StatTile icon="droplet" label="Water" value={String(waterOz)} unit="oz" />
    </>
  );

  if (view === "review") {
    const about = [
      { label: "Date of birth", value: age === null ? dob : `${dob} (${age})`, step: "dob" as const },
      { label: "Height", value: showHeight(heightIn, heightImp), step: "height" as const },
      { label: "Weight", value: showWeight(weightLb, weightImp), step: "weight" as const },
    ];
    const inputs = [
      { label: "Goal", value: GOAL_LABEL[goalNow], step: "goal" as const },
      { label: "Activity", value: ACTIVITY_LABEL[activityNow], step: "activity" as const },
      { label: "Surgery", value: surgeryNow, step: "surgery" as const },
    ];
    const bmi = bmiOf(heightIn, weightLb);
    return (
      <QuizStepLayout
        images={IMAGES}
        activeImage={PROGRESS_STEPS.length}
        stepKey="review"
        direction={direction}
        caption={
          <StepIntro
            eyebrow="Review"
            title="Everything you told us, in one place."
            body="Every figure here updates if you edit an answer, and every setting can be changed later."
          />
        }
        header={<StepProgress current={TOTAL} total={TOTAL} stepName="Review" complete />}
        onBack={() => (editing ? navigate(editReturnTo ?? "/you") : go("reveal", step, "back"))}
        onSubmit={() => (editing ? void finishEdit() : go("reveal"))}
        actions={
          <PrimaryButton
            type="submit"
            disabled={busy}
            label={editing ? "Confirm and continue" : "Back to your plan"}
          />
        }
      >
        <QuestionHeading
          size="chapter"
          title="Your answers"
          helper="Check anything that's off. Each edit brings you straight back here, and your plan updates to match."
          headingRef={headingRef}
        />
        <section aria-labelledby={`${uid}-plan`} className="mt-6 rounded-2xl bg-navy-soft p-5">
          <h2 id={`${uid}-plan`} className={cn("type-section-title text-brand-navy", ONB_TYPE.body)}>
            Your starting plan
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-3">{planTiles}</div>
          <p className={cn(ONB_SPACING.notes, "type-meta text-text-secondary", ONB_TYPE.meta)}>
            Water is a general guide — drink more on hot days and when you train.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-border-default pt-4">
            <div>
              <dt className={cn("type-meta text-text-secondary", ONB_TYPE.meta)}>TDEE</dt>
              <dd className={cn("mt-0.5 type-row-figure text-text-primary", ONB_TYPE.body)}>
                {baseline === null ? "Not enough info" : `${baseline.toLocaleString("en-US")} kcal/day`}
              </dd>
            </div>
            <div>
              <dt className={cn("type-meta text-text-secondary", ONB_TYPE.meta)}>BMI</dt>
              <dd className={cn("mt-0.5 type-row-figure text-text-primary", ONB_TYPE.body)}>
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
                  onEdit={() => {
                    setFromReview(true);
                    go("setup", r.step, "back");
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </QuizStepLayout>
    );
  }

  if (step === "encourage") {
    return (
      <QuizStepLayout
        images={IMAGES}
        activeImage={imageFor("encourage")}
        stepKey="step-encourage"
        direction={direction}
        band={ENCOURAGE_IMAGE}
        caption={
          <StepIntro
            eyebrow="Goal set"
            title="A few details to shape your plan."
            body="Height, weight and activity turn your goal into daily numbers."
          />
        }
        onBack={onBackStep}
        onSubmit={onContinue}
        actions={
          <PrimaryButton
            type="submit"
            label={fromReview ? "Back to review" : "Continue"}
            className="flex-1 lg:ml-auto lg:max-w-60"
          />
        }
      >
        <QuestionHeading
          size="chapter"
          eyebrow={goal ? `Goal set · ${GOAL_OPTIONS.find((o) => o.value === goal)?.title}` : "Next up"}
          title="Great — now your starting point"
          helper="A few quick measurements so your targets start from where you are today."
          headingRef={headingRef}
        />
      </QuizStepLayout>
    );
  }

  const copy = STEP_COPY[step];
  const whyId = `${uid}-why`;
  const headingId = `${uid}-heading`;
  const exampleFocus = () => {
    firstInputRef.current?.focus();
    firstInputRef.current?.select();
  };
  const heightShown = heightImp ? (parsedHeight ?? heightIn) : (num(cm) ?? Math.round(heightIn * CM));
  const weightShown = num(weightText) ?? Math.round(weightImp ? weightLb : weightLb * KG);
  const bmiLive = parsedWeight === null ? null : bmiOf(Math.round(heightIn), Math.round(parsedWeight));

  return (
    <QuizStepLayout
      images={IMAGES}
      activeImage={imageFor(step)}
      stepKey={`step-${step}`}
      direction={direction}
      wide={step === "goal"}
      caption={<StepIntro eyebrow={copy.name} title="A few details to shape your plan." />}
      header={
        <StepProgress current={PROGRESS_STEPS.indexOf(step as (typeof PROGRESS_STEPS)[number]) + 1} total={TOTAL} stepName={copy.name} />
      }
      onBack={onBackStep}
      onSubmit={onContinue}
      actions={
        <>
          {copy.optional && !fromReview && !editing && (
            <button
              type="button"
              onClick={onSkip}
              className={cn(
                "h-14 shrink-0 rounded-2xl px-4 type-button-secondary text-brand-navy hover:bg-navy-soft",
                ONB_TYPE.body,
              )}
            >
              Skip for now
            </button>
          )}
          <PrimaryButton
            type="submit"
            label={busy ? "Please wait..." : fromReview ? "Back to review" : "Continue"}
            disabled={!valid[step] || busy}
            className="flex-1 lg:ml-auto lg:max-w-60"
          />
        </>
      }
    >
      <QuestionHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        why={copy.why}
        headingRef={headingRef}
        headingId={headingId}
        lineId={whyId}
      />

      {step === "dob" && (
        <div className={ONB_SPACING.control}>
          <p id={`${uid}-dob-label`} className="sr-only">
            Date of birth
          </p>
          <DobInput
            value={dob}
            onChange={(v) => {
              markTouched("dob");
              setGateError(undefined);
              setDob(v);
            }}
            labelledBy={`${uid}-dob-label`}
            invalid={Boolean(dobError || tooYoung || gateError)}
            example={false}
            describedBy={`${whyId} ${uid}-dob-result`}
            firstInputRef={firstInputRef}
          />
          <div className={cn("flex flex-col", ONB_SPACING.notes, ONB_SPACING.stack)}>
            <div id={`${uid}-dob-result`} aria-live="polite" className="empty:hidden">
              {gateError ? (
                <InlineMessage message={gateError} />
              ) : dobOk ? (
                <InlineMessage message={`${age} years old`} success />
              ) : dobError ? (
                <InlineMessage message={dobError} />
              ) : tooYoung ? (
                <div role="alert" className="rounded-2xl bg-error-soft p-4">
                  <p className={cn("flex items-center gap-2 type-section-title text-text-primary", ONB_TYPE.body)}>
                    <Icon name="alert" size={18} color="var(--color-status-low)" />
                    Age requirement not met
                  </p>
                  <p className={cn("mt-1.5 type-meta text-text-primary", ONB_TYPE.meta)}>
                    You must be at least 13 years old to create an account. Please ask a parent or guardian for help.
                  </p>
                </div>
              ) : null}
            </div>
            <Reassurance>Private to you. Your date of birth is never shown on your profile.</Reassurance>
          </div>
        </div>
      )}

      {step === "goal" && (
        <GoalPicker
          className={ONB_SPACING.control}
          labelledBy={headingId}
          describedBy={whyId}
          options={GOAL_OPTIONS}
          value={goal}
          onChange={setGoal}
        />
      )}

      {step === "height" && (
        <div className={cn("flex flex-col items-center", ONB_SPACING.control, ONB_SPACING.siblings)}>
          <UnitToggle label="Height units" left="ft/in" right="cm" leftSelected={heightImp} onChange={toggleHeightUnit} />
          <NumberStepper
            name="height"
            value={heightShown}
            min={heightImp ? MIN_IN : MIN_CM}
            max={heightImp ? MAX_IN : MAX_CM}
            onStep={stepHeight}
            invalid={parsedHeight === null}
            example={!touched.height}
            describedBy={`${whyId} ${uid}-height-hint`}
            fields={
              heightImp
                ? [
                    { id: `${uid}-ft`, label: "Height, feet", unit: "ft", maxLength: 1, value: ft, onChange: (v) => changeHeight(v, inch, cm), inputRef: firstInputRef },
                    { id: `${uid}-in`, label: "Height, inches", unit: "in", maxLength: 2, value: inch, onChange: (v) => changeHeight(ft, v, cm) },
                  ]
                : [
                    { id: `${uid}-cm`, label: "Height, centimetres", unit: "cm", maxLength: 3, value: cm, onChange: (v) => changeHeight(ft, inch, v), inputRef: firstInputRef },
                  ]
            }
          />
          <div className="flex flex-col items-center gap-1">
            {!touched.height && <ExampleHint onPress={exampleFocus} />}
            <p
              id={`${uid}-height-hint`}
              aria-live="polite"
              className={cn(
                "text-center type-meta",
                ONB_TYPE.meta,
                parsedHeight === null ? "text-error-red" : "text-text-secondary",
              )}
            >
              {parsedHeight === null
                ? heightImp
                  ? "Enter a height between 3 ft and 8 ft, with 0–11 inches."
                  : `Enter a height between ${MIN_CM} and ${MAX_CM} cm.`
                : heightImp
                  ? `That's ${Math.round(parsedHeight * CM)} cm.`
                  : `That's ${showHeight(parsedHeight, true)}.`}
            </p>
          </div>
        </div>
      )}

      {step === "weight" && (
        <div className={cn("flex flex-col items-center", ONB_SPACING.control, ONB_SPACING.siblings)}>
          <UnitToggle label="Weight units" left="lbs" right="kg" leftSelected={weightImp} onChange={toggleWeightUnit} />
          <NumberStepper
            name="weight"
            value={weightShown}
            min={weightImp ? MIN_LB : MIN_KG}
            max={weightImp ? MAX_LB : MAX_KG}
            onStep={(v) => changeWeight(String(v))}
            invalid={parsedWeight === null}
            example={!touched.weight}
            describedBy={`${whyId} ${uid}-weight-hint`}
            fields={[
              { id: `${uid}-weight`, label: weightImp ? "Weight, pounds" : "Weight, kilograms", unit: weightImp ? "lbs" : "kg", maxLength: 3, value: weightText, onChange: changeWeight, inputRef: firstInputRef },
            ]}
          />
          <div className="flex flex-col items-center gap-1">
            {!touched.weight && <ExampleHint onPress={exampleFocus} />}
            <p
              id={`${uid}-weight-hint`}
              aria-live="polite"
              className={cn(
                "text-center type-meta",
                ONB_TYPE.meta,
                parsedWeight === null ? "text-error-red" : "text-text-secondary",
              )}
            >
              {parsedWeight === null
                ? weightImp
                  ? `Enter a weight between ${MIN_LB} and ${MAX_LB} lbs.`
                  : `Enter a weight between ${MIN_KG} and ${MAX_KG} kg.`
                : weightImp
                  ? `That's ${Math.round(parsedWeight * KG)} kg.`
                  : `That's ${Math.round(parsedWeight)} lbs.`}
            </p>
          </div>
          {bmiLive !== null && Number.isFinite(bmiLive) && (
            <div className="flex w-full items-center gap-4 rounded-2xl bg-navy-soft p-4" aria-live="polite">
              <span className="flex flex-col">
                <span className={cn("type-meta text-text-secondary", ONB_TYPE.meta)}>Your BMI</span>
                <span className={cn("type-row-figure tabular-nums text-brand-navy", ONB_TYPE.body)}>
                  {bmiLive.toFixed(1)}
                </span>
              </span>
              <span className={cn("min-w-0 flex-1 border-l border-border-default pl-4 type-meta text-text-secondary", ONB_TYPE.meta)}>
                At {showHeight(heightIn, heightImp)}. One signal among many, used for context only.
              </span>
            </div>
          )}
        </div>
      )}

      {step === "activity" && (
        <OptionList
          className={ONB_SPACING.control}
          labelledBy={headingId}
          describedBy={whyId}
          options={ACTIVITY_OPTIONS}
          value={activity}
          onChange={setActivity}
        />
      )}

      {step === "surgery" && (
        <div className={cn("flex flex-col", ONB_SPACING.control, ONB_SPACING.notesGap)}>
          <OptionList
            labelledBy={headingId}
            describedBy={whyId}
            options={SURGERY_OPTIONS}
            value={surgery}
            onChange={setSurgery}
          />
          <Reassurance icon="shield">
            Private to you, and you can change it later. Choose Prefer not to say and the app keeps recommendations
            general and hides surgery-specific resources.
          </Reassurance>
        </div>
      )}
    </QuizStepLayout>
  );
}
