import type { Metadata } from "next";
import Link from "next/link";
import { OnboardingScreen } from "@/components/Onboarding";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Welcome — ForkThis!",
};

export default function OnboardingWelcomePage() {
  return (
    <OnboardingScreen
      image="/onboarding/welcome-pattern.svg"
      imageAlt="ForkThis!"
      heading="Your ForkThis! moment starts here."
      actions={
        <>
          <Link href={ROUTES.onboarding.goals}>
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href={ROUTES.dashboard}>
            <Button size="lg" variant="outline">
              Continue as Guest
            </Button>
          </Link>
        </>
      }
    >
      ForkThis! helps you choose what to order or cook when real life puts your healthier habits on
      the spot.
    </OnboardingScreen>
  );
}
