"use client";

import { useMemo, useState } from "react";
import { AppTextField, NameFields, validateFirstName } from "@/components/TextField";
import { PrimaryButton } from "@/components/Button";
import { FormSection, ProfileLayout } from "@/components/Track/ProfileParts";
import {
  ageFromDob,
  calorieTarget,
  cmToInches,
  dobToIso,
  inchesToCm,
  isoToDob,
  kgToLb,
  lbToKg,
  tdee,
} from "@/lib/nutrition";
import { EmptyState } from "@/components/Feedback";
import { Link } from "@/lib/nav";
import { toast, useAppSession, useProfile, type UserProfile } from "@/lib/store";
import { getErrorMessage } from "@/lib/api";

interface Form {
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  feet: string;
  inches: string;
  pounds: string;
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

function initial(p: UserProfile): Form {
  const total = p.heightCm ? Math.round(cmToInches(p.heightCm)) : null;
  return {
    firstName: p.firstName,
    middleName: "",
    lastName: p.lastName,
    dob: isoToDob(p.dateOfBirth),
    feet: total === null ? "" : String(Math.floor(total / 12)),
    inches: total === null ? "" : String(total % 12),
    pounds: p.weightKg ? String(Math.round(kgToLb(p.weightKg))) : "",
  };
}

const totalInches = (f: Form) =>
  !f.feet.trim() && !f.inches.trim() ? null : Number(f.feet || 0) * 12 + Number(f.inches || 0);
const same = (a: Form, b: Form) =>
  (Object.keys(a) as (keyof Form)[]).every((k) => a[k].trim() === b[k].trim());

function validate(f: Form) {
  const e: Partial<Record<"firstName" | "dob" | "height" | "weight", string>> = {};
  const name = validateFirstName(f);
  if (name) e.firstName = name;
  if (f.dob.trim()) {
    const age = ageFromDob(f.dob);
    if (age === null) e.dob = "Use MM/DD/YYYY, e.g. 03/15/1993.";
    else if (age < 13 || age > 120) e.dob = "Check the year — that age is outside 13–120.";
  }
  const h = totalInches(f);
  if (h !== null && (!Number.isFinite(h) || h < 36 || h > 98)) e.height = "Height should be between 3'0\" and 8'2\".";
  if (f.pounds.trim()) {
    const n = Number(f.pounds);
    if (!Number.isFinite(n) || n < 55 || n > 700) e.weight = "Weight should be between 55 and 700 lb.";
  }
  return e;
}

function figures(p: UserProfile, f: Form) {
  const h = totalInches(f);
  const heightCm = h === null ? null : inchesToCm(h);
  const weightKg = f.pounds.trim() ? lbToKg(Number(f.pounds)) : null;
  const age = ageFromDob(f.dob) ?? p.age;
  if (!heightCm || !weightKg || !age) return { target: null, tdee: null, bmi: null };
  const input = {
    weightKg,
    heightCm,
    age,
    activityLevel: p.activityLevel ?? ("moderatelyActive" as const),
    sex: (p.sex as "male" | "female" | "other" | null) ?? "other",
  };
  return {
    target: p.goal ? calorieTarget({ ...input, goal: p.goal }) : null,
    tdee: tdee(input),
    bmi: weightKg / (heightCm / 100) ** 2,
  };
}

function Delta({
  label,
  unit,
  from,
  to,
  format = fmt,
}: {
  label: string;
  unit?: string;
  from: number | null;
  to: number | null;
  format?: (n: number) => string;
}) {
  const changed = from !== null && to !== null && format(from) !== format(to);
  return (
    <div className="flex items-baseline gap-2 py-2.5">
      <dt className="min-w-0 flex-1 type-meta text-[13px] text-text-secondary">{label}</dt>
      <dd className="type-meta text-right text-[13px] tabular-nums text-text-primary">
        {to === null ? (
          <span className="text-text-secondary">—</span>
        ) : (
          <>
            {changed && from !== null && (
              <span className="text-text-secondary">
                <span className="sr-only">from </span>
                {format(from)}
                <span aria-hidden="true"> → </span>
                <span className="sr-only"> to </span>
              </span>
            )}
            <span className="type-row-figure">{format(to)}</span>
            {unit && <span className="text-text-secondary"> {unit}</span>}
          </>
        )}
      </dd>
    </div>
  );
}

function Editor({ profile, update }: { profile: UserProfile; update: (p: Parameters<ReturnType<typeof useProfile>["update"]>[0]) => Promise<void> }) {
  const [saved, setSaved] = useState(() => initial(profile));
  const [form, setForm] = useState(saved);
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({});
  const [busy, setBusy] = useState(false);
  const dirty = !same(form, saved);
  const set = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));
  const before = useMemo(() => figures(profile, saved), [profile, saved]);
  const after = useMemo(() => figures(profile, form), [profile, form]);

  const save = async () => {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const h = totalInches(form);
    const iso = dobToIso(form.dob);
    setBusy(true);
    try {
      await update({
        givenName: form.firstName.trim(),
        familyName: form.lastName.trim() || undefined,
        dateOfBirth: iso ?? undefined,
        age: ageFromDob(form.dob) ?? undefined,
        heightCm: h === null ? undefined : Math.round(inchesToCm(h)),
        weightKg: form.pounds.trim() ? Math.round(lbToKg(Number(form.pounds)) * 10) / 10 : undefined,
      });
      setSaved(form);
      toast.success("Details saved", {
        body:
          after.target === null
            ? "Add height, weight and date of birth for a personal calorie target."
            : before.target === after.target
              ? undefined
              : `Your daily target is now ${fmt(after.target)} kcal.`,
      });
    } catch (err) {
      toast.error("Couldn't save your details", { body: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const aside = (
    <section className="panel p-5">
      <h2 className="text-[15px] type-section-title tracking-[-0.5px] text-brand-navy">What this changes</h2>
      <p className="mt-1 type-meta text-[13px] leading-5 text-text-secondary">
        Updates as you type. Nothing is saved until you press Save.
      </p>
      <dl className="mt-3 divide-y divide-border-divider">
        <Delta label="Calorie target" unit="kcal/day" from={before.target} to={after.target} />
        <Delta label="TDEE" unit="kcal/day" from={before.tdee} to={after.tdee} />
        <Delta label="BMI" from={before.bmi} to={after.bmi} format={(n) => n.toFixed(1)} />
      </dl>
      {after.target === null && (
        <p className="mt-3 rounded-xl bg-navy-soft p-3 type-meta text-[12px] leading-5 text-brand-navy">
          A calorie target needs height, weight and date of birth.
        </p>
      )}
    </section>
  );

  return (
    <ProfileLayout
      title="Personal details"
      subtitle="Your name, contact and the body details your targets use."
      aside={aside}
      asideLabel="What this changes"
      footer={
        <div className="flex items-center gap-3">
          <p role="status" className="min-w-0 flex-1 type-meta text-[13px] text-text-secondary">
            {dirty ? "Unsaved changes" : "All changes saved"}
          </p>
          <PrimaryButton
            label={busy ? "Saving…" : "Save"}
            onPress={() => void save()}
            disabled={!dirty || busy}
            size="medium"
            className="w-36 md:w-44"
          />
        </div>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (dirty && !busy) void save();
        }}
      >
        <FormSection title="Name">
          <div className="flex flex-col gap-3">
            <NameFields
              value={{ firstName: form.firstName, middleName: form.middleName, lastName: form.lastName }}
              onChange={(v) => set(v)}
              error={errors.firstName}
            />
          </div>
        </FormSection>
        <FormSection title="Contact">
          <AppTextField
            label="Email"
            type="email"
            autoComplete="email"
            value={profile.email ?? ""}
            hint="Your sign-in email can't be changed here."
            onChange={() => {}}
          />
        </FormSection>
        <FormSection title="Body" description="Used for your calorie target, TDEE and BMI. Never shared.">
          <div className="flex flex-col gap-3">
            <AppTextField
              label="Date of birth"
              placeholder="MM/DD/YYYY"
              autoComplete="bday"
              value={form.dob}
              error={errors.dob}
              onChange={(dob) => set({ dob })}
            />
            <div className="grid grid-cols-2 gap-3">
              <AppTextField label="Height (ft)" type="number" placeholder="5" value={form.feet} onChange={(feet) => set({ feet })} />
              <AppTextField label="Height (in)" type="number" placeholder="7" value={form.inches} onChange={(inches) => set({ inches })} />
            </div>
            {errors.height && (
              <p role="alert" className="-mt-1 text-xs type-meta text-error-red">
                {errors.height}
              </p>
            )}
            <AppTextField
              label="Weight (lb)"
              type="number"
              placeholder="165"
              value={form.pounds}
              error={errors.weight}
              onChange={(pounds) => set({ pounds })}
            />
          </div>
        </FormSection>
      </form>
    </ProfileLayout>
  );
}

export function PersonalDetailsScreen() {
  const session = useAppSession();
  const { profile, update, isLoading } = useProfile();
  if (!session.isSignedIn)
    return (
      <ProfileLayout title="Personal details" subtitle="Your name, contact and the body details your targets use.">
        <EmptyState
          icon="person"
          title="You're browsing as a guest"
          body="Create an account or log in to manage your personal details."
          action={{ label: "Create an account", to: "/signup?next=/you/personal-details" }}
        />
        <p className="mt-3 text-center type-meta text-[13px] text-text-secondary">
          Already have an account?{" "}
          <Link
            to="/login?next=/you/personal-details"
            className="type-button text-primary underline underline-offset-2"
          >
            Log in
          </Link>
        </p>
      </ProfileLayout>
    );
  if (!profile)
    return (
      <ProfileLayout title="Personal details" subtitle="Your name, contact and the body details your targets use.">
        <p className="panel p-4 text-[13px] type-meta text-text-secondary">{isLoading ? "Loading…" : "Couldn't load your profile."}</p>
      </ProfileLayout>
    );
  return <Editor key={profile.email ?? "guest"} profile={profile} update={update} />;
}
