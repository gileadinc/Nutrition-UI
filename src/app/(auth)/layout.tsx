"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SplitFrame } from "@/components/SplitFrame";

function imageFor(pathname: string): string {
  if (pathname.startsWith("/login")) return "/img/quiz/login.webp";
  if (pathname.startsWith("/register")) return "/img/quiz/dob.webp";
  if (pathname.startsWith("/verify-email")) return "/img/quiz/analyzing.webp";
  if (
    pathname.startsWith("/email-verified") ||
    pathname.startsWith("/account-ready") ||
    pathname === "/reset-password/done"
  ) {
    return "/img/quiz/result.webp";
  }
  return "/img/quiz/goal.webp";
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <SplitFrame image={imageFor(pathname)}>{children}</SplitFrame>;
}
