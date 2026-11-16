"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/TextField";
import { AuthHeader } from "@/components/AuthHeader";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { useAsync } from "@/lib/hooks";
import { authApi } from "@/lib/api";
import type { RecoveryOptions, ResetChannel } from "@/lib/api/endpoints/auth";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [channel, setChannel] = useState<ResetChannel>("email");
  const [options, setOptions] = useState<RecoveryOptions | null>(null);
  const { execute, isLoading, error } = useAsync(authApi.requestPasswordReset);

  // Only offer the channels this profile actually has on file.
  useEffect(() => {
    let active = true;
    authApi
      .getRecoveryOptions()
      .then((next) => {
        if (!active) return;
        setOptions(next);
        if (!next.email && next.phone) setChannel("phone");
      })
      .catch(() => {
        /* fall back to email-only, which is always offered */
      });
    return () => {
      active = false;
    };
  }, []);

  const hasPhone = Boolean(options?.phone);
  const isPhone = channel === "phone";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await execute({ channel, destination });
    if (result) {
      router.push(
        `${ROUTES.forgotPasswordSent}?channel=${result.channel}&to=${encodeURIComponent(result.destination)}`,
      );
    }
  }

  return (
    <>
      <AuthHeader showBrand heading="Reset your password." />
      <p className={styles.resetDesc}>
        {hasPhone
          ? "Choose where to send your reset link and we’ll get you back in."
          : "Enter the email on your account and we’ll send a link to reset your password."}
      </p>

      {hasPhone ? (
        <div className={styles.channelChoice} role="group" aria-label="Where to send the reset link">
          <button
            type="button"
            aria-pressed={!isPhone}
            className={cn(styles.channelOption, !isPhone && styles.channelOptionOn)}
            onClick={() => {
              setChannel("email");
              setDestination("");
            }}
          >
            <Mail size={18} aria-hidden="true" />
            <span>
              <strong>Email</strong>
              <small>{options?.email ?? "On your account"}</small>
            </span>
          </button>
          <button
            type="button"
            aria-pressed={isPhone}
            className={cn(styles.channelOption, isPhone && styles.channelOptionOn)}
            onClick={() => {
              setChannel("phone");
              setDestination("");
            }}
          >
            <Smartphone size={18} aria-hidden="true" />
            <span>
              <strong>Text message</strong>
              <small>{options?.phone}</small>
            </span>
          </button>
        </div>
      ) : null}

      <form className={styles.resetForm} onSubmit={handleSubmit} noValidate>
        <TextField
          label={isPhone ? "Phone number" : "Email"}
          type={isPhone ? "tel" : "email"}
          name={isPhone ? "phone" : "email"}
          autoComplete={isPhone ? "tel" : "email"}
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
        />
        {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
        <Button type="submit" className={styles.submit} disabled={isLoading}>
          {isLoading ? "Sending..." : isPhone ? "Send reset code" : "Send reset link"}
        </Button>
      </form>
      <Link href={ROUTES.login} className={styles.darkLink} style={{ paddingTop: "1rem" }}>
        Back to sign in
      </Link>
    </>
  );
}
