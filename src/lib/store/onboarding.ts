"use client";

/**
 * Questionnaire / onboarding answers.
 *
 * - The in-progress answers ("draft") live in localStorage so a refresh or a
 *   detour to sign-up doesn't lose them (same key as the deployed app).
 * - Completing the questionnaire persists to the backend onboarding session
 *   (works for guests and signed-in users) and, when signed in, to the profile.
 */

import { onboardingApi, profileApi, type OnboardingSession } from "@/lib/api";
import { getGuestSessionId } from "@/lib/auth";
import {
  ageFromDob,
  calorieTarget,
  dobToIso,
  inchesToCm,
  activityToWire,
  isActivityKey,
  isGoalKey,
  lbToKg,
  normalizeSurgicalContext,
  type ActivityKey,
  type GoalKey,
  type SurgicalContext,
} from "@/lib/nutrition";
import { getAppSession } from "./session";
import { invalidate } from "./resource";

/* ------------------------------------------------------------------ steps */

/** Answer steps in order. */
export const QUESTION_STEPS = [
  "dob",
  "goal",
  "encourage",
  "height",
  "weight",
  "activity",
  "surgery",
] as const;
/** Post-answer steps. */
export const RESULT_STEPS = ["building", "reveal", "save"] as const;
export type QuestionStep = (typeof QUESTION_STEPS)[number];
export type ResultStep = (typeof RESULT_STEPS)[number];
export type QuestionnairePosition = QuestionStep | ResultStep | "review";

export const isQuestionStep = (v: unknown): v is QuestionStep =>
  typeof v === "string" && (QUESTION_STEPS as readonly string[]).includes(v);
export const isResultStep = (v: unknown): v is ResultStep =>
  typeof v === "string" && (RESULT_STEPS as readonly string[]).includes(v);
export const isPosition = (v: unknown): v is QuestionnairePosition =>
  v === "review" || isQuestionStep(v) || isResultStep(v);

/** Deep link to edit one answer and come back: `/questionnaire?step=goal&returnTo=/you`. */
export const questionnaireUrl = (step: QuestionStep | "review", returnTo: string) =>
  `/questionnaire?step=${step}&returnTo=${encodeURIComponent(returnTo)}`;

/* ------------------------------------------------------------------ draft */

export interface QuestionnaireDraft {
  position: QuestionnairePosition | null;
  answered: QuestionStep[];
  /** MM/DD/YYYY */
  dob: string;
  goal: GoalKey | null;
  activityLevel: ActivityKey | null;
  surgicalContext: SurgicalContext | null;
  /** Always stored in inches / pounds; the *Imperial flag is only the display unit. */
  heightIn: number;
  heightImperial: boolean;
  weightLb: number;
  weightImperial: boolean;
}

const DRAFT_KEY = "forkthis_onboarding_draft";
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function loadDraft(): QuestionnaireDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof d !== "object" ||
      !d ||
      typeof d.dob !== "string" ||
      !finite(d.heightIn) ||
      !finite(d.weightLb)
    ) {
      return null;
    }
    return {
      position: isPosition(d.position) ? d.position : null,
      answered: Array.isArray(d.answered) ? d.answered.filter(isQuestionStep) : [],
      dob: d.dob,
      goal: isGoalKey(d.goal) ? d.goal : null,
      activityLevel: isActivityKey(d.activityLevel) ? d.activityLevel : null,
      surgicalContext:
        typeof d.surgicalContext === "string" ? normalizeSurgicalContext(d.surgicalContext) : null,
      heightIn: d.heightIn,
      heightImperial: d.heightImperial !== false,
      weightLb: d.weightLb,
      weightImperial: d.weightImperial !== false,
    };
  } catch {
    return null;
  }
}

export function saveDraft(draft: QuestionnaireDraft) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota / disabled storage
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

/* --------------------------------------------------------------- estimate */

export interface QuestionnaireResult {
  age: number | null;
  dateOfBirth: string | null;
  heightCm: number;
  weightKg: number;
  /** Client-side estimate; the backend's `preferences.nutritionTargets` is authoritative once signed in. */
  calorieTarget: number | null;
}

export function resultFromDraft(d: QuestionnaireDraft): QuestionnaireResult {
  const age = ageFromDob(d.dob);
  const heightCm = Math.round(inchesToCm(d.heightIn));
  const weightKg = Math.round(lbToKg(d.weightLb) * 10) / 10;
  return {
    age,
    dateOfBirth: dobToIso(d.dob),
    heightCm,
    weightKg,
    calorieTarget:
      d.goal && d.activityLevel
        ? calorieTarget({ weightKg, heightCm, age, activityLevel: d.activityLevel, goal: d.goal })
        : null,
  };
}

/* ------------------------------------------------------- backend session */

const SESSION_KEY = "forkthis.onboarding.sessionId";

/** Find or create the backend onboarding session for this device / account. */
export async function getOrCreateOnboardingSession(): Promise<OnboardingSession> {
  let existing: string | null = null;
  try {
    existing = window.localStorage.getItem(SESSION_KEY);
  } catch {
    // ignore
  }
  const guestId = getGuestSessionId() ?? undefined;
  let session: OnboardingSession;
  if (existing) {
    try {
      session = await onboardingApi.getOnboardingSession(existing);
    } catch {
      session = await onboardingApi.createOnboardingSession({ sessionId: guestId });
    }
  } else {
    session = await onboardingApi.createOnboardingSession({ sessionId: guestId });
  }
  try {
    window.localStorage.setItem(SESSION_KEY, session.sessionId);
  } catch {
    // ignore
  }
  return session;
}

/**
 * Has the signed-in user already answered the questionnaire? Judged from the account PROFILE, because
 * guest sign-in migration clears the local onboarding-session id and a fresh session would always look
 * empty. Falls back to the onboarding session if the profile can't be read.
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const p = await profileApi.getProfile();
    if (p.goal && p.heightCm && p.weightKg) return true;
  } catch {
    // fall through to the session check
  }
  try {
    return (await getOrCreateOnboardingSession()).isCompleted === true;
  } catch {
    return false;
  }
}

/**
 * Persist the finished questionnaire: backend onboarding session (always) and
 * the profile (when signed in). Clears the local draft on success.
 */
export async function submitQuestionnaire(
  draft: QuestionnaireDraft,
  opts: { omit?: ("height" | "weight")[] } = {},
): Promise<QuestionnaireResult> {
  const omitHeight = opts.omit?.includes("height") ?? false;
  const omitWeight = opts.omit?.includes("weight") ?? false;
  const result = resultFromDraft(draft);
  const session = await getOrCreateOnboardingSession();
  const update = {
    goal: draft.goal ?? undefined,
    dateOfBirth: result.dateOfBirth ?? undefined,
    age: result.age ?? undefined,
    heightCm: omitHeight ? undefined : result.heightCm,
    weightKg: omitWeight ? undefined : result.weightKg,
    unitsPreference: draft.heightImperial && draft.weightImperial ? "imperial" : "metric",
    activityLevel: draft.activityLevel ? activityToWire(draft.activityLevel) : undefined,
    surgicalContext: draft.surgicalContext ?? undefined,
    currentStep: QUESTION_STEPS.length,
    completedSteps: QUESTION_STEPS.map((_, i) => i + 1),
    isCompleted: true,
  };
  await onboardingApi.updateOnboardingSession(session.sessionId, update);

  if (getAppSession().isSignedIn) {
    await profileApi.updateProfile({
      goal: update.goal,
      dateOfBirth: update.dateOfBirth,
      age: update.age,
      heightCm: update.heightCm,
      weightKg: update.weightKg,
      unitsPreference: update.unitsPreference,
      activityLevel: update.activityLevel,
      surgicalContext: update.surgicalContext,
    });
  }
  invalidate("profile");
  clearDraft();
  return result;
}

/** Push a signed-out user's onboarding answers into their new account profile (call right after sign-in/up). */
export async function syncOnboardingToProfile(): Promise<void> {
  if (!getAppSession().isSignedIn) return;
  try {
    const s = await getOrCreateOnboardingSession();
    if (!s.isCompleted) return;
    await profileApi.updateProfile({
      goal: s.goal ?? undefined,
      dateOfBirth: s.dateOfBirth ?? undefined,
      age: s.age ?? undefined,
      heightCm: s.heightCm ?? undefined,
      weightKg: s.weightKg ?? undefined,
      unitsPreference: s.unitsPreference ?? undefined,
      sex: s.sex ?? undefined,
      activityLevel: s.activityLevel ?? undefined,
      surgicalContext: s.surgicalContext ?? undefined,
    });
    invalidate("profile");
  } catch {
    // best effort
  }
}
