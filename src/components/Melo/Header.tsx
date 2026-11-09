"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { Link } from "@/lib/nav";
import { meloActions, useCanRecognize, useCanSpeak, useMelo } from "@/lib/melo";
import { MeloMark } from "./Bubbles";

export const ICON_BTN =
  "flex size-11 shrink-0 items-center justify-center rounded-full border border-border-default bg-white transition-colors hover:border-text-neutral-400 hover:bg-icon-well focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** Round outlined icon button (or link when `to` is given). */
export function MeloIconButton({
  label,
  icon,
  onClick,
  to,
  className,
}: {
  label: string;
  icon: IconName;
  onClick?: () => void;
  to?: string;
  className?: string;
}) {
  const glyph = <Icon name={icon} size={18} color="var(--color-primary)" />;
  return to ? (
    <Link to={to} onClick={onClick} aria-label={label} className={cn(ICON_BTN, className)}>
      {glyph}
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} className={cn(ICON_BTN, className)}>
      {glyph}
    </button>
  );
}

export function MeloHeader({
  title,
  subtitle,
  onBack,
  actions,
  titleAs: Title = "h1",
  markSize = 36,
  className,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: ReactNode;
  titleAs?: "h1" | "h2";
  markSize?: number;
  className?: string;
}) {
  return (
    <header className={cn("flex items-center gap-2.5", className)}>
      {onBack && (
        <button type="button" aria-label="Back" onClick={onBack} className={ICON_BTN}>
          <Icon name="arrowBack" size={20} color="var(--color-text-primary)" />
        </button>
      )}
      <MeloMark size={markSize} />
      <div className="min-w-0 flex-1">
        <Title className="truncate text-[21px] type-section-title leading-6 text-text-primary">{title}</Title>
        {subtitle && <p className="truncate text-xs type-meta leading-4 text-text-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="relative flex shrink-0 items-center gap-1.5">{actions}</div>}
    </header>
  );
}

/**
 * Voice settings popover: only shown when the browser supports voice input or read-aloud.
 * Typed questions are never read aloud.
 */
export function VoiceSettings() {
  const recognize = useCanRecognize();
  const speak = useCanSpeak();
  const on = useMelo((s) => s.voiceReplies);
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [open]);

  if (!recognize && !speak) return null;
  return (
    <div
      ref={wrap}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !open) return;
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        btn.current?.focus();
      }}
    >
      <button
        ref={btn}
        type="button"
        aria-label="Voice settings"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={cn(ICON_BTN, open && "border-text-neutral-400 bg-icon-well")}
      >
        <Icon name="voice" size={18} color="var(--color-primary)" />
      </button>
      {open && (
        <div
          id={id}
          role="group"
          aria-label="Voice settings"
          className="panel absolute right-0 top-full z-20 mt-2 w-[min(17rem,calc(100vw-2rem))] p-1.5"
        >
          {speak ? (
            <>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-describedby={`${id}-hint`}
                onClick={() => meloActions.setVoiceReplies(!on)}
                className="flex min-h-11 w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left transition-colors hover:bg-icon-well focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
              >
                <span className="min-w-0 flex-1 text-[18px] type-item-title leading-5 text-text-primary">
                  Read answers aloud after voice questions
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
                    on ? "bg-control-on" : "bg-border-default",
                  )}
                >
                  <span className={cn("size-5 rounded-full bg-white transition-transform", on && "translate-x-5")} />
                </span>
              </button>
              <p id={`${id}-hint`} className="px-2.5 pb-1.5 text-xs type-meta leading-4 text-text-secondary">
                Typed questions are never read aloud. Every answer has its own Read aloud.
              </p>
            </>
          ) : (
            <p className="px-2.5 py-2 text-xs type-meta leading-4 text-text-secondary">
              This browser can take voice questions but can’t read answers aloud.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
