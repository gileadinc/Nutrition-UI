"use client";

import { lockBodyScroll } from "@/lib/hooks/scrollLock";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { useIsDesktop } from "@/lib/hooks";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Modal sheet (bottom sheet on mobile, centred card on md+), styled like the guest gate.
 * Escape and the scrim call `onClose` unless `dismissible` is false (confirm dialogs: only the
 * buttons close it). Focus moves in on open, is trapped, and returns to the trigger on close.
 */
export function Dialog({
  title,
  description,
  onClose,
  dismissible = true,
  role = "dialog",
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  onClose: () => void;
  dismissible?: boolean;
  role?: "dialog" | "alertdialog";
  children: ReactNode;
  className?: string;
}) {
  const desktop = useIsDesktop();
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const node = panel.current;
    const unlockScroll = lockBodyScroll();
    const first = node?.querySelector<HTMLElement>("input,textarea") ?? node;
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) {
        e.preventDefault();
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const a = items[0];
      const z = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === a || document.activeElement === node)) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      unlockScroll();
      opener?.focus?.();
    };
  }, [dismissible]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[56] flex bg-black/55 motion-safe:animate-[fade-in_200ms_ease-out]",
        desktop ? "items-center justify-center p-6" : "items-end",
      )}
      onMouseDown={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "drawer-panel flex max-h-[88dvh] w-full flex-col bg-white focus:outline-none",
          desktop ? "max-w-md rounded-3xl" : "rounded-t-[32px]",
          className,
        )}
        style={{ boxShadow: "var(--shadow-raised)" }}
      >
        {!desktop && <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-2xl bg-border-default" />}
        <header className="flex items-start gap-3 px-6 pb-2 pt-5 md:pt-6">
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-[22px] type-display leading-7 tracking-[-1px] text-brand-navy"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1.5 type-meta text-[13px] leading-5 text-text-secondary">
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-warm-gray"
            >
              <Icon name="close" size={16} color="var(--color-text-primary)" />
            </button>
          )}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 md:pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
