"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onboardingApi, getErrorMessage, type OnboardingSession } from "@/lib/api";
import type { OnboardingSessionUpdate } from "@/lib/api/endpoints/onboarding";
import { getGuestSessionId } from "@/lib/auth";

const KEY = "forkthis.onboarding.sessionId";

function readId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem(KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeId(id: string) {
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    // ignore
  }
}

export interface UseOnboardingSession {
  session: OnboardingSession | null;
  error: string | null;
  isLoading: boolean;
  /** PATCH the session and update local state with the response. */
  save: (update: OnboardingSessionUpdate) => Promise<OnboardingSession | undefined>;
  isSaving: boolean;
}

export function useOnboardingSession(): UseOnboardingSession {
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const existingId = readId();
    const guestId = getGuestSessionId() ?? undefined;

    const load = existingId
      ? onboardingApi.getOnboardingSession(existingId).catch(() =>
          onboardingApi.createOnboardingSession({ sessionId: guestId }),
        )
      : onboardingApi.createOnboardingSession({ sessionId: guestId });

    load
      .then((result) => {
        writeId(result.sessionId);
        setSession(result);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  const save = useCallback(
    async (update: OnboardingSessionUpdate) => {
      if (!session) return undefined;
      setIsSaving(true);
      setError(null);
      try {
        const result = await onboardingApi.updateOnboardingSession(session.sessionId, update);
        setSession(result);
        return result;
      } catch (err) {
        setError(getErrorMessage(err));
        return undefined;
      } finally {
        setIsSaving(false);
      }
    },
    [session],
  );

  return { session, error, isLoading, save, isSaving };
}
