import { ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ROUTES } from "@/lib/constants";
import styles from "./layout.module.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <div className={styles.wrapper}>
        <div className={styles.panel}>
          <Link href={ROUTES.home} className={styles.brand}>
            Fork<span className={styles.brandAccent}>This!</span>
          </Link>
          {children}
        </div>
      </div>
    </AppShell>
  );
}
