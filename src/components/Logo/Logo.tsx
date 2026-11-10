import { cn } from "@/lib/utils";
import styles from "./Logo.module.css";

export interface LogoProps {
  /** Render only the "F!" tile. */
  mark?: boolean;
  /** Light variant for use over dark photos. */
  light?: boolean;
  className?: string;
}

export function Logo({ mark = false, light = false, className }: LogoProps) {
  return (
    <span className={cn(styles.logo, light && styles.light, className)} data-testid="logo">
      <span className={styles.tile} aria-hidden="true">
        F!
      </span>
      {mark ? <span className="sr-only">ForkThis!</span> : <span className={styles.word}>ForkThis!</span>}
    </span>
  );
}
