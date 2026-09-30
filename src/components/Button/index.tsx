"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Link } from "@/lib/nav";
import { OUTLINE_DISABLED, PRIMARY_DISABLED } from "@/components/styles";

export interface PrimaryButtonProps {
  label: ReactNode;
  onPress?: () => void;
  /** `large` = 56px (default), `medium` = 52px. */
  size?: "large" | "medium";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

/** Full-width navy primary action. */
export function PrimaryButton({
  label,
  onPress,
  size = "large",
  disabled = false,
  className,
  type = "button",
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onPress}
      disabled={disabled}
      className={cn(
        "w-full rounded-2xl bg-primary text-white transition-colors enabled:hover:bg-primary-hover",
        PRIMARY_DISABLED,
        size === "large" ? "h-14 text-base type-button" : "h-[52px] text-sm type-button",
        className,
      )}
      style={{ letterSpacing: size === "large" ? "-0.48px" : "-0.42px" }}
    >
      {label}
    </button>
  );
}

export interface SecondaryButtonProps {
  label: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
}

/** Full-width white outlined button with navy text. */
export function SecondaryButton({ label, onPress, disabled = false, className }: SecondaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={cn(
        "h-14 w-full rounded-2xl border border-border-default bg-white",
        "text-sm type-button-secondary text-primary transition-colors",
        OUTLINE_DISABLED,
        className,
      )}
      style={{ letterSpacing: "-0.63px" }}
    >
      {label}
    </button>
  );
}

export interface SocialButtonProps {
  label: ReactNode;
  icon?: ReactNode;
  onPress?: () => void;
  /** Black (Apple) variant. */
  dark?: boolean;
  className?: string;
}

/** Google / Apple sign-in button. */
export function SocialButton({ label, icon, onPress, dark = false, className }: SocialButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "flex h-[52px] w-full items-center justify-center gap-3 rounded-2xl border",
        dark
          ? "border-text-primary bg-text-primary text-white"
          : "border-border-google bg-white text-google-label",
        "text-sm type-button-secondary",
        className,
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export interface ActionSpec {
  label: string;
  to?: string;
  onPress?: () => void;
}

/** Link-or-button styled as a full-width primary/secondary CTA (StatePanel actions). */
export function ActionButton({
  action,
  variant,
  className,
  style,
}: {
  action: ActionSpec;
  variant: "primary" | "secondary";
  className?: string;
  style?: CSSProperties;
}) {
  const cls = cn(
    "flex h-13 w-full items-center justify-center rounded-2xl text-onb-body",
    variant === "primary"
      ? "bg-primary type-button text-white"
      : "type-button-secondary border border-border-default bg-white text-primary",
    className,
  );
  return action.to ? (
    <Link to={action.to} className={cls} style={style}>
      {action.label}
    </Link>
  ) : (
    <button type="button" onClick={action.onPress} className={cls} style={style}>
      {action.label}
    </button>
  );
}
