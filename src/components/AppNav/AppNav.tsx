"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  UtensilsCrossed,
  MapPin,
  NotebookPen,
  Bookmark,
  Settings,
  LogOut,
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator, MenuLabel } from "@/components/ui/menu";
import { clearSession, clearGuestSessionId, useSession } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import styles from "./AppNav.module.css";

const PRIMARY = [
  { href: ROUTES.dashboard, label: "Home", icon: Home },
  { href: ROUTES.recipes, label: "Recipes", icon: UtensilsCrossed },
  { href: ROUTES.eatOut, label: "Eat out", icon: MapPin },
  { href: ROUTES.track, label: "Track", icon: NotebookPen },
  { href: ROUTES.saved, label: "Saved", icon: Bookmark },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === ROUTES.dashboard
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const router = useRouter();
  const session = useSession();
  const isActive = useIsActive();

  const name = session.email?.split("@")[0] ?? "You";

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
    <>
      <header className={styles.topbar}>
        <div className={styles.inner}>
          <Link href={ROUTES.dashboard} className={styles.brand}>
            Fork<span className={styles.brandAccent}>This!</span>
          </Link>

          <nav className={styles.desktopNav} aria-label="Primary">
            {PRIMARY.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(styles.navLink, isActive(href) && styles.navLinkActive)}
              >
                {label}
              </Link>
            ))}
          </nav>

          <Menu>
            <MenuTrigger className={styles.avatarButton} aria-label="Account menu">
              <UserAvatar name={name} size="sm" />
            </MenuTrigger>
            <MenuContent>
              <MenuLabel>{session.email ?? "Signed in"}</MenuLabel>
              <MenuItem
                render={
                  <Link href={ROUTES.settings}>
                    <Settings />
                    Settings
                  </Link>
                }
              />
              <MenuSeparator />
              <MenuItem onClick={handleSignOut}>
                <LogOut />
                Sign out
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </header>

      <nav className={styles.bottomBar} aria-label="Primary">
        {PRIMARY.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(styles.tab, isActive(href) && styles.tabActive)}
          >
            <Icon className={styles.tabIcon} />
            <span className={styles.tabLabel}>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
