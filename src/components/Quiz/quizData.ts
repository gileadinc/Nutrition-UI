import type { ActivityKey, GoalKey } from "@/lib/nutrition/onboarding";

export const STEPS = ["dob", "goal", "height", "weight", "activity", "health"] as const;
export type StepKey = (typeof STEPS)[number];

export interface StepCopy {
  name: string;
  eyebrow: string;
  title: string;
  /** Shown after a bold "Why we ask:" lead-in. */
  why?: string;
  /** Plain sentence(s) shown without the lead-in. */
  intro?: string[];
  image: string;
  optional: boolean;
}

export const STEP_COPY: Record<StepKey, StepCopy> = {
  dob: {
    name: "Date of birth",
    eyebrow: "About you",
    title: "How old are you?",
    why: "age shapes your energy needs, and ForkThis can’t be used by anyone under 13.",
    image: "/img/quiz/dob.webp",
    optional: false,
  },
  goal: {
    name: "Goal",
    eyebrow: "Your goal",
    title: "What's your main goal?",
    intro: [
      "It decides whether your daily target leans toward a deficit, a surplus or maintenance. Click all that apply",
    ],
    image: "/img/quiz/goal.webp",
    optional: true,
  },
  height: {
    name: "Height",
    eyebrow: "Your starting point",
    title: "What's your height and Weight?",
    why: "height and weight together give your baseline energy — what your body uses at rest.",
    image: "/img/quiz/measure.webp",
    optional: true,
  },
  weight: {
    name: "Weight",
    eyebrow: "Your starting point",
    title: "What's your weight?",
    why: "it completes your baseline energy estimate, and shows your BMI for context.",
    image: "/img/quiz/measure.webp",
    optional: true,
  },
  activity: {
    name: "Activity",
    eyebrow: "Your week",
    title: "How active are you right now?",
    intro: ["Activity multiplies your baseline. Pick a typical week, not your best one."],
    image: "/img/quiz/activity.webp",
    optional: true,
  },
  health: {
    name: "Surgery",
    eyebrow: "Your health",
    title: "Anything else you’d like to tell us?",
    why: "it surfaces the right nutrition guidance before or after surgery, and stays private to you.",
    image: "/img/quiz/activity.webp",
    optional: true,
  },
};

export const START_IMAGE = "/img/quiz/intro.webp";
export const ANALYZING_IMAGE = "/img/quiz/analyzing.webp";
export const RESULT_IMAGE = "/img/quiz/result.webp";

export interface GoalOption {
  value: GoalKey;
  /** Title lines (the first card wraps over two lines in the design). */
  title: string[];
  subtitle: string;
  /** Subtitle max width in px, as laid out in the design. */
  subtitleWidth: number;
  image: string;
}

export const GOAL_OPTIONS: GoalOption[] = [
  {
    value: "eatOut",
    title: ["Eat healthier", "while you’re out!"],
    subtitle: "Low cal, high protein fast food and restaurant hacks",
    subtitleWidth: 146,
    image: "/img/quiz/goal-eat-out.webp",
  },
  {
    value: "track",
    title: ["Track your progress"],
    subtitle: "Move at your own pace. Track meals, movement, and the habits that matter most to you",
    subtitleWidth: 124,
    image: "/img/quiz/goal-track.webp",
  },
  {
    value: "lose",
    title: ["Lose weight"],
    subtitle: "Looking for sustainable guidance toward fat loss",
    subtitleWidth: 160,
    image: "/img/quiz/goal-lose.webp",
  },
  {
    value: "recomp",
    title: ["Body recomposition"],
    subtitle: "Looking for healthier recipes to cook at home!",
    subtitleWidth: 132,
    image: "/img/quiz/goal-recomp.webp",
  },
];

export const ACTIVITY_ORDER = [
  "mostlyInactive",
  "lightlyActive",
  "moderatelyActive",
  "veryActive",
] as const satisfies readonly ActivityKey[];

export const ACTIVITY_COPY: Record<(typeof ACTIVITY_ORDER)[number], { title: string; subtitle: string }> = {
  mostlyInactive: { title: "Sedentary", subtitle: "Little or no activity" },
  lightlyActive: { title: "Lightly active", subtitle: "Exercise 1–3 days per week" },
  moderatelyActive: { title: "Moderately active", subtitle: "Exercise 3–5 days per week" },
  veryActive: { title: "Very active", subtitle: "Active 5–7 days per week" },
};

export const HEALTH_OPTIONS = [
  { value: "none", title: "No surgery", subtitle: "No, none of these apply" },
  {
    value: "plastic",
    title: "Preparing for or recovering from plastic surgeries",
    subtitle: "Show pre-op nutrition context",
  },
  { value: "bariatric", title: "Recovering from surgery", subtitle: "I’ve had bariatric surgery" },
  { value: "glp1", title: "I’m on a GLP-1", subtitle: "" },
  { value: "peptide", title: "I’m on a peptide", subtitle: "" },
] as const;
export type HealthKey = (typeof HEALTH_OPTIONS)[number]["value"];

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
