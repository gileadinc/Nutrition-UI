"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { PageContainer, SectionHeader } from "@/components/Layout";
import { MiniRing, RadialGauge } from "@/components/Charts";
import { Link, useNavigate } from "@/lib/nav";
import {
  ACTIVITY_LABEL,
  GOAL_LABEL,
  budgetFromSummary,
  calorieTarget,
  cmToInches,
  kgToLb,
  tdee,
} from "@/lib/nutrition";
import {
  signOut,
  toast,
  useAppSession,
  useDailySummary,
  useNotifications,
  useProfile,
  useSaved,
} from "@/lib/store";
import { ICON_WELL } from "@/components/styles";
import { LINK_CLS, META } from "@/components/Track/ProfileParts";

const R = "text-[26px] type-row-figure leading-7 tabular-nums tracking-[-0.8px] text-text-primary";
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const feetIn = (inches: number) => {
  const t = Math.round(inches);
  return `${Math.floor(t / 12)}'${t % 12}"`;
};

function Identity({
  initials,
  name,
  email,
  goal,
}: {
  initials: string;
  name: string;
  email: string | null;
  goal: string;
}) {
  return (
    <header data-slot="profile-identity" className="flex items-start gap-4">
      <span
        aria-hidden="true"
        className="flex size-16 shrink-0 items-center justify-center rounded-[20px] bg-primary text-[26px] type-display tracking-[-0.5px] text-text-on-dark"
      >
        {initials || <Icon name="person" size={26} color="var(--color-text-on-dark)" />}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <h1 className="line-clamp-2 break-words type-display text-brand-navy text-[28px] leading-[1.15] tracking-[-1.08px] md:text-[32px] md:tracking-[-1.26px]">
          {name || "You"}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-soft px-2.5 py-1 text-[17px] type-meta text-brand-navy">
            <Icon name="target" size={13} color="var(--color-brand-navy)" />
            {goal}
          </span>
          {!name && (
            <Link to="/you/personal-details" className={LINK_CLS}>
              Add your name
            </Link>
          )}
          {email ? (
            <span className="min-w-0 max-w-full truncate type-meta text-[17px] text-text-secondary">{email}</span>
          ) : (
            <Link to="/you/personal-details" className={LINK_CLS}>
              Add email
            </Link>
          )}
        </div>
      </div>
      <Link
        to="/you/personal-details"
        aria-label="Edit personal details"
        className="inline-flex size-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border-default bg-white text-[17px] type-button text-brand-navy transition-colors hover:border-text-neutral-400 sm:w-auto sm:px-4"
      >
        <Icon name="pencilEdit" size={16} color="var(--color-brand-navy)" />
        <span aria-hidden="true" className="hidden sm:inline">
          Edit
        </span>
      </Link>
    </header>
  );
}

function GuestCard() {
  return (
    <div data-slot="profile-identity">
      <header className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-[20px] bg-primary"
        >
          <Icon name="person" size={26} color="var(--color-text-on-dark)" />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="type-display text-brand-navy text-[28px] leading-[1.15] tracking-[-1.08px] md:text-[32px]">
            You&apos;re browsing as a guest
          </h1>
          <p className={cn(META, "mt-1.5")}>Saves and tracking need an account. Nothing you do now is stored.</p>
        </div>
      </header>
      <div data-slot="guest-cta" className="mt-6 rounded-2xl bg-navy-soft px-5 py-5">
        <h2 className="text-[22px] type-section-title leading-6 tracking-[-0.81px] text-brand-navy">Save your plan</h2>
        <p className={cn(META, "mt-1 max-w-[46ch]")}>
          Create an account to keep your targets, saved food and everything you log.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            to="/signup"
            className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-[17px] type-button text-text-on-dark transition-colors hover:bg-primary-hover"
          >
            Create an account
          </Link>
          <Link to="/login" className={LINK_CLS}>
            I already have one
          </Link>
        </div>
      </div>
    </div>
  );
}

function Block({ id, title, action, children }: { id: string; title: string; action?: { label: string; to: string }; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-7 border-t border-border-divider pt-6">
      <SectionHeader id={id} title={title} action={action} />
      {children}
    </section>
  );
}

function PlanRings({ readings }: { readings: { key: "calories" | "protein" | "water"; label: string; eaten: number; goal: number; unit: string }[] }) {
  const icons: Record<string, IconName> = { calories: "fire", protein: "dumbbell", water: "droplet" };
  const colors: Record<string, string> = {
    calories: "var(--color-accent-graphic)",
    protein: "var(--color-brand-navy)",
    water: "var(--color-graphic)",
  };
  return (
    <ul data-slot="plan-rings" className="mt-4 grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2 sm:gap-6">
      {readings.map((r) => {
        const spoken = `${r.label}: ${fmt(r.eaten)} of ${fmt(r.goal)} ${r.unit} today.`;
        return (
          <li key={r.key} className="min-w-0">
            <Link
              to={r.key === "water" ? "/track/water" : "/track"}
              aria-label={`${spoken} Open ${r.key === "water" ? "water" : "Track"}`}
              className="flex min-w-0 flex-col items-center rounded-2xl px-1 pb-2 pt-1 text-center transition-colors hover:bg-navy-soft"
            >
              <span className="text-[17px] type-item-title text-text-secondary">{r.label}</span>
              <span className="mt-2 w-full max-w-[104px]">
                <MiniRing value={r.eaten} goal={r.goal} size={104} stroke={9} color={colors[r.key]} overlap fluid label={spoken}>
                  <Icon name={icons[r.key]} size={20} color={colors[r.key]} />
                </MiniRing>
              </span>
              <span aria-hidden="true" className={cn(R, "mt-2")}>
                {fmt(r.eaten)}
              </span>
              <span aria-hidden="true" className={META}>
                of {fmt(r.goal)} {r.unit}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Figure({
  to,
  label,
  value,
  detail,
  accessible,
  gauge,
}: {
  to: string;
  label: string;
  value: string | null;
  detail: string;
  accessible: string | null;
  gauge?: { value: number; min: number; max: number };
}) {
  return (
    <Link
      to={to}
      aria-label={`${label}: ${accessible ?? "needs your details"}. Open calculator`}
      className="group flex min-h-11 min-w-0 flex-col px-2.5 py-1 transition-colors first:pl-0 last:pr-0 hover:bg-navy-soft/60 sm:px-3"
    >
      <span className="flex items-center gap-1 text-[17px] type-item-title text-text-secondary">
        <span className="truncate">{label}</span>
        <Icon name="chevronRight" size={13} color="var(--color-text-neutral-400)" className="shrink-0" />
      </span>
      <span className="mt-1 flex min-w-0 items-center gap-2">
        {gauge && value !== null && (
          <RadialGauge
            value={gauge.value}
            min={gauge.min}
            max={gauge.max}
            color="var(--color-brand-navy)"
            size={26}
            stroke={4}
            label={label}
            decorative
            bare
          />
        )}
        <span className={cn(R, "truncate")}>{value ?? "—"}</span>
      </span>
      <span
        className={cn(
          "text-[17px] leading-5",
          value === null ? "type-button text-primary" : "type-meta truncate text-text-secondary",
        )}
      >
        {value === null ? "Add details" : detail}
      </span>
    </Link>
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  const id = `settings-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="mt-7 first:mt-0">
      <h2 id={id} className="mb-2 text-[17px] type-section-title text-text-secondary">
        {title}
      </h2>
      <ul className="divide-y divide-border-divider overflow-hidden rounded-2xl border border-border-divider bg-surface-card">
        {children}
      </ul>
    </section>
  );
}

function SettingsRow({
  icon,
  label,
  sub,
  to,
  badge,
}: {
  icon: IconName;
  label: string;
  sub?: string;
  to: string;
  badge?: number;
}) {
  return (
    <li>
      <Link
        to={to}
        className="group flex min-h-[60px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-navy-soft/60"
      >
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", ICON_WELL)}>
          <Icon name={icon} size={17} color="var(--color-icon-well-ink)" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm type-item-title text-text-primary">{label}</span>
          {sub && <span className="block truncate type-meta text-[17px] leading-5 text-text-secondary">{sub}</span>}
        </span>
        {badge !== undefined && badge > 0 && (
          <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[17px] type-meta tabular-nums text-text-on-dark">
            {badge}
            <span className="sr-only"> unread</span>
          </span>
        )}
        <Icon
          name="chevronRight"
          size={16}
          color="var(--color-text-neutral-400)"
          className="shrink-0 motion-safe:transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </li>
  );
}

export function ProfileScreen() {
  const session = useAppSession();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { data: summary } = useDailySummary();
  const saved = useSaved();
  const notes = useNotifications();
  const guest = !session.isSignedIn;
  const budget = budgetFromSummary(summary);

  const inches = profile?.heightCm ? cmToInches(profile.heightCm) : null;
  const pounds = profile?.weightKg ? kgToLb(profile.weightKg) : null;
  const bmi = profile?.heightCm && profile.weightKg ? profile.weightKg / (profile.heightCm / 100) ** 2 : null;
  const activity = profile?.activityLevel ?? "moderatelyActive";
  const calc =
    profile?.heightCm && profile.weightKg
      ? {
          weightKg: profile.weightKg,
          heightCm: profile.heightCm,
          age: profile.age,
          activityLevel: activity,
          sex: (profile.sex as "male" | "female" | "other" | null) ?? "other",
        }
      : null;
  const tdeeVal = calc ? tdee(calc) : null;
  const target =
    profile?.targets?.calories ||
    (calc && profile?.goal ? calorieTarget({ ...calc, goal: profile.goal }) : null) ||
    null;
  const goalLabel = profile?.goal ? GOAL_LABEL[profile.goal] : "No goal set";
  const basis =
    target !== null && inches !== null && pounds !== null
      ? `Based on ${feetIn(inches)} · ${Math.round(pounds)} lb · ${ACTIVITY_LABEL[activity]} · ${goalLabel}`
      : null;
  const initials = [profile?.firstName, profile?.lastName]
    .map((s) => (s ?? "").trim().charAt(0).toUpperCase())
    .join("");

  const prefs = profile?.dietaryPreferences ?? [];
  const allergies = profile?.allergies ?? [];
  const foodSub =
    [
      prefs.length === 0 ? null : prefs.length === 1 ? prefs[0] : `${prefs[0]} +${prefs.length - 1}`,
      allergies.length === 0 ? null : `${allergies.length} ${allergies.length === 1 ? "allergy" : "allergies"}`,
    ]
      .filter(Boolean)
      .join(" · ") || "None set";
  const sub = (s: string | undefined) => (guest ? undefined : s);

  const onSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/welcome");
  };

  const left = guest ? (
    <GuestCard />
  ) : (
    <>
      <Identity initials={initials} name={profile?.name ?? ""} email={profile?.email ?? null} goal={goalLabel} />
      <Block id="plan-heading" title="Your plan">
        <PlanRings
          readings={[
            { key: "calories", label: "Calories", eaten: budget.calories.consumed, goal: budget.calories.goal, unit: "kcal" },
            { key: "protein", label: "Protein", eaten: budget.protein.consumed, goal: budget.protein.goal, unit: "g" },
            { key: "water", label: "Water", eaten: budget.water.consumed, goal: budget.water.goal, unit: "oz" },
          ]}
        />
        <div className="mt-4 flex items-start gap-3">
          <p className={cn(META, "min-w-0 flex-1")}>
            {basis ?? "Standard targets. Add your height, weight and date of birth to personalise them."}
          </p>
          <Link to="/you/personal-details" className={cn(LINK_CLS, "shrink-0 leading-5")}>
            {basis ? "Edit" : "Add details"}
          </Link>
        </div>
      </Block>
      <Block id="week-heading" title="This week" action={{ label: "Insights", to: "/track/insights" }}>
        <div data-slot="body-figures" className="mt-5 border-t border-border-divider pt-4">
          <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] divide-x divide-border-divider">
            <Figure
              to="/you/bmi"
              label="BMI"
              value={bmi ? bmi.toFixed(1) : null}
              detail="kg/m²"
              accessible={bmi ? bmi.toFixed(1) : null}
              gauge={bmi ? { value: bmi, min: 15, max: 40 } : undefined}
            />
            <Figure
              to="/you/tdee"
              label="TDEE"
              value={tdeeVal === null ? null : fmt(tdeeVal)}
              detail="kcal/day"
              accessible={tdeeVal === null ? null : `${fmt(tdeeVal)} kcal a day`}
            />
            <Figure
              to="/you/calories"
              label="Target"
              value={target === null ? null : fmt(target)}
              detail="kcal/day"
              accessible={target === null ? null : `${fmt(target)} kcal a day`}
            />
          </div>
        </div>
      </Block>
    </>
  );

  return (
    <PageContainer className="max-w-[1680px]">
      <div className="mx-auto grid max-w-4xl gap-10 xl:max-w-none xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] xl:items-start xl:gap-16 2xl:gap-24">
        <div className="min-w-0">{left}</div>
        <div
          data-slot="profile-settings"
          className="min-w-0 border-t border-border-divider pt-7 xl:border-t-0 xl:pt-1"
        >
          <SettingsGroup title="Plan">
            <SettingsRow
              icon="person"
              label="Personal details"
              sub={sub(inches !== null && pounds !== null ? `${feetIn(inches)} · ${Math.round(pounds)} lb` : "Add height and weight")}
              to="/you/personal-details"
            />
            <SettingsRow
              icon="target"
              label="Goal"
              sub={sub(goalLabel)}
              to={`/questionnaire?step=goal&returnTo=${encodeURIComponent("/you")}`}
            />
            <SettingsRow
              icon="activity"
              label="Activity level"
              sub={sub(ACTIVITY_LABEL[activity])}
              to={`/questionnaire?step=activity&returnTo=${encodeURIComponent("/you")}`}
            />
            <SettingsRow
              icon="medication"
              label="Surgery context"
              sub={sub(profile?.surgicalContext ?? "Not set")}
              to={`/questionnaire?step=surgery&returnTo=${encodeURIComponent("/you")}`}
            />
            <SettingsRow icon="leaf" label="Food preferences" sub={sub(foodSub)} to="/you/dietary-preferences" />
          </SettingsGroup>
          <SettingsGroup title="App">
            <SettingsRow
              icon="bookmark"
              label="Saved"
              sub={sub(saved.count === 0 ? "None yet" : `${saved.count} saved`)}
              to="/you/saved"
            />
            <SettingsRow icon="shoppingCart" label="Shopping list" to="/shopping-list" />
            <SettingsRow
              icon="bell"
              label="Notifications"
              sub="Reminders and updates"
              to="/you/notifications"
              badge={notes.unreadCount}
            />
          </SettingsGroup>
          <SettingsGroup title="Support">
            <SettingsRow icon="info" label="Help & support" sub="Questions and contact" to="/you/help-support" />
            <SettingsRow
              icon="legalDocument"
              label="Legal & privacy"
              sub="Terms, privacy and health notice"
              to="/you/legal/terms"
            />
          </SettingsGroup>
          {!guest && (
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full px-1 text-sm type-button-secondary text-text-secondary transition-colors hover:text-brand-navy"
            >
              <Icon name="logout" size={18} color="currentColor" />
              Sign out
            </button>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
