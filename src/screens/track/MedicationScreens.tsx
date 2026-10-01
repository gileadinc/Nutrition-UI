"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { PageContainer } from "@/components/Layout";
import { PrimaryButton, SecondaryButton } from "@/components/Button";
import { AppTextField } from "@/components/TextField";
import { CenteredShell, StatePanel } from "@/components/Feedback";
import { AdvancedFilters, FacetGroup } from "@/components/Filters";
import { ChipRow, LogSectionTitle, TodayPanel, TrackLogLayout } from "@/components/Track/LogParts";
import { Link, useBack, useNavigate, useParams } from "@/lib/nav";
import { useFilterParams, useNow } from "@/lib/hooks";
import {
  doseStatus,
  firstNameOf,
  timeToMinutes,
  toast,
  useMedications,
  useProfile,
  useRequireAccount,
  type DoseStatus,
  type Medication,
} from "@/lib/store";
import { cn } from "@/lib/utils";

const noopSub = () => () => {};
/** False during SSR / hydration so device-local data doesn't flash a "not found" state. */
const useHydrated = () =>
  useSyncExternalStore(
    noopSub,
    () => true,
    () => false,
  );

const WHEN = ["8:00 AM", "12:00 PM", "6:00 PM", "9:00 PM"] as const;

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

function MissingMedication() {
  return (
    <CenteredShell>
      <StatePanel
        icon="medication"
        title="That medication isn't here"
        body="It may have been deleted from today's schedule."
        primary={{ label: "Back to medication", to: "/track/medication" }}
        secondary={{ label: "Go to Track", to: "/track" }}
      />
    </CenteredShell>
  );
}

function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  const back = useBack("/track/medication");
  return (
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
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      </div>
    </header>
  );
}

const statusPill = (s: DoseStatus) =>
  s === "Logged"
    ? "bg-brand-teal-soft text-brand-navy"
    : s === "Missed"
      ? "bg-missed-dose-surface text-primary"
      : "bg-brand-warm-gray text-text-neutral-500";

/* ----------------------------------------------------------- Schedule */

function NextDoseCard({ meds, now }: { meds: Medication[]; now: Date }) {
  const taken = meds.filter((m) => m.taken).length;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const pending = meds.filter((m) => !m.taken);
  const upcoming = pending.find((m) => timeToMinutes(m.time) >= nowMin);
  const overdue = pending.find((m) => timeToMinutes(m.time) < nowMin);
  const dur = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
  };
  let value: string;
  let unit = "";
  let sub: string;
  let alert = false;
  if (upcoming) {
    value = dur(timeToMinutes(upcoming.time) - nowMin);
    unit = "to go";
    sub = `${upcoming.name} at ${upcoming.time}`;
  } else if (overdue) {
    value = "Due now";
    alert = true;
    sub = `${overdue.name} · ${overdue.time}, ${dur(nowMin - timeToMinutes(overdue.time))} ago`;
  } else {
    value = "All done";
    sub = "No more doses today";
  }
  return (
    <section className="panel flex items-center gap-4 p-4" aria-label="Next dose">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-warm-gray">
        <Icon name="medication" size={18} color="var(--color-brand-navy)" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="eyebrow text-[12px]">Next dose</p>
        <p className="mt-1 flex items-center gap-1.5">
          {alert && <Icon name="alert" size={18} color="var(--color-accent-ink)" />}
          <span
            className={cn(
              "text-[24px] type-numeral leading-[1.05] tracking-[-1.08px]",
              alert ? "text-primary" : "text-text-primary",
            )}
          >
            {value}
          </span>
          {unit && <span className="text-xs type-meta text-text-secondary">{unit}</span>}
        </p>
        <p className="truncate text-xs type-meta text-text-secondary">{sub}</p>
        <p className="mt-1 text-[11px] type-meta text-text-neutral-500">
          {taken === meds.length ? "All taken today" : `${taken} of ${meds.length} taken today`}
        </p>
      </div>
    </section>
  );
}

export function MedicationScreen() {
  const requireAccount = useRequireAccount();
  const { meds, take, untake } = useMedications();
  const hydrated = useHydrated();
  const now = useNow(60_000);
  const list = hydrated ? meds : [];
  const missed = list.find((m) => doseStatus(m, now) === "Missed");
  const taken = list.filter((m) => m.taken).length;

  const onTake = (m: Medication) => {
    if (!requireAccount("Tracking")) return;
    void take(m.id).then((ok) => {
      if (ok) toast.success(`${m.name} taken`, { action: { label: "Undo", run: () => void untake(m.id) } });
    });
  };

  return (
    <TrackLogLayout
      title="Medication"
      subtitle={now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      asideLabel="Medication"
      aside={
        <section className="panel px-4 pb-2 pt-3.5" aria-label="Today's doses">
          <h2 className="eyebrow text-[12px]">Today</h2>
          <p className="mt-1 text-[15px] type-row-figure tabular-nums text-text-primary">
            {taken} of {list.length} <span className="type-unit text-text-secondary">doses taken</span>
          </p>
          <ul className="mt-2 divide-y divide-border-divider border-t border-border-divider">
            {[
              { to: "/track/medication/history", label: "Medication history", icon: "history" as const },
              { to: "/track/medication/reminders", label: "Reminders", icon: "bell" as const },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="flex min-h-11 items-center gap-3 text-[13px] type-item-title text-text-primary"
                >
                  <Icon name={l.icon} size={16} color="var(--color-text-secondary)" />
                  <span className="flex-1">{l.label}</span>
                  <Icon name="chevronRight" size={14} color="var(--color-text-neutral-400)" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      }
    >
      {missed && (
        <Link
          to="/track/medication/missed"
          className="mb-3 flex items-center gap-3 rounded-2xl bg-missed-dose-surface p-4"
        >
          <Icon name="alert" size={22} color="var(--color-accent-ink)" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm type-item-title text-text-primary">Missed dose</span>
            <span className="block truncate text-xs type-meta text-text-neutral-600">
              {missed.name} was due at {missed.time}
            </span>
          </span>
          <Icon name="chevronRight" size={16} color="var(--color-text-neutral-500)" />
        </Link>
      )}
      {list.length > 0 && <NextDoseCard meds={list} now={now} />}
      <section className="mt-6" aria-label="Today's schedule">
        <LogSectionTitle
          action={
            <span className="text-[12px] type-meta tabular-nums text-text-secondary">
              {taken} of {list.length} taken
            </span>
          }
        >
          Today&apos;s schedule
        </LogSectionTitle>
        <div className="panel overflow-hidden">
          {list.length === 0 ? (
            <p className="p-4 text-[13px] type-meta text-text-secondary">
              Nothing scheduled yet. Add a medication or supplement to get reminders.
            </p>
          ) : (
            <ul className="divide-y divide-border-divider">
              {list.map((m) => {
                const s = doseStatus(m, now);
                return (
                  <li key={m.id} className="flex min-h-[64px] items-center gap-3 px-4 py-2.5">
                    <span className="w-[60px] shrink-0 text-[12px] type-meta tabular-nums text-text-secondary">
                      {m.time}
                    </span>
                    <Link to={`/track/medication/detail/${m.id}`} className="min-w-0 flex-1">
                      <span className="block truncate text-sm type-item-title text-text-primary">{m.name}</span>
                      <span
                        className={cn(
                          "block truncate text-xs type-meta",
                          s === "Missed" ? "text-primary" : "text-text-secondary",
                        )}
                      >
                        {m.dose} · {s === "Logged" ? `Taken${m.loggedAt ? ` at ${clock(m.loggedAt)}` : ""}` : s}
                      </span>
                    </Link>
                    {m.taken ? (
                      <span className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-brand-teal-soft px-3 text-[12px] type-meta text-brand-navy">
                        <Icon name="tick" size={14} color="var(--color-brand-navy)" />
                        Taken
                      </span>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Take ${m.name}`}
                        onClick={() => onTake(m)}
                        className="h-9 shrink-0 rounded-full bg-primary px-4 text-[13px] type-button text-white"
                      >
                        Take
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            to="/track/medication/add"
            className="flex min-h-12 items-center gap-2 border-t border-border-divider px-4 text-[13px] type-button text-primary"
          >
            <Icon name="plusSign" size={16} color="var(--color-primary)" />
            Add a medication
          </Link>
        </div>
      </section>
    </TrackLogLayout>
  );
}

/* --------------------------------------------------------------- Form */

export function MedicationFormScreen({ mode }: { mode: "add" | "edit" }) {
  const hydrated = useHydrated();
  const { id = "" } = useParams<{ id: string }>();
  const { meds, isLoading } = useMedications();
  if (!hydrated || isLoading) return null;
  const existing = mode === "edit" ? meds.find((m) => m.id === id) : undefined;
  if (mode === "edit" && !existing) return <MissingMedication />;
  return <MedicationForm mode={mode} existing={existing} />;
}

function MedicationForm({ mode, existing }: { mode: "add" | "edit"; existing?: Medication }) {
  const navigate = useNavigate();
  const requireAccount = useRequireAccount();
  const { meds, add, update } = useMedications();
  const [name, setName] = useState(existing?.name ?? "");
  const [dose, setDose] = useState(existing?.dose ?? "");
  const [time, setTime] = useState(existing?.time ?? "");
  const [errors, setErrors] = useState<{ name?: string; dose?: string; time?: string }>({});

  const submit = async () => {
    const n = name.trim();
    const dup = meds.some((m) => m.id !== existing?.id && m.name.toLowerCase() === n.toLowerCase());
    const next = {
      name: n ? (dup ? "That medication is already on today’s list." : undefined) : "Name the medication.",
      dose: dose.trim() ? undefined : "Enter the dose, e.g. 200 mg.",
      time: /^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(time.trim())
        ? undefined
        : "Enter a scheduled time, e.g. 9:00 AM.",
    };
    setErrors(next);
    if (Object.values(next).some(Boolean) || !requireAccount("Tracking")) return;
    const input = { name: n, dose: dose.trim(), time: time.trim().toUpperCase() };
    if (existing) {
      if (!(await update(existing.id, input))) return;
    } else {
      if (!(await add(input))) return;
      toast.success(`${n} added`, { body: `${input.dose} at ${input.time}` });
    }
    navigate("/track/medication");
  };

  return (
    <TrackLogLayout
      title={mode === "add" ? "Add medication" : "Edit medication"}
      subtitle={mode === "add" ? "A prescription or supplement, taken daily." : "Keep the schedule up to date."}
      asideLabel="Today's schedule"
      aside={
        <TodayPanel
          title="Today's schedule"
          empty="Nothing scheduled yet."
          rows={meds.map((m) => ({ id: m.id, title: m.name, meta: `${m.dose} · ${m.time}` }))}
        />
      }
    >
      <form
        className="panel flex flex-col gap-5 p-4 md:p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <AppTextField
          label="Medication name"
          value={name}
          placeholder={mode === "add" ? "e.g. Vitamin B12" : "e.g. Vitamin D3"}
          error={errors.name}
          onChange={setName}
        />
        <AppTextField
          label="Dose"
          value={dose}
          placeholder={mode === "add" ? "e.g. 500mg" : "e.g. 2000 IU"}
          error={errors.dose}
          onChange={setDose}
        />
        <ChipRow
          label="When"
          options={WHEN}
          value={(WHEN.find((w) => w === time.trim()) ?? "") as (typeof WHEN)[number]}
          onChange={setTime}
        />
        <AppTextField
          label="Scheduled time"
          value={time}
          placeholder="e.g. 9:00 AM"
          error={errors.time}
          onChange={setTime}
        />
        <PrimaryButton type="submit" label={mode === "add" ? "Add medication" : "Save changes"} />
      </form>
    </TrackLogLayout>
  );
}

/* ------------------------------------------------------------- Detail */

export function MedicationDetailScreen() {
  const hydrated = useHydrated();
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const requireAccount = useRequireAccount();
  const { meds, take, remove, isLoading } = useMedications();
  const now = useNow(60_000);
  if (!hydrated || isLoading) return null;
  const m = meds.find((x) => x.id === id);
  if (!m) return <MissingMedication />;
  const status = doseStatus(m, now);
  return (
    <PageContainer variant="focused">
      <PageHeading title={m.name} subtitle="Medication details and reminders." />
      <section className="panel mt-4 p-5">
        <p className="text-[20px] type-numeral tracking-[-0.9px] text-brand-navy">{m.dose}</p>
        <p className="mt-1.5 text-[15px] tracking-[-0.675px] text-text-secondary">Scheduled for {m.time}</p>
        <p
          className={cn(
            "mt-3 inline-flex rounded-xl px-3 py-1.5 text-xs type-meta tracking-[-0.54px]",
            statusPill(status),
          )}
        >
          {status}
        </p>
        {m.loggedAt && (
          <p className="mt-2 text-xs type-meta tracking-[-0.54px] text-text-secondary">
            Logged at {clock(m.loggedAt)}
          </p>
        )}
      </section>
      <div className="mt-6 flex flex-col gap-3">
        {!m.taken && (
          <PrimaryButton
            label="Log medication"
            onPress={() => {
              if (!requireAccount("Tracking")) return;
              void take(m.id);
              navigate("/track/medication");
            }}
          />
        )}
        <SecondaryButton label="Manage reminders" onPress={() => navigate("/track/medication/reminders")} />
        <SecondaryButton label="Edit medication" onPress={() => navigate(`/track/medication/edit/${m.id}`)} />
        <SecondaryButton
          label="Delete medication"
          onPress={() => {
            if (!requireAccount("Tracking")) return;
            void remove(m.id);
            navigate("/track/medication");
          }}
        />
      </div>
    </PageContainer>
  );
}

/* ------------------------------------------------------------- Missed */

export function MissedDoseScreen() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const requireAccount = useRequireAccount();
  const { profile } = useProfile();
  const { meds, take, untake, isLoading } = useMedications();
  const now = useNow(60_000);
  if (!hydrated || isLoading) return null;
  const m = meds.find((x) => doseStatus(x, now) === "Missed");
  if (!m) {
    return (
      <PageContainer variant="focused">
        <PageHeading title="Missed doses" subtitle="Still outstanding for today." />
        <div className="panel mt-6 p-6 text-center">
          <Icon name="checkCircle" size={24} color="var(--color-status-good)" />
          <p className="mt-2 text-sm type-section-title text-text-primary">Nothing outstanding</p>
          <p className="mt-1 text-[13px] type-meta text-text-secondary">No dose has gone past its time today.</p>
        </div>
      </PageContainer>
    );
  }
  const h = now.getHours();
  const greeting = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const first = firstNameOf(profile);
  return (
    <PageContainer variant="focused">
      <header>
        <h1 className="text-[20px] type-display leading-[1.33] tracking-[-0.9px] text-brand-navy">
          {greeting}
          {first ? `, ${first}` : ""}
        </h1>
        <p className="mt-1 text-xs type-meta leading-4 tracking-[-0.54px] text-text-neutral-500">
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </header>
      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-missed-dose-surface p-4">
        <Icon name="alert" size={24} color="var(--color-accent-ink)" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm type-item-title tracking-[-0.63px] text-text-primary">Missed Dose</span>
          <span className="block truncate text-xs type-meta leading-4 tracking-[-0.54px] text-text-neutral-600">
            You missed your {m.time} dose of {m.name}
          </span>
        </span>
      </div>
      <h2 className="mt-5 text-base type-section-title tracking-[-0.72px] text-text-primary">Today&apos;s schedule</h2>
      <div className="panel mt-3 flex items-center gap-3 p-4">
        <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-primary" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm type-item-title tracking-[-0.63px] text-text-primary">{m.name}</span>
          <span className="block truncate text-xs type-meta leading-4 tracking-[-0.54px] text-text-secondary">
            {m.dose} · Daily at {m.time}
          </span>
        </span>
        <span className="shrink-0 rounded-xl bg-missed-dose-surface px-3 py-1.5 text-xs type-meta tracking-[-0.54px] text-primary">
          Missed
        </span>
      </div>
      <div className="mt-5 flex flex-col gap-3">
        <PrimaryButton
          label="Log Now"
          onPress={() => {
            if (!requireAccount("Tracking")) return;
            void take(m.id).then((ok) => {
              if (ok)
                toast.success(`${m.name} logged`, {
                  body: "It is on today's schedule.",
                  action: { label: "Undo", run: () => void untake(m.id) },
                });
            });
            navigate("/track/medication");
          }}
        />
      </div>
    </PageContainer>
  );
}

/* ---------------------------------------------------------- Reminders */

export function MedicationRemindersScreen() {
  const navigate = useNavigate();
  const requireAccount = useRequireAccount();
  const { reminders, setReminder, isLoading } = useMedications();
  return (
    <PageContainer variant="focused">
      <PageHeading title="Set reminders" subtitle="Choose which medications ForkThis reminds you about." />
      {reminders.length === 0 ? (
        <div className="panel mt-[18px] p-6 text-center">
          <p className="text-sm type-section-title text-text-primary">
            {isLoading ? "Loading your medications" : "No medications yet"}
          </p>
          {!isLoading && (
            <p className="mt-1 text-[13px] type-meta text-text-secondary">
              Add a medication to turn on reminders for it.
            </p>
          )}
        </div>
      ) : (
        <div className="panel mt-[18px] divide-y divide-border-divider">
          {reminders.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-4">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm type-item-title tracking-[-0.63px] text-text-primary">
                  {r.name}
                </span>
                <span className="block text-xs type-meta leading-4 tracking-[-0.54px] text-text-secondary">
                  {r.time}
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={r.enabled}
                aria-label={`${r.name} reminder`}
                onClick={() => {
                  if (!requireAccount("Tracking")) return;
                  void setReminder(r.id, !r.enabled);
                }}
                className={cn(
                  "flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
                  r.enabled ? "bg-primary" : "bg-border-default",
                )}
              >
                <span
                  className={cn("size-5 rounded-full bg-white transition-transform", r.enabled && "translate-x-5")}
                />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-[18px]">
        <PrimaryButton label="Done" onPress={() => navigate("/track/medication")} />
      </div>
    </PageContainer>
  );
}

/* ------------------------------------------------------------ History */

const longDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
};

export function MedicationHistoryScreen() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const { history } = useMedications({ history: true });
  const f = useFilterParams({}, ["adv"]);
  const adv = f.get("adv") === "1";
  const day = f.get("day");
  const of = f.get("of");
  const todayKey = history[0]?.date;
  const now = useNow(60_000);
  const all: { id: string; title: string; meta: ReactNode; date: string; bucket: string }[] = hydrated
    ? history.flatMap((d) =>
        d.meds.map((m) => {
          const bucket = m.taken ? "Logged" : d.date === todayKey ? doseStatus(m, now) : "Missed";
          return {
            id: `${d.date}-${m.id}`,
            title: m.name,
            meta: `${longDay(d.date)} · ${m.dose} · ${bucket}`,
            date: d.date,
            bucket,
          };
        }),
      )
    : [];
  const shown = all.filter((e) => (!day || e.date === day) && (!of || e.bucket === of));
  const dayOpts = history.map((d) => ({
    value: d.date,
    label: longDay(d.date),
    count: all.filter((e) => e.date === d.date && (!of || e.bucket === of)).length,
  }));
  const bucketOpts = [...new Set(all.map((e) => e.bucket))].sort().map((b) => ({
    value: b,
    label: b,
    count: all.filter((e) => e.bucket === b && (!day || e.date === day)).length,
  }));
  return (
    <PageContainer variant="focused" pathname="/track/medication/history">
      <PageHeading title="Medication History" subtitle="Review your recent tracking activity." />
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
            label="Kind"
            options={bucketOpts}
            selected={of ? [of] : []}
            onToggle={(v) => f.set("of", of === v ? null : v)}
            onClear={() => f.set("of", null)}
          />
        </AdvancedFilters>
      </div>
      <p className="mt-4 text-[13px] type-meta text-text-secondary">
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
            <PrimaryButton label="Log something" onPress={() => navigate("/track/medication")} />
          </div>
        </div>
      ) : (
        <ul className="mt-[18px] flex flex-col gap-2.5">
          {shown.map((e) => (
            <li key={e.id} className="panel flex items-center gap-3 p-3.5">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-brand-navy) 12%, transparent)" }}
              >
                <Icon name="medication" size={18} color="var(--color-brand-navy)" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm type-item-title tracking-[-0.63px] text-text-primary">
                  {e.title}
                </span>
                <span className="block truncate text-xs type-meta leading-4 tracking-[-0.54px] text-text-secondary">
                  {e.meta}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
