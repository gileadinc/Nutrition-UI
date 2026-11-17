"use client";

/**
 * Guest gating. Features that need an account (saving, tracking, ...) call
 * `const requireAccount = useRequireAccount()` and bail when it returns false:
 *
 *   const requireAccount = useRequireAccount();
 *   const onSave = () => { if (!requireAccount("Saving recipes")) return; ... };
 *
 * For guests it opens the "needs an account" sheet (GuestGateProvider, mounted
 * by the (app) layout) or, outside a provider, routes to `/guest?feature=...`.
 */

import { createContext, useCallback, useContext } from "react";
import { useNavigate } from "@/lib/nav";
import { getAppSession } from "./session";

export interface GuestGateContextValue {
  request: (feature: string) => void;
}

export const GuestGateContext = createContext<GuestGateContextValue | null>(null);

/** Returns `true` when the action may proceed (user is signed in). */
export function useRequireAccount(): (feature: string) => boolean {
  const navigate = useNavigate();
  const gate = useContext(GuestGateContext);
  return useCallback(
    (feature: string) => {
      const { isSignedIn } = getAppSession();
      if (isSignedIn) return true;
      // Anonymous visitors are treated the same as guests for gating.
      if (gate) gate.request(feature);
      else navigate(`/guest?feature=${encodeURIComponent(feature)}`);
      return false;
    },
    [gate, navigate],
  );
}
