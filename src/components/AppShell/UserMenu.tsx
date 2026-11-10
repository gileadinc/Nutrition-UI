"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAvatar } from "../UserAvatar";
import { clearTokens } from "@/lib/api/tokenStore";
import { ROUTES } from "@/lib/constants";
import styles from "./UserMenu.module.css";

/** Avatar button that opens a small menu with a dashboard link and Log out. */
export function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function logOut() {
    setOpen(false);
    clearTokens();
    router.push(ROUTES.login);
  }

  return (
    <div className={styles.root} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <UserAvatar name="Account" size="sm" />
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <Link
            href={ROUTES.dashboard}
            className={styles.item}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          <button type="button" className={styles.item} role="menuitem" onClick={logOut}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
