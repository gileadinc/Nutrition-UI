"use client";

import { useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/Icon";
import { PrimaryButton } from "@/components/Button";
import { TodayPanel, TrackLogLayout } from "@/components/Track/LogParts";
import { useBack, useNavigate } from "@/lib/nav";
import { getErrorMessage } from "@/lib/api";
import { kgToLb, lbToKg } from "@/lib/nutrition";
import { toast, useProfile, useRequireAccount, useWeight } from "@/lib/store";

const noopSub = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    noopSub,
    () => true,
    () => false,
  );

const shortDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const change = (delta: number) =>
  Math.abs(delta) < 0.05 ? "Unchanged" : `${delta < 0 ? "Down" : "Up"} ${Math.abs(delta).toFixed(1)} lb`;

export function LogWeightScreen() {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return <WeightForm />;
}

function WeightForm() {
  const back = useBack("/track");
  const navigate = useNavigate();
  const requireAccount = useRequireAccount();
  const { readings, todayReading, previous, setToday } = useWeight();
  const { profile, update } = useProfile();
  // The backend keeps only the current weight (profile.weightKg); readings history is kept on this device.
  const profilePounds = profile?.weightKg ? Math.round(kgToLb(profile.weightKg) * 10) / 10 : null;
  const start = todayReading?.pounds ?? previous?.pounds ?? profilePounds;
  const [value, setValue] = useState(start ? start.toFixed(1) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const n = Number(value);
  // The backend rejects anything under 20 kg.
  const valid = value.trim() !== "" && Number.isFinite(n) && lbToKg(n) >= 20 && n <= 900;

  const nudge = (d: number) => {
    setValue(Math.max(0, Math.round(((valid ? n : 0) + d) * 10) / 10).toFixed(1));
    setError(undefined);
  };

  const save = async () => {
    if (!valid) {
      setError("Enter a weight between 45 and 900 lb.");
      return;
    }
    if (!requireAccount("Tracking")) return;
    const pounds = Math.round(n * 10) / 10;
    const before = todayReading?.pounds ?? null;
    setSaving(true);
    try {
      await update({ weightKg: Math.round(lbToKg(pounds) * 10) / 10 });
    } catch (err) {
      toast.error("Couldn't save your weight", { body: getErrorMessage(err) });
      setSaving(false);
      return;
    }
    setSaving(false);
    setToday(pounds);
    toast.success(`Weighed in at ${pounds.toFixed(1)} lb`, {
      body: previous
        ? `${change(pounds - previous.pounds)} since ${shortDay(previous.date)}.`
        : "First weigh-in on record. The trend starts here.",
      action: {
        label: "Undo",
        run: () => {
          setToday(before);
          if (before !== null)
            void update({ weightKg: Math.round(lbToKg(before) * 10) / 10 }).catch(() => undefined);
        },
      },
      link: { label: "View in Track", href: "/track", run: () => navigate("/track") },
    });
    back();
  };

  const delta = valid && previous ? n - previous.pounds : null;
  const recent = readings.slice(0, 7);
  return (
    <TrackLogLayout
      title="Weigh-in"
      subtitle="One reading a day is plenty."
      asideLabel="Recent readings"
      aside={
        <TodayPanel
          title="Recent readings"
          empty="No readings yet."
          rows={recent.map((r, i) => {
            const prev = readings[i + 1];
            return {
              id: r.date,
              title: `${r.pounds.toFixed(1)} lb`,
              meta:
                (r.date === todayReading?.date ? "Today" : shortDay(r.date)) +
                (prev ? ` · ${change(r.pounds - prev.pounds).toLowerCase()}` : ""),
            };
          })}
        />
      }
    >
      <form
        className="panel flex flex-col items-center p-5 md:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <p className="text-[13px] type-meta text-text-secondary">
          {todayReading ? `Today: ${todayReading.pounds.toFixed(1)} lb` : "Nothing recorded today"}
        </p>
        <div className="mt-4 flex w-full max-w-sm items-end gap-3">
          <button
            type="button"
            aria-label="Decrease by 0.1 lb"
            onClick={() => nudge(-0.1)}
            className="mb-1 flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-warm-gray"
          >
            <Icon name="minusSign" size={20} color="var(--color-text-primary)" />
          </button>
          <label className="min-w-0 flex-1 text-center">
            <span className="text-sm type-item-title text-text-primary">Weight (lb)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={value}
              aria-invalid={error ? true : undefined}
              onChange={(e) => {
                setValue(e.target.value);
                setError(undefined);
              }}
              className="mt-1 h-16 w-full rounded-xl border border-border-default bg-white text-center text-[32px] type-numeral tabular-nums tracking-[-1px] text-brand-navy"
            />
          </label>
          <button
            type="button"
            aria-label="Increase by 0.1 lb"
            onClick={() => nudge(0.1)}
            className="mb-1 flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-warm-gray"
          >
            <Icon name="plusSign" size={20} color="var(--color-text-primary)" />
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs type-meta text-error-red">
            {error}
          </p>
        )}
        <p className="mt-3 min-h-5 text-[13px] type-meta text-text-secondary" aria-live="polite">
          {previous
            ? delta === null
              ? `Last reading ${previous.pounds.toFixed(1)} lb on ${shortDay(previous.date)}`
              : `${change(delta)} since ${shortDay(previous.date)} (${previous.pounds.toFixed(1)} lb)`
            : "Your first reading starts the trend."}
        </p>
        <div className="mt-5 w-full">
          <PrimaryButton type="submit" label={saving ? "Saving…" : "Save weigh-in"} disabled={saving} />
        </div>
      </form>
    </TrackLogLayout>
  );
}
