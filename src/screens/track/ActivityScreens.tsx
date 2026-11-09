"use client";

import { useState, useSyncExternalStore } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { PageContainer } from "@/components/Layout";
import { PrimaryButton } from "@/components/Button";
import { AppTextField } from "@/components/TextField";
import { AdvancedFilters, FacetGroup } from "@/components/Filters";
import {
  LogSectionTitle,
  ProgressCard,
  QuickList,
  TodayPanel,
  TrackLogLayout,
} from "@/components/Track/LogParts";
import { Link, useBack, useNavigate } from "@/lib/nav";
import { useFilterParams } from "@/lib/hooks";
import { isoDate } from "@/lib/nutrition";
import { toast, useActivity, useRequireAccount } from "@/lib/store";

const noopSub = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    noopSub,
    () => true,
    () => false,
  );

const PRESETS = [
  { name: "Strength workout", minutes: 32, calories: 190 },
  { name: "Brisk walk", minutes: 24, calories: 125 },
  { name: "Evening walk", minutes: 26, calories: 133 },
  { name: "Easy run", minutes: 20, calories: 190 },
  { name: "Cycling", minutes: 30, calories: 240 },
  { name: "Yoga", minutes: 30, calories: 110 },
];

const iconFor = (name: string): IconName => {
  const t = name.toLowerCase();
  return t.includes("walk")
    ? "walking"
    : t.includes("run")
      ? "runningShoes"
      : t.includes("cycl") || t.includes("bike")
        ? "bicycle"
        : t.includes("strength") || t.includes("weight") || t.includes("gym")
          ? "dumbbell"
          : "activity";
};

const whole = (s: string, max: number) => {
  const n = Number(s.trim());
  return !Number.isFinite(n) || !Number.isInteger(n) || n <= 0 || n > max ? null : n;
};

function useLogActivity() {
  const requireAccount = useRequireAccount();
  const navigate = useNavigate();
  const { add, remove } = useActivity();
  return (input: { name: string; minutes: number; calories: number }) => {
    if (!requireAccount("Tracking")) return false;
    const entry = add(input);
    toast.success(`${input.name} logged`, {
      body: `${input.minutes} min · ${input.calories} kcal`,
      action: { label: "Undo", run: () => remove(entry.id) },
      link: { label: "View in Track", href: "/track", run: () => navigate("/track") },
    });
    return true;
  };
}

function TodayActivityPanel() {
  const hydrated = useHydrated();
  const { todayEntries, todayMinutes, remove, add } = useActivity();
  const requireAccount = useRequireAccount();
  const list = hydrated ? todayEntries : [];
  return (
    <TodayPanel
      title="Today's activity"
      total={list.length ? `${todayMinutes} min` : undefined}
      empty="Nothing logged yet today."
      rows={list.map((e) => ({
        id: e.id,
        title: e.name,
        at: e.loggedAt,
        meta: `${e.minutes} min · ${e.calories} kcal`,
        onRemove: () => {
          if (!requireAccount("Tracking")) return;
          remove(e.id);
          toast.success(`${e.name} removed`, {
            action: {
              label: "Undo",
              run: () => add({ name: e.name, minutes: e.minutes, calories: e.calories }, new Date(e.loggedAt)),
            },
          });
        },
      }))}
      footer={
        <Link to="/track/activity/history" className="tap-24 text-[17px] type-button text-primary">
          Activity history
        </Link>
      }
    />
  );
}

/* ------------------------------------------------------------ Picker */

export function LogActivityPickerScreen() {
  const hydrated = useHydrated();
  const { todayMinutes, todayCalories, goalMinutes, recents } = useActivity();
  const log = useLogActivity();
  const recent = hydrated ? recents : [];
  const seen = new Set(recent.map((r) => r.name.trim().toLowerCase()));
  const items = [
    ...recent.map((r) => ({ name: r.name, minutes: r.minutes, calories: r.calories, recent: true })),
    ...PRESETS.filter((p) => !seen.has(p.name.toLowerCase())).map((p) => ({ ...p, recent: false })),
  ];
  const minutes = hydrated ? todayMinutes : 0;
  const kcal = hydrated ? todayCalories : 0;
  return (
    <TrackLogLayout
      title="Log activity"
      subtitle="Tap to log. Undo is in the notification."
      asideLabel="Today's activity"
      aside={<TodayActivityPanel />}
    >
      <ProgressCard
        label="Active minutes today"
        value={minutes}
        goal={goalMinutes}
        unit="min"
        color="var(--color-brand-navy)"
        extra={kcal > 0 ? `${kcal} kcal burned` : undefined}
      />
      <section className="mt-6" aria-label="Quick add">
        <LogSectionTitle>Quick add</LogSectionTitle>
        <QuickList
          label="Activities"
          items={items.map((e) => ({
            key: e.name,
            title: e.name,
            tag: e.recent ? "Recent" : undefined,
            icon: iconFor(e.name),
            meta: `${e.minutes} min · ${e.calories} kcal`,
            onAdd: () => void log({ name: e.name, minutes: e.minutes, calories: e.calories }),
          }))}
        />
        <Link
          to="/track/activity/custom"
          className="mt-3 flex h-12 items-center justify-center gap-2 rounded-full border border-dashed border-border-default bg-white text-[17px] type-button-secondary text-text-primary transition-colors hover:border-text-neutral-400"
        >
          <Icon name="pencilEdit" size={15} color="var(--color-text-primary)" />
          Something else? Enter it yourself
        </Link>
      </section>
    </TrackLogLayout>
  );
}

/* ------------------------------------------------------------ Custom */

const MIN = 5;
const MAX = 120;

export function LogActivityScreen() {
  const back = useBack("/track");
  const log = useLogActivity();
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState("");
  const [calories, setCalories] = useState("");
  const [errors, setErrors] = useState<{ title?: string; minutes?: string; calories?: string }>({});
  const mins = whole(minutes, 600);
  const estimate = mins === null ? null : Math.round(mins * 6);

  const submit = () => {
    const kcal = whole(calories, 3000);
    const e = {
      title: name.trim() ? undefined : "Name the activity.",
      minutes: mins === null ? "Enter minutes between 1 and 600." : undefined,
      calories: kcal === null ? "Enter calories between 1 and 3000." : undefined,
    };
    setErrors(e);
    if (Object.values(e).some(Boolean) || mins === null || kcal === null) return;
    if (log({ name: name.trim(), minutes: mins, calories: kcal })) back();
  };

  return (
    <TrackLogLayout
      title="Custom activity"
      subtitle="What you did and for how long."
      asideLabel="Today's activity"
      aside={<TodayActivityPanel />}
    >
      <form
        className="panel flex flex-col gap-5 p-4 md:p-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <AppTextField label="What did you do?" value={name} error={errors.title} onChange={setName} />
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[17px] type-item-title text-text-primary">Duration</p>
            <span className="flex items-baseline gap-1">
              <span className="text-[32px] leading-none type-numeral tabular-nums tracking-[-1px] text-brand-navy">
                {mins ?? 0}
              </span>
              <span className="text-xs type-meta text-text-secondary">min</span>
            </span>
          </div>
          <input
            type="range"
            aria-label="Duration in minutes"
            min={MIN}
            max={MAX}
            step={1}
            value={Math.min(MAX, Math.max(MIN, mins ?? MIN))}
            onChange={(e) => setMinutes(e.target.value)}
            className="mt-2 h-6 w-full cursor-pointer accent-primary"
          />
          <div
            aria-hidden="true"
            className="mt-1.5 flex justify-between text-[15px] type-meta tabular-nums text-text-secondary"
          >
            <span>{MIN} min</span>
            <span>{MAX} min</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <AppTextField label="Minutes" type="number" value={minutes} error={errors.minutes} onChange={setMinutes} />
          <AppTextField label="Calories" type="number" value={calories} error={errors.calories} onChange={setCalories} />
        </div>
        {estimate !== null && String(estimate) !== calories.trim() && (
          <button
            type="button"
            onClick={() => setCalories(String(estimate))}
            className="tap-24 -mt-2 self-start text-[17px] type-button text-primary"
          >
            Use an estimate: about {estimate} kcal
          </button>
        )}
        <PrimaryButton type="submit" label="Log activity" />
      </form>
    </TrackLogLayout>
  );
}

/* ----------------------------------------------------------- History */

const longDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
};

export function ActivityHistoryScreen() {
  const hydrated = useHydrated();
  const back = useBack("/track");
  const navigate = useNavigate();
  const { entries } = useActivity();
  const f = useFilterParams({}, ["adv"]);
  const adv = f.get("adv") === "1";
  const day = f.get("day");
  const of = f.get("of");
  const all = (hydrated ? entries : []).map((e) => ({
    id: e.id,
    title: e.name,
    meta: `${e.minutes} min · ${e.calories} kcal`,
    date: isoDate(new Date(e.loggedAt)),
    bucket: e.name,
  }));
  const shown = all.filter((e) => (!day || e.date === day) && (!of || e.bucket === of));
  const days = [...new Set(all.map((e) => e.date))];
  const dayOpts = days.map((d) => ({
    value: d,
    label: longDay(d),
    count: all.filter((e) => e.date === d && (!of || e.bucket === of)).length,
  }));
  const bucketOpts = [...new Set(all.map((e) => e.bucket))].sort().map((b) => ({
    value: b,
    label: b,
    count: all.filter((e) => e.bucket === b && (!day || e.date === day)).length,
  }));
  return (
    <PageContainer variant="focused" pathname="/track/activity/history">
      <header className="flex items-start gap-3">
        <button
          type="button"
          aria-label="Go back"
          onClick={back}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-white"
        >
          <Icon name="arrowBack" size={20} color="var(--color-text-primary)" />
        </button>
        <div>
          <h1 className="text-2xl type-display text-brand-navy" style={{ letterSpacing: "-1.08px" }}>
            Activity History
          </h1>
          <p className="mt-1 text-sm text-text-secondary">Review your recent tracking activity.</p>
        </div>
      </header>
      <div className="mt-4">
        <AdvancedFilters
          open={adv}
          onOpenChange={(o) => f.set("adv", o ? "1" : null)}
          activeCount={[!!day, !!of].filter(Boolean).length}
        >
          <FacetGroup
            label="Day"
            options={dayOpts}
            selected={day ? [day] : []}
            onToggle={(v) => f.set("day", day === v ? null : v)}
            onClear={() => f.set("day", null)}
          />
          <FacetGroup
            label="Activity"
            options={bucketOpts}
            selected={of ? [of] : []}
            onToggle={(v) => f.set("of", of === v ? null : v)}
            onClear={() => f.set("of", null)}
          />
        </AdvancedFilters>
      </div>
      <p className="mt-4 text-[17px] type-meta text-text-secondary">
        <span className="type-row-figure text-text-primary">{shown.length}</span>
        {shown.length === 1 ? " entry" : " entries"}
        {shown.length !== all.length && ` of ${all.length}`}
      </p>
      {shown.length === 0 ? (
        <div className="panel mt-6 p-6 text-center">
          <Icon name="database" size={24} color="var(--color-text-secondary)" />
          <p className="mt-2 text-sm type-section-title text-text-primary">
            {all.length === 0 ? "Nothing logged yet" : "Nothing matches those filters"}
          </p>
          <div className="mt-4">
            <PrimaryButton label="Log something" onPress={() => navigate("/track/activity")} />
          </div>
        </div>
      ) : (
        <ul className="mt-[18px] flex flex-col gap-2.5">
          {shown.map((e) => (
            <li key={e.id} className="panel flex items-center gap-3 p-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-teal-soft">
                <Icon name={iconFor(e.title)} size={18} color="var(--color-brand-navy)" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm type-item-title tracking-[-0.63px] text-text-primary">
                  {e.title}
                </span>
                <span className="block truncate text-xs type-meta leading-4 tracking-[-0.54px] text-text-secondary">
                  {longDay(e.date)} · {e.meta}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
