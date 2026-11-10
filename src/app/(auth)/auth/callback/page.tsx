"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { authApi, getErrorMessage } from "@/lib/api";
import { consumePendingSocialSignIn } from "@/lib/auth/social";
import { ROUTES } from "@/lib/constants";

const REASON = {
  missing: "This sign-in link has expired or was opened in a different browser. Please start again.",
  mismatch: "We couldn't verify that this sign-in started here. Please start again.",
  expired: "That sign-in took too long. Please start again.",
} as const;

/** Landing page for the OAuth redirect: `/auth/callback?code=&state=`. */
export default function OAuthCallbackPage() {
  const router = useRouter();
  const ran = useRef(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (ran.current) return; // Strict mode runs effects twice; the code is single use.
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const providerError = params.get("error_description") ?? params.get("error");
    const code = params.get("code");
    const pending = consumePendingSocialSignIn(params.get("state"));
    // Don't leave the single-use code in the address bar or history.
    window.history.replaceState(null, "", window.location.pathname);

    void (async () => {
      try {
        if (providerError) throw new Error(providerError);
        if (!pending.ok) throw new Error(REASON[pending.reason]);
        if (!code) throw new Error("The provider didn't return an authorization code.");
        await authApi.exchangeOAuthCode({ code, redirectUri: pending.redirectUri });
        router.replace(ROUTES.dashboard);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    })();
  }, [router]);

  return (
    <Card>
      <CardContent style={{ textAlign: "center", display: "grid", gap: "0.75rem", justifyItems: "center" }}>
        {error ? (
          <>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Sign-in didn&apos;t finish</h1>
            <p role="alert">{error}</p>
            <Link href={ROUTES.login}>
              <Button>Back to sign in</Button>
            </Link>
          </>
        ) : (
          <div role="status" aria-live="polite" style={{ display: "grid", gap: "0.75rem", justifyItems: "center" }}>
            <Spinner />
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Completing sign-in…</h1>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
