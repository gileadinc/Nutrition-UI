"use client";

import { useState } from "react";
import { AppImage, PhotoFade } from "@/components/AppImage";
import { PrimaryButton, SecondaryButton } from "@/components/Button";
import { Logo } from "@/components/Shell/Logo";
import { getErrorMessage } from "@/lib/api";
import { useNavigate } from "@/lib/nav";
import { startGuestSession, toast } from "@/lib/store";

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
    <div className="relative min-h-dvh overflow-hidden bg-brand-navy lg:grid lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:bg-surface-white">
      <div className="absolute inset-0 lg:relative lg:h-dvh">
        <AppImage
          src="/img/onboarding/welcome"
          alt=""
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="absolute inset-0 size-full object-cover object-[50%_30%] sm:object-[50%_60%] lg:object-[50%_30%]"
        />
        <PhotoFade className="hidden lg:block" />
      </div>
      <main className="relative flex min-h-dvh flex-col justify-end lg:justify-center lg:px-16 lg:py-12 xl:px-24">
        <div className="relative flex min-h-[50dvh] flex-col justify-end px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-32 lg:block lg:min-h-0 lg:p-0">
          <PhotoFade variant="copy" className="lg:hidden" />
          <div className="relative mx-auto w-full max-w-md lg:mx-0">
            <Logo />
            <h1 className="mt-5 text-onb-photo type-display text-brand-navy sm:text-onb-photo-sm lg:mt-6 lg:text-onb-display">
              Your ForkThis! moment starts here.
            </h1>
            <p className="mt-3 text-onb-body text-text-secondary">
              Know what to order or cook when real life puts your healthier habits on the spot.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <PrimaryButton label="Get started" onPress={() => navigate("/onboarding")} />
              <SecondaryButton
                label="I already have an account"
                onPress={() => navigate("/login")}
                className="border-brand-navy text-base text-brand-navy"
              />
              <button
                type="button"
                onClick={continueAsGuest}
                disabled={busy}
                className="mx-auto h-11 px-4 text-onb-body type-button-secondary text-brand-navy underline underline-offset-4 disabled:opacity-60"
              >
                Continue as guest
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
