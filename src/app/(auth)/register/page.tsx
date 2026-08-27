"use client";

import { FormEvent, useId, useState } from "react";
import Link from "next/link";
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

function validate(values: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreed: boolean;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Enter your full name.";
  }
  if (!values.email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!values.password) {
    errors.password = "Choose a password.";
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (!values.confirmPassword) {
    errors.confirmPassword = "Repeat your password.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }
  if (!values.agreed) {
    errors.terms = "Please accept the terms to continue.";
  }

  return errors;
}

export default function RegisterPage() {
  const termsId = useId();
  const termsErrorId = `${termsId}-error`;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const { execute, isLoading, error } = useAsync(authApi.register);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate({ name, email, password, confirmPassword, agreed });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const result = await execute({ name, email, password });
    if (result) {
      toast.success("Account created. Let's set up your goals.");
    }
  }

  return (
    <Card className="py-8">
      <CardContent className="px-8">
        <AuthHeader
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
            error={fieldErrors.name}
            required
          />
          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
            required
          />
          <PasswordField
            label="New password"
            name="password"
            autoComplete="new-password"
            placeholder="Enter new password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            required
          />
          <PasswordField
            label="Confirm password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={fieldErrors.confirmPassword}
            required
          />

          <div className={styles.terms}>
            <Checkbox
              id={termsId}
              name="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(Boolean(checked))}
              aria-invalid={Boolean(fieldErrors.terms)}
              aria-describedby={fieldErrors.terms ? termsErrorId : undefined}
            />
            <Label htmlFor={termsId} className={styles.termsLabel}>
              By creating an account you agree to our{" "}
              <Link href={ROUTES.about}>Terms</Link> and{" "}
              <Link href={ROUTES.about}>Privacy Policy</Link>.
            </Label>
          </div>
          {fieldErrors.terms ? (
            <p id={termsErrorId} className={styles.termsError} role="alert">
              {fieldErrors.terms}
            </p>
          ) : null}

          {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}

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
