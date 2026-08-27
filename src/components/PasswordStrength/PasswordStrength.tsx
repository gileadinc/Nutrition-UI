import { cn } from "@/lib/utils";
import styles from "./PasswordStrength.module.css";

export type PasswordStrengthLevel = "empty" | "weak" | "fair" | "strong";

export function getPasswordStrength(password: string): PasswordStrengthLevel {
  if (!password) return "empty";
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return "weak";
  if (score <= 3) return "fair";
  return "strong";
}

const SEGMENT_COUNT = 3;

const LEVEL_META: Record<
  Exclude<PasswordStrengthLevel, "empty">,
  { filled: number; label: string; segmentClass: string }
> = {
  weak: { filled: 1, label: "Weak", segmentClass: styles.segmentWeak },
  fair: { filled: 2, label: "Fair", segmentClass: styles.segmentFair },
  strong: { filled: 3, label: "Strong", segmentClass: styles.segmentStrong },
};

export interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const level = getPasswordStrength(password);
  if (level === "empty") return null;

  const { filled, label, segmentClass } = LEVEL_META[level];

  return (
    <div className={styles.wrapper}>
      <div className={styles.track}>
        {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
          <span key={index} className={cn(styles.segment, index < filled && segmentClass)} />
        ))}
      </div>
      <p className={styles.label} aria-live="polite">
        Password strength: {label}
      </p>
    </div>
  );
}
