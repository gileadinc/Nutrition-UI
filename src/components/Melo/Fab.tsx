"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { useLocation } from "@/lib/nav";
import { meloActions, useMelo } from "@/lib/melo";
import { AssistantMark } from "./AssistantMark";
import { MeloPanel } from "./Panel";

/** Routes where the popup does not appear (full-bleed screens with their own chrome). */
const IMMERSIVE =
  /^\/recipes\/[^/]+\/(ingredients|cook)$|^\/you\/(personal-details|goal|activity-level)$/;
const available = (pathname: string) =>
  !(pathname.startsWith("/assistant") || pathname === "/ai") && !IMMERSIVE.test(pathname);
/** Detail pages (a hack or recipe) open in a drawer that has its own actions. */
const DETAIL = /^\/hack\/[^/]+$|^\/recipes\/(mine\/)?(?!new$)[^/]+$/;

/** Floating "Ask ForkThis!" button plus the chat popup it opens. Mounted once in the app shell. */
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
        aria-label={open ? "Close ForkThis!" : "Ask ForkThis!"}
        className={cn(
          DETAIL.test(pathname) && !open ? "hidden" : "flex",
          "fixed bottom-[76px] right-4 z-30 h-14 items-center gap-2.5 rounded-full bg-design-orange pl-2.5 pr-5 transition-[filter] hover:brightness-95 motion-reduce:transform-none md:bottom-6 md:right-6",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-safe:animate-[melo-rise_300ms_ease-out_backwards]",
          open && "md:hidden",
        )}
        style={{ boxShadow: "var(--shadow-fab)" }}
      >
        <AssistantMark size={40} animated={!open} onDark />
        {open && <Icon name="close" size={18} color="white" />}
        <span className="text-[15px] type-button text-white">
          {open ? "Close" : "Ask ForkThis!"}
        </span>
      </button>
      {open && <MeloPanel pathname={pathname} />}
    </>
  );
}
