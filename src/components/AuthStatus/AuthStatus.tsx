import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./AuthStatus.module.css";

export interface AuthStatusProps {
  /** Icon element shown in the circular badge. */
  icon: ReactNode;
  /** Use the success (green) badge treatment instead of the brand (orange) one. */
  tone?: "brand" | "success";
  heading: string;
  children: ReactNode;
  /** Optional emphasized value (e.g. an email address) shown in a highlight pill. */
  highlight?: string;
  /** Action buttons / links, rendered below the message. */
  actions?: ReactNode;
}

export function AuthStatus({
  icon,
  tone = "brand",
  heading,
  children,
  highlight,
  actions,
}: AuthStatusProps) {
  return (
    <div className={styles.wrapper}>
      <span
        className={cn(styles.iconBadge, tone === "success" && styles.iconBadgeSuccess)}
        aria-hidden="true"
      >
        {icon}
      </span>
      <h1 className={styles.heading}>{heading}</h1>
      <p className={styles.message}>{children}</p>
      {highlight ? <span className={styles.highlight}>{highlight}</span> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}

/** Class names for buttons/links placed in the `actions` slot. */
export const authStatusActionClasses = {
  primary: styles.primaryAction,
  link: styles.linkAction,
  mutedLink: styles.mutedLink,
};
