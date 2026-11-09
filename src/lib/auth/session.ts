"use client";

/**
 * Lightweight client-side auth session for the placeholder / API-testing UI.
 * Tokens are held in localStorage so the API playground and authenticated
 * pages can attach a bearer token. This is intentionally simple — a real
 * build would use httpOnly cookies and refresh rotation on the server.
 */

const STORAGE_KEY = "forkthis.auth.session";

export interface AuthSession {
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  email: string | null;
  userId: string | null;
  /** Epoch ms when the access token expires, if known. */
  expiresAt: number | null;
}

const EMPTY: AuthSession = {
  accessToken: null,
  idToken: null,
  refreshToken: null,
  email: null,
  userId: null,
  expiresAt: null,
};

type Listener = () => void;
const listeners = new Set<Listener>();

/**
 * Cached snapshot so getSession() returns a stable reference between changes —
 * required for useSyncExternalStore not to loop.
 */
let snapshot: AuthSession | null = null;

function read(): AuthSession {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<AuthSession>) };
  } catch {
    return EMPTY;
  }
}

function write(session: AuthSession) {
  snapshot = session;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore quota / disabled storage
    }
  }
  listeners.forEach((fn) => fn());
}

export function getSession(): AuthSession {
  if (snapshot === null) snapshot = read();
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
  const next: AuthSession = {
    accessToken: tokens.accessToken ?? current.accessToken,
    idToken: tokens.idToken ?? current.idToken,
    refreshToken: tokens.refreshToken ?? current.refreshToken,
    email: tokens.email ?? current.email,
    userId: tokens.userId ?? current.userId,
    expiresAt:
      typeof tokens.expiresIn === "number"
        ? Date.now() + tokens.expiresIn * 1000
        : current.expiresAt,
  };
  write(next);
  return next;
}

export function clearSession() {
  snapshot = EMPTY;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  listeners.forEach((fn) => fn());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Authorization header for authenticated requests, or an empty object. */
export function authHeader(): Record<string, string> {
  const token = getSession().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
