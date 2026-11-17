const ACCESS_KEY = "forkthis.accessToken";
const REFRESH_KEY = "forkthis.refreshToken";
const CHANGE_EVENT = "forkthis:auth-change";

function read(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Subscribes to token changes from this tab (custom event) and other tabs (`storage`). */
export function subscribeToTokens(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getAccessToken(): string | null {
  return read(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return read(REFRESH_KEY);
}

export function setTokens(tokens: { accessToken?: string | null; refreshToken?: string | null }) {
  try {
    if (tokens.accessToken) window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    if (tokens.refreshToken) window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  } catch {
    // Storage unavailable (private mode) — the session just won't persist.
  }
  notify();
}

export function clearTokens() {
  try {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  } catch {
    // ignore
  }
  notify();
}
