"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api";
import { SOCIAL_PROVIDER_LABEL, startSocialSignIn, type SocialProvider } from "@/lib/auth/social";
import styles from "./SocialAuthDialog.module.css";

export type { SocialProvider };

export interface SocialAuthDialogProps {
  provider: SocialProvider | null;
  onOpenChange: (open: boolean) => void;
}

/** Hands off to the provider's sign-in page; shows the error here if it can't start. */
export function SocialAuthDialog({ provider, onOpenChange }: SocialAuthDialogProps) {
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!provider) return;
    let cancelled = false;
    startSocialSignIn(provider).catch((err) => {
      if (!cancelled) setError(getErrorMessage(err));
    });
    return () => {
      cancelled = true;
      setError(undefined);
    };
  }, [provider]);

  const name = provider ? SOCIAL_PROVIDER_LABEL[provider] : "";

  return (
    <Dialog open={provider !== null} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content} showCloseButton>
        {error === undefined ? (
          <div className={styles.state}>
            <Spinner className={styles.spinner} />
            <DialogTitle className={styles.title}>{`Connecting to ${name}…`}</DialogTitle>
            <DialogDescription className={styles.body}>
              {`Opening the secure ${name} sign-in window.`}
            </DialogDescription>
          </div>
        ) : (
          <div className={styles.state}>
            <DialogTitle className={styles.title}>{`Couldn't start ${name} sign-in`}</DialogTitle>
            <DialogDescription className={styles.body}>{error}</DialogDescription>
            <Button type="button" className={styles.dismiss} onClick={() => onOpenChange(false)}>
              Use email instead
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
