"use client";

import { useEffect, useRef, useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { OnboardingFrame } from "@/components/Onboarding";
import { authApi, getErrorMessage } from "@/lib/api";
import { consumePendingSocialSignIn } from "@/lib/auth";
import { useNavigate, useSearchParams } from "@/lib/nav";
import { completeSignIn, syncOnboardingToProfile } from "@/lib/store";
import { safeNext } from "./Login";

const REASON: Record<string, string> = {
  missing: "This sign-in link has expired or was opened in a different browser. Please start again.",
  mismatch: "We couldn't verify that this sign-in started here. Please start again.",
  expired: "That sign-in took too long. Please start again.",
};

/** Landing page for the Cognito hosted UI redirect: `/auth/callback?code=&state=`. */
export function OAuthCallbackScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const ran = useRef(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (ran.current) return; // React strict mode runs effects twice; the code is single use.
    ran.current = true;

    const providerError = params.get("error_description") ?? params.get("error");
    const code = params.get("code");
    const pending = consumePendingSocialSignIn(params.get("state"));

    void (async () => {
      try {
        if (providerError) throw new Error(providerError);
        if (!pending.ok) throw new Error(REASON[pending.reason]);
        if (!code) throw new Error("The provider didn't return an authorization code.");
        const res = await authApi.exchangeOAuthCode({ code, redirectUri: pending.redirectUri });
        if (!(await completeSignIn(res))) throw new Error("The provider didn't return a session.");
        void syncOnboardingToProfile();
        navigate(safeNext(pending.next) ?? "/home", { replace: true });
      } catch (err) {
        setError(getErrorMessage(err));
      }
    })();
  }, [params, navigate]);

  return (
    <OnboardingFrame
      image="/img/onboarding/setup-complete"
      tone="ink"
      label="ACCOUNT SETUP"
      title="One step closer to your personalized plan."
      body="ForkThis keeps account setup short so you can get back to useful food decisions."
      mobileClassName="bg-surface-white px-5"
      contentClassName="max-w-md"
    >
      <div className="flex min-h-dvh flex-col items-center justify-center text-center lg:min-h-[38rem]">
        {error ? (
          <>
            <span className="flex size-14 items-center justify-center rounded-full bg-error-soft">
              <Icon name="alert" size={26} color="var(--color-error-red)" />
            </span>
            <h1 className="mt-6 type-display text-text-primary text-onb-chapter lg:text-onb-chapter-lg">
              Sign-in didn&apos;t finish
            </h1>
            <p role="alert" className="mt-3 text-onb-body text-text-secondary">
              {error}
            </p>
            <div className="mt-8 flex w-full flex-col gap-3">
              <PrimaryButton label="Back to sign in" onPress={() => navigate("/login", { replace: true })} />
              <SecondaryButton label="Use email instead" onPress={() => navigate("/signup", { replace: true })} />
            </div>
          </>
        ) : (
          <div role="status" aria-live="polite" className="flex flex-col items-center">
            <span
              aria-hidden
              className="size-10 animate-spin rounded-full border-[3px] border-border-default border-t-primary motion-reduce:animate-none"
            />
            <h1 className="mt-6 type-display text-text-primary text-onb-chapter lg:text-onb-chapter-lg">
              Completing sign-in…
            </h1>
            <p className="mt-3 text-onb-body text-text-secondary">
              Hang on while we secure your session.
            </p>
          </div>
        )}
      </div>
    </OnboardingFrame>
  );
}
