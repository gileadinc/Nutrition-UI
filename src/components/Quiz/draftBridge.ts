/**
 * Bridges the quiz's answers onto the app-wide `QuestionnaireDraft`, so the
 * redesigned quiz feeds the same store, backend session and profile the old
 * questionnaire did.
 */
import { isoToDob } from "@/lib/nutrition";
import type { SurgicalContext } from "@/lib/nutrition";
import type { QuestionnaireDraft, QuestionStep } from "@/lib/store";
import { EMPTY_ANSWERS, goalKeyFor, type HealthKey, type QuizAnswers, type StepKey } from "./quizData";

const IN_TO_CM = 2.54;
const LB_TO_KG = 0.453592;

/**
 * The quiz asks about clinical context as a multi-select; the profile stores a
 * single `SurgicalContext`. Map conservatively: only an explicit surgery answer
 * claims one, and a medication-only answer stays "Prefer not to say".
 */
export function surgicalContextFor(health: readonly HealthKey[]): SurgicalContext | null {
  if (health.length === 0) return null;
  if (health.includes("plastic") || health.includes("bariatric")) return "Preparing for surgery";
  if (health.includes("none")) return "No surgery";
  return "Prefer not to say";
}

/** Which quiz step answers a given questionnaire step, for `?step=` deep links. */
export const STEP_FOR_QUESTION: Partial<Record<QuestionStep, StepKey>> = {
  dob: "dob",
  goal: "goal",
  height: "measure",
  weight: "measure",
  activity: "activity",
  surgery: "health",
};

/** The questionnaire steps the quiz has actually answered. */
function answeredSteps(a: QuizAnswers): QuestionStep[] {
  const done: QuestionStep[] = [];
  if (a.month && a.day && a.year) done.push("dob");
  if (a.goals.length) done.push("goal");
  if (a.heightIn !== null) done.push("height");
  if (a.weightLb !== null) done.push("weight");
  if (a.activity) done.push("activity");
  if (a.health.length) done.push("surgery");
  return done;
}

/** Quiz answers -> the draft shape the store, backend and profile expect. */
export function draftFromAnswers(a: QuizAnswers): QuestionnaireDraft {
  return {
    position: null,
    answered: answeredSteps(a),
    dob: a.month && a.day && a.year
      ? `${a.month.padStart(2, "0")}/${a.day.padStart(2, "0")}/${a.year}`
      : "",
    goal: a.goals.length ? goalKeyFor(a.goals) : null,
    activityLevel: a.activity,
    surgicalContext: surgicalContextFor(a.health),
    heightIn: a.heightIn ?? 0,
    heightImperial: !a.heightMetric,
    weightLb: a.weightLb ?? 0,
    weightImperial: !a.weightMetric,
  };
}

/** Seed the quiz from a saved profile, so `?returnTo=` edits start from real answers. */
export function answersFromProfile(p: {
  dateOfBirth?: string | null;
  goal?: string | null;
  activityLevel?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  isImperial?: boolean;
}): QuizAnswers {
  const dob = isoToDob(p.dateOfBirth ?? null);
  const [month = "", day = "", year = ""] = dob ? dob.split("/") : [];
  const imperial = p.isImperial ?? true;
  return {
    ...EMPTY_ANSWERS,
    month,
    day,
    year,
    heightIn: p.heightCm ? Math.round(p.heightCm / IN_TO_CM) : null,
    weightLb: p.weightKg ? Math.round(p.weightKg / LB_TO_KG) : null,
    heightMetric: !imperial,
    weightMetric: !imperial,
    activity: (p.activityLevel as QuizAnswers["activity"]) ?? null,
  };
}
