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
  const [localError, setLocalError] = useState<string | null>(null);

  const effectiveDob = dateOfBirth || session?.dateOfBirth || "";
  const effectiveHeight = heightCm || (session?.heightCm ? String(session.heightCm) : "");
  const effectiveWeight = weightKg || (session?.weightKg ? String(session.weightKg) : "");

  const heightNum = Number(effectiveHeight);
  const weightNum = Number(effectiveWeight);
  const complete =
    Boolean(effectiveDob) &&
    Number.isFinite(heightNum) &&
    heightNum > 0 &&
    Number.isFinite(weightNum) &&
    weightNum > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (!effectiveDob) {
      setLocalError("Enter your date of birth.");
      return;
    }
    if (!Number.isFinite(heightNum) || heightNum <= 0) {
      setLocalError("Enter a valid height.");
      return;
    }
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
      setLocalError("Enter a valid weight.");
      return;
    }

    const result = await save({
      currentStep: 2,
      completedSteps: [0, 1],
      dateOfBirth: effectiveDob,
      heightCm: heightNum,
      weightKg: weightNum,
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
      description="Used to estimate your energy needs. You can change these later in settings."
    >
      {isLoading ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.fields} noValidate>
          <TextField
            label="Date of birth *"
            type="date"
            name="dateOfBirth"
            required
            value={effectiveDob}
            onChange={(e) => {
              setDateOfBirth(e.target.value);
              setLocalError(null);
            }}
          />
          <div className={styles.row}>
            <TextField
              label="Height (cm) *"
              type="number"
              name="heightCm"
              inputMode="numeric"
              required
              min={1}
              value={effectiveHeight}
              onChange={(e) => {
                setHeightCm(e.target.value);
                setLocalError(null);
              }}
            />
            <TextField
              label="Weight (kg) *"
              type="number"
              name="weightKg"
              inputMode="decimal"
              required
              min={1}
              value={effectiveWeight}
              onChange={(e) => {
                setWeightKg(e.target.value);
                setLocalError(null);
              }}
            />
          </div>
          <div>
            <label className={styles.fieldLabel} htmlFor="sex">
              Sex
            </label>
            <select
              id="sex"
              className={styles.select}
              value={sex || session?.sex || ""}
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

          {localError ?? error ? (
            <FormErrorMessage>{(localError ?? error) as string}</FormErrorMessage>
          ) : null}

          <Button
            size="lg"
            type="submit"
            className={styles.submit}
            disabled={isSaving || !complete}
          >
            {isSaving ? "Saving…" : "Next"}
          </Button>
        </form>
      )}
    </OnboardingFormShell>
  );
}
