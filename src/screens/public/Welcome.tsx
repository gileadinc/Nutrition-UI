"use client";

import { useState } from "react";
import { AppImage } from "@/components/AppImage";
import { PrimaryButton, SecondaryButton } from "@/components/Button";
import { OnboardingDesktopFrame } from "@/components/Onboarding";
import { Logo } from "@/components/Shell/Logo";
import { getErrorMessage } from "@/lib/api";
import { useNavigate } from "@/lib/nav";
import { startGuestSession, toast } from "@/lib/store";

const TRUST = [
  { src: "/design/trust-shield.svg", label: "Secure" },
  { src: "/design/trust-lock.svg", label: "No credit card" },
  { src: "/design/trust-setup.svg", label: "2 min setup" },
];

export function WelcomeScreen() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const continueAsGuest = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await startGuestSession();
      navigate("/home");
    } catch (e) {
      toast.error(getErrorMessage(e));
      setBusy(false);
    }
  };

  return (
    <OnboardingDesktopFrame image="/img/figma-2026-11/auth/welcome">
      <Logo size="lg" className="md:hidden" />
      <div className="hidden h-9 md:block" aria-hidden />
      <h1 className="pt-6 text-4xl type-numeral leading-9 tracking-[-0.8px] text-primary md:text-justify">
        The first step toward a healthier you starts here.
      </h1>
      <p className="mt-3 text-sm type-body leading-[18px] tracking-[-0.176px] text-text-secondary md:text-justify">
        ForkThis! brings everything you need to support a healthier lifestyle into one simple place,
        so you can spend less time figuring it out and more time making progress.
      </p>
      <div className="flex flex-col items-center gap-3 pt-8">
        <PrimaryButton label="Create a free account" onPress={() => navigate("/onboarding")} />
        <SecondaryButton
          label="Sign in"
          onPress={() => navigate("/signin")}
          className="border-primary text-base text-primary"
        />
        <button
          type="button"
          onClick={continueAsGuest}
          disabled={busy}
          className="flex min-h-11 items-center justify-center px-4 text-base type-button-secondary text-primary disabled:opacity-60"
        >
          Continue as guest
        </button>
      </div>
      <ul
        aria-label="Getting started"
        className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs type-button-secondary text-primary"
      >
        {TRUST.map((t) => (
          <li key={t.label} className="flex items-center gap-1">
            <span className="flex size-6 items-center justify-center">
              <AppImage src={t.src} alt="" />
            </span>
            {t.label}
          </li>
        ))}
      </ul>
    </OnboardingDesktopFrame>
  );
}
