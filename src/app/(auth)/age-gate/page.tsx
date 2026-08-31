"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TextField } from "@/components/TextField";
import { AuthHeader } from "@/components/AuthHeader";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { ageGateApi, getErrorMessage } from "@/lib/api";
import { ensureGuestSession, getSession } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

export default function AgeGatePage() {
  const router = useRouter();
  const [age, setAge] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedAge = Number(age);
    if (!Number.isFinite(parsedAge) || parsedAge <= 0) {
      setError("Enter your age.");
      return;
    }
    if (!confirmed) {
      setError("Please confirm you meet the minimum age.");
      return;
    }

    setSubmitting(true);
    try {
      const sessionId = getSession().accessToken ? undefined : await ensureGuestSession();
      const result = await ageGateApi.verifyAgeGate({
        age: parsedAge,
        isAgeConfirmed: confirmed,
        sessionId,
      });

      if (!result.allowed) {
        setError(
          `You must be at least ${result.minimumAge} to use ForkThis!.`,
        );
        return;
      }
      router.push(ROUTES.onboarding.welcome);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <AuthHeader
          heading="Before we start"
          subtext="ForkThis! is for people aged 13 and over. Tell us your age to continue."
        />
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <TextField
            label="Your age"
            type="number"
            name="age"
            inputMode="numeric"
            min={1}
            value={age}
            onChange={(event) => setAge(event.target.value)}
          />
          <div className={styles.confirm}>
            <Checkbox
              id="age-confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(Boolean(checked))}
            />
            <Label htmlFor="age-confirm" className={styles.confirmLabel}>
              I confirm the age above is accurate.
            </Label>
          </div>

          {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}

          <Button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? "Checking…" : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
