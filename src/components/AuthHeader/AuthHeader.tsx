import styles from "./AuthHeader.module.css";

export interface AuthHeaderProps {
  heading: string;
  subtext?: string;
  /** @deprecated The auth layout now renders the brand lockup. */
  showBrand?: boolean;
  /** @deprecated Decorative media strip is no longer used. */
  showMedia?: boolean;
}

export function AuthHeader({ heading, subtext }: AuthHeaderProps) {
  return (
    <div className={styles.root}>
      <h1 className={styles.heading}>{heading}</h1>
      {subtext ? <p className={styles.subtext}>{subtext}</p> : null}
    </div>
  );
}
