"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
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
          <Link href={ROUTES.forgotPassword} className={styles.forgot}>
            Forgot password?
          </Link>
          {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
          <Button type="submit" className={styles.submit} disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <SocialAuthButtons dividerLabel="Or sign in with" />

        <p className={styles.footer}>
          New to ForkThis? <Link href={ROUTES.register}>Sign Up</Link>
        </p>
      </CardContent>
    </Card>
  );
}
