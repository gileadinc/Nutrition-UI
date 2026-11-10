"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SplitFrame, type SplitFrameProps } from "@/components/SplitFrame";

type FrameConfig = Omit<SplitFrameProps, "children">;

const LOGIN: FrameConfig = {
  image: "/img/auth/login-hero",
  tone: "ink",
  imagePosition: "top",
  label: "Welcome back",
  title: "Your plan is ready where you left it.",
  body: "Return to saved meals, daily targets and recommendations shaped around your goals.",
};

const REGISTER: FrameConfig = {
  image: "/img/onboarding/private-basics",
  tone: "ink",
  label: "Create your ForkThis! account",
  title: "Keep your progress connected to you.",
  body: "Your saved meals, preferences and health context stay together wherever you sign in.",
};

const RECOVERY: FrameConfig = {
  image: "/img/auth/chef-illustration",
  tone: "ink",
  label: "Account help",
  title: "We'll get you back in.",
  body: "A few quick steps and you're back to your plan.",
};

const DONE: FrameConfig = {
  image: "/img/auth/chef-thumbsup-illustration",
  tone: "ink",
  label: "All set",
  title: "You're good to go.",
  body: "Your account is ready for your ForkThis! moment.",
};

const VERIFY: FrameConfig = {
  image: "/img/auth/chef-cooking-illustration",
  tone: "ink",
  label: "Almost there",
  title: "One quick check.",
  body: "Confirm your email so we can keep your progress safe.",
};

function configFor(pathname: string): FrameConfig {
  if (pathname.startsWith("/login")) return LOGIN;
  if (pathname.startsWith("/register")) return REGISTER;
  if (pathname.startsWith("/verify-email")) return VERIFY;
  if (pathname.startsWith("/email-verified") || pathname.startsWith("/account-ready")) return DONE;
  if (pathname === "/reset-password/done") return DONE;
  return RECOVERY;
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <SplitFrame {...configFor(pathname)}>{children}</SplitFrame>;
}
