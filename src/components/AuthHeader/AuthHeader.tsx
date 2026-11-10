import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import styles from "./AuthHeader.module.css";

export interface AuthHeaderProps {
  heading: string;
  subtext?: string;
  /** Show the ForkThis! logo lockup above the heading. */
  showBrand?: boolean;
  /** Extra-bold heading weight (used on the create-account screen). */
  strong?: boolean;
}

export function AuthHeader({ heading, subtext, showBrand = false, strong = false }: AuthHeaderProps) {
  return (
    <div>
      {showBrand ? <Logo className={styles.brand} /> : null}
      <h1 className={cn(styles.heading, !showBrand && styles.headingNoBrand, strong && styles.strong)}>
        {heading}
      </h1>
      {subtext ? (
        <p className={cn(styles.subtext, !showBrand && styles.subtextTight)}>{subtext}</p>
      ) : null}
    </div>
  );
}
