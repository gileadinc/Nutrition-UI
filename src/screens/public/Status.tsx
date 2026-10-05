"use client";

import { useState, type ReactNode } from "react";
import { AppImage } from "@/components/AppImage";
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
  showBrandMark = false,
  visual,
  heading,
  body,
  extra,
  footer,
}: {
  showBrandMark?: boolean;
  visual: ReactNode;
  heading: string;
  body?: ReactNode;
  extra?: ReactNode;
  footer: ReactNode;
}) {
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
      <div className="flex min-h-dvh flex-col lg:min-h-[38rem]">
        {showBrandMark && (
          <div className="w-full pt-3 lg:pt-0">
            <Logo size="lg" tagline />
          </div>
        )}
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="flex w-full flex-col items-center text-center">
            {visual}
            <h1 className="mt-6 type-display text-text-primary text-onb-chapter lg:text-onb-chapter-lg">
              {heading}
            </h1>
            {body && <p className="mt-3 text-onb-body text-text-secondary">{body}</p>}
            {extra && <div className="mt-5 w-full">{extra}</div>}
          </div>
        </div>
        <div className="w-full pb-6 lg:pb-0">{footer}</div>
      </div>
    </OnboardingFrame>
  );
}

const backToSignIn = (returnTo: string | null) =>
  returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login";

export function VerificationSentScreen() {
  const navigate = useNavigate();
  const returnTo = safeNext(useSearchParam("returnTo"));
  const email = useSearchParam("email") || "your email";
  return (
    <StatusFrame
      visual={
        <AppImage
          src="/img/auth/chef-illustration"
          alt=""
          className="size-[180px] object-contain"
        />
      }
      heading="Check your inbox"
      extra={
        <p className="text-center text-[15px] text-text-secondary">
          We sent a verification link to{" "}
          <span className="type-item-title text-text-secondary">{email}</span>. Tap it to activate
          your account.
        </p>
      }
      footer={
        <div className="flex flex-col items-center">
          <p className="type-meta text-[13px] text-text-secondary">Didn&apos;t receive the email?</p>
          <button
            type="button"
            disabled
            title="Resending is not available yet"
            className="tap-24 mt-2 text-sm type-button text-primary opacity-50"
          >
            Resend email
          </button>
          <p className="type-meta text-[12px] text-text-secondary">Resending is not available yet.</p>
          <button
            type="button"
            onClick={() => navigate(backToSignIn(returnTo))}
            className="tap-24 mt-6 text-sm type-button-secondary text-text-primary"
          >
            Back to sign in
          </button>
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
      visual={
        <div className="flex size-20 items-center justify-center rounded-full bg-surface-white">
          <Icon name="tick" size={36} color="var(--color-brand-navy)" />
        </div>
      }
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
          className="tap-24 w-full justify-center text-sm type-button-secondary text-text-primary"
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
      showBrandMark
      visual={
        <AppImage
          src="/img/auth/chef-cooking-illustration"
          alt=""
          className="size-[173px] object-contain"
        />
      }
      heading="Password updated."
      body="Your password has been successfully reset. You can now sign in with your new password."
      footer={
        <div className="flex flex-col items-center gap-4">
          <PrimaryButton label="Sign in" onPress={() => navigate("/login")} />
          <button
            type="button"
            onClick={guest}
            className="tap-24 text-sm type-button-secondary text-text-primary"
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
      showBrandMark
      visual={
        <AppImage
          src="/img/auth/chef-thumbsup-illustration"
          alt=""
          className="size-[200px] object-contain"
        />
      }
      heading="You're all set!"
      body="Your email has been verified and your account is ready to go. Let's configure your dietary goals."
      footer={
        <div className="flex flex-col items-center gap-4">
          <PrimaryButton label="Get started" onPress={start} disabled={busy} />
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="tap-24 gap-1 text-sm type-button-secondary text-text-neutral-500"
          >
            <Icon name="arrowBack" size={16} color="var(--color-text-neutral-500)" />
            Back to sign in
          </button>
        </div>
      }
    />
  );
}
