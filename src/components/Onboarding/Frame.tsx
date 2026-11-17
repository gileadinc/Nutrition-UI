"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AppImage } from "@/components/AppImage";
import { Logo } from "@/components/Shell/Logo";
import { useIsLg } from "@/lib/hooks";

interface FrameProps {
  /** Local image base, e.g. `/img/auth/login-hero`. */
  image: string;
  /** Eyebrow over the photo. */
  label: string;
  title: string;
  body: string;
  children: ReactNode;
  contentClassName?: string;
  variant?: "default" | "quiz";
  /** `ink` = dark text over a light photo. */
  tone?: "light" | "ink";
  imagePosition?: "center" | "top";
}

/** Desktop split layout: photo + copy on the left, form on the right. */
export function OnboardingDesktopFrame({
  image,
  label,
  title,
  body,
  children,
  contentClassName,
  variant = "default",
  tone = "light",
  imagePosition = "center",
}: FrameProps) {
  const ink = tone === "ink";
  return (
    <div
      className={cn(
        "grid min-h-dvh bg-surface-white",
        variant === "quiz"
          ? "grid-cols-[minmax(21rem,0.72fr)_minmax(38rem,1.28fr)] xl:grid-cols-[minmax(25rem,0.72fr)_minmax(44rem,1.28fr)]"
          : "grid-cols-[minmax(21rem,0.82fr)_minmax(30rem,1.18fr)] xl:grid-cols-[minmax(28rem,0.9fr)_minmax(36rem,1.1fr)]",
      )}
    >
      <aside className="relative min-h-dvh overflow-hidden bg-brand-navy">
        <AppImage
          src={image}
          alt=""
          priority
          sizes={
            variant === "quiz" ? "(min-width: 1280px) 36vw, 38vw" : "(min-width: 1280px) 45vw, 40vw"
          }
          className={cn(
            "absolute inset-0 size-full object-cover",
            imagePosition === "top" && "object-top",
          )}
        />
        <div className="relative flex min-h-dvh flex-col justify-between p-8 xl:p-12">
          <Logo
            size="md"
            className={ink ? "on-photo-ink text-brand-navy" : "on-photo text-white"}
          />
          <div className={cn("max-w-md pb-2", ink ? "on-photo-ink" : "on-photo")}>
            <p
              className={cn(
                "text-onb-meta type-eyebrow uppercase",
                ink ? "text-brand-navy" : "text-primary-soft",
              )}
            >
              {label}
            </p>
            <p
              className={cn(
                "mt-3 text-onb-chapter type-display xl:text-onb-chapter-lg",
                ink ? "text-brand-navy" : "text-white",
              )}
            >
              {title}
            </p>
            <p
              className={cn(
                "mt-3 max-w-sm text-onb-body",
                ink ? "text-text-primary" : "text-white",
              )}
            >
              {body}
            </p>
          </div>
        </div>
      </aside>
      <main className="flex min-h-dvh items-center justify-center overflow-y-auto px-8 py-10 lg:px-12 xl:px-16">
        <div className={cn("w-full max-w-lg", contentClassName)}>{children}</div>
      </main>
    </div>
  );
}

/**
 * Auth / status screens: split frame at lg+, plain centred column on mobile.
 * This is the wrapper Login/Signup/Forgot/Status screens use.
 */
export function OnboardingFrame({
  image,
  label,
  title,
  body,
  children,
  mobileClassName = "bg-brand-cream px-5 py-6",
  contentClassName,
  variant = "default",
  tone = "light",
  imagePosition,
}: FrameProps & { mobileClassName?: string }) {
  const lg = useIsLg();
  return lg ? (
    <OnboardingDesktopFrame
      image={image}
      label={label}
      title={title}
      body={body}
      contentClassName={contentClassName}
      variant={variant}
      tone={tone}
      imagePosition={imagePosition}
    >
      {children}
    </OnboardingDesktopFrame>
  ) : (
    <main className={cn("min-h-dvh", mobileClassName)}>
      <div className={cn("mx-auto w-full max-w-md", contentClassName)}>{children}</div>
    </main>
  );
}
