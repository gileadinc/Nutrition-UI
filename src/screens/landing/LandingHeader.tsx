"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Brand } from "./Brand";

const NAV = [
  { label: "How it works", href: "#features" },
  { label: "What's inside", href: "#tracking" },
  { label: "About us", href: "#team" },
  // No dedicated FAQ section yet — points at the contact form.
  { label: "FAQs", href: "#contact" },
  { label: "Contact us", href: "#contact" },
];

function NavDialog({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/45" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-2 bottom-2 top-2 flex flex-col bg-white px-[3.25rem] pb-7 pt-[3.25rem] max-md:px-6 max-md:pt-12 md:inset-y-4 md:left-auto md:right-4 md:w-[30rem] md:rounded-2xl md:px-12"
      >
        <div className="flex items-center justify-between border-b border-border-divider pb-3">
          <span className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">
            Navigation
          </span>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="flex size-8 items-center justify-center text-text-primary"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </div>
        <nav aria-label="Sections">
          <ol>
            {NAV.map((n, i) => (
              <li key={n.label} className="border-b border-border-divider">
                <a
                  href={n.href}
                  onClick={onClose}
                  className="flex items-baseline gap-2 py-4 text-[26px] font-light uppercase leading-tight tracking-wide text-brand-navy hover:text-teal-700"
                >
                  <span className="text-lg text-text-neutral-400">{i + 1}.</span>
                  {n.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <p className="mt-auto text-xs type-meta text-text-secondary">
          Less guessing. More enjoying your food.
        </p>
      </div>
    </div>
  );
}

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-[1512px] items-center gap-3 px-5 py-4 md:px-8">
        <Link
          to="/landing"
          aria-label="ForkThis! home"
          className="mr-auto text-brand-navy md:hidden"
        >
          <Brand />
        </Link>
        <Link
          to="/signup"
          className="ml-auto hidden items-center gap-2 rounded-full bg-text-primary px-4 py-2.5 text-xs type-button text-white transition-opacity hover:opacity-90 md:inline-flex"
        >
          Sign up free <span aria-hidden>↗</span>
        </Link>
        <button
          type="button"
          aria-label="Open navigation"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className={cn("flex size-10 flex-col items-center justify-center gap-1.5")}
        >
          <span className="h-0.5 w-6 rounded bg-brand-navy" />
          <span className="h-0.5 w-6 rounded bg-brand-navy" />
        </button>
      </div>
      {open && <NavDialog onClose={() => setOpen(false)} />}
    </header>
  );
}
