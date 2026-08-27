"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import styles from "./SocialAuthDialog.module.css";

export type SocialProvider = "apple" | "google";

const PROVIDER_META: Record<SocialProvider, { name: string; envVar: string }> = {
  apple: { name: "Apple", envVar: "NEXT_PUBLIC_APPLE_CLIENT_ID" },
  google: { name: "Google", envVar: "NEXT_PUBLIC_GOOGLE_CLIENT_ID" },
};

export interface SocialAuthDialogProps {
  provider: SocialProvider | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Simulates the OAuth hand-off so the Apple / Google buttons feel wired up.
 * When the corresponding client-id env var is set this is where the real
 * provider redirect would fire; until then it surfaces a clear "not configured"
 * state instead of doing nothing.
 */
export function SocialAuthDialog({ provider, onOpenChange }: SocialAuthDialogProps) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!provider) return;
    const timer = setTimeout(() => setConnected(true), 1400);
    return () => {
      clearTimeout(timer);
      setConnected(false);
    };
  }, [provider]);

  const meta = provider ? PROVIDER_META[provider] : null;
  const phase = connected ? "unavailable" : "connecting";

  return (
    <Dialog open={provider !== null} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content} showCloseButton>
        {phase === "connecting" ? (
          <div className={styles.state}>
            <Spinner className={styles.spinner} />
            <DialogTitle className={styles.title}>{`Connecting to ${meta?.name}…`}</DialogTitle>
            <DialogDescription className={styles.body}>
              {`Opening the secure ${meta?.name} sign-in window.`}
            </DialogDescription>
          </div>
        ) : (
          <div className={styles.state}>
            <DialogTitle className={styles.title}>
              {`${meta?.name} sign-in isn't set up yet`}
            </DialogTitle>
            <DialogDescription className={styles.body}>
              This build has no <code className={styles.code}>{meta?.envVar}</code> configured. Once
              the {meta?.name} OAuth credentials are added, this button will hand off to{" "}
              {meta?.name} directly.
            </DialogDescription>
            <Button type="button" className={styles.dismiss} onClick={() => onOpenChange(false)}>
              Use email instead
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
