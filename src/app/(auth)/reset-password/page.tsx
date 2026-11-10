"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/PasswordField";
import { PasswordStrength } from "@/components/PasswordStrength";
import { AuthHeader } from "@/components/AuthHeader";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { useAsync } from "@/lib/hooks";
import { authApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import styles from "./page.module.css";

interface Rule {
  label: string;
  test: (value: string) => boolean;
}

const RULES: Rule[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "At least 1 uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "At least 1 number", test: (v) => /\d/.test(v) },
];

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "demo-token";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { execute, isLoading, error } = useAsync(authApi.resetPassword);

  const mismatch = confirmPassword.length > 0 && confirmPassword !== password;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await execute({ token, password });
    if (result) {
      router.push(ROUTES.resetPasswordDone);
    }
  }

  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <AuthHeader
          heading="Create new password"
          subtext="Your new password must be different from any of your previously used passwords."
        />
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <PasswordField
              label="New password"
              name="password"
              autoComplete="new-password"
              placeholder="Enter new password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <PasswordStrength password={password} />
          </div>

          <PasswordField
            label="Confirm password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={mismatch ? "Passwords do not match." : undefined}
          />

          <ul className={styles.rules}>
            {RULES.map((rule) => {
              const passed = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={cn(styles.rule, passed && styles.rulePassed)}
                >
                  <span className={styles.ruleIcon} aria-hidden="true">
                    {passed ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                  </span>
                  {rule.label}
                </li>
              );
            })}
          </ul>

          {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}

          <Button type="submit" className={styles.submit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Reset Password"}
          </Button>
        </form>
        <p className={styles.footer}>
          <Link href={ROUTES.login}>Back to sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
