"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/TextField";
import { PasswordField } from "@/components/PasswordField";
import { AuthHeader } from "@/components/AuthHeader";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { toast } from "sonner";
import { useAsync } from "@/lib/hooks";
import { authApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import styles from "../auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { execute, isLoading, error } = useAsync(authApi.login);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Demo mode: any values are accepted.
    const result = await execute({ email, password });
    if (result) {
      toast.success("Welcome back!");
      router.push(ROUTES.dashboard);
    }
  }

  return (
    <>
      <AuthHeader
        showBrand
        heading="We’re happy you’re back!"
        subtext="Sign in to continue your personalized ForkThis! settings."
      />
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <div className={styles.forgotRow}>
          <Link href={ROUTES.forgotPassword} className={styles.forgot}>
            Forgot password?
          </Link>
        </div>
        {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
        <Button type="submit" className={styles.submit} disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <SocialAuthButtons dividerLabel="Or sign in with" />

      <p className={cn(styles.footer, styles.underline)}>
        New to ForkThis? <Link href={ROUTES.register}>Sign Up</Link>
      </p>
    </>
  );
}
