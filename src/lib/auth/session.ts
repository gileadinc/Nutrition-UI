"use client";

/**
 * Client auth session for the app screens (track, recipes, hacks, profile).
 *
 * Access/refresh tokens live in `@/lib/api/tokenStore`, the same store the login / register
 * pages write to, so signing in there signs the user in here. Profile-ish extras (email, userId,
 * idToken, expiry) that the token store doesn't keep go in a small side record.
 */

import { clearTokens, getAccessToken, getRefreshToken, setTokens, subscribeToTokens } from "@/lib/api/tokenStore";

const EXTRAS_KEY = "forkthis.auth.extras";

export interface AuthSession {
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  email: string | null;
  userId: string | null;
  /** Epoch ms when the access token expires, if known. */
  expiresAt: number | null;
}

type Extras = Pick<AuthSession, "idToken" | "email" | "userId" | "expiresAt">;

const EMPTY: AuthSession = {
  accessToken: null,
  idToken: null,
  refreshToken: null,
  email: null,
  userId: null,
  expiresAt: null,
};

/** Cached snapshot so getSession() is referentially stable between changes (useSyncExternalStore). */
let snapshot: AuthSession = EMPTY;
let snapshotKey = "";

function readExtrasRaw(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(EXTRAS_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeExtras(extras: Extras | null) {
  try {
    if (extras) window.localStorage.setItem(EXTRAS_KEY, JSON.stringify(extras));
    else window.localStorage.removeItem(EXTRAS_KEY);
  } catch {
    // storage unavailable — extras just won't persist
  }
}

export function getSession(): AuthSession {
  if (typeof window === "undefined") return EMPTY;
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  const extrasRaw = readExtrasRaw();
  const key = `${accessToken ?? ""}|${refreshToken ?? ""}|${extrasRaw}`;
  if (key === snapshotKey) return snapshot;

  let extras: Partial<Extras> = {};
  if (extrasRaw) {
    try {
      extras = JSON.parse(extrasRaw) as Partial<Extras>;
    } catch {
      extras = {};
    }
  }
  snapshotKey = key;
  snapshot =
    accessToken || refreshToken
      ? { ...EMPTY, ...extras, accessToken, refreshToken }
      : EMPTY;
  return snapshot;
}

export function isAuthenticated(): boolean {
  return Boolean(getSession().accessToken);
}

export interface SignInTokens {
  accessToken?: string | null;
  idToken?: string | null;
  refreshToken?: string | null;
  email?: string | null;
  userId?: string | null;
  expiresIn?: number | null;
}

export function setSession(tokens: SignInTokens): AuthSession {
  const current = getSession();
  writeExtras({
    idToken: tokens.idToken ?? current.idToken,
    email: tokens.email ?? current.email,
    userId: tokens.userId ?? current.userId,
    expiresAt:
      typeof tokens.expiresIn === "number" ? Date.now() + tokens.expiresIn * 1000 : current.expiresAt,
  });
  // Notifies subscribers (token-change event).
  setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  return getSession();
}

export function clearSession() {
  writeExtras(null);
  clearTokens();
}

export function subscribe(listener: () => void): () => void {
  return subscribeToTokens(listener);
}

/** Authorization header for authenticated requests, or an empty object. */
export function authHeader(): Record<string, string> {
  const token = getSession().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
