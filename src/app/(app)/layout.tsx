import { ReactNode } from "react";
import { AppNav } from "@/components/AppNav";
import { RequireAuth } from "@/components/RequireAuth";
import styles from "./layout.module.css";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <div className={styles.shell}>
        <AppNav />
        <main className={styles.main}>
          <div className={styles.content}>{children}</div>
        </main>
      </div>
    </RequireAuth>
  );
}
