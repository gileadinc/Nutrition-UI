import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./ItemCard.module.css";

export interface ItemCardProps {
  href: string;
  title: string;
  subtitle?: string;
  meta?: string;
  tags?: string[];
  action?: ReactNode;
}

export function ItemCard({ href, title, subtitle, meta, tags, action }: ItemCardProps) {
  return (
    <div className={styles.card}>
      <Link href={href} className={styles.body}>
        <p className={styles.title}>{title}</p>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        {meta ? <p className={styles.meta}>{meta}</p> : null}
        {tags && tags.length > 0 ? (
          <div className={styles.tags}>
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </Link>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
