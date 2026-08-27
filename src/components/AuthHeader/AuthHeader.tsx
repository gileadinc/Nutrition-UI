import { UtensilsCrossed } from "lucide-react";
import styles from "./AuthHeader.module.css";

export interface AuthHeaderProps {
  heading: string;
  subtext?: string;
  /** Show the ForkThis! brand lockup above the heading. */
  showBrand?: boolean;
  /** Show the decorative food image strip at the top of the card. */
  showMedia?: boolean;
}

export function AuthHeader({
  heading,
  subtext,
  showBrand = false,
  showMedia = false,
}: AuthHeaderProps) {
  return (
    <div>
      {showMedia ? <div className={styles.media} role="presentation" /> : null}
      {showBrand ? (
        <p className={styles.brand}>
          <span className={styles.brandIcon}>
            <UtensilsCrossed className="size-4" />
          </span>
          <span>
            Fork<span className={styles.brandAccent}>This!</span>
          </span>
        </p>
      ) : null}
      <h1 className={styles.heading}>{heading}</h1>
      {subtext ? <p className={styles.subtext}>{subtext}</p> : null}
    </div>
  );
}
