"use client";

import { ReactNode } from "react";
import { OnboardingProgress } from "./OnboardingProgress";
import styles from "./OnboardingFormShell.module.css";

export interface OnboardingFormShellProps {
  step: number;
  total: number;
  eyebrow: string;
  heading: string;
  description?: string;
  children: ReactNode;
}

export function OnboardingFormShell({
  step,
  total,
  eyebrow,
  heading,
  description,
  children,
}: OnboardingFormShellProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <OnboardingProgress current={step} total={total} />
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.heading}>{heading}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
