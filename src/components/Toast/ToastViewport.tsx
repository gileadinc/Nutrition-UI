"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { dismissToast, getToasts, subscribeToasts, type ToastItem } from "@/lib/store/toast";

const TONES = {
  success: { icon: "checkCircle", ink: "var(--color-status-good)", well: "bg-brand-teal-soft" },
  error: { icon: "alert", ink: "var(--color-error-red)", well: "bg-brand-warm-gray" },
  info: { icon: "bell", ink: "var(--color-primary)", well: "bg-primary-soft" },
} as const;

const EMPTY: ToastItem[] = [];

/** Mount once (root layout). Renders the toasts fired via `toast.*` from `@/lib/store`. */
export function ToastViewport() {
  const items = useSyncExternalStore(subscribeToasts, getToasts, () => EMPTY);
  return (
    <div
      // Bottom-right; on mobile sit above the 60px tab bar.
      className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[70] flex flex-col items-end gap-2 p-4 sm:inset-x-auto sm:bottom-0 sm:right-0"
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const tone = TONES[toast.tone];
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.duration);
  const startedAt = useRef(0);

  useEffect(() => {
    if (toast.duration === 0 || paused) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => dismissToast(toast.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
    };
  }, [toast.id, toast.duration, paused]);

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border-default bg-white p-3.5",
        "motion-safe:animate-[toast-in_220ms_cubic-bezier(0.215,0.61,0.355,1)_backwards]",
      )}
      style={{ boxShadow: "var(--shadow-raised)" }}
    >
      <span
        className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", tone.well)}
      >
        <Icon name={tone.icon} size={18} color={tone.ink} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm type-item-title tracking-[-0.63px] text-text-primary">
          {toast.title}
        </p>
        {toast.body && (
          <p className="mt-0.5 type-meta text-[17px] leading-5 text-text-secondary">{toast.body}</p>
        )}
        {(toast.action || toast.link) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action!.run();
                  dismissToast(toast.id);
                }}
                className="tap-24 text-[17px] type-button text-primary"
              >
                {toast.action.label}
              </button>
            )}
            {toast.link && (
              <a
                href={toast.link.href}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                  e.preventDefault();
                  toast.link!.run();
                  dismissToast(toast.id);
                }}
                className="tap-24 text-[17px] type-button text-primary"
              >
                {toast.link.label}
              </a>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        aria-label={`Dismiss: ${toast.title}`}
        className="-m-1.5 flex size-9 shrink-0 items-center justify-center p-1.5"
      >
        <Icon name="close" size={14} color="var(--color-text-neutral-500)" />
      </button>
    </div>
  );
}
