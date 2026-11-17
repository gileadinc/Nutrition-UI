"use client";

import { useSyncExternalStore } from "react";
import { getSession, subscribe, type AuthSession } from "./session";

const SERVER_SNAPSHOT: AuthSession = {
  accessToken: null,
  idToken: null,
  refreshToken: null,
  email: null,
  userId: null,
  expiresAt: null,
};

/** Reactive view of the current client auth session. */
export function useSession(): AuthSession {
  return useSyncExternalStore(
    (onChange) => subscribe(onChange),
    getSession,
    () => SERVER_SNAPSHOT,
  );
}
