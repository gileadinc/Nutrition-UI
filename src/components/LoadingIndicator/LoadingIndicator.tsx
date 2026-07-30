import styles from "./LoadingIndicator.module.css";

export interface LoadingIndicatorProps {
  label?: string;
}

export function LoadingIndicator({ label = "Loading" }: LoadingIndicatorProps) {
  return (
    <div className={styles.wrapper} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
