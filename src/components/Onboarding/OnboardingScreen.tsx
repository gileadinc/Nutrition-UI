import { ReactNode } from "react";
import styles from "./OnboardingLayout.module.css";

export interface OnboardingScreenProps {
  /** Background image URL for the media panel. */
  image: string;
  imageAlt?: string;
  eyebrow?: string;
  heading: string;
  children: ReactNode;
  /** Progress indicator, rendered above the heading. */
  progress?: ReactNode;
  /** Action buttons / links, rendered below the body copy. */
  actions: ReactNode;
}

export function OnboardingScreen({
  image,
  imageAlt = "",
  eyebrow,
  heading,
  progress,
  children,
  actions,
}: OnboardingScreenProps) {
  return (
    <div className={styles.screen}>
      <div
        className={styles.media}
        style={{ backgroundImage: `url(${image})` }}
        role={imageAlt ? "img" : "presentation"}
        aria-label={imageAlt || undefined}
      />
      <div className={styles.panel}>
        <div className={styles.body}>
          {progress}
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h1 className={styles.heading}>{heading}</h1>
          <div className={styles.text}>{children}</div>
          <div className={styles.actions}>{actions}</div>
        </div>
      </div>
    </div>
  );
}
