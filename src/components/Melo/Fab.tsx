"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { useLocation } from "@/lib/nav";
import { meloActions, useMelo } from "@/lib/melo";
import { MeloPanel } from "./Panel";

/** Routes where the popup does not appear (full-bleed screens with their own chrome). */
const IMMERSIVE = /^\/recipes\/[^/]+\/(ingredients|cook)$|^\/you\/personal-details$/;
const available = (pathname: string) =>
  !(pathname.startsWith("/assistant") || pathname === "/ai") && !IMMERSIVE.test(pathname);

/** Floating "Ask Melo" button plus the chat popup it opens. Mounted once in the app shell. */
export function MeloLayer() {
  const { pathname } = useLocation();
  const open = useMelo((s) => s.open);
  const visible = available(pathname);
  const openedOn = useRef<string | null>(null);

  useEffect(() => {
    meloActions.hydrate();
  }, []);

  // The panel belongs to the page it was opened on: navigating away closes it.
  useEffect(() => {
    if (open && openedOn.current !== null && openedOn.current !== pathname) meloActions.close();
  }, [open, pathname]);
  if (!visible) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          openedOn.current = pathname;
          meloActions.toggle();
        }}
        aria-expanded={open}
        aria-label={open ? "Close Melo" : "Ask Melo"}
        className={cn(
          "fixed bottom-[76px] right-4 z-30 flex h-14 items-center gap-2.5 rounded-full bg-accent pl-4 pr-5 transition-transform hover:-translate-y-0.5 hover:scale-105 active:scale-95 motion-reduce:transform-none md:bottom-6 md:right-6",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-safe:animate-[melo-rise_300ms_ease-out_backwards]",
          open && "md:hidden",
        )}
        style={{ boxShadow: "var(--shadow-fab)" }}
      >
        <Icon name={open ? "close" : "chefHat"} size={20} color="var(--color-on-accent)" />
        <span className="text-sm type-button text-on-accent">{open ? "Close" : "Ask Melo"}</span>
      </button>
      {open && <MeloPanel pathname={pathname} />}
    </>
  );
}
