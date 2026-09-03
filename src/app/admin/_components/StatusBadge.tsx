import type { PublishStatus } from "@/lib/api";
import styles from "./admin-form.module.css";

const TONE: Record<string, string> = {
  PUBLISHED: styles.badgePublished,
  APPROVED: styles.badgePublished,
  IN_REVIEW: styles.badgeReview,
  DRAFT: styles.badgeDraft,
  REJECTED: styles.badgeRejected,
};

export function StatusBadge({ status }: { status?: PublishStatus | null }) {
  if (!status) return <span className={styles.badgeUnknown}>—</span>;
  return (
    <span className={`${styles.badge} ${TONE[status] ?? styles.badgeDraft}`}>
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}
