"use client";

import { useState } from "react";
import { PrimaryButton, SocialButton } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { OnboardingFrame } from "@/components/Onboarding";
import { CONTROL_ON } from "@/components/styles";
import { Logo } from "@/components/Shell/Logo";
import {
  AppTextField,
  AppleLogo,
  GoogleLogo,
  NameFields,
  validateFirstName,
  type NameValue,
} from "@/components/TextField";
import { authApi, getErrorMessage } from "@/lib/api";
import { Link, useNavigate, useSearchParam } from "@/lib/nav";
import { isValidEmail } from "@/lib/nutrition";
import { completeSignIn, endGuestSession, syncOnboardingToProfile } from "@/lib/store";
import { safeNext } from "./Login";

type Errors = Partial<
  Record<"firstName" | "email" | "password" | "confirmPassword" | "terms" | "form", string>
>;

export function SignupScreen() {
  const navigate = useNavigate();
  const next = safeNext(useSearchParam("next"));
  const [name, setName] = useState<NameValue>({ firstName: "", middleName: "", lastName: "" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    const e: Errors = {
      firstName: validateFirstName(name) ?? undefined,
      email: isValidEmail(email) ? undefined : "Enter a valid email address.",
      password: password.length >= 8 ? undefined : "Use at least 8 characters.",
      confirmPassword: password === confirm ? undefined : "Passwords do not match.",
      terms: agreed ? undefined : "Agree to the Terms and Privacy Policy to continue.",
    };
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    setBusy(true);
    const addr = email.trim();
    try {
      // The API has no middle-name field: first -> givenName, last -> familyName.
      const res = await authApi.signUp({
        email: addr,
        password,
        givenName: name.firstName.trim(),
        familyName: name.lastName.trim() || undefined,
      });
      if (res.userConfirmed) {
        const session = await authApi.signIn({ email: addr, password });
        if (await completeSignIn(session)) {
          endGuestSession();
          void syncOnboardingToProfile();
          navigate(next ? `/email-verified?returnTo=${encodeURIComponent(next)}` : "/email-verified");
          return;
        }
      }
      const q = new URLSearchParams({ email: addr });
      if (next) q.set("returnTo", next);
      navigate(`/verification-sent?${q.toString()}`);
    } catch (err) {
      setErrors({ form: getErrorMessage(err) });
      setBusy(false);
    }
  };

  return (
    <OnboardingFrame
      image="/img/onboarding/private-basics"
      tone="ink"
      label="CREATE YOUR FORKTHIS ACCOUNT"
      title="Keep your progress connected to you."
      body="Your saved meals, preferences and health context stay together wherever you sign in."
      mobileClassName="bg-surface-white px-6 py-5"
      contentClassName="max-w-md"
    >
      <form
        className="w-full"
        onSubmit={(ev) => {
          ev.preventDefault();
          void submit();
        }}
      >
        <Logo size="lg" tagline />
        <h1
          className="mt-8 text-4xl type-display text-primary"
          style={{ letterSpacing: "-1.62px", lineHeight: "38px" }}
        >
          Create your account
        </h1>
        <p className="mt-1 type-meta text-[13px] leading-5 text-text-secondary">
          Just enough to save your progress. Your goals and body context come next.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <NameFields value={name} onChange={setName} error={errors.firstName} />
          <AppTextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            error={errors.email}
            onChange={setEmail}
          />
          <AppTextField
            label="New password"
            type="password"
            autoComplete="new-password"
            value={password}
            error={errors.password}
            onChange={setPassword}
          />
          <AppTextField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            error={errors.confirmPassword}
            onChange={setConfirm}
          />
        </div>
        <div className="mt-4 flex items-start gap-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={agreed}
            aria-label="Agree to the Terms and Privacy Policy"
            onClick={() => setAgreed((v) => !v)}
            className="-m-1.5 mt-[-2px] flex shrink-0 p-1.5"
          >
            <span
              className={`flex size-5 items-center justify-center rounded-md border ${agreed ? CONTROL_ON : "border-border-default bg-white"}`}
            >
              {agreed && <Icon name="tick" size={14} color="var(--color-text-on-dark)" />}
            </span>
          </button>
          <p className="type-meta text-[13px] leading-5 text-text-secondary">
            I agree to the{" "}
            <Link
              to="/you/legal/terms"
              target="_blank"
              rel="noopener"
              className="type-button text-primary underline"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              to="/you/legal/privacy"
              target="_blank"
              rel="noopener"
              className="type-button text-primary underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        {errors.terms && (
          <p role="alert" className="mt-2 type-meta text-[13px] text-error-red">
            {errors.terms}
          </p>
        )}
        {errors.form && (
          <p role="alert" className="mt-3 type-meta text-[13px] text-error-red">
            {errors.form}
          </p>
        )}
        <div className="mt-4">
          <PrimaryButton label={busy ? "Creating account..." : "Register"} type="submit" disabled={busy} />
        </div>
        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-border-divider" />
          <span className="text-[11px] type-meta text-text-neutral-600">OR SIGN UP WITH</span>
          <span className="h-px flex-1 bg-border-divider" />
        </div>
        <div className="flex gap-3">
          <SocialButton
            label="Apple"
            dark
            icon={<AppleLogo color="currentColor" />}
            onPress={() => setNotice("Apple sign-up is not available yet.")}
          />
          <SocialButton
            label="Google"
            icon={<GoogleLogo />}
            onPress={() => setNotice("Google sign-up is not available yet.")}
          />
        </div>
        {notice && (
          <p role="status" className="mt-3 text-center type-meta text-[13px] text-text-secondary">
            {notice}
          </p>
        )}
        <p className="mt-4 text-center text-sm type-meta text-text-secondary">
          Already have an account?{" "}
          <Link
            to={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="type-button text-primary"
          >
            Sign In
          </Link>
        </p>
      </form>
    </OnboardingFrame>
  );
}
