"use client";

/**
 * Social sign-in (Google) through the backend's hosted-UI OAuth flow.
 *
 *  1. `startSocialSignIn` asks the backend for the provider's authorize URL, points its
 *     `redirect_uri` at this app's `/auth/callback` page and navigates there.
 *  2. After the provider round-trip the user returns to `/auth/callback?code=&state=`.
 *  3. That page calls `consumePendingSocialSignIn` to verify `state`, then exchanges the code
 *     for tokens with the same `redirectUri`.
 *
 * The redirect URI (local and production `/auth/callback`) must be registered on the OAuth app client.
 */

import { authApi } from "@/lib/api";

export type SocialProvider = "google";

export const SOCIAL_PROVIDER_LABEL: Record<SocialProvider, string> = { google: "Google" };

export const OAUTH_CALLBACK_PATH = "/auth/callback";

const PENDING_KEY = "forkthis.oauth.pending";
/** A started sign-in older than this is treated as abandoned. */
const MAX_AGE_MS = 15 * 60 * 1000;

interface PendingSocialSignIn {
  state: string;
  provider: SocialProvider;
  redirectUri: string;
  startedAt: number;
}

const newState = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Requests the provider URL and navigates away. Throws (with the API message) if it can't start. */
export async function startSocialSignIn(provider: SocialProvider): Promise<void> {
  const state = newState();
  const redirectUri = `${window.location.origin}${OAUTH_CALLBACK_PATH}`;
  const { authorizeUrl } = await authApi.googleAuthUrl(state);

  const url = new URL(authorizeUrl);
  url.searchParams.set("redirect_uri", redirectUri);

  const pending: PendingSocialSignIn = { state, provider, redirectUri, startedAt: Date.now() };
  try {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    throw new Error("Your browser is blocking storage, which social sign-in needs. Use email instead.");
  }
  window.location.assign(url.toString());
}

export type PendingResult =
  | { ok: true; redirectUri: string; provider: SocialProvider }
  | { ok: false; reason: "missing" | "mismatch" | "expired" };

/** Verifies the returned `state` against the one we started with, and clears it (single use). */
export function consumePendingSocialSignIn(returnedState: string | null): PendingResult {
  let pending: PendingSocialSignIn | null = null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    pending = raw ? (JSON.parse(raw) as PendingSocialSignIn) : null;
    window.sessionStorage.removeItem(PENDING_KEY);
  } catch {
    pending = null;
  }
  if (!pending) return { ok: false, reason: "missing" };
  if (!returnedState || returnedState !== pending.state) return { ok: false, reason: "mismatch" };
  if (Date.now() - pending.startedAt > MAX_AGE_MS) return { ok: false, reason: "expired" };
  return { ok: true, redirectUri: pending.redirectUri, provider: pending.provider };
}
