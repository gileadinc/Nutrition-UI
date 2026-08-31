"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingFormShell } from "@/components/Onboarding";
import { Button } from "@/components/ui/button";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { Spinner } from "@/components/ui/spinner";
import { useOnboardingSession } from "@/lib/hooks";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import styles from "../onboarding-form.module.css";

const GOALS = [
  { value: "weight_loss", label: "Lose weight", hint: "Stay in a calorie deficit without feeling deprived." },
  { value: "maintenance", label: "Maintain", hint: "Hold steady and eat with more confidence." },
  { value: "muscle_gain", label: "Build muscle", hint: "Hit protein targets and fuel training." },
  { value: "surgical_recovery", label: "Surgical recovery", hint: "Eat to support healing after a procedure." },
];

export default function OnboardingGoalsPage() {
  const router = useRouter();
  const { session, isLoading, error, save, isSaving } = useOnboardingSession();
  const [goal, setGoal] = useState<string | null>(null);
  const selected = goal ?? session?.goal ?? null;

  async function handleNext() {
    if (!selected) return;
    const result = await save({ goal: selected, currentStep: 1, completedSteps: [0] });
    if (result) router.push(ROUTES.onboarding.basics);
  }

  return (
    <OnboardingFormShell
      step={1}
      total={3}
      eyebrow="Goal setup"
      heading="What are you working toward?"
      description="This shapes your calorie and macro targets and the meals we recommend."
    >
      {isLoading ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : (
        <>
          <div className={styles.options}>
            {GOALS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(styles.option, selected === option.value && styles.optionActive)}
                onClick={() => setGoal(option.value)}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionHint}>{option.hint}</span>
              </button>
            ))}
          </div>

          {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}

          <Button
            size="lg"
            className={styles.submit}
            onClick={handleNext}
            disabled={!selected || isSaving}
          >
            {isSaving ? "Saving…" : "Next"}
          </Button>
        </>
      )}
    </OnboardingFormShell>
  );
}
