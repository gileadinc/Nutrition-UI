"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingFormShell } from "@/components/Onboarding";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/TextField";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { Spinner } from "@/components/ui/spinner";
import { useOnboardingSession } from "@/lib/hooks";
import { ROUTES } from "@/lib/constants";
import styles from "../onboarding-form.module.css";

export default function OnboardingBasicsPage() {
  const router = useRouter();
  const { session, isLoading, error, save, isSaving } = useOnboardingSession();

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [sex, setSex] = useState("");
  const [unitsPreference, setUnitsPreference] = useState("metric");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await save({
      currentStep: 2,
      completedSteps: [0, 1],
      dateOfBirth: dateOfBirth || (session?.dateOfBirth ?? undefined),
      heightCm: heightCm ? Number(heightCm) : (session?.heightCm ?? undefined),
      weightKg: weightKg ? Number(weightKg) : (session?.weightKg ?? undefined),
      sex: sex || (session?.sex ?? undefined),
      unitsPreference,
    });
    if (result) router.push(ROUTES.onboarding.health);
  }

  return (
    <OnboardingFormShell
      step={2}
      total={3}
      eyebrow="Private basics"
      heading="A few body stats"
      description="Used to estimate your energy needs. You can change or clear these later in settings."
    >
      {isLoading ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.fields} noValidate>
          <TextField
            label="Date of birth"
            type="date"
            name="dateOfBirth"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
          <div className={styles.row}>
            <TextField
              label="Height (cm)"
              type="number"
              name="heightCm"
              inputMode="numeric"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
            <TextField
              label="Weight (kg)"
              type="number"
              name="weightKg"
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </div>
          <div>
            <label className={styles.fieldLabel} htmlFor="sex">
              Sex
            </label>
            <select
              id="sex"
              className={styles.select}
              value={sex}
              onChange={(e) => setSex(e.target.value)}
            >
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
          <div>
            <label className={styles.fieldLabel} htmlFor="units">
              Units
            </label>
            <select
              id="units"
              className={styles.select}
              value={unitsPreference}
              onChange={(e) => setUnitsPreference(e.target.value)}
            >
              <option value="metric">Metric (cm / kg)</option>
              <option value="imperial">Imperial (in / lb)</option>
            </select>
          </div>

          {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}

          <Button size="lg" type="submit" className={styles.submit} disabled={isSaving}>
            {isSaving ? "Saving…" : "Next"}
          </Button>
          <button
            type="button"
            className={styles.skip}
            onClick={() => router.push(ROUTES.onboarding.health)}
          >
            Skip for now
          </button>
        </form>
      )}
    </OnboardingFormShell>
  );
}
