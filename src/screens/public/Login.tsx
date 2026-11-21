"use client";

import { useState, type ReactNode } from "react";
import { PrimaryButton, SocialButton } from "@/components/Button";
import { OnboardingDesktopFrame } from "@/components/Onboarding";
import { Logo } from "@/components/Shell/Logo";
import { AppTextField, AppleLogo, GoogleLogo } from "@/components/TextField";
import { authApi, getErrorMessage } from "@/lib/api";
import { APPLE_SIGN_IN_ENABLED } from "@/lib/auth";
import { Link, useNavigate, useSearchParam } from "@/lib/nav";
import { isValidEmail } from "@/lib/nutrition";
import { completeSignIn, syncOnboardingToProfile } from "@/lib/store";
import { useSocialSignIn } from "./useSocialSignIn";

/** Only follow same-origin relative `next` targets. */
export const safeNext = (v: string | null) =>
  v && v.startsWith("/") && !v.startsWith("//") ? v : null;

function LoginFrame({ children }: { children: ReactNode }) {
  return (
    <OnboardingDesktopFrame image="/img/figma-2026-11/auth/login">
      {children}
    </OnboardingDesktopFrame>
  );
}

export function LoginScreen() {
  const navigate = useNavigate();
  const next = safeNext(useSearchParam("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [busy, setBusy] = useState(false);
  const social = useSocialSignIn(next);

  const submit = async () => {
    if (busy) return;
    const e1 = isValidEmail(email) ? undefined : "Enter a valid email address.";
    const e2 = password.length > 0 ? undefined : "Enter your password.";
    setEmailError(e1);
    setPasswordError(e2);
    if (e1 || e2) return;
    setBusy(true);
    setNotice(undefined);
    try {
      const res = await authApi.signIn({ email: email.trim(), password });
      const ok = await completeSignIn(res);
      if (!ok) {
        setNotice(
          "Additional verification is required for this account, which isn't supported here yet.",
        );
        setBusy(false);
        return;
      }
      void syncOnboardingToProfile();
      navigate(next ?? "/home");
    } catch (err) {
      setPasswordError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <LoginFrame>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Logo size="lg" className="mb-4" />
        <h1
          className="text-4xl type-display text-primary"
          style={{ letterSpacing: "-1.62px", lineHeight: "38px" }}
        >
          We’re happy you’re back!
        </h1>
        <p className="mt-2 type-meta text-[13px] leading-5 text-text-secondary">
          Sign in to continue your personalized ForkThis! settings.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <AppTextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            error={emailError}
            onChange={(v) => {
              setEmail(v);
              setEmailError(undefined);
            }}
          />
          <AppTextField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            error={passwordError}
            onChange={(v) => {
              setPassword(v);
              setPasswordError(undefined);
            }}
          />
        </div>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="px-1 py-2.5 text-sm type-button text-primary">
            Forgot password?
          </Link>
        </div>
        <PrimaryButton label={busy ? "Signing in..." : "Sign in"} type="submit" disabled={busy} />
        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-border-divider" />
          <span className="text-[12px] type-meta text-text-neutral-600">OR SIGN IN WITH</span>
          <span className="h-px flex-1 bg-border-divider" />
        </div>
        <div className="flex gap-3">
          <SocialButton
            label="Apple"
            dark
            icon={<AppleLogo color="currentColor" />}
            onPress={() => void social.start("apple")}
            disabled={!APPLE_SIGN_IN_ENABLED || busy || social.busy !== null}
            title={APPLE_SIGN_IN_ENABLED ? undefined : "Apple sign-in is coming soon"}
          />
          <SocialButton
            label="Google"
            icon={<GoogleLogo />}
            onPress={() => void social.start("google")}
            disabled={busy || social.busy !== null}
          />
        </div>
        {(social.error || notice) && (
          <p role="status" className="mt-3 text-center type-meta text-[13px] text-text-secondary">
            {social.error ?? notice}
          </p>
        )}
        <p className="mt-3 text-center text-sm type-meta text-text-secondary">
          New to ForkThis?{" "}
          <Link
            to={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
            className="type-button text-primary underline decoration-1 underline-offset-2"
          >
            Sign Up
          </Link>
        </p>
      </form>
    </LoginFrame>
  );
}
