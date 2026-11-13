"use client";

/**
 * Medication, backed by `/api/medication-schedules/me*`. A medication is a daily schedule
 * (one time of day); today's doses and per-day history come from the reminders endpoint, and
 * "taken" is `POST .../{scheduleId}/doses` (which also creates a tracking entry). Signed in only;
 * guests read nothing.
 *
 * Not supported by the API: snoozing a dose. Undo ("untake") deletes the tracking entry the dose
 * created (`DELETE /api/tracking/me/entries/{takenEntryId}`).
 */

import { useCallback, useMemo } from "react";
import {
  getErrorMessage,
  medicationApi,
  trackingApi,
  type MedicationDose,
  type MedicationSchedule,
} from "@/lib/api";
import { isoDate } from "@/lib/nutrition";
import { invalidate, useCached } from "./resource";
import { useAppSession } from "./session";
import { toast } from "./toast";

/** A medication as it stands on a given day. */
export interface Medication {
  /** Schedule id. */
  id: string;
  name: string;
  dose: string;
  /** Scheduled time of day, e.g. "9:00 PM". */
  time: string;
  taken: boolean;
  loggedAt: string | null;
  /** Tracking entry created when the dose was taken (used to undo). */
  entryId?: string | null;
}

export type DoseStatus = "Logged" | "Missed" | "Due";

/** A schedule as the reminders settings screen needs it. */
export interface MedicationReminderSetting {
  id: string;
  name: string;
  time: string;
  enabled: boolean;
}

const SCHEDULES = "medication:schedules";
const dayKey = (date: string) => `medication:day:${date}`;
const HISTORY_DAYS = 14;
const TIME_12H = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

/** "9:00 PM" -> minutes since midnight (unparseable sorts last). */
export function timeToMinutes(t: string): number {
  const m = TIME_12H.exec(t.trim());
  if (!m) return 24 * 60;
  return ((Number(m[1]) % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0)) * 60 + Number(m[2]);
}

/** Adds minutes to a "9:00 PM" style time (wraps past midnight). */
export function addMinutes(t: string, delta: number): string {
  if (!TIME_12H.test(t.trim())) return t;
  const total = (timeToMinutes(t) + delta + 1440) % 1440;
  const h = Math.floor(total / 60);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(total % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** "9:00 PM" -> "21:00" (what the API wants). */
function to24h(t: string): string {
  const mins = timeToMinutes(t);
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

/** "21:00" -> "9:00 PM". */
function from24h(t: string): string {
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return t;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function doseStatus(m: Pick<Medication, "taken" | "time">, now = new Date()): DoseStatus {
  if (m.taken) return "Logged";
  return timeToMinutes(m.time) < now.getHours() * 60 + now.getMinutes() ? "Missed" : "Due";
}

const toMedication = (d: MedicationDose): Medication => ({
  id: d.scheduleId,
  name: d.name,
  dose: d.dosage ?? "",
  time: from24h(d.time),
  taken: d.status === "taken",
  loggedAt: d.takenAt,
  entryId: d.takenEntryId,
});

const byTime = (a: Medication, b: Medication) => timeToMinutes(a.time) - timeToMinutes(b.time);

const fetchSchedules = async () =>
  (await medicationApi.listMedicationSchedules({ limit: 100 })).items;

const fetchDay = async (date: string): Promise<Medication[]> =>
  (await medicationApi.getMedicationReminders(date)).doses.map(toMedication).sort(byTime);

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return isoDate(new Date(y, m - 1, d + n));
};

/** Entry ids by schedule id for today's taken doses (so Undo works from a stale closure). */
const entryIds = new Map<string, string>();

export function useMedications(opts?: { history?: boolean }) {
  const { isSignedIn } = useAppSession();
  const date = isoDate(new Date());

  const schedulesRes = useCached<MedicationSchedule[]>(isSignedIn ? SCHEDULES : null, fetchSchedules);
  const dayRes = useCached<Medication[]>(isSignedIn ? dayKey(date) : null, () => fetchDay(date));
  const meds = dayRes.data ?? [];
  const schedules = schedulesRes.data;

  // History: every day from the first schedule (at most two weeks back) up to today.
  const start = useMemo(() => {
    if (!schedules?.length) return null;
    const first = schedules.reduce((a, s) => (s.startDate < a ? s.startDate : a), date);
    const floor = addDays(date, -(HISTORY_DAYS - 1));
    return first > floor ? first : floor;
  }, [schedules, date]);
  const historyRes = useCached<{ date: string; meds: Medication[] }[]>(
    isSignedIn && opts?.history && start ? `medication:history:${start}:${date}` : null,
    async () => {
      const days: string[] = [];
      for (let d = start!; d <= date; d = addDays(d, 1)) days.push(d);
      const all = await Promise.all(days.map(async (d) => ({ date: d, meds: await fetchDay(d) })));
      return all.filter((d) => d.meds.length).reverse();
    },
  );
  const history = historyRes.data ?? [];

  for (const m of meds) if (m.taken && m.entryId) entryIds.set(m.id, m.entryId);

  const refreshAll = useCallback(() => {
    invalidate("medication:");
  }, []);

  const fail = useCallback(
    (title: string, err: unknown) => {
      toast.error(title, { body: getErrorMessage(err) });
      refreshAll();
    },
    [refreshAll],
  );

  const add = useCallback(
    async (input: { name: string; dose: string; time: string }): Promise<string | null> => {
      try {
        const created = await medicationApi.createMedicationSchedule({
          name: input.name,
          dosage: input.dose,
          frequency: "daily",
          timesOfDay: [to24h(input.time)],
          startDate: isoDate(new Date()),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        });
        refreshAll();
        return created.scheduleId;
      } catch (err) {
        toast.error("Couldn't add the medication", { body: getErrorMessage(err) });
        return null;
      }
    },
    [refreshAll],
  );

  const update = useCallback(
    async (id: string, input: { name: string; dose: string; time: string }): Promise<boolean> => {
      try {
        await medicationApi.updateMedicationSchedule(id, {
          name: input.name,
          dosage: input.dose,
          timesOfDay: [to24h(input.time)],
        });
        refreshAll();
        return true;
      } catch (err) {
        toast.error("Couldn't save the medication", { body: getErrorMessage(err) });
        return false;
      }
    },
    [refreshAll],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      dayRes.mutate((prev) => (prev ?? []).filter((m) => m.id !== id));
      try {
        await medicationApi.deleteMedicationSchedule(id);
        refreshAll();
        return true;
      } catch (err) {
        fail("Couldn't delete the medication", err);
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dayRes.mutate is stable per key
    [refreshAll, fail, dayRes.mutate],
  );

  const take = useCallback(
    async (id: string): Promise<boolean> => {
      const now = new Date().toISOString();
      dayRes.mutate((prev) =>
        (prev ?? []).map((m) => (m.id === id && !m.taken ? { ...m, taken: true, loggedAt: now } : m)),
      );
      try {
        const entry = await medicationApi.logMedicationDose(id);
        entryIds.set(id, entry.entryId);
        refreshAll();
        invalidate("tracking");
        return true;
      } catch (err) {
        fail("Couldn't log the dose", err);
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshAll, fail, dayRes.mutate],
  );

  const untake = useCallback(
    async (id: string): Promise<boolean> => {
      const entryId = entryIds.get(id);
      dayRes.mutate((prev) =>
        (prev ?? []).map((m) => (m.id === id ? { ...m, taken: false, loggedAt: null, entryId: null } : m)),
      );
      if (!entryId) {
        refreshAll();
        return false;
      }
      try {
        await trackingApi.deleteEntry(entryId);
        entryIds.delete(id);
        refreshAll();
        invalidate("tracking");
        return true;
      } catch (err) {
        fail("Couldn't undo the dose", err);
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshAll, fail, dayRes.mutate],
  );

  /** Reminder settings for every active schedule. */
  const reminders = useMemo<MedicationReminderSetting[]>(
    () =>
      (schedules ?? [])
        .filter((s) => s.isActive)
        .map((s) => ({
          id: s.scheduleId,
          name: s.name,
          time: s.timesOfDay[0] ? from24h(s.timesOfDay[0]) : "",
          enabled: s.remindersEnabled,
        })),
    [schedules],
  );

  const setReminder = useCallback(
    async (id: string, enabled: boolean): Promise<boolean> => {
      schedulesRes.mutate((prev) =>
        (prev ?? []).map((s) => (s.scheduleId === id ? { ...s, remindersEnabled: enabled } : s)),
      );
      try {
        await medicationApi.updateMedicationSchedule(id, { remindersEnabled: enabled });
        return true;
      } catch (err) {
        fail("Couldn't update the reminder", err);
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fail, schedulesRes.mutate],
  );

  return {
    meds,
    history,
    /** False until the first response for today's doses (always false-free for guests). */
    isLoading: isSignedIn && (dayRes.isLoading || (!!opts?.history && historyRes.isLoading)),
    reminders,
    add,
    update,
    remove,
    take,
    untake,
    setReminder,
  };
}
