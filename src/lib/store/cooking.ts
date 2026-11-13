"use client";

/**
 * Cook-mode progress, backed by `/api/profile/me/cooking-state` (one in-progress recipe per account).
 * Signed in only; guests simply don't resume. Saves are debounced and best-effort, so a failed
 * save never interrupts cooking.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { profileApi, type CookingStateUpdate } from "@/lib/api";
import { useAppSession } from "./session";

const SAVE_DELAY_MS = 600;

export interface CookingResume {
  currentStep: number;
  timerSecondsRemaining: number | null;
}

export function useCookingProgress(recipeId: string | undefined) {
  const session = useAppSession();
  const signedIn = session.ready && session.isSignedIn;
  const [resume, setResume] = useState<CookingResume | null>(null);
  const loaded = useRef(false);
  const pending = useRef<CookingStateUpdate | null>(null);
  const timer = useRef<number | null>(null);

  // Load once per recipe; saving waits for this so a fresh page can't overwrite saved progress.
  useEffect(() => {
    if (!signedIn || !recipeId) return;
    loaded.current = false;
    let cancelled = false;
    profileApi
      .getCookingState()
      .then((s) => {
        if (cancelled) return;
        if (s.recipeId === recipeId && !s.completed) {
          setResume({ currentStep: s.currentStep, timerSecondsRemaining: s.timerSecondsRemaining });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) loaded.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, recipeId]);

  const flush = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    const update = pending.current;
    pending.current = null;
    if (update) void profileApi.updateCookingState(update).catch(() => undefined);
  }, []);

  /** Queue the latest progress; only the most recent value in a burst is sent. */
  const save = useCallback(
    (update: CookingStateUpdate, immediately = false) => {
      if (!signedIn || !loaded.current) return;
      pending.current = update;
      if (immediately) return flush();
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, SAVE_DELAY_MS);
    },
    [signedIn, flush],
  );

  // Don't lose the last change when leaving the screen.
  useEffect(() => flush, [flush]);

  return { resume, save };
}
