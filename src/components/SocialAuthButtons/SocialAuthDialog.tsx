"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authApi, getErrorMessage } from "@/lib/api";
import styles from "./SocialAuthDialog.module.css";

export type SocialProvider = "apple" | "google";

const PROVIDER_META: Record<SocialProvider, { name: string }> = {
  apple: { name: "Apple" },
  google: { name: "Google" },
};

export interface SocialAuthDialogProps {
  provider: SocialProvider | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Requests a Cognito hosted-UI authorize URL from the backend
 * (GET /api/auth/oauth/{provider}/url) and redirects to it. After the provider
 * round-trip the hosted UI returns to /auth/callback with a `code` to exchange.
 */
export function SocialAuthDialog({ provider, onOpenChange }: SocialAuthDialogProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provider) return;
    let cancelled = false;

    const state =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now());

    const request = provider === "google" ? authApi.googleAuthUrl : authApi.appleAuthUrl;

    Promise.resolve()
      .then(() => request(state))
      .then((data) => {
        if (cancelled) return;
        try {
          sessionStorage.setItem("forkthis.oauth.state", state);
        } catch {
          // ignore
        }
        window.location.assign(data.authorizeUrl);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      });

    return () => {
      cancelled = true;
      setError(null);
    };
  }, [provider]);

  const meta = provider ? PROVIDER_META[provider] : null;

  return (
    <Dialog open={provider !== null} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content} showCloseButton>
        {error ? (
          <div className={styles.state}>
            <DialogTitle className={styles.title}>
              {`Couldn't start ${meta?.name} sign-in`}
            </DialogTitle>
            <DialogDescription className={styles.body}>{error}</DialogDescription>
            <Button type="button" className={styles.dismiss} onClick={() => onOpenChange(false)}>
              Use email instead
            </Button>
          </div>
        ) : (
          <div className={styles.state}>
            <Spinner className={styles.spinner} />
            <DialogTitle className={styles.title}>{`Connecting to ${meta?.name}…`}</DialogTitle>
            <DialogDescription className={styles.body}>
              {`Opening the secure ${meta?.name} sign-in window.`}
            </DialogDescription>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
