"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
import styles from "./page.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { execute, isLoading, error } = useAsync(authApi.login);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await execute({ email, password });
    if (result) {
      toast.success("Welcome back!");
    }
  }

  return (
    <Card className="py-8">
      <CardContent className="px-8">
        <AuthHeader
          showBrand
          heading="Welcome back"
          subtext="Sign in to keep your ForkThis! journey, goals, and context in sync."
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
          <Link href={ROUTES.onboarding.welcome} className={styles.forgot}>
            Forgot password?
          </Link>
          {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
          <Button type="submit" className={styles.submit} disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <SocialAuthButtons dividerLabel="Or continue with" />

        <p className={styles.footer}>
          New to ForkThis? <Link href={ROUTES.register}>Sign up</Link>
        </p>
      </CardContent>
    </Card>
  );
}
