import type { Metadata } from "next";
import Link from "next/link";
import { OnboardingScreen, OnboardingProgress } from "@/components/Onboarding";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Private basics — ForkThis!",
};

export default function OnboardingBasicsPage() {
  return (
    <OnboardingScreen
      image="/onboarding/photo-basics.svg"
      imageAlt="A fresh grain bowl being served"
      progress={<OnboardingProgress current={2} total={3} />}
      eyebrow="Private basics"
      heading="Personalized to your context."
      actions={
        <Link href={ROUTES.onboarding.health}>
          <Button size="lg">Next</Button>
        </Link>
      }
    >
      No cookie-cutter templates. Your nutritional plans adapt to your unique body stats, goals, and
      specific medical or surgical context.
    </OnboardingScreen>
  );
}
