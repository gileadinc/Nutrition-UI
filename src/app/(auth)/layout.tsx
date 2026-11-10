"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SplitFrame, type SplitFrameProps } from "@/components/SplitFrame";

type FrameConfig = Omit<SplitFrameProps, "children">;

const SETUP_COPY = {
  label: "Account setup",
  title: "You’re almost ready to ForkThis!",
  body: "You’re almost there! We just need to verify that you want to ForkThis!",
};

const CONFIGS: Record<string, FrameConfig> = {
  login: { image: "/img/auth/login.webp" },
  welcome: { image: "/img/auth/welcome.webp" },
  register: {
    image: "/img/auth/create.webp",
    caption: {
      label: "Created your free ForkThis! account",
      size: "md",
      title: (
        <>
          Taking the <strong>first step</strong> is the hardest. <strong>ForkThis!</strong> is here
          to help lighten that load.
        </>
      ),
      body: "ForkTHIS! combines food, fitness, habit-building, and progress tracking into one convenient platform.",
    },
  },
  verify: { image: "/img/auth/verify.webp", caption: SETUP_COPY },
  recovery: {
    image: "/img/auth/reset.webp",
    caption: {
      label: "Account recovery",
      title: "We’re here to get you back on track!",
      body: "You’re almost there! We just need to verify that you want to ForkThis!",
    },
  },
};

function configFor(pathname: string): FrameConfig {
  if (pathname.startsWith("/login")) return CONFIGS.login;
  if (pathname.startsWith("/welcome")) return CONFIGS.welcome;
  if (pathname.startsWith("/register")) return CONFIGS.register;
  if (
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/email-verified") ||
    pathname.startsWith("/account-ready") ||
    pathname.startsWith("/auth/callback")
  ) {
    return CONFIGS.verify;
  }
  return CONFIGS.recovery;
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <SplitFrame {...configFor(pathname)}>{children}</SplitFrame>;
}
