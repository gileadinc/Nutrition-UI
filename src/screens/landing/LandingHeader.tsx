"use client";

import { useState } from "react";
import { Link } from "@/lib/nav";
import { Brand } from "./Brand";

const NAV = [
  { label: "What we do", href: "#features" },
  { label: "Recipes & hacks", href: "#recipes" },
  { label: "Tracking", href: "#tracking" },
  { label: "Our story", href: "#team" },
  { label: "Contact", href: "#contact" },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4 md:px-8">
        <Link to="/landing" aria-label="ForkThis! home" className="mr-auto text-brand-navy">
          <Brand />
        </Link>
        <Link
          to="/signup"
          className="hidden rounded-full bg-primary px-4 py-2 text-xs type-button text-white transition-colors hover:bg-primary-hover md:block"
        >
          Sign up free
        </Link>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex size-10 flex-col items-center justify-center gap-1.5 rounded-full"
        >
          <span className="h-0.5 w-6 rounded bg-brand-navy" />
          <span className="h-0.5 w-6 rounded bg-brand-navy" />
          <span className="h-0.5 w-6 rounded bg-brand-navy" />
        </button>
      </div>
      {open && (
        <nav
          aria-label="Landing sections"
          className="absolute right-4 top-16 w-56 rounded-2xl border border-border-divider bg-white p-2 shadow-raised md:right-8"
        >
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm type-item-title text-text-primary hover:bg-navy-soft"
            >
              {n.label}
            </a>
          ))}
          <Link
            to="/signup"
            className="mt-1 block rounded-xl bg-primary px-3 py-2.5 text-center text-sm type-button text-white md:hidden"
          >
            Sign up free
          </Link>
        </nav>
      )}
    </header>
  );
}
