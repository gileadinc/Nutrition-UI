"use client";

import { useSyncExternalStore } from "react";
import { subscribe } from "./session";
import { isAdmin } from "./claims";

/** Reactive: is the signed-in user in the Cognito `admin` group. */
export function useIsAdmin(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isAdmin(),
    () => false,
  );
}
