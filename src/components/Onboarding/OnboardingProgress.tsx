import { cn } from "@/lib/utils";
import styles from "./OnboardingProgress.module.css";

export interface OnboardingProgressProps {
  /** 1-based index of the current step. */
  current: number;
  /** Total number of steps. */
  total: number;
}

export function OnboardingProgress({ current, total }: OnboardingProgressProps) {
  return (
    <div
      className={styles.wrapper}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={`Step ${current} of ${total}`}
    >
      <div className={styles.track}>
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn(styles.segment, index < current && styles.segmentActive)}
          />
        ))}
      </div>
      <p className={styles.label}>
        Step {current} of {total}
      </p>
    </div>
  );
}
