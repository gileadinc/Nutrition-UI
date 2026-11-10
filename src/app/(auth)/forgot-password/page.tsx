"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/TextField";
import { AuthHeader } from "@/components/AuthHeader";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { useAsync } from "@/lib/hooks";
import { authApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const { execute, isLoading, error } = useAsync(authApi.requestPasswordReset);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await execute({ email });
    if (result) {
      router.push(`${ROUTES.forgotPasswordSent}?email=${encodeURIComponent(result.email)}`);
    }
  }

  return (
    <>
      <AuthHeader showBrand heading="Reset your password." />
      <p className={styles.resetDesc}>
        Enter the email on your account and we&apos;ll send a link to reset your password.
      </p>
      <form className={styles.resetForm} onSubmit={handleSubmit} noValidate>
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
      <Link href={ROUTES.dashboard} className={styles.softLink}>
        Skip sign-in and explore the app
      </Link>
      <Link href={ROUTES.login} className={styles.darkLink} style={{ paddingTop: "1rem" }}>
        Back to sign in
      </Link>
    </>
  );
}
