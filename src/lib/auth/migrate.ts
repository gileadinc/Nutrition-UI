"use client";

import { authApi } from "@/lib/api";
import type { GuestMigrateResponse } from "@/lib/api/endpoints/auth";
import { clearGuestSessionId, getGuestSessionId } from "./guest";

const ONBOARDING_SESSION_KEY = "forkthis.onboarding.sessionId";

/**
 * Migrate device-local guest progress (onboarding, tracking, age gate) into the
 * just-authenticated account, then drop the guest session id so the app stops
 * using the guest endpoints.
 *
 * Call this immediately after a token is stored (sign in, sign up, OAuth). The
 * backend endpoint is idempotent and tolerates an unknown / already-migrated
 * session id, so a failure here never blocks sign-in — it's best-effort.
 *
 * A valid bearer token must already be in the session; the request attaches it.
 */
export async function migrateGuestProgress(): Promise<GuestMigrateResponse | null> {
  const sessionId = getGuestSessionId();
  if (!sessionId) return null;

  try {
    const result = await authApi.migrateGuest({ sessionId });
    // The guest session has served its purpose; the account now owns the data.
    clearGuestSessionId();
    try {
      window.localStorage.removeItem(ONBOARDING_SESSION_KEY);
    } catch {
      // ignore
    }
    return result;
  } catch {
    // Non-fatal: keep the guest id so a later attempt can retry.
    return null;
  }
}
