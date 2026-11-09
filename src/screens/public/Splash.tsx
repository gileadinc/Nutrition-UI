"use client";

import { useEffect } from "react";
import { AppImage } from "@/components/AppImage";
import { Logo } from "@/components/Shell/Logo";
import { useReducedMotion } from "@/lib/hooks";
import { Navigate, useNavigate } from "@/lib/nav";

const SPLASH_MS = 1800;

export function SplashScreen() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => navigate("/welcome", { replace: true }), SPLASH_MS);
    return () => clearTimeout(t);
  }, [navigate, reduced]);

  if (reduced) return <Navigate to="/welcome" replace />;
  return (
    <main
      className="relative flex min-h-dvh items-center justify-center motion-safe:animate-[fade-in_620ms_ease-out]"
      style={{ backgroundColor: "var(--color-splash-canvas)" }}
      data-testid="splash"
    >
      <h1 className="sr-only">ForkThis!</h1>
      <AppImage
        src="/img/brand/splash-backdrop"
        alt=""
        priority
        sizes="(min-width: 768px) 50vw, 100vw"
        className="h-dvh w-full max-w-[36rem] object-contain"
      />
      <div
        aria-hidden
        data-testid="splash-lockup"
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4"
      >
        <Logo size="xl" stacked decorative />
      </div>
    </main>
  );
}
