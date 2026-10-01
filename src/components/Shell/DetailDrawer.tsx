"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useBack } from "@/lib/nav";

/**
 * Modal detail panel (bottom sheet on mobile, centred card on md+). The
 * deployed app opened /hack/:id and /recipes/:id in this over the previous
 * screen; in Next these are regular pages, so use this only if a screen wants
 * the modal look. Escape / scrim click call `onClose` (default: history back).
 */
export function DetailDrawer({
  children,
  onClose,
  fallbackPath,
}: {
  children: ReactNode;
  onClose?: () => void;
  fallbackPath?: string;
}) {
  const back = useBack(fallbackPath);
  const close = onClose ?? back;
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [close]);
  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center md:items-center md:p-8">
      <button
        type="button"
        aria-hidden
        data-testid="drawer-scrim"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default bg-black/55 motion-safe:animate-[fade-in_200ms_ease-out]"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Details"
        tabIndex={0}
        data-testid="detail-drawer"
        className="drawer-panel relative z-10 h-[calc(100dvh-0.75rem)] w-full overflow-y-auto rounded-t-[28px] bg-brand-cream focus:outline-none md:h-[min(860px,calc(100dvh-5rem))] md:max-w-5xl md:rounded-[20px] md:border md:border-border-default md:shadow-raised"
      >
        {children}
      </div>
    </div>
  );
}
