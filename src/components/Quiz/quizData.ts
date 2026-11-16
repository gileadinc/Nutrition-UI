import type { ActivityKey, GoalKey } from "@/lib/nutrition";

export const STEPS = ["dob", "goal", "measure", "bmi", "activity", "health"] as const;
export type StepKey = (typeof STEPS)[number];

export interface StepCopy {
  name: string;
  eyebrow: string;
  title: string;
  /** Plain sentence(s) shown without a lead-in. */
  intro?: string[];
  image: string;
  optional: boolean;
}

export const STEP_COPY: Record<StepKey, StepCopy> = {
  dob: {
    name: "Age",
    eyebrow: "About you",
    title: "How old are you?",
    intro: [
      "Age shapes your energy needs, and ForkThis! can’t be used by anyone under 13.",
    ],
    image: "/img/quiz/dob.webp",
    optional: false,
  },
  goal: {
    name: "Goal",
    eyebrow: "Your goal",
    title: "What's your main goal?",
    intro: [
      "Your answer helps determine whether your daily target leans toward a deficit, a surplus or maintenance. Click all that apply:",
    ],
    image: "/img/quiz/goal.webp",
    optional: true,
  },
  measure: {
    name: "Height & weight",
    eyebrow: "Your starting point",
    title: "What's your height and weight?",
    intro: ["Together these give your baseline energy — what your body uses at rest."],
    image: "/img/quiz/measure.webp",
    optional: true,
  },
  bmi: {
    name: "BMI",
    eyebrow: "Your starting point",
    title: "Here's your BMI.",
    intro: ["One signal among many. It's here for context, and you can find it on your profile too."],
    image: "/img/quiz/measure.webp",
    optional: true,
  },
  activity: {
    name: "Activity",
    eyebrow: "Your week",
    title: "How active are you right now?",
    intro: ["Pick a typical week, not your best one."],
    image: "/img/quiz/activity.webp",
    optional: true,
  },
  health: {
    name: "Surgery",
    eyebrow: "Your health",
    title: "Anything else you’d like to tell us?",
    intro: ["Click all that apply:"],
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
    title: ["Eat healthier", "while you’re out"],
    subtitle: "Low cal, high protein fast food and restaurant hacks.",
    subtitleWidth: 146,
    image: "/img/quiz/goal-eat-out.webp",
  },
  {
    value: "recomp",
    title: ["Fresh Ideas"],
    subtitle: "Looking for healthier recipes to cook at home.",
    subtitleWidth: 132,
    image: "/img/quiz/goal-recomp.webp",
  },
  {
    value: "lose",
    title: ["Lose weight"],
    subtitle: "Looking for sustainable guidance toward fat loss.",
    subtitleWidth: 160,
    image: "/img/quiz/goal-lose.webp",
  },
  {
    value: "track",
    title: ["Track your progress"],
    subtitle:
      "Move at your own pace. Track meals, movement, and the habits that matter most to you.",
    subtitleWidth: 124,
    image: "/img/quiz/goal-track.webp",
  },
];

/** Most active first, sedentary last. */
export const ACTIVITY_ORDER = [
  "veryActive",
  "moderatelyActive",
  "lightlyActive",
  "mostlyInactive",
] as const satisfies readonly ActivityKey[];

export const ACTIVITY_COPY: Record<(typeof ACTIVITY_ORDER)[number], { title: string; subtitle: string }> = {
  veryActive: { title: "Very active", subtitle: "Exercise 6–7 days per week" },
  moderatelyActive: { title: "Active", subtitle: "Exercise 3–5 days per week" },
  lightlyActive: { title: "Lightly active", subtitle: "Exercise 1–2 days per week" },
  mostlyInactive: { title: "Sedentary", subtitle: "Little or no activity" },
};

export const HEALTH_OPTIONS = [
  {
    value: "plastic",
    title: "Preparing for or recovering from plastic surgery",
    subtitle: "Show high protein nutrition content.",
  },
  {
    value: "bariatric",
    title: "History of bariatric surgery",
    subtitle: "Keep portions and nutrient density in view.",
  },
  {
    value: "glp1",
    title: "I’m on a GLP-1 agonist",
    subtitle: "Maintain muscle mass while losing fat.",
  },
  { value: "peptide", title: "Peptides are part of my routine", subtitle: "" },
  { value: "none", title: "None of the above", subtitle: "" },
] as const;
export type HealthKey = (typeof HEALTH_OPTIONS)[number]["value"];

/** BMI bands, shown so people can place themselves without being labelled. */
export const BMI_BANDS = [
  { label: "Underweight", max: 18.5, range: "Below 18.5" },
  { label: "Normal", max: 25, range: "18.5 – 24.9" },
  { label: "Overweight", max: 30, range: "25.0 – 29.9" },
  { label: "Obese", max: Infinity, range: "30.0 and above" },
] as const;

export function bmiBand(bmi: number) {
  return BMI_BANDS.find((b) => bmi < b.max) ?? BMI_BANDS[BMI_BANDS.length - 1];
}

export const BMI_FOOTNOTE =
  "BMI compares weight to height only. It can’t tell muscle from fat, and it doesn’t account for build, age or ancestry — so treat it as context, not a verdict.";

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
  health: HealthKey[];
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
  health: [],
};

export const EXAMPLE_HEIGHT_IN = 67;
export const EXAMPLE_WEIGHT_LB = 165;
export const MIN_IN = 36;
export const MAX_IN = 96;
export const MIN_LB = 60;
export const MAX_LB = 500;
