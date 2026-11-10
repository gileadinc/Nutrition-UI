import type { Metadata } from "next";
import Link from "next/link";
import { OnboardingScreen, OnboardingProgress } from "@/components/Onboarding";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Health context — ForkThis!",
};

export default function OnboardingHealthPage() {
  return (
    <OnboardingScreen
      image="/onboarding/photo-health.svg"
      imageAlt="Two people sharing a healthy meal"
      progress={<OnboardingProgress current={3} total={3} />}
      eyebrow="Health context"
      heading="Clinical depth, real empathy."
      actions={
        <Link href={ROUTES.register}>
          <Button size="lg">Let&apos;s Begin</Button>
        </Link>
      }
    >
      Co-founded by a renowned plastic surgeon and a weight-health creator who lived the 260 lb loss
      journey. Pure support, zero intimidation.
    </OnboardingScreen>
  );
}
