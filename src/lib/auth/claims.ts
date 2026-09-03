"use client";

import { getSession } from "./session";

/** Decode a JWT payload (no signature verification — client-side hints only). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Cognito groups on the current session's token, e.g. `["admin"]`. */
export function getCognitoGroups(): string[] {
  const session = getSession();
  const token = session.idToken ?? session.accessToken;
  if (!token) return [];
  const payload = decodeJwtPayload(token);
  const groups = payload?.["cognito:groups"];
  return Array.isArray(groups) ? groups.filter((g): g is string => typeof g === "string") : [];
}

/**
 * Whether the signed-in user is in the Cognito `admin` group. This is a
 * client-side convenience for showing/hiding admin UI — the backend still
 * enforces it (403 "Admin access requires membership in the Cognito 'admin'
 * group.").
 */
export function isAdmin(): boolean {
  return getCognitoGroups().includes("admin");
}
