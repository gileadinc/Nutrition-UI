import { apiClient } from "../client";
import type { DailySummary, MacroTotals, MealType, NutritionEntry, Paginated } from "../models";
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

export interface Momentum {
  points: number;
  currentStreak: number;
  longestStreak: number;
  daysLogged: number;
  scoring: { pointsPerEntry: number; dailyConsistencyBonus: number };
}

export function getMomentum(date?: string): Promise<Momentum> {
  return apiClient.get<Momentum>(`/api/tracking/me/momentum${toQuery({ date })}`, {
    headers: authHeader(),
  });
}

type Macros = Pick<MacroTotals, "calories" | "protein" | "carbs" | "fat">;

/** A meal that fits today's remaining macros, best match first. */
export interface MealRecommendation extends Macros {
  id: string;
  title: string;
  description?: string | null;
  prepTimeMinutes?: number | null;
  servings?: number | null;
  goalTags?: string[];
  category?: string | null;
  imageUrl?: string | null;
  ingredients?: string[];
  steps?: string[];
  matchScore: number;
}

export interface MealRecommendations {
  date: string;
  remaining: Macros;
  items: MealRecommendation[];
}

export function getTrackingRecommendations(
  date?: string,
  limit?: number,
): Promise<MealRecommendations> {
  return apiClient.get<MealRecommendations>(
    `/api/tracking/me/recommendations${toQuery({ date, limit })}`,
    { headers: authHeader() },
  );
}

export function getSnapshot(date?: string): Promise<unknown> {
  return apiClient.get<unknown>(`/api/tracking/me/snapshot${toQuery({ date })}`, {
    headers: authHeader(),
  });
}

export interface FirstTimeState {
  isFirstTime: boolean;
  guidanceCompleted: boolean;
  /** e.g. "log_meal", "log_water", "set_goal". */
  suggestedActions: string[];
}

export function getFirstTimeState(): Promise<FirstTimeState> {
  return apiClient.get<FirstTimeState>("/api/tracking/me/first-time", { headers: authHeader() });
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
