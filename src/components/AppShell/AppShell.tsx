"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "../Container";
import { ROUTES } from "@/lib/constants";
import { useSession } from "@/lib/auth";
import type { NavLink } from "@/lib/types";
import { cn } from "@/lib/utils";
import styles from "./AppShell.module.css";

const NAV_LINKS: NavLink[] = [
  { href: ROUTES.home, label: "Home" },
  { href: ROUTES.guestHome, label: "Discover" },
];

export interface AppShellProps {
  children: ReactNode;
}

/** Marketing / public site chrome: header + footer. Not used by the signed-in app. */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const session = useSession();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Container className={styles.headerInner}>
          <Link href={ROUTES.home} className={styles.logo}>
            Fork<span className={styles.logoAccent}>This!</span>
          </Link>
          <nav aria-label="Primary">
            <ul className={styles.navList}>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      styles.navLink,
                      pathname === link.href && styles.navLinkActive,
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={session.accessToken ? ROUTES.dashboard : ROUTES.login}
                  className={styles.navCta}
                >
                  {session.accessToken ? "Open app" : "Log in"}
                </Link>
              </li>
            </ul>
          </nav>
        </Container>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <Container className={styles.footerInner}>
          <p>&copy; {new Date().getFullYear()} ForkThis!</p>
        </Container>
      </footer>
    </div>
  );
}
