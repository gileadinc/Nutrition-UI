"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { AppTextField } from "@/components/TextField";
import { CheckMark, PageContainer, PageHeader } from "@/components/Layout";
import { SELECTED_CHIP, UNSELECTED_CHIP } from "@/components/styles";
import { Link, useBack } from "@/lib/nav";
import {
  ACTIVITY_HINT,
  ACTIVITY_KEYS,
  ACTIVITY_LABEL,
  ACTIVITY_MULTIPLIER,
  BMI_BANDS,
  GOAL_CALORIE_DELTA,
  GOAL_KEYS,
  GOAL_LABEL,
  bmiBand,
  bmr,
  calorieTarget,
  cmToInches,
  inchesToCm,
  kgToLb,
  lbToKg,
  macroGrams,
  tdee as tdeeOf,
  type ActivityKey,
  type GoalKey,
  type Sex,
} from "@/lib/nutrition";
import { toast, useProfile, type UserProfile } from "@/lib/store";

/* -------------------------------------------------------------- constants */

const DISCLAIMER =
  "An estimate from a standard formula, not a diagnosis or medical advice. Talk to a clinician before making changes, especially around surgery or a medical condition.";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const signed = (n: number) => (n === 0 ? "±0" : n > 0 ? `+${n}` : `−${Math.abs(n)}`);
const num = (s: string) => {
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
};
const round1 = (n: number) => String(Math.round(n * 10) / 10);

/** Example values behind the "Example values · add yours" link (5'7", 165 lb, 33). */
const EXAMPLE = { inch: "67", lb: "165", cm: "170", kg: "75", age: "33" } as const;

const SEX_OPTIONS: { key: Sex; label: string }[] = [
  { key: "female", label: "Female" },
  { key: "male", label: "Male" },
  { key: "other", label: "Other / prefer not to say" },
];

const sexOf = (raw: string | null | undefined): Sex =>
  raw && /^m/i.test(raw) ? "male" : raw && /^f/i.test(raw) ? "female" : "other";

/* ---------------------------------------------------------- body inputs */

type Units = "imperial" | "metric";
interface Edits {
  units?: Units;
  inch?: string;
  lb?: string;
  cm?: string;
  kg?: string;
  ft?: string;
  ftIn?: string;
  age?: string;
  sex?: Sex;
  activity?: ActivityKey;
  goal?: GoalKey;
}

/**
 * Calculator inputs: whatever the user typed, else their saved profile, else
 * (only while "example values" is on) a worked example. Nothing is invented.
 */
function useBodyInputs(profile: UserProfile | null, loading: boolean) {
  const [edits, setEdits] = useState<Edits>({});
  const [exampleOn, setExampleOn] = useState(true);
  const set = (patch: Edits) => setEdits((e) => ({ ...e, ...patch }));

  const units: Units = edits.units ?? (profile?.isImperial === false ? "metric" : "imperial");
  const useExample = exampleOn && !loading;

  const profInches = profile?.heightCm ? cmToInches(profile.heightCm) : null;
  const profLb = profile?.weightKg ? kgToLb(profile.weightKg) : null;
  const profileComplete = Boolean(profile?.heightCm && profile?.weightKg);
  const exampleShown =
    useExample && !profileComplete && edits.inch === undefined && edits.lb === undefined;

  const pick = (edit: string | undefined, fromProfile: number | null, example: string, dp = 0) =>
    edit ?? (fromProfile !== null ? String(dp ? Math.round(fromProfile * 10 ** dp) / 10 ** dp : Math.round(fromProfile)) : useExample ? example : "");

  const inch = pick(edits.inch, profInches, EXAMPLE.inch, 1);
  const lb = pick(edits.lb, profLb, EXAMPLE.lb, 1);
  const cm = pick(edits.cm, profile?.heightCm ?? null, EXAMPLE.cm);
  const kg = pick(edits.kg, profile?.weightKg ?? null, EXAMPLE.kg, 1);
  const age = pick(edits.age, profile?.age ?? null, EXAMPLE.age);

  // Feet + inches view of the same height (TDEE / calorie pages).
  const totalIn = num(inch);
  const ft = edits.ft ?? (totalIn !== null ? String(Math.floor(totalIn / 12)) : "");
  const ftIn = edits.ftIn ?? (totalIn !== null ? round1(totalIn - Math.floor(totalIn / 12) * 12) : "");

  const sex: Sex = edits.sex ?? sexOf(profile?.sex);
  const activity: ActivityKey = edits.activity ?? profile?.activityLevel ?? "moderatelyActive";
  const goal: GoalKey = edits.goal ?? profile?.goal ?? "maintain";

  const heightCm =
    units === "metric" ? num(cm) : totalIn !== null ? inchesToCm(totalIn) : null;
  const weightKg = units === "metric" ? num(kg) : num(lb) !== null ? lbToKg(num(lb)!) : null;

  /** Feet + inches fields drive the same imperial height. */
  const setFeetInches = (nextFt: string, nextIn: string) => {
    const f = num(nextFt);
    const i = num(nextIn) ?? 0;
    set({
      ft: nextFt,
      ftIn: nextIn,
      inch: f === null && num(nextIn) === null ? "" : String((f ?? 0) * 12 + i),
    });
  };

  const switchUnits = (next: Units) => {
    if (next === units) return;
    if (next === "metric") {
      set({
        units: next,
        cm: heightCm !== null ? String(Math.round(heightCm)) : "",
        kg: weightKg !== null ? round1(weightKg) : "",
      });
    } else {
      set({
        units: next,
        inch: heightCm !== null ? round1(cmToInches(heightCm)) : "",
        lb: weightKg !== null ? round1(kgToLb(weightKg)) : "",
        ft: undefined,
        ftIn: undefined,
      });
    }
  };

  const toggleExample = () => {
    setEdits({});
    setExampleOn((v) => !v);
  };

  return {
    units,
    inch,
    lb,
    cm,
    kg,
    ft,
    ftIn,
    age,
    sex,
    activity,
    goal,
    heightCm,
    weightKg,
    ageYears: num(age),
    exampleShown,
    exampleOn: useExample,
    canToggleExample: !profileComplete,
    set,
    setFeetInches,
    switchUnits,
    toggleExample,
  };
}
type BodyInputs = ReturnType<typeof useBodyInputs>;

/* --------------------------------------------------------- UI primitives */

function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn("type-eyebrow text-[13px] uppercase tracking-[0.5px] text-eyebrow", className)}>
      {children}
    </h2>
  );
}

function ExampleLink({ b }: { b: BodyInputs }) {
  if (!b.canToggleExample) return null;
  return (
    <button
      type="button"
      onClick={b.toggleExample}
      className="type-meta text-[13px] text-text-secondary underline underline-offset-2 hover:text-text-primary"
    >
      {b.exampleOn ? "Example values · add yours" : "Use example values"}
    </button>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  columns,
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  columns?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("grid gap-1 rounded-2xl bg-brand-warm-gray p-1", columns ?? "grid-cols-2")}
    >
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.key)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[14px] type-button tracking-[-0.3px]",
              on ? SELECTED_CHIP : "text-text-primary hover:bg-white/60",
            )}
          >
            {on && <CheckMark size={14} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SexField({ b }: { b: BodyInputs }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="type-item-title text-[14px] text-text-primary">Sex</p>
      <Segmented
        label="Sex"
        options={SEX_OPTIONS}
        value={b.sex}
        onChange={(sex) => b.set({ sex })}
        columns="grid-cols-[1fr_1fr_1.7fr]"
      />
    </div>
  );
}

function ActivityField({ b }: { b: BodyInputs }) {
  // The design lists four levels; keep "extremely active" only if it is already chosen.
  const keys = ACTIVITY_KEYS.filter((k) => k !== "extremelyActive" || b.activity === k);
  return (
    <div className="flex flex-col gap-2">
      <p id="activity-label" className="type-item-title text-[14px] text-text-primary">
        Activity level
      </p>
      <div
        role="radiogroup"
        aria-labelledby="activity-label"
        className="divide-y divide-border-divider overflow-hidden rounded-2xl border border-border-default bg-white"
      >
        {keys.map((k) => {
          const on = b.activity === k;
          return (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => b.set({ activity: k })}
              className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-brand-warm-gray/50"
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                  on ? "border-control-on" : "border-border-default",
                )}
              >
                {on && <span className="size-3 rounded-full bg-control-on" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block type-item-title text-[14px] text-text-primary">
                  {ACTIVITY_LABEL[k]}
                </span>
                <span className="block type-meta text-[13px] text-text-secondary">
                  {ACTIVITY_HINT[k]}
                </span>
              </span>
              <span className="type-meta text-[13px] tabular-nums text-text-secondary">
                ×{ACTIVITY_MULTIPLIER[k]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ImperialBodyFields({ b }: { b: BodyInputs }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <AppTextField
        type="number"
        label="Height (ft)"
        value={b.ft}
        onChange={(v) => b.setFeetInches(v, b.ftIn)}
      />
      <AppTextField
        type="number"
        label="Height (in)"
        value={b.ftIn}
        onChange={(v) => b.setFeetInches(b.ft, v)}
      />
      <AppTextField type="number" label="Weight (lb)" value={b.lb} onChange={(v) => b.set({ lb: v })} />
      <AppTextField type="number" label="Age" value={b.age} onChange={(v) => b.set({ age: v })} />
    </div>
  );
}

const TOOLS: Record<"bmi" | "tdee" | "calories", { label: string; detail: string; to: string; icon: IconName }> = {
  bmi: { label: "BMI", detail: "Body mass", to: "/you/bmi", icon: "ruler" },
  tdee: { label: "TDEE", detail: "Daily burn", to: "/you/tdee", icon: "activity" },
  calories: { label: "Calories", detail: "Daily target", to: "/you/calories", icon: "fire" },
};

function OtherTools({ current }: { current: keyof typeof TOOLS }) {
  const others = (Object.keys(TOOLS) as (keyof typeof TOOLS)[]).filter((k) => k !== current);
  return (
    <section aria-labelledby="other-tools" className="flex flex-col gap-3">
      <Eyebrow>
        <span id="other-tools">Other health tools</span>
      </Eyebrow>
      <div className="grid gap-3 sm:grid-cols-2">
        {others.map((k) => (
          <Link
            key={k}
            to={TOOLS[k].to}
            className="flex items-center gap-3 rounded-2xl bg-brand-warm-gray px-4 py-3.5 hover:bg-navy-100"
          >
            <Icon name={TOOLS[k].icon} size={20} color="var(--color-navy-400)" />
            <span className="min-w-0 flex-1">
              <span className="block type-item-title text-[14px] text-text-primary">
                {TOOLS[k].label}
              </span>
              <span className="block type-meta text-[14px] text-text-secondary">
                {TOOLS[k].detail}
              </span>
            </span>
            <Icon name="chevronRight" size={18} color="var(--color-text-neutral-400)" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function Disclaimer() {
  return (
    <p className="flex items-start gap-2 type-meta text-[14px] leading-5 text-text-secondary">
      <Icon name="info" size={16} color="var(--color-text-neutral-500)" className="mt-0.5 shrink-0" />
      <span>{DISCLAIMER}</span>
    </p>
  );
}

function ResultCard({ children }: { children: ReactNode }) {
  return (
    <aside className="overflow-hidden rounded-3xl border border-border-default bg-white lg:sticky lg:top-24">
      {children}
    </aside>
  );
}

function Explainer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border-divider">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left type-item-title text-[14px] text-text-primary"
      >
        How this is calculated
        <Icon
          name="chevronRight"
          size={18}
          color="var(--color-text-neutral-500)"
          className={cn("transition-transform", open ? "-rotate-90" : "rotate-90")}
        />
      </button>
      {open && (
        <div className="space-y-2 px-5 pb-5 type-meta text-[14px] leading-5 text-text-secondary">
          {children}
        </div>
      )}
    </div>
  );
}

function ValueRing({
  size = 144,
  stroke = 12,
  color,
  children,
}: {
  size?: number;
  stroke?: number;
  color: string;
  children: ReactNode;
}) {
  const r = (size - stroke) / 2;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

function CalculatorShell({
  title,
  subtitle,
  form,
  result,
}: {
  title: string;
  subtitle: string;
  form: ReactNode;
  result: ReactNode;
}) {
  const back = useBack("/you");
  return (
    <PageContainer>
      <div className="mx-auto max-w-[62rem]">
        <PageHeader title={title} subtitle={subtitle} onBack={back} />
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
          <div className="order-2 flex min-w-0 flex-col gap-8 lg:order-1">{form}</div>
          <div className="order-1 lg:order-2">{result}</div>
        </div>
      </div>
    </PageContainer>
  );
}

/* ------------------------------------------------------------------- BMI */

const BAND_COLORS = ["#aab4c8", "#bfe5d3", "#f3c05a", "#f7b4b4"] as const;
const BAND_RING = [
  "var(--color-navy-300)",
  "var(--color-control-on)",
  "#f0b94a",
  "var(--color-error-red)",
] as const;
const SCALE_MIN = 14;
const SCALE_MAX = 40;
const scalePct = (v: number) => `${((Math.min(SCALE_MAX, Math.max(SCALE_MIN, v)) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100}%`;

export function BmiCalculatorScreen() {
  const { profile, isLoading } = useProfile();
  const b = useBodyInputs(profile, isLoading);
  const imperial = b.units === "imperial";

  const hM = b.heightCm !== null && b.heightCm > 0 ? b.heightCm / 100 : null;
  const bmi = hM !== null && b.weightKg !== null && b.weightKg > 0 ? b.weightKg / hM ** 2 : null;
  const bandIdx = bmi === null ? -1 : BMI_BANDS.indexOf(bmiBand(bmi));

  let range: { text: string; note: string } | null = null;
  if (hM !== null && b.weightKg !== null && bmi !== null) {
    const lo = 18.5 * hM ** 2;
    const hi = 25 * hM ** 2;
    const conv = imperial ? kgToLb : (x: number) => x;
    const unit = imperial ? "lb" : "kg";
    const loD = Math.round(conv(lo));
    const hiD = Math.floor(conv(hi));
    const w = Math.round(conv(b.weightKg));
    const note =
      w > hiD ? `${w - hiD} ${unit} above this range` : w < loD ? `${loD - w} ${unit} below this range` : "Your weight is within this range";
    range = { text: `${loD}–${hiD} ${unit}`, note };
  }

  const form = (
    <>
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>Your measurements</Eyebrow>
          <ExampleLink b={b} />
        </div>
        <Segmented
          label="Units"
          options={[
            { key: "imperial", label: "Imperial (in, lb)" },
            { key: "metric", label: "Metric (cm, kg)" },
          ]}
          value={b.units}
          onChange={b.switchUnits}
        />
        <div className="grid grid-cols-2 gap-3">
          {imperial ? (
            <>
              <AppTextField type="number" label="Height (in)" value={b.inch} onChange={(v) => b.set({ inch: v, ft: undefined, ftIn: undefined })} />
              <AppTextField type="number" label="Weight (lb)" value={b.lb} onChange={(v) => b.set({ lb: v })} />
            </>
          ) : (
            <>
              <AppTextField type="number" label="Height (cm)" value={b.cm} onChange={(v) => b.set({ cm: v })} />
              <AppTextField type="number" label="Weight (kg)" value={b.kg} onChange={(v) => b.set({ kg: v })} />
            </>
          )}
        </div>
      </section>
      <OtherTools current="bmi" />
      <Disclaimer />
    </>
  );

  const result = (
    <ResultCard>
      <div className="px-5 pt-5">
        <p className="type-item-title text-[13px] text-text-secondary">Your BMI</p>
        <div className="mt-3 flex justify-center">
          <ValueRing size={160} stroke={13} color={bmi === null ? "var(--color-border-divider)" : BAND_RING[bandIdx]}>
            <span className="type-numeral text-[40px] leading-none tracking-[-1.6px] text-brand-navy">
              {bmi === null ? "—" : bmi.toFixed(1)}
            </span>
            <span className="mt-1 type-meta text-[14px] text-text-secondary">kg/m²</span>
          </ValueRing>
        </div>
        {bmi !== null && (
          <p className="mt-3 text-center type-item-title text-[14px] text-text-primary">
            {BMI_BANDS[bandIdx].label}
          </p>
        )}
        <div className="mt-5 pb-6">
          <div className="relative">
            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
              {BMI_BANDS.map((band, i) => (
                <span
                  key={band.label}
                  className="h-full"
                  style={{
                    background: BAND_COLORS[i],
                    flexGrow: Math.min(band.end, SCALE_MAX) - Math.max(band.start, SCALE_MIN),
                    flexBasis: 0,
                  }}
                />
              ))}
            </div>
            {bmi !== null && (
              <span
                aria-hidden
                className="absolute -top-1 h-[18px] w-[3px] -translate-x-1/2 rounded-full bg-brand-navy"
                style={{ left: scalePct(bmi) }}
              />
            )}
            {[18.5, 25, 30].map((t) => (
              <span
                key={t}
                className="absolute top-4 -translate-x-1/2 type-meta text-[12px] text-text-secondary"
                style={{ left: scalePct(t) }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border-divider px-5 py-4">
        <p className="type-meta text-[14px] text-text-secondary">Healthy weight for this height</p>
        {range ? (
          <>
            <p className="mt-1 type-section-title text-[22px] tracking-[-0.8px] text-brand-navy">{range.text}</p>
            <p className="type-meta text-[14px] text-text-secondary">{range.note}</p>
          </>
        ) : (
          <p className="mt-1 type-meta text-[13px] text-text-secondary">
            Enter your height and weight to see your BMI.
          </p>
        )}
      </div>
      <Explainer>
        <p>BMI is your weight in kilograms divided by your height in metres, squared.</p>
        <p>Bands: under 18.5 underweight, 18.5–24.9 healthy, 25–29.9 overweight, 30 and over obesity.</p>
        <p>BMI can&apos;t tell muscle from fat or reflect where weight is carried, so treat it as one rough signal.</p>
      </Explainer>
    </ResultCard>
  );

  return (
    <CalculatorShell
      title="BMI Calculator"
      subtitle="Body mass index from your height and weight."
      form={form}
      result={result}
    />
  );
}

/* ------------------------------------------------------------ TDEE / cal */

function BodyAndActivity({ b, heading }: { b: BodyInputs; heading: string }) {
  return (
    <>
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>{heading}</Eyebrow>
          <ExampleLink b={b} />
        </div>
        <ImperialBodyFields b={b} />
        <SexField b={b} />
        <ActivityField b={b} />
      </section>
    </>
  );
}

function useEstimate(b: BodyInputs) {
  const ready = b.heightCm !== null && b.weightKg !== null && b.ageYears !== null;
  const base =
    ready && b.heightCm! > 0 && b.weightKg! > 0 && b.ageYears! > 0
      ? { weightKg: b.weightKg!, heightCm: b.heightCm!, age: b.ageYears, activityLevel: b.activity, sex: b.sex }
      : null;
  const resting = base ? Math.round(bmr({ ...base, age: base.age! })) : null;
  const total = base ? tdeeOf(base) : null;
  return { base, resting, total };
}

export function TdeeCalculatorScreen() {
  const { profile, isLoading } = useProfile();
  const b = useBodyInputs(profile, isLoading);
  const { base, resting, total } = useEstimate(b);
  const burn = total !== null && resting !== null ? total - resting : null;
  const restShare = total && resting ? Math.round((resting / total) * 100) : null;

  const form = (
    <>
      <BodyAndActivity b={b} heading="Your body" />
      <OtherTools current="tdee" />
      <Disclaimer />
    </>
  );

  const result = (
    <ResultCard>
      <div className="px-5 pt-5">
        <p className="type-item-title text-[13px] text-text-secondary">Your TDEE</p>
        <div className="mt-3 flex items-center gap-4">
          <ValueRing size={140} stroke={11} color={total === null ? "var(--color-border-divider)" : "var(--color-brand-navy)"}>
            <span className="type-numeral text-[30px] leading-none tracking-[-1.2px] text-brand-navy">
              {total === null ? "—" : fmt(total)}
            </span>
            <span className="mt-1 type-meta text-[13px] text-text-secondary">kcal/day</span>
          </ValueRing>
          {restShare !== null ? (
            <p className="type-meta text-[14px] leading-5 text-text-secondary">
              <strong className="type-item-title text-text-primary">{restShare}%</strong> of it is what you burn at
              rest; the rest is your activity.
            </p>
          ) : (
            <p className="type-meta text-[14px] leading-5 text-text-secondary">
              Enter your height, weight and age to see your TDEE.
            </p>
          )}
        </div>
        {total !== null && resting !== null && burn !== null && (
          <div className="mt-5 pb-5">
            <div className="flex h-2 overflow-hidden rounded-full">
              <span className="bg-brand-navy" style={{ width: `${(resting / total) * 100}%` }} />
              <span className="flex-1 bg-accent" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="flex items-center gap-1.5 type-meta text-[13px] text-text-secondary">
                  <span className="size-2 rounded-full bg-brand-navy" /> Resting (BMR)
                </p>
                <p className="type-item-title text-[13px] text-text-primary">{fmt(resting)} kcal</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 type-meta text-[13px] text-text-secondary">
                  <span className="size-2 rounded-full bg-accent" /> Activity ×{ACTIVITY_MULTIPLIER[b.activity]}
                </p>
                <p className="type-item-title text-[13px] text-text-primary">+{fmt(burn)} kcal</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-border-divider px-5 py-4">
        <p className="type-item-title text-[13px] text-text-primary">What your goal would target</p>
        <ul className="mt-2 divide-y divide-border-divider">
          {GOAL_KEYS.map((g) => {
            const target = base ? calorieTarget({ ...base, goal: g }) : null;
            return (
              <li key={g} className="flex items-center gap-2 py-2.5 type-meta text-[13px] text-text-secondary">
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  {GOAL_LABEL[g]}
                  {profile?.goal === g && (
                    <span className="rounded-md bg-navy-100 px-1.5 py-0.5 text-[11px] text-text-secondary">Your goal</span>
                  )}
                </span>
                <span className="tabular-nums">{signed(GOAL_CALORIE_DELTA[g])}</span>
                <span className="w-14 text-right type-item-title tabular-nums text-text-primary">
                  {target === null ? "—" : fmt(target)}
                </span>
              </li>
            );
          })}
        </ul>
        <Link to="/you/calories" className="mt-3 inline-flex items-center gap-1 type-button text-[13px] text-primary underline underline-offset-2">
          Set a daily target
          <Icon name="chevronRight" size={14} color="currentColor" />
        </Link>
      </div>
      <Explainer>
        <p>
          Resting energy (BMR) uses the Mifflin-St Jeor equation from your weight, height, age and sex. &ldquo;Other / prefer
          not to say&rdquo; uses the midpoint between the male and female constants.
        </p>
        <p>TDEE is BMR multiplied by an activity factor from ×1.2 (sedentary) up to ×1.725 (very active).</p>
      </Explainer>
    </ResultCard>
  );

  return (
    <CalculatorShell
      title="TDEE Calculator"
      subtitle="Total daily energy expenditure — what you burn on an average day."
      form={form}
      result={result}
    />
  );
}

const MACRO_COLORS = { protein: "var(--color-control-on)", carbs: "var(--color-accent)", fat: "#f0b94a" } as const;

export function CalorieCalculatorScreen() {
  const { profile, isLoading, update } = useProfile();
  const b = useBodyInputs(profile, isLoading);
  const { base, resting, total } = useEstimate(b);
  const target = base ? calorieTarget({ ...base, goal: b.goal }) : null;
  const delta = GOAL_CALORIE_DELTA[b.goal];
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await update({ goal: b.goal, activityLevel: b.activity });
      toast.success("Goal and activity level saved");
    } catch {
      toast.error("Couldn't save your target. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const form = (
    <>
      <section className="flex flex-col gap-3">
        <Eyebrow>Your goal</Eyebrow>
        <div role="radiogroup" aria-label="Goal" className="grid grid-cols-2 gap-1 rounded-2xl bg-brand-warm-gray p-1">
          {GOAL_KEYS.map((g) => {
            const on = b.goal === g;
            return (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => b.set({ goal: g })}
                className={cn(
                  "flex min-h-[4.25rem] flex-col items-center justify-center rounded-xl px-3 py-3 text-center",
                  on ? SELECTED_CHIP : UNSELECTED_CHIP,
                )}
              >
                <span className="flex items-center gap-1.5 type-item-title text-[14px]">
                  {on && <CheckMark size={14} />}
                  {GOAL_LABEL[g]}
                </span>
                <span className={cn("type-meta text-[14px]", on ? "text-on-selected/90" : "text-text-secondary")}>
                  {signed(GOAL_CALORIE_DELTA[g])} kcal
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <BodyAndActivity b={b} heading="Your details" />
      <OtherTools current="calories" />
      <Disclaimer />
    </>
  );

  const macros = target !== null ? macroGrams(target) : null;

  const result = (
    <ResultCard>
      <div className="px-5 pt-5">
        <p className="type-item-title text-[13px] text-text-secondary">Daily target</p>
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="type-numeral text-[44px] leading-none tracking-[-1.8px] text-brand-navy">
            {target === null ? "—" : fmt(target)}
          </span>
          <span className="type-meta text-[14px] text-text-secondary">kcal/day</span>
        </p>
        {total !== null && target === null && (
          <p role="status" className="mt-2 type-meta text-[14px] text-text-secondary">
            Targets under 1,000 kcal aren&apos;t recommended. Check your details or pick another goal.
          </p>
        )}
        {resting !== null && total !== null ? (
          <dl className="mt-4 divide-y divide-border-divider border-y border-border-divider type-meta text-[14px]">
            <Row label="BMR" value={`${fmt(resting)} kcal`} />
            <Row label={`× activity (${ACTIVITY_MULTIPLIER[b.activity]})`} value={`${fmt(total)} kcal`} />
            <Row label={`Goal adjustment (${GOAL_LABEL[b.goal]})`} value={`${signed(delta)} kcal`} />
          </dl>
        ) : (
          <p className="mt-3 type-meta text-[14px] text-text-secondary">
            Enter your height, weight and age to see your target.
          </p>
        )}
        <button
          type="button"
          disabled={target === null || saving}
          onClick={save}
          className="mt-4 mb-5 flex h-12 w-full items-center justify-center rounded-full bg-primary type-button text-[14px] text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-primary-soft disabled:text-text-secondary"
        >
          {saving ? "Saving…" : "Use this as my target"}
        </button>
      </div>
      {macros && (
        <div className="border-t border-border-divider px-5 py-4">
          <p className="type-item-title text-[13px] text-text-primary">Macro split (30 / 40 / 30)</p>
          <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full">
            {macros.map((m) => (
              <span key={m.key} style={{ width: `${m.pct}%`, background: MACRO_COLORS[m.key] }} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {macros.map((m) => (
              <div key={m.key}>
                <p className="flex items-center gap-1.5 type-meta text-[13px] text-text-secondary">
                  <span className="size-2 rounded-full" style={{ background: MACRO_COLORS[m.key] }} />
                  {m.label}
                </p>
                <p className="type-item-title text-[15px] text-text-primary">{m.grams}g</p>
                <p className="type-meta text-[12px] text-text-secondary">{m.pct}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <Explainer>
        <p>
          BMR (Mifflin-St Jeor) × your activity factor gives your TDEE. The goal then adds or removes calories: −500 to
          lose weight, +500 to build muscle, −200 for recomposition.
        </p>
        <p>Macros split the target 30% protein, 40% carbs, 30% fat (4, 4 and 9 kcal per gram).</p>
      </Explainer>
    </ResultCard>
  );

  return (
    <CalculatorShell
      title="Calorie Calculator"
      subtitle="A daily target from your body, movement and goal."
      form={form}
      result={result}
    />
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="type-item-title tabular-nums text-text-primary">{value}</dd>
    </div>
  );
}
