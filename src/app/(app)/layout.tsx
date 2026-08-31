"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, UtensilsCrossed, MapPin, NotebookPen, Bookmark, Settings, LogOut } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { clearSession, useSession } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import styles from "./layout.module.css";

const NAV = [
  { href: ROUTES.dashboard, label: "Home", icon: Home },
  { href: ROUTES.recipes, label: "Recipes", icon: UtensilsCrossed },
  { href: ROUTES.eatOut, label: "Eat out", icon: MapPin },
  { href: ROUTES.track, label: "Track", icon: NotebookPen },
  { href: ROUTES.saved, label: "Saved", icon: Bookmark },
  { href: ROUTES.settings, label: "Settings", icon: Settings },
];

export default function AppLayout({ children }: { children: ReactNode }) {
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
      // best effort — clear locally regardless
    }
    clearSession();
    router.push(ROUTES.login);
  }

  const name = session.email?.split("@")[0] ?? "You";

  return (
    <RequireAuth>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <UserAvatar name={name} size="sm" />
            <span className={styles.userName}>{session.email ?? "Signed in"}</span>
          </div>
          <nav aria-label="App">
            <ul className={styles.navList}>
              {NAV.map((link) => {
                const active =
                  pathname === link.href || pathname.startsWith(`${link.href}/`);
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(styles.navLink, active && styles.navLinkActive)}
                    >
                      <Icon className={styles.navIcon} />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <Button
            type="button"
            variant="ghost"
            className={styles.signOut}
            onClick={handleSignOut}
          >
            <LogOut className={styles.navIcon} />
            Sign out
          </Button>
        </aside>
        <main className={styles.content}>{children}</main>
      </div>
    </RequireAuth>
  );
}
