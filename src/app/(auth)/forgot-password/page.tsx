"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/TextField";
import { AuthHeader } from "@/components/AuthHeader";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { useAsync } from "@/lib/hooks";
import { authApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const { execute, isLoading, error } = useAsync(authApi.forgotPassword);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await execute({ email });
    // The endpoint resolves with `null` when the email is unknown (no account
    // enumeration), so treat any non-throwing result as success.
    if (result !== undefined) {
      router.push(
        `${ROUTES.resetPassword}?email=${encodeURIComponent(email)}`,
      );
    }
  }

  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <AuthHeader
          heading="Reset your password"
          subtext="Enter the email on your account and we'll send a link to reset your password."
        />
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
          <Button type="submit" className={styles.submit} disabled={isLoading}>
            {isLoading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        <p className={styles.footer}>
          Remember it? <Link href={ROUTES.login}>Back to sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
