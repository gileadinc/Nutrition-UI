"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AppImage } from "@/components/AppImage";

interface FrameProps {
  /** Local image base, e.g. `/img/figma-2026-11/auth/login`. */
  image: string;
  /** Optional image painted under `image` (e.g. a tinted backdrop). */
  backdrop?: string;
  /** Eyebrow over the photo. */
  label?: string;
  title?: ReactNode;
  body?: string;
  children: ReactNode;
  contentClassName?: string;
  variant?: "default" | "quiz";
  /** `ink` = light text over a dark photo, `light` = navy text over a light photo. */
  tone?: "light" | "ink";
  imagePosition?: "center" | "top";
  imageClassName?: string;
  titleClassName?: string;
  /** Kept for call-site compatibility; the frame is responsive by CSS now. */
  mobileClassName?: string;
}

/**
 * Auth / onboarding split frame: a padded canvas with a rounded photo card on
 * the left (md+) and the form column on the right. On mobile only the form
 * column shows.
 */
export function OnboardingDesktopFrame({
  image,
  backdrop,
  label,
  title,
  body,
  children,
  contentClassName,
  variant = "default",
  tone = "light",
  imagePosition = "center",
  imageClassName,
  titleClassName,
}: FrameProps) {
  const hasCopy = !!(label || title || body);
  return (
    <div className="grid min-h-dvh grid-rows-[1fr] gap-2.5 rounded-[20px] bg-auth-canvas p-2.5 md:grid-rows-[auto_1fr] lg:grid-cols-[minmax(0,653fr)_minmax(0,751fr)] lg:grid-rows-none">
      <aside
        aria-hidden
        className="relative hidden h-[min(36dvh,24rem)] overflow-hidden rounded-[20px] bg-surface-card md:block lg:sticky lg:top-2.5 lg:h-[calc(100dvh-1.25rem)] lg:min-h-[32rem]"
      >
        {backdrop && (
          <AppImage
            src={backdrop}
            alt=""
            priority
            sizes="(min-width: 1024px) 47vw, 100vw"
            className="absolute inset-0 size-full object-cover"
          />
        )}
        <AppImage
          src={image}
          alt=""
          priority
          sizes="(min-width: 1024px) 47vw, 100vw"
          className={cn(
            "absolute inset-0 size-full object-cover",
            imagePosition === "top" && "object-top",
            imageClassName,
          )}
        />
        {hasCopy && (
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 hidden p-[30px] lg:block",
              tone === "ink" ? "text-text-on-dark" : "text-brand-navy",
            )}
          >
            {label && (
              <p className="text-[13px] type-meta uppercase leading-5 tracking-[-0.176px]">
                {label}
              </p>
            )}
            {title && (
              <p
                className={cn(
                  "mt-3 text-[28px] type-meta leading-[36.8px] tracking-[-0.8px]",
                  titleClassName,
                )}
              >
                {title}
              </p>
            )}
            {body && (
              <p
                className={cn(
                  "mt-3 text-base type-body leading-6 tracking-[-0.176px]",
                  tone === "light" && "text-text-primary",
                )}
              >
                {body}
              </p>
            )}
          </div>
        )}
      </aside>
      <main className="flex min-w-0 items-center justify-center px-5 py-7 lg:min-h-[calc(100dvh-1.25rem)] lg:px-[clamp(2rem,8.65vw,7.75rem)] lg:py-10">
        <div
          className={cn(
            "w-full",
            variant === "quiz" ? "max-w-[34rem]" : "max-w-md",
            contentClassName,
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

/** Wrapper the auth / status screens use (same component; responsive by CSS). */
export function OnboardingFrame(props: FrameProps) {
  return <OnboardingDesktopFrame {...props} />;
}
