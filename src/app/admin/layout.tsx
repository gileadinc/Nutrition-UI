"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Store,
  ListOrdered,
  Zap,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { clearSession, clearGuestSessionId, useSession } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import styles from "./layout.module.css";

const NAV = [
  { href: ROUTES.admin.home, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: ROUTES.admin.recipes, label: "Recipes", icon: UtensilsCrossed },
  { href: ROUTES.admin.restaurants, label: "Restaurants", icon: Store },
  { href: ROUTES.admin.menuItems, label: "Menu items", icon: ListOrdered },
  { href: ROUTES.admin.fastHacks, label: "Fast Hacks", icon: Zap },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();

  async function handleSignOut() {
    try {
      await authApi.signOut({
        accessToken: session.accessToken ?? undefined,
        refreshToken: session.refreshToken ?? undefined,
      });
    } catch {
      // best effort
    }
    clearSession();
    clearGuestSessionId();
    router.push(ROUTES.login);
  }

  return (
    <RequireAdmin>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            Fork<span className={styles.brandAccent}>This!</span>
            <span className={styles.brandTag}>Admin</span>
          </div>

          <nav className={styles.nav} aria-label="Admin">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(styles.navLink, active && styles.navLinkActive)}
                >
                  <Icon className={styles.navIcon} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <Link href={ROUTES.dashboard} className={styles.footerLink}>
              <ArrowLeft className={styles.navIcon} />
              Back to app
            </Link>
            <button type="button" className={styles.footerLink} onClick={handleSignOut}>
              <LogOut className={styles.navIcon} />
              Sign out
            </button>
          </div>
        </aside>

        <main className={styles.main}>{children}</main>
      </div>
    </RequireAdmin>
  );
}
