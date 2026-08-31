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

export function getExperienceState(): Promise<unknown> {
  return apiClient.get<unknown>("/api/profile/me/experience-state", { headers: authHeader() });
}

export function updateExperienceState(update: Record<string, unknown>): Promise<unknown> {
  return apiClient.patch<unknown>("/api/profile/me/experience-state", update, {
    headers: authHeader(),
  });
}
