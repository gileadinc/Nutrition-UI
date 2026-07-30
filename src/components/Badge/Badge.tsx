import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./Badge.module.css";

export type BadgeVariant = "neutral" | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
}

export function Badge({ children, variant = "neutral", className, ...rest }: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[variant], className)} {...rest}>
      {children}
    </span>
  );
}
