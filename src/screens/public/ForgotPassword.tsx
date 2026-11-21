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
      image="/img/figma-2026-11/auth/recovery"
      tone="ink"
      label="ACCOUNT RECOVERY"
      title="We’re here to get you back on track!"
      titleClassName="text-[32px] type-display"
      body="You’re almost there! We just need to verify that you want to ForkThis!"
      contentClassName="max-w-md"
    >
      <form
        className="flex w-full flex-col"
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
          className="tap-24 mt-4 w-full justify-center text-[13px] type-meta text-text-secondary hover:text-text-primary"
        >
          Skip sign-in and explore the app
        </button>
        <button
          type="button"
          onClick={() => navigate("/signin")}
          className="tap-24 w-full justify-center pb-3 text-sm type-button text-primary underline decoration-1 underline-offset-2"
        >
          Back to sign in
        </button>
      </form>
    </OnboardingFrame>
  );
}
