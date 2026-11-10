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
import { useAsync } from "@/lib/hooks";
import { authApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const termsId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const { execute, isLoading, error } = useAsync(authApi.register);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Demo mode: no blocking client-side validation — the flow always proceeds.
    const result = await execute({ name, email, password });
    if (result) {
      toast.success("Account created. Check your email to verify it.");
      router.push(
        `${ROUTES.verifyEmail}?email=${encodeURIComponent(result.email)}`,
      );
    }
  }

  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <AuthHeader
          showBrand
          heading="Create your account"
          subtext="Just enough to save your progress. Your goals and body context come next."
        />
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <TextField
            label="Full name"
            type="text"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
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
              <Link href={ROUTES.about}>Terms</Link> and{" "}
              <Link href={ROUTES.about}>Privacy&nbsp;Policy</Link>.
            </Label>
          </div>

          {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}

          <Button type="submit" className={styles.submit} disabled={isLoading}>
            {isLoading ? "Creating account..." : "Register"}
          </Button>
        </form>

        <SocialAuthButtons dividerLabel="Or sign up with" />

        <p className={styles.footer}>
          Already have an account? <Link href={ROUTES.login}>Sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
