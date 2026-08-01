"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/ui/button";
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
      toast.success("Logged in successfully.");
    }
  }

  return (
    <Card className="py-8">
      <CardContent className="px-8">
        <h1 className={styles.heading}>Log in (placeholder)</h1>
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
          <TextField
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
      </CardContent>
    </Card>
  );
}
