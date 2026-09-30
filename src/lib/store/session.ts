"use client";

/**
 * App session: signed-in (real Cognito tokens from `@/lib/auth`) vs guest
 * (backend guest session id) vs anonymous (neither yet).
 *
 * Replaces the deployed mock store's `isGuest` / `isSignedIn` flags.
 */

import { useMemo, useSyncExternalStore } from "react";
import { authApi, type SignInResponse } from "@/lib/api";
import {
  clearGuestSessionId,
  clearSession,
  ensureGuestSession,
  getGuestSessionId,
  getSession,
  migrateGuestProgress,
  setSession,
  subscribe as subscribeAuth,
} from "@/lib/auth";
import { resetCache } from "./resource";

export type SessionStatus = "signedIn" | "guest" | "anonymous";

export interface AppSession {
  /** False during SSR / first paint; do not redirect until true. */
  ready: boolean;
  status: SessionStatus;
  isSignedIn: boolean;
  /** Browsing as a guest (no account). Writes that need an account are gated. */
  isGuest: boolean;
  email: string | null;
  userId: string | null;
  guestSessionId: string | null;
}

const guestListeners = new Set<() => void>();
const notifyGuest = () => guestListeners.forEach((l) => l());

const subscribe = (cb: () => void) => {
  guestListeners.add(cb);
  const off = subscribeAuth(cb);
  return () => {
    guestListeners.delete(cb);
    off();
  };
};

const SERVER: AppSession = {
  ready: false,
  status: "anonymous",
  isSignedIn: false,
  isGuest: false,
  email: null,
  userId: null,
  guestSessionId: null,
};

function useSnapshotKey() {
  return useSyncExternalStore(
    subscribe,
    () => {
      const s = getSession();
      return `${s.accessToken ?? ""}|${s.email ?? ""}|${s.userId ?? ""}|${getGuestSessionId() ?? ""}`;
    },
    () => "",
  );
}

export function useAppSession(): AppSession {
  const key = useSnapshotKey();
  return useMemo(() => {
    // `key === ""` only on the server snapshot; on the client it always has "|||".
    if (key === "") return SERVER;
    const s = getSession();
    const guestSessionId = getGuestSessionId();
    const isSignedIn = Boolean(s.accessToken);
    const isGuest = !isSignedIn && Boolean(guestSessionId);
    return {
      ready: true,
      status: isSignedIn ? "signedIn" : isGuest ? "guest" : "anonymous",
      isSignedIn,
      isGuest,
      email: s.email,
      userId: s.userId,
      guestSessionId,
    } satisfies AppSession;
  }, [key]);
}

/** Non-hook read (event handlers, effects). */
export function getAppSession(): Pick<AppSession, "status" | "isSignedIn" | "isGuest" | "guestSessionId"> {
  const token = Boolean(getSession().accessToken);
  const guestSessionId = getGuestSessionId();
  const isGuest = !token && Boolean(guestSessionId);
  return {
    status: token ? "signedIn" : isGuest ? "guest" : "anonymous",
    isSignedIn: token,
    isGuest,
    guestSessionId,
  };
}

/** "Continue as guest": creates (or reuses) a backend guest session. */
export async function startGuestSession(): Promise<string> {
  const had = getGuestSessionId();
  const id = await ensureGuestSession();
  if (!had) {
    resetCache();
    notifyGuest();
  }
  return id;
}

/** Leave guest mode (e.g. on the way to sign-up). Guest progress migrates on sign-in via `completeSignIn`. */
export function endGuestSession() {
  if (!getGuestSessionId()) return;
  clearGuestSessionId();
  resetCache();
  notifyGuest();
}

/**
 * Store tokens from a sign-in / sign-up / OAuth response, then migrate any
 * guest progress into the account (best effort). Returns false when the
 * response is a challenge (no tokens).
 */
export async function completeSignIn(res: SignInResponse): Promise<boolean> {
  if (!res.accessToken) return false;
  setSession({
    accessToken: res.accessToken,
    idToken: res.idToken,
    refreshToken: res.refreshToken,
    email: res.email,
    userId: res.userId,
    expiresIn: res.expiresIn,
  });
  await migrateGuestProgress();
  resetCache();
  notifyGuest();
  return true;
}

/** Sign out on the server (best effort) and clear all local session state. */
export async function signOut(): Promise<void> {
  const s = getSession();
  try {
    await authApi.signOut({
      accessToken: s.accessToken ?? undefined,
      refreshToken: s.refreshToken ?? undefined,
    });
  } catch {
    // Local sign-out must always succeed.
  }
  clearSession();
  clearGuestSessionId();
  try {
    window.localStorage.removeItem("forkthis.onboarding.sessionId");
  } catch {
    // ignore
  }
  resetCache();
  notifyGuest();
}
