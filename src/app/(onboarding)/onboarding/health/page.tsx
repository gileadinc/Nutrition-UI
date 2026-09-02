"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OnboardingFormShell } from "@/components/Onboarding";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/TextField";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { Spinner } from "@/components/ui/spinner";
import { useOnboardingSession } from "@/lib/hooks";
import { getSession } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import styles from "../onboarding-form.module.css";

const ACTIVITY = [
  { value: "sedentary", label: "Sedentary — little or no exercise" },
  { value: "lightly_active", label: "Lightly active — 1–3 days/week" },
  { value: "moderately_active", label: "Moderately active — 3–5 days/week" },
  { value: "very_active", label: "Very active — 6–7 days/week" },
];

export default function OnboardingHealthPage() {
  const router = useRouter();
  const { session, isLoading, error, save, isSaving } = useOnboardingSession();

  const [activityLevel, setActivityLevel] = useState("");
  const [surgicalContext, setSurgicalContext] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const effectiveActivity = activityLevel || session?.activityLevel || "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (!effectiveActivity) {
      setLocalError("Select your activity level to finish.");
      return;
    }

    const result = await save({
      currentStep: 3,
      completedSteps: [0, 1, 2],
      activityLevel: effectiveActivity,
      surgicalContext: surgicalContext || (session?.surgicalContext ?? undefined),
      isCompleted: true,
    });
    if (result) {
      toast.success("You're all set.");
      router.push(getSession().accessToken ? ROUTES.dashboard : ROUTES.register);
    }
  }

  return (
    <OnboardingFormShell
      step={3}
      total={3}
      eyebrow="Health context"
      heading="Anything we should know?"
      description="Your activity level sets your calorie target. Medical context is optional but helps us tailor guidance."
    >
      {isLoading ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.fields} noValidate>
          <div>
            <label className={styles.fieldLabel} htmlFor="activity">
              Activity level <span aria-hidden="true">*</span>
            </label>
            <select
              id="activity"
              className={styles.select}
              required
              aria-invalid={Boolean(localError)}
              value={effectiveActivity}
              onChange={(e) => {
                setActivityLevel(e.target.value);
                setLocalError(null);
              }}
            >
              <option value="">Choose one</option>
              {ACTIVITY.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <TextField
            label="Surgical or medical context (optional)"
            type="text"
            name="surgicalContext"
            placeholder="e.g. Recovering from bariatric surgery"
            value={surgicalContext}
            onChange={(e) => setSurgicalContext(e.target.value)}
          />

          {localError ?? error ? (
            <FormErrorMessage>{(localError ?? error) as string}</FormErrorMessage>
          ) : null}

          <Button
            size="lg"
            type="submit"
            className={styles.submit}
            disabled={isSaving || !effectiveActivity}
          >
            {isSaving ? "Finishing…" : "Finish setup"}
          </Button>
        </form>
      )}
    </OnboardingFormShell>
  );
}
