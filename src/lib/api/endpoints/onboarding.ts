import { apiClient } from "../client";
import { authHeader } from "@/lib/auth";
import type { OnboardingSession } from "../models";

export interface CreateOnboardingSessionInput {
  /** Guest session id to resume onboarding started as a guest. */
  sessionId?: string;
}

export function createOnboardingSession(
  input: CreateOnboardingSessionInput = {},
): Promise<OnboardingSession> {
  return apiClient.post<OnboardingSession>("/api/onboarding/sessions", input, {
    headers: authHeader(),
  });
}

export function getOnboardingSession(sessionId: string): Promise<OnboardingSession> {
  return apiClient.get<OnboardingSession>(
    `/api/onboarding/sessions/${encodeURIComponent(sessionId)}`,
    { headers: authHeader() },
  );
}

export interface OnboardingSessionUpdate {
  currentStep?: number;
  goal?: string;
  dateOfBirth?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  unitsPreference?: string;
  sex?: string;
  surgicalContext?: string;
  activityLevel?: string;
  completedSteps?: number[];
  isCompleted?: boolean;
}

export function updateOnboardingSession(
  sessionId: string,
  update: OnboardingSessionUpdate,
): Promise<OnboardingSession> {
  return apiClient.patch<OnboardingSession>(
    `/api/onboarding/sessions/${encodeURIComponent(sessionId)}`,
    update,
    { headers: authHeader() },
  );
}
