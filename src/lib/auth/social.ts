"use client";

/**
 * Social sign-in (Google, Apple) through the Cognito hosted UI.
 *
 *  1. `startSocialSignIn` asks the backend for the provider's authorize URL
 *     (`GET /api/auth/oauth/{provider}/url?state=`), points its `redirect_uri` at this app's
 *     `/auth/callback` page and navigates there.
 *  2. After the provider round-trip the hosted UI returns to `/auth/callback?code=&state=`.
 *  3. That page calls `consumePendingSocialSignIn` to verify `state`, then
 *     `POST /api/auth/oauth/exchange` with the same `redirectUri` to get tokens.
 *
 * The backend builds its URL with its own `/api/auth/oauth/callback` as redirect, which answers with
 * raw JSON, so for a web app we swap in our page. Cognito only accepts redirect URIs registered on the
 * app client, so this app's `/auth/callback` (local and production) must be listed there.
 */

import { authApi } from "@/lib/api";

export type SocialProvider = "google" | "apple";

export const SOCIAL_PROVIDER_LABEL: Record<SocialProvider, string> = {
  google: "Google",
  apple: "Apple",
};

export const OAUTH_CALLBACK_PATH = "/auth/callback";

const PENDING_KEY = "forkthis.oauth.pending";

interface PendingSocialSignIn {
  state: string;
  provider: SocialProvider;
  redirectUri: string;
  /** Same-origin path to open after sign-in. */
  next: string | null;
  startedAt: number;
}

/** A started sign-in older than this is treated as abandoned. */
const MAX_AGE_MS = 15 * 60 * 1000;

const newState = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Requests the provider URL and navigates away. Throws (with the API message) if it can't start. */
export async function startSocialSignIn(provider: SocialProvider, next?: string | null): Promise<void> {
  const state = newState();
  const redirectUri = `${window.location.origin}${OAUTH_CALLBACK_PATH}`;
  const { authorizeUrl } =
    provider === "google" ? await authApi.googleAuthUrl(state) : await authApi.appleAuthUrl(state);

  const url = new URL(authorizeUrl);
  url.searchParams.set("redirect_uri", redirectUri);

  const pending: PendingSocialSignIn = { state, provider, redirectUri, next: next ?? null, startedAt: Date.now() };
  try {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    throw new Error("Your browser is blocking storage, which social sign-in needs. Use email instead.");
  }
  window.location.assign(url.toString());
}

export type PendingResult =
  | { ok: true; redirectUri: string; next: string | null; provider: SocialProvider }
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
  return { ok: true, redirectUri: pending.redirectUri, next: pending.next, provider: pending.provider };
}
