"use client";

/**
 * Current user's profile view model.
 * - signed in: `GET/PATCH /api/profile/me`
 * - guest: the backend onboarding session (goal, age, height, weight, ...)
 */

import { useCallback, useMemo } from "react";
import {
  onboardingApi,
  profileApi,
  type MacroTotals,
  type OnboardingSession,
  type Profile,
} from "@/lib/api";
import type { ProfileUpdate } from "@/lib/api/endpoints/profile";
import {
  activityFromWire,
  activityToWire,
  isGoalKey,
  normalizeSurgicalContext,
  type ActivityKey,
  type GoalKey,
  type SurgicalContext,
} from "@/lib/nutrition";
import { getOrCreateOnboardingSession } from "./onboarding";
import { invalidate, useCached } from "./resource";
import { useAppSession } from "./session";

export interface UserProfile {
  source: "account" | "guest";
  email: string | null;
  firstName: string;
  lastName: string;
  /** Display name: displayName, else "First Last", else "". */
  name: string;
  goal: GoalKey | null;
  age: number | null;
  /** YYYY-MM-DD */
  dateOfBirth: string | null;
  heightCm: number | null;
  weightKg: number | null;
  sex: string | null;
  activityLevel: ActivityKey | null;
  surgicalContext: SurgicalContext | null;
  dietaryPreferences: string[];
  allergies: string[];
  unitsPreference: string | null;
  /** True when the user prefers imperial (default). */
  isImperial: boolean;
  /** Server-computed daily targets (account only). */
  targets: MacroTotals | null;
  notifications: Profile["preferences"]["notifications"] | null;
  privacy: Profile["preferences"]["privacy"] | null;
  onboardingComplete: boolean;
}

const isImperial = (u: string | null) => !u || !/^m/i.test(u);

function fromAccount(p: Profile): UserProfile {
  const first = p.givenName ?? "";
  const last = p.familyName ?? "";
  return {
    source: "account",
    email: p.email,
    firstName: first,
    lastName: last,
    name: p.displayName ?? ([first, last].filter(Boolean).join(" ") || ""),
    goal: isGoalKey(p.goal) ? p.goal : null,
    age: p.age,
    dateOfBirth: p.dateOfBirth,
    heightCm: p.heightCm,
    weightKg: p.weightKg,
    sex: p.sex,
    activityLevel: activityFromWire(p.activityLevel),
    surgicalContext: normalizeSurgicalContext(p.surgicalContext),
    dietaryPreferences: p.dietaryPreferences ?? [],
    allergies: p.allergies ?? [],
    unitsPreference: p.unitsPreference,
    isImperial: isImperial(p.unitsPreference),
    targets: p.preferences?.nutritionTargets ?? null,
    notifications: p.preferences?.notifications ?? null,
    privacy: p.preferences?.privacy ?? null,
    onboardingComplete: Boolean(p.goal && p.heightCm && p.weightKg),
  };
}

function fromGuest(s: OnboardingSession): UserProfile {
  return {
    source: "guest",
    email: null,
    firstName: "",
    lastName: "",
    name: "",
    goal: isGoalKey(s.goal) ? s.goal : null,
    age: s.age,
    dateOfBirth: s.dateOfBirth,
    heightCm: s.heightCm,
    weightKg: s.weightKg,
    sex: s.sex,
    activityLevel: activityFromWire(s.activityLevel),
    surgicalContext: normalizeSurgicalContext(s.surgicalContext),
    dietaryPreferences: [],
    allergies: [],
    unitsPreference: s.unitsPreference,
    isImperial: isImperial(s.unitsPreference),
    targets: null,
    notifications: null,
    privacy: null,
    onboardingComplete: s.isCompleted,
  };
}

export interface UseProfile {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /**
   * Update profile fields. Accounts PATCH /api/profile/me; guests PATCH the
   * onboarding session (only goal/age/height/weight/units/sex/activity/surgery apply).
   */
  update: (patch: ProfileUpdate) => Promise<void>;
}

export function useProfile(): UseProfile {
  const session = useAppSession();
  const account = useCached<Profile>(session.isSignedIn ? "profile:account" : null, () =>
    profileApi.getProfile(),
  );
  const guest = useCached<OnboardingSession>(session.isGuest ? "profile:guest" : null, () =>
    getOrCreateOnboardingSession(),
  );

  const profile = useMemo(
    () =>
      session.isSignedIn
        ? account.data
          ? fromAccount(account.data)
          : null
        : session.isGuest
          ? guest.data
            ? fromGuest(guest.data)
            : null
          : null,
    [session.isSignedIn, session.isGuest, account.data, guest.data],
  );

  const { mutate: mutateAccount } = account;
  const { data: guestData, mutate: mutateGuest } = guest;
  const isSignedIn = session.isSignedIn;
  const update = useCallback(
    async (patch: ProfileUpdate) => {
      // Activity level goes over the wire as snake_case.
      const wire: ProfileUpdate = {
        ...patch,
        activityLevel: patch.activityLevel
          ? (activityFromWire(patch.activityLevel)
              ? activityToWire(activityFromWire(patch.activityLevel)!)
              : patch.activityLevel)
          : patch.activityLevel,
      };
      if (isSignedIn) {
        const next = await profileApi.updateProfile(wire);
        mutateAccount(next);
        invalidate("tracking");
      } else if (guestData) {
        const next = await onboardingApi.updateOnboardingSession(guestData.sessionId, {
          goal: patch.goal,
          dateOfBirth: patch.dateOfBirth,
          age: patch.age,
          heightCm: patch.heightCm,
          weightKg: patch.weightKg,
          unitsPreference: patch.unitsPreference,
          sex: patch.sex,
          surgicalContext: patch.surgicalContext,
          activityLevel: wire.activityLevel,
        });
        mutateGuest(next);
      }
    },
    [isSignedIn, guestData, mutateAccount, mutateGuest],
  );

  const active = session.isSignedIn ? account : guest;
  return {
    profile,
    isLoading: session.ready ? active.isLoading : true,
    error: active.error,
    refresh: active.refresh,
    update,
  };
}

/** First name for greetings, or null. */
export const firstNameOf = (p: UserProfile | null) =>
  p?.firstName.trim() || p?.name.split(" ")[0] || null;
