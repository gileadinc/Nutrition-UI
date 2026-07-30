"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { TextInput } from "@/components/TextInput";
import { Button } from "@/components/Button";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { useToast } from "@/components/Toast";
import { useAsync } from "@/lib/hooks";
import { authApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { showToast } = useToast();
  const { execute, isLoading, error } = useAsync(authApi.login);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await execute({ email, password });
    if (result) {
      showToast("Logged in successfully.", { variant: "success" });
    }
  }

  return (
    <Card>
      <h1 className={styles.heading}>Log in (placeholder)</h1>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextInput
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <TextInput
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
        <Button type="submit" className={styles.submit} disabled={isLoading}>
          {isLoading ? "Logging in..." : "Log in"}
        </Button>
      </form>
      <p className={styles.footer}>
        Don&apos;t have an account? <Link href={ROUTES.register}>Register</Link>
      </p>
    </Card>
  );
}
