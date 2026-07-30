import { ReactNode } from "react";
import Link from "next/link";
import { Container } from "../Container";
import { ROUTES } from "@/lib/constants";
import type { NavLink } from "@/lib/types";
import styles from "./AppShell.module.css";

const NAV_LINKS: NavLink[] = [
  { href: ROUTES.home, label: "Home" },
  { href: ROUTES.about, label: "About" },
  { href: ROUTES.dashboard, label: "Dashboard" },
  { href: ROUTES.login, label: "Log in" },
];

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Container className={styles.headerInner}>
          <Link href="/" className={styles.logo}>
            Nutrition (placeholder name)
          </Link>
          <nav aria-label="Primary">
            <ul className={styles.navList}>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.navLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <Container className={styles.footerInner}>
          <p>&copy; {new Date().getFullYear()} Nutrition (placeholder name). Placeholder footer.</p>
        </Container>
      </footer>
    </div>
  );
}
