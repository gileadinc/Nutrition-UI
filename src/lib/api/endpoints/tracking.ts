import { apiClient } from "../client";
import type { DailySummary, MealType, NutritionEntry, Paginated } from "../models";
import { authHeader } from "@/lib/auth";
import { toQuery, type ListParams } from "./query";

export interface EntryInput {
  mealType: MealType;
  loggedAt?: string;
  sourceType?: string;
  sourceItemId?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  waterMl?: number;
  notes?: string;
  /** Guest entries only. */
  sessionId?: string;
}

export interface EntryListParams extends ListParams {
  mealType?: MealType;
  sourceType?: string;
}

/* ---- Authenticated ---- */

export function createEntry(input: EntryInput): Promise<NutritionEntry> {
  return apiClient.post<NutritionEntry>("/api/tracking/me/entries", input, {
    headers: authHeader(),
  });
}

export function listEntries(params?: EntryListParams): Promise<Paginated<NutritionEntry>> {
  return apiClient.get<Paginated<NutritionEntry>>(`/api/tracking/me/entries${toQuery(params)}`, {
    headers: authHeader(),
  });
}

export function updateEntry(entryId: string, input: Partial<EntryInput>): Promise<NutritionEntry> {
  return apiClient.patch<NutritionEntry>(
    `/api/tracking/me/entries/${encodeURIComponent(entryId)}`,
    input,
    { headers: authHeader() },
  );
}

export function deleteEntry(entryId: string): Promise<null> {
  return apiClient.delete<null>(`/api/tracking/me/entries/${encodeURIComponent(entryId)}`, {
    headers: authHeader(),
  });
}

export function getDailySummary(date?: string): Promise<DailySummary> {
  return apiClient.get<DailySummary>(`/api/tracking/me/daily-summary${toQuery({ date })}`, {
    headers: authHeader(),
  });
}

export function getMomentum(date?: string): Promise<unknown> {
  return apiClient.get<unknown>(`/api/tracking/me/momentum${toQuery({ date })}`, {
    headers: authHeader(),
  });
}

export function getTrackingRecommendations(date?: string): Promise<unknown> {
  return apiClient.get<unknown>(`/api/tracking/me/recommendations${toQuery({ date })}`, {
    headers: authHeader(),
  });
}

export function getSnapshot(date?: string): Promise<unknown> {
  return apiClient.get<unknown>(`/api/tracking/me/snapshot${toQuery({ date })}`, {
    headers: authHeader(),
  });
}

export function getFirstTimeState(): Promise<unknown> {
  return apiClient.get<unknown>("/api/tracking/me/first-time", { headers: authHeader() });
}

/* ---- Guest ---- */

export function createGuestEntry(
  input: EntryInput & { sessionId: string },
): Promise<NutritionEntry> {
  return apiClient.post<NutritionEntry>("/api/tracking/guest/entries", input);
}

export function listGuestEntries(
  sessionId: string,
  params?: EntryListParams,
): Promise<Paginated<NutritionEntry>> {
  return apiClient.get<Paginated<NutritionEntry>>(
    `/api/tracking/guest/entries/${encodeURIComponent(sessionId)}${toQuery(params)}`,
  );
}

export function updateGuestEntry(
  sessionId: string,
  entryId: string,
  input: Partial<EntryInput>,
): Promise<NutritionEntry> {
  return apiClient.patch<NutritionEntry>(
    `/api/tracking/guest/entries/${encodeURIComponent(sessionId)}/${encodeURIComponent(entryId)}`,
    input,
  );
}

export function deleteGuestEntry(sessionId: string, entryId: string): Promise<null> {
  return apiClient.delete<null>(
    `/api/tracking/guest/entries/${encodeURIComponent(sessionId)}/${encodeURIComponent(entryId)}`,
  );
}
