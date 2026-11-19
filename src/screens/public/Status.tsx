"use client";

import { useState, type ReactNode } from "react";
import { PrimaryButton } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { OnboardingFrame } from "@/components/Onboarding";
import { Logo } from "@/components/Shell/Logo";
import { AppTextField } from "@/components/TextField";
import { authApi, getErrorMessage } from "@/lib/api";
import { useNavigate, useSearchParam } from "@/lib/nav";
import { validatePassword } from "@/lib/nutrition";
import { getAppSession, hasCompletedOnboarding, startGuestSession, toast } from "@/lib/store";
import { safeNext } from "./Login";

function StatusFrame({
  showBrandMark = true,
  recovery = false,
  visual,
  heading,
  body,
  extra,
  footer,
}: {
  showBrandMark?: boolean;
  recovery?: boolean;
  visual: ReactNode;
  heading: string;
  body?: ReactNode;
  extra?: ReactNode;
  footer: ReactNode;
}) {
  return (
    <OnboardingFrame
      image={recovery ? "/img/figma-2026-11/auth/recovery" : "/img/figma-2026-11/auth/verification"}
      tone="ink"
      label={recovery ? "ACCOUNT RECOVERY" : "ACCOUNT SETUP"}
      title={recovery ? "We’re here to get you back on track!" : "You’re almost ready to ForkThis!"}
      titleClassName="text-[32px] type-display"
      body="You’re almost there! We just need to verify that you want to ForkThis!"
    >
      <div className="flex min-h-[32rem] w-full flex-col lg:min-h-[38rem]">
        {showBrandMark && (
          <div className="w-full pb-3">
            <Logo size="lg" />
          </div>
        )}
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="flex w-full flex-col items-center text-center">
            {visual}
            <h1 className="mt-6 text-[32px] type-display leading-[36.8px] tracking-[-0.8px] text-text-primary">
              {heading}
            </h1>
            {body && (
              <p className="mt-3 text-[15px] type-body leading-[22.5px] text-text-secondary">
                {body}
              </p>
            )}
            {extra && <div className="mt-5 w-full">{extra}</div>}
          </div>
        </div>
        <div className="w-full">{footer}</div>
      </div>
    </OnboardingFrame>
  );
}

const TICK_TILE = (
  <span className="flex size-[111.207px] items-center justify-center rounded-[32px] bg-text-primary">
    <Icon name="tick" size={52} color="var(--color-on-primary)" />
  </span>
);

const VERIFY_STEPS = [
  "Open the email from ForkThis!",
  "Tap “Verify email” inside it",
  "You land back here, ready to set up your plan",
];

const backToSignIn = (returnTo: string | null) =>
  returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login";

export function VerificationSentScreen() {
  const navigate = useNavigate();
  const returnTo = safeNext(useSearchParam("returnTo"));
  const email = useSearchParam("email") || "your email";
  return (
    <StatusFrame
      visual={
        <span className="relative flex size-[88px] items-center justify-center rounded-[28px] bg-text-primary">
          <Icon name="shareEmail" size={40} color="var(--color-on-primary)" />
          <span
            aria-hidden
            className="absolute -right-1.5 -top-1.5 flex size-7 items-center justify-center rounded-full border-2 border-white bg-accent text-[12px] type-numeral text-brand-navy"
          >
            1
          </span>
        </span>
      }
      heading="Check your inbox"
      extra={
        <div className="flex flex-col items-center gap-5">
          <p className="text-center text-[15px] text-text-secondary">
            We sent a verification link to{" "}
            <span className="type-item-title break-words text-text-primary">{email}</span>. Tap it
            to activate your account.
          </p>
          <ol className="w-full divide-y divide-border-divider rounded-2xl border border-border-divider bg-white text-left">
            {VERIFY_STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-3 px-4 py-3">
                <span
                  aria-hidden
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-navy-50 text-[12px] type-numeral text-brand-navy"
                >
                  {i + 1}
                </span>
                <span className="text-[14px] leading-5 text-text-primary">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      }
      footer={
        <div className="flex flex-col gap-3">
          <PrimaryButton label="Open email app" onPress={() => window.open("mailto:", "_self")} />
          <div className="flex flex-col items-center gap-1 pt-1 text-center">
            <p className="type-meta text-[13px] text-text-secondary">
              Nothing yet? Check spam or promotions, or resend.
            </p>
            <button
              type="button"
              disabled
              title="Resending is not available yet"
              className="tap-24 text-sm type-button text-primary disabled:text-text-secondary"
            >
              Resend email
            </button>
            <p className="type-meta text-[13px] text-text-secondary">
              Resending is not available yet.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 border-t border-border-divider pt-3">
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="tap-24 text-sm type-button text-primary underline decoration-1 underline-offset-2"
            >
              Wrong email?
            </button>
            <button
              type="button"
              onClick={() => navigate(backToSignIn(returnTo))}
              className="tap-24 text-sm type-button text-primary underline decoration-1 underline-offset-2"
            >
              Back to sign in
            </button>
          </div>
        </div>
      }
    />
  );
}

export function ResetLinkSentScreen() {
  const navigate = useNavigate();
  const email = useSearchParam("email");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ code?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  // Extra (not in the deployed prototype, which simulated tapping the email link):
  // the backend resets with the emailed confirmation code + new password.
  const submit = async () => {
    if (busy) return;
    const e = {
      code: code.trim() ? undefined : "Enter the code from your email.",
      password: validatePassword(password) ?? undefined,
    };
    setErrors(e);
    if (e.code || e.password || !email) return;
    setBusy(true);
    try {
      await authApi.resetPassword({
        email,
        confirmationCode: code.trim(),
        newPassword: password,
      });
      navigate("/password-reset-success");
    } catch (err) {
      setErrors({ code: getErrorMessage(err) });
      setBusy(false);
    }
  };

  return (
    <StatusFrame
      recovery
      visual={TICK_TILE}
      heading="Reset link sent"
      body={
        email
          ? `Check ${email} for a password reset link. It expires in 30 minutes.`
          : "Check your email for a password reset link. It expires in 30 minutes."
      }
      extra={
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2 rounded-xl bg-navy-50 p-3 text-left">
            <Icon name="info" size={18} color="var(--color-text-secondary)" />
            <p className="type-meta text-[13px] leading-5 text-text-secondary">
              Make sure to check your spam or promotions folder if you don&apos;t see it.
            </p>
          </div>
          <form
            className="flex flex-col gap-3 text-left"
            onSubmit={(ev) => {
              ev.preventDefault();
              void submit();
            }}
          >
            <AppTextField
              label="Verification code"
              autoComplete="one-time-code"
              value={code}
              error={errors.code}
              onChange={(v) => {
                setCode(v);
                setErrors({});
              }}
            />
            <AppTextField
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              error={errors.password}
              onChange={(v) => {
                setPassword(v);
                setErrors({});
              }}
            />
            <PrimaryButton
              label={busy ? "Updating..." : "Reset password"}
              type="submit"
              disabled={busy || !email}
            />
          </form>
        </div>
      }
      footer={
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="tap-24 w-full justify-center text-sm type-button text-primary underline decoration-1 underline-offset-2"
        >
          Back to sign in
        </button>
      }
    />
  );
}

export function PasswordResetSuccessScreen() {
  const navigate = useNavigate();
  const guest = async () => {
    try {
      await startGuestSession();
      navigate("/guest");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };
  return (
    <StatusFrame
      recovery
      visual={TICK_TILE}
      heading="Password updated."
      body="Your password has been successfully reset. You can now sign in with your new password."
      footer={
        <div className="flex flex-col items-center gap-4">
          <PrimaryButton label="Sign in" onPress={() => navigate("/login")} />
          <button
            type="button"
            onClick={guest}
            className="tap-24 text-sm type-button text-primary underline decoration-1 underline-offset-2"
          >
            Or continue as Guest →
          </button>
        </div>
      }
    />
  );
}

export function EmailVerifiedScreen() {
  const navigate = useNavigate();
  const returnTo = safeNext(useSearchParam("returnTo"));
  const [busy, setBusy] = useState(false);

  const start = async () => {
    if (busy) return;
    if (!getAppSession().isSignedIn) {
      navigate(backToSignIn(returnTo));
      return;
    }
    setBusy(true);
    const done = await hasCompletedOnboarding();
    navigate(
      done
        ? (returnTo ?? "/home")
        : returnTo
          ? `/questionnaire?next=${encodeURIComponent(returnTo)}`
          : "/questionnaire",
    );
  };

  return (
    <StatusFrame
      visual={TICK_TILE}
      heading="You're all set!"
      body="Your email has been verified and your account is ready to go. Let's configure your dietary goals."
      footer={
        <div className="flex flex-col items-center gap-4">
          <PrimaryButton label="Get started" onPress={start} disabled={busy} />
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="tap-24 gap-1 text-sm type-button text-primary"
          >
            <Icon name="arrowBack" size={16} color="var(--color-primary)" />
            Back to sign in
          </button>
        </div>
      }
    />
  );
}
