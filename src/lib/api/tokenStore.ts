const ACCESS_KEY = "forkthis.accessToken";
const REFRESH_KEY = "forkthis.refreshToken";

function read(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
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
}

export function clearTokens() {
  try {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  } catch {
    // ignore
  }
}
