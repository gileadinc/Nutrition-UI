"use client";

import { FormEvent, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TextField } from "@/components/TextField";
import { PasswordField } from "@/components/PasswordField";
import { AuthHeader } from "@/components/AuthHeader";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { LegalDialog } from "@/components/LegalDialog";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { toast } from "sonner";
import { useAsync } from "@/lib/hooks";
import { authApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import styles from "../auth.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const termsId = useId();

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const { execute, isLoading, error } = useAsync(authApi.register);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Demo mode: no blocking client-side validation — the flow always proceeds.
    const name = [firstName, middleName, lastName]
      .map((p) => p.trim())
      .filter(Boolean)
      .join(" ");
    const result = await execute({ name, email, password });
    if (result) {
      toast.success("Account created. Check your email to verify it.");
      router.push(`${ROUTES.verifyEmail}?email=${encodeURIComponent(result.email)}`);
    }
  }

  return (
    <>
      <AuthHeader
        showBrand
        strong
        heading="Create your account"
        subtext="Your free account opens all that ForkThis! has to offer."
      />
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label="First name"
          type="text"
          name="firstName"
          autoComplete="given-name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
        <div className={styles.row}>
          <TextField
            label="Middle name or initials"
            type="text"
            name="middleName"
            autoComplete="additional-name"
            value={middleName}
            onChange={(event) => setMiddleName(event.target.value)}
          />
          <TextField
            label="Last name"
            type="text"
            name="lastName"
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
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
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
            I agree to the <LegalDialog doc="terms">Terms</LegalDialog> and{" "}
            <LegalDialog doc="privacy">Privacy Policy</LegalDialog>.
          </Label>
        </div>

        {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}

        <Button type="submit" className={cn(styles.submit, styles.submitGap)} disabled={isLoading}>
          {isLoading ? "Creating account..." : "Register"}
        </Button>
      </form>

      <SocialAuthButtons dividerLabel="Or sign up with" />

      <p className={cn(styles.footer, styles.footerRegister)}>
        Already have an account? <Link href={ROUTES.login}>Sign In</Link>
      </p>
    </>
  );
}
