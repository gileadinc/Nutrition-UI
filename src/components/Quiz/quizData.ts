import type { ActivityKey, GoalKey } from "@/lib/nutrition";

export const STEPS = ["dob", "goal", "height", "weight", "activity", "health"] as const;
export type StepKey = (typeof STEPS)[number];

export const STEP_COPY: Record<
  StepKey,
  { name: string; eyebrow: string; title: string; why: string; image: string; optional: boolean }
> = {
  dob: {
    name: "Date of birth",
    eyebrow: "About you",
    title: "How old are you?",
    why: "age shapes your energy needs, and ForkThis can’t be used by anyone under 13.",
    image: "/img/onboarding/generated/quiz-private-profile-v2",
    optional: false,
  },
  goal: {
    name: "Goal",
    eyebrow: "Your goal",
    title: "What's your main goal?",
    why: "it decides whether your daily target leans toward a deficit, a surplus or maintenance.",
    image: "/img/onboarding/tour-personalized-plan-v2",
    optional: true,
  },
  height: {
    name: "Height",
    eyebrow: "Your starting point",
    title: "What's your height?",
    why: "height and weight together give your baseline energy — what your body uses at rest.",
    image: "/img/onboarding/generated/quiz-height-v2",
    optional: true,
  },
  weight: {
    name: "Weight",
    eyebrow: "Your starting point",
    title: "What's your weight?",
    why: "it completes your baseline energy estimate, and shows your BMI for context.",
    image: "/img/onboarding/generated/quiz-weight-v2",
    optional: true,
  },
  activity: {
    name: "Activity",
    eyebrow: "Your week",
    title: "How active are you right now?",
    why: "activity multiplies your baseline. Pick a typical week, not your best one.",
    image: "/img/onboarding/generated/quiz-activity-v2",
    optional: true,
  },
  health: {
    name: "Health",
    eyebrow: "Your health",
    title: "Anything else you'd like to tell us?",
    why: "it surfaces the right nutrition guidance before or after surgery, and stays private to you.",
    image: "/img/onboarding/tour-clinical-support-v2",
    optional: true,
  },
};

export const START_IMAGE = "/img/onboarding/welcome";
export const ANALYZING_IMAGE = "/img/onboarding/generated/quiz-review-v2";
export const RESULT_IMAGE = "/img/onboarding/generated/quiz-complete-v2";

export const GOAL_OPTIONS: {
  value: GoalKey;
  title: string;
  subtitle: string;
  image: string;
  alt: string;
}[] = [
  {
    value: "lose",
    title: "Lose weight",
    subtitle: "Sustainable fat loss with muscle preservation",
    image: "/img/onboarding/goals/goal-lose-v2",
    alt: "Balanced chicken grain bowl beside walking shoes and a fitness watch",
  },
  {
    value: "gain",
    title: "Gain muscle",
    subtitle: "Build physical strength and energetic support",
    image: "/img/onboarding/goals/goal-gain-v2",
    alt: "Athlete lifting a dumbbell beside a protein-rich meal",
  },
  {
    value: "maintain",
    title: "Maintain weight",
    subtitle: "Focus on longevity, metabolism and vitality",
    image: "/img/onboarding/goals/goal-maintain-v2",
    alt: "Salmon grain bowl with vegetables and lemon water in warm sunlight",
  },
  {
    value: "recomp",
    title: "Body recomposition",
    subtitle: "Lose fat and build muscle at the same time",
    image: "/img/onboarding/goals/goal-recomp-v2",
    alt: "Athlete holding a resistance band beside a high-protein grain bowl",
  },
];

export const HEALTH_OPTIONS = [
  { value: "none", title: "No surgery", subtitle: "None of these apply" },
  {
    value: "plastic",
    title: "Preparing for or recovering from plastic surgeries",
    subtitle: "Show pre-op nutrition context",
  },
  {
    value: "recovering",
    title: "Recovering from surgery",
    subtitle: "I've had bariatric surgery",
  },
  { value: "glp1", title: "I'm on a GLP-1", subtitle: "Keep protein and portion guidance in view" },
  { value: "peptide", title: "I'm on a peptide", subtitle: "Keep recommendations specific" },
] as const;
export type HealthKey = (typeof HEALTH_OPTIONS)[number]["value"];

export const ACTIVITY_ORDER: ActivityKey[] = [
  "mostlyInactive",
  "lightlyActive",
  "moderatelyActive",
  "veryActive",
  "extremelyActive",
];

export interface QuizAnswers {
  month: string;
  day: string;
  year: string;
  goals: GoalKey[];
  heightIn: number | null;
  heightMetric: boolean;
  weightLb: number | null;
  weightMetric: boolean;
  activity: ActivityKey | null;
  health: HealthKey | null;
}

export const EMPTY_ANSWERS: QuizAnswers = {
  month: "",
  day: "",
  year: "",
  goals: [],
  heightIn: null,
  heightMetric: false,
  weightLb: null,
  weightMetric: false,
  activity: null,
  health: null,
};

export const EXAMPLE_HEIGHT_IN = 67;
export const EXAMPLE_WEIGHT_LB = 165;
export const MIN_IN = 36;
export const MAX_IN = 96;
export const MIN_LB = 60;
export const MAX_LB = 500;
