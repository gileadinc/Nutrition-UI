import { apiClient } from "../client";
import { authHeader } from "@/lib/auth";
import type { AppNotification, Preferences, Profile } from "../models";

export interface ProfileUpdate {
  displayName?: string;
  givenName?: string;
  familyName?: string;
  dateOfBirth?: string;
  sex?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  goal?: string;
  unitsPreference?: string;
  activityLevel?: string;
  surgicalContext?: string;
  dietaryPreferences?: string[];
  allergies?: string[];
}

export function getProfile(): Promise<Profile> {
  return apiClient.get<Profile>("/api/profile/me", { headers: authHeader() });
}

export function updateProfile(update: ProfileUpdate): Promise<Profile> {
  return apiClient.patch<Profile>("/api/profile/me", update, { headers: authHeader() });
}

export function deleteAccount(): Promise<null> {
  return apiClient.delete<null>("/api/profile/me", { headers: authHeader() });
}

export function getPreferences(): Promise<Preferences> {
  return apiClient.get<Preferences>("/api/profile/me/preferences", { headers: authHeader() });
}

export function updatePreferences(update: Partial<Preferences>): Promise<Preferences> {
  return apiClient.patch<Preferences>("/api/profile/me/preferences", update, {
    headers: authHeader(),
  });
}

export function listNotifications(): Promise<AppNotification[] | { items: AppNotification[] }> {
  return apiClient.get<AppNotification[] | { items: AppNotification[] }>(
    "/api/profile/me/notifications",
    { headers: authHeader() },
  );
}

export function markAllNotificationsRead(): Promise<unknown> {
  return apiClient.patch<unknown>("/api/profile/me/notifications/read-all", undefined, {
    headers: authHeader(),
  });
}

export function markNotificationRead(notificationId: string): Promise<unknown> {
  return apiClient.patch<unknown>(
    `/api/profile/me/notifications/${encodeURIComponent(notificationId)}/read`,
    undefined,
    { headers: authHeader() },
  );
}

export function deleteNotification(notificationId: string): Promise<unknown> {
  return apiClient.delete<unknown>(
    `/api/profile/me/notifications/${encodeURIComponent(notificationId)}`,
    { headers: authHeader() },
  );
}

export function exportData(): Promise<unknown> {
  return apiClient.get<unknown>("/api/profile/me/export", { headers: authHeader() });
}

export function resetDemo(): Promise<unknown> {
  return apiClient.post<unknown>("/api/profile/me/reset-demo", undefined, {
    headers: authHeader(),
  });
}

/** Free-form guidance flags, e.g. `{ quickTourCompleted: true }`. Empty until something is saved. */
export type ExperienceState = Record<string, unknown>;

export function getExperienceState(): Promise<ExperienceState> {
  return apiClient.get<ExperienceState>("/api/profile/me/experience-state", {
    headers: authHeader(),
  });
}

export function updateExperienceState(update: ExperienceState): Promise<ExperienceState> {
  return apiClient.patch<ExperienceState>("/api/profile/me/experience-state", update, {
    headers: authHeader(),
  });
}

/** Where the user is in cook mode, so it can resume after a refresh or on another device. */
export interface CookingState {
  recipeId: string | null;
  currentStep: number;
  timerSecondsRemaining: number | null;
  completed: boolean;
}

export interface CookingStateUpdate {
  recipeId: string;
  currentStep: number;
  timerSecondsRemaining?: number;
  completed: boolean;
}

export function getCookingState(): Promise<CookingState> {
  return apiClient.get<CookingState>("/api/profile/me/cooking-state", { headers: authHeader() });
}

export function updateCookingState(update: CookingStateUpdate): Promise<CookingState> {
  return apiClient.patch<CookingState>("/api/profile/me/cooking-state", update, {
    headers: authHeader(),
  });
}
