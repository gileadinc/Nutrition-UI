"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/Button";
import { OnboardingFrame } from "@/components/Onboarding";
import { Logo } from "@/components/Shell/Logo";
import { AppTextField } from "@/components/TextField";
import { authApi, getErrorMessage } from "@/lib/api";
import { useNavigate } from "@/lib/nav";
import { isValidEmail } from "@/lib/nutrition";
import { startGuestSession, toast } from "@/lib/store";

export function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    const err = isValidEmail(email) ? undefined : "Enter a valid email address.";
    setError(err);
    if (err) return;
    setBusy(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      navigate(`/reset-link-sent?email=${encodeURIComponent(email.trim())}`);
    } catch (e) {
      setError(getErrorMessage(e));
      setBusy(false);
    }
  };

  const skip = async () => {
    try {
      await startGuestSession();
      navigate("/guest");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <OnboardingFrame
      image="/img/auth/login-hero"
      tone="ink"
      imagePosition="top"
      label="ACCOUNT RECOVERY"
      title="A quick reset, then back to your plan."
      body="Use the email attached to your account and we’ll guide you back to your saved progress."
      mobileClassName="bg-brand-cream px-5 py-5"
      contentClassName="max-w-md"
    >
      <form
        className="flex min-h-[calc(100dvh-2.5rem)] w-full flex-col lg:min-h-[36rem]"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Logo size="lg" />
        <div className="flex-1" />
        <h1
          className="text-4xl type-display text-primary"
          style={{ letterSpacing: "-1.62px", lineHeight: "38px" }}
        >
          Reset your password.
        </h1>
        <p className="mt-2 type-meta text-[13px] leading-5 text-text-secondary">
          Enter the email on your account and we&apos;ll send a link to reset your password.
        </p>
        <div className="mt-6">
          <AppTextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            error={error}
            onChange={(v) => {
              setEmail(v);
              setError(undefined);
            }}
          />
        </div>
        <div className="mt-6">
          <PrimaryButton
            label={busy ? "Sending..." : "Send reset link"}
            type="submit"
            disabled={busy}
          />
        </div>
        <button
          type="button"
          onClick={skip}
          className="tap-24 mt-5 w-full justify-center text-[13px] text-text-secondary"
        >
          Skip sign-in and explore the app
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="tap-24 w-full justify-center pb-3 text-sm type-button-secondary text-text-primary"
        >
          Back to sign in
        </button>
      </form>
    </OnboardingFrame>
  );
}
