import { ReactNode } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { ROUTES } from "@/lib/constants";
import styles from "./layout.module.css";

const SIDEBAR_LINKS = [{ href: ROUTES.dashboard, label: "Overview" }];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Avatar name="Placeholder User" size="sm" />
          <span className={styles.userName}>Placeholder User</span>
        </div>
        <nav aria-label="Dashboard">
          <ul className={styles.navList}>
            {SIDEBAR_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.navLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
