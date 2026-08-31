"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { AuthStatus, authStatusActionClasses } from "@/components/AuthStatus";
import { authApi, getErrorMessage } from "@/lib/api";
import { setSession } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = searchParams.get("code");
    const providerError = searchParams.get("error_description") ?? searchParams.get("error");

    Promise.resolve()
      .then(() => {
        if (providerError) throw new Error(providerError);
        if (!code) throw new Error("No authorization code was returned by the provider.");
        return authApi.exchangeOAuthCode({
          code,
          redirectUri: `${window.location.origin}${ROUTES.oauthCallback}`,
        });
      })
      .then((result) => {
        if (!result.accessToken) {
          setError("The provider did not return a session.");
          return;
        }
        setSession({
          accessToken: result.accessToken,
          idToken: result.idToken,
          refreshToken: result.refreshToken,
          email: result.email,
          userId: result.userId,
          expiresIn: result.expiresIn,
        });
        router.replace(ROUTES.dashboard);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [router, searchParams]);

  return (
    <Card style={{ border: "none", boxShadow: "var(--shadow-md)", paddingBlock: "2.5rem" }}>
      <CardContent style={{ paddingInline: "2.25rem" }}>
        {error ? (
          <AuthStatus
            icon={<X />}
            heading="Sign-in failed"
            actions={
              <Link href={ROUTES.login} className={authStatusActionClasses.primary}>
                Back to sign in
              </Link>
            }
          >
            {error}
          </AuthStatus>
        ) : (
          <AuthStatus icon={<Check />} tone="success" heading="Completing sign-in…">
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <Spinner /> Exchanging your authorization code for a session.
            </span>
          </AuthStatus>
        )}
      </CardContent>
    </Card>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackContent />
    </Suspense>
  );
}
