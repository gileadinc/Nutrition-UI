"use client";

import { FormEvent, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TextField } from "@/components/TextField";
import { PasswordField } from "@/components/PasswordField";
import { AuthHeader } from "@/components/AuthHeader";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { toast } from "sonner";
import { authApi, getErrorMessage } from "@/lib/api";
import { migrateGuestProgress, setSession } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

/** Cognito needs a moment to propagate a new user before sign-in succeeds. */
async function signInWithRetry(email: string, password: string, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await authApi.signIn({ email, password });
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 2500));
    }
  }
  throw new Error("Sign-in failed after retries.");
}

export default function RegisterPage() {
  const router = useRouter();
  const termsId = useId();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setLocalError("Enter your first and last name.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setLocalError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.signUp({
        email,
        password,
        givenName: firstName.trim(),
        familyName: lastName.trim(),
      });
      // The dev backend auto-confirms accounts, so sign in straight away.
      const session = await signInWithRetry(email, password);
      if (session.accessToken) {
        setSession({
          accessToken: session.accessToken,
          idToken: session.idToken,
          refreshToken: session.refreshToken,
          email: session.email ?? email,
          userId: session.userId,
          expiresIn: session.expiresIn,
        });

        // If this user already completed onboarding as a guest on this device,
        // migrate it into the account and skip straight to the app.
        const migration = await migrateGuestProgress();
        if (migration?.migratedOnboarding) {
          toast.success("Account created. Your setup carried over.");
          router.push(ROUTES.dashboard);
        } else {
          toast.success("Account created. Let's set up your goals.");
          router.push(ROUTES.ageGate);
        }
      } else {
        toast.success("Account created. Please sign in.");
        router.push(ROUTES.login);
      }
    } catch (err) {
      setLocalError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const isLoading = submitting;

  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <AuthHeader
          heading="Create your account"
          subtext="Just enough to save your progress. Your goals and body context come next."
        />
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.nameRow}>
            <TextField
              label="First name"
              type="text"
              name="given-name"
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
            <TextField
              label="Last name"
              type="text"
              name="family-name"
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>
          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <PasswordField
            label="New password"
            name="password"
            autoComplete="new-password"
            placeholder="Enter new password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <PasswordField
            label="Confirm password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />

          <div className={styles.terms}>
            <Checkbox
              id={termsId}
              name="agree"
              className={styles.termsCheckbox}
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(Boolean(checked))}
            />
            <Label htmlFor={termsId} className={styles.termsLabel}>
              By creating an account you agree to our{" "}
              <Link href={ROUTES.home}>Terms</Link> and{" "}
              <Link href={ROUTES.home}>Privacy&nbsp;Policy</Link>.
            </Label>
          </div>

          {localError ? <FormErrorMessage>{localError}</FormErrorMessage> : null}

          <Button type="submit" className={styles.submit} disabled={isLoading}>
            {isLoading ? "Creating account..." : "Register"}
          </Button>
        </form>

        <SocialAuthButtons dividerLabel="Or use email" />

        <p className={styles.footer}>
          Already have an account? <Link href={ROUTES.login}>Sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
