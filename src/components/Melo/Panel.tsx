"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@/lib/nav";
import { meloActions, useMelo } from "@/lib/melo";
import { MeloChat } from "./Chat";
import { MeloHeader, MeloIconButton, VoiceSettings } from "./Header";

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/** The Melo chat popup: bottom sheet on mobile, floating card on lg. */
export function MeloPanel({ pathname }: { pathname: string }) {
  const hasTurns = useMelo((s) => s.turns.length > 0);
  const navigate = useNavigate();
  const root = useRef<HTMLElement>(null);
  const [opener] = useState(() => (typeof document === "undefined" ? null : document.activeElement));
  const [openedOn] = useState(pathname);

  const close = () => {
    const samePage = openedOn === pathname;
    meloActions.close();
    requestAnimationFrame(() => {
      if (samePage && opener instanceof HTMLElement && opener.isConnected) opener.focus();
    });
  };
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });

  useEffect(() => {
    const el = root.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!e.defaultPrevented) closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !el) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Close Melo"
        tabIndex={-1}
        onClick={close}
        className="fixed inset-0 z-40 bg-text-primary/35 lg:hidden"
      />
      <section
        ref={root}
        role="dialog"
        aria-modal="true"
        aria-label="Melo"
        className="fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col overflow-hidden rounded-t-[24px] bg-white motion-safe:animate-[drawer-in_260ms_cubic-bezier(0.215,0.61,0.355,1)_backwards] lg:inset-x-auto lg:bottom-6 lg:right-6 lg:h-[min(44rem,85dvh)] lg:w-[26rem] lg:rounded-[24px] lg:border lg:border-border-default"
        style={{ boxShadow: "var(--shadow-raised)" }}
      >
        <span aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-border-default lg:hidden" />
        <MeloHeader
          title="Ask Melo"
          subtitle="Answers from your day"
          titleAs="h2"
          markSize={32}
          className="border-b border-border-divider py-2 pl-4 pr-2.5"
          actions={
            <>
              <VoiceSettings />
              {hasTurns && <MeloIconButton label="New chat" icon="pencilEdit" onClick={() => meloActions.newChat()} />}
              <MeloIconButton
                label="Expand to the full Melo page"
                icon="expand"
                onClick={() => {
                  meloActions.close();
                  navigate("/assistant");
                }}
              />
              <MeloIconButton label="Close Melo" icon="close" onClick={close} />
            </>
          }
        />
        <MeloChat size="sheet" onNavigate={() => meloActions.close()} autoFocus />
      </section>
    </>
  );
}
