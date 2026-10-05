"use client";

import { useState, type ReactNode } from "react";
import { AppImage } from "@/components/AppImage";
import { PrimaryButton, SocialButton } from "@/components/Button";
import { OnboardingDesktopFrame } from "@/components/Onboarding";
import { Logo } from "@/components/Shell/Logo";
import { AppTextField, AppleLogo, GoogleLogo } from "@/components/TextField";
import { authApi, getErrorMessage } from "@/lib/api";
import { useIsLg } from "@/lib/hooks";
import { Link, useNavigate, useSearchParam } from "@/lib/nav";
import { isValidEmail } from "@/lib/nutrition";
import { completeSignIn, syncOnboardingToProfile } from "@/lib/store";
import { useSocialSignIn } from "./useSocialSignIn";

/** Only follow same-origin relative `next` targets. */
export const safeNext = (v: string | null) => (v && v.startsWith("/") && !v.startsWith("//") ? v : null);

function LoginFrame({ children }: { children: ReactNode }) {
  const lg = useIsLg();
  const src = "/img/auth/login-hero";
  return lg ? (
    <OnboardingDesktopFrame
      image={src}
      tone="ink"
      imagePosition="top"
      label="WELCOME BACK"
      title="Your plan is ready where you left it."
      body="Return to saved meals, daily targets and recommendations shaped around your goals."
      contentClassName="max-w-md"
    >
      {children}
    </OnboardingDesktopFrame>
  ) : (
    <main className="relative min-h-dvh overflow-hidden bg-white">
      <AppImage
        src={src}
        alt=""
        priority
        sizes="100vw"
        className="absolute inset-0 size-full object-cover object-top"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgb(255 255 255 / 0) 22%, rgb(255 255 255 / 0.2) 48%, rgb(255 255 255 / 0.95) 68%, rgb(255 255 255) 100%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 px-5 pb-3 pt-2 sm:bg-[linear-gradient(to_bottom,rgb(255_255_255/0),rgb(255_255_255)_6rem)] sm:pt-24">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </main>
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
        setNotice("Additional verification is required for this account, which isn't supported here yet.");
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
          Welcome back
        </h1>
        <p className="mt-2 type-meta text-[13px] leading-5 text-text-secondary">
          Sign in to keep your ForkThis! moments, saves, and momentum together.
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
          <span className="text-[11px] type-meta text-text-neutral-600">OR SIGN IN WITH</span>
          <span className="h-px flex-1 bg-border-divider" />
        </div>
        <div className="flex gap-3">
          <SocialButton
            label="Apple"
            dark
            icon={<AppleLogo color="currentColor" />}
            onPress={() => void social.start("apple")}
            disabled={busy || social.busy !== null}
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
