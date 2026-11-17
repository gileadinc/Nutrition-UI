import { apiClient } from "../client";
import { authHeader } from "@/lib/auth";
import type {
  NutritionEntry,
  MedicationReminders,
  MedicationSchedule,
  MedicationScheduleInput,
  Paginated,
} from "../models";
import { toQuery, type ListParams } from "./query";

const base = "/api/medication-schedules/me";
const one = (id: string) => `${base}/${encodeURIComponent(id)}`;
const opts = () => ({ headers: authHeader() });

export function createMedicationSchedule(
  input: MedicationScheduleInput,
): Promise<MedicationSchedule> {
  return apiClient.post<MedicationSchedule>(base, input, opts());
}

export function listMedicationSchedules(
  params?: ListParams & { isActive?: boolean },
): Promise<Paginated<MedicationSchedule>> {
  return apiClient.get<Paginated<MedicationSchedule>>(`${base}${toQuery(params)}`, opts());
}

export function getMedicationSchedule(scheduleId: string): Promise<MedicationSchedule> {
  return apiClient.get<MedicationSchedule>(one(scheduleId), opts());
}

/** Also pauses/resumes (`isActive`) and edits reminder settings. */
export function updateMedicationSchedule(
  scheduleId: string,
  patch: Partial<MedicationScheduleInput>,
): Promise<MedicationSchedule> {
  return apiClient.patch<MedicationSchedule>(one(scheduleId), patch, opts());
}

export function deleteMedicationSchedule(scheduleId: string): Promise<null> {
  return apiClient.delete<null>(one(scheduleId), opts());
}

/** Scheduled doses for a day (default today) with status taken / pending / missed. */
export function getMedicationReminders(date?: string): Promise<MedicationReminders> {
  return apiClient.get<MedicationReminders>(`${base}/reminders${toQuery({ date })}`, opts());
}

/** Marks a dose taken; creates a tracking entry (sourceType "medication"). Delete that entry to undo. */
export function logMedicationDose(
  scheduleId: string,
  input?: { takenAt?: string; notes?: string },
): Promise<NutritionEntry> {
  return apiClient.post<NutritionEntry>(`${one(scheduleId)}/doses`, input ?? {}, opts());
}
