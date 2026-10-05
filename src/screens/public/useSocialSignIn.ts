"use client";

import { useCallback, useState } from "react";
import { getErrorMessage } from "@/lib/api";
import { SOCIAL_PROVIDER_LABEL, startSocialSignIn, type SocialProvider } from "@/lib/auth";

/** Shared by Login, Signup and the questionnaire's save step. */
export function useSocialSignIn(next?: string | null) {
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string>();

  const start = useCallback(
    async (provider: SocialProvider, beforeRedirect?: () => Promise<boolean>) => {
      if (busy) return;
      setBusy(provider);
      setError(undefined);
      try {
        if (beforeRedirect && !(await beforeRedirect())) {
          setBusy(null);
          return;
        }
        await startSocialSignIn(provider, next);
        // The page navigates away; leave `busy` set so the buttons stay disabled until then.
      } catch (err) {
        setError(`Couldn't start ${SOCIAL_PROVIDER_LABEL[provider]} sign-in. ${getErrorMessage(err)}`);
        setBusy(null);
      }
    },
    [busy, next],
  );

  return { busy, error, start };
}
