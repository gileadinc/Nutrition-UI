import type { Metadata } from "next";
import Link from "next/link";
import { OnboardingScreen, OnboardingProgress } from "@/components/Onboarding";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Goal setup — ForkThis!",
};

export default function OnboardingGoalsPage() {
  return (
    <OnboardingScreen
      image="/onboarding/photo-goals.svg"
      imageAlt="A prepared meal in a takeaway box"
      progress={<OnboardingProgress current={1} total={3} />}
      eyebrow="Goal setup"
      heading="Eat smart, anywhere."
      actions={
        <Link href={ROUTES.onboarding.basics}>
          <Button size="lg">Next</Button>
        </Link>
      }
    >
      Real life happens. We show you exactly what to order at your favorite restaurants to stay
      entirely on track, completely guilt-free.
    </OnboardingScreen>
  );
}
