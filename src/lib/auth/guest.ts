"use client";

import { authApi } from "@/lib/api";

/**
 * Guest session id, persisted in localStorage. Used for guest tracking,
 * discovery, onboarding, and the age gate before a user has an account.
 */
const KEY = "forkthis.guest.sessionId";

export function getGuestSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setGuestSessionId(id: string) {
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    // ignore
  }
}

export function clearGuestSessionId() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Return the existing guest session id, creating one if needed. */
export async function ensureGuestSession(): Promise<string> {
  const existing = getGuestSessionId();
  if (existing) return existing;
  const session = await authApi.createGuestSession();
  setGuestSessionId(session.sessionId);
  return session.sessionId;
}
