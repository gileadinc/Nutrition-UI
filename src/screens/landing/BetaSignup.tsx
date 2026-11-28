"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Dialog } from "@/components/Collections/Dialog";
import { LegalDialog } from "@/components/LegalDialog";
import { BetaSignupError, submitBetaSignup } from "@/lib/beta/submit";

const FIELD =
  "w-full rounded-xl border border-border-divider bg-[#f4f6fb] px-4 py-3 text-sm type-meta text-text-primary placeholder:text-text-neutral-400 focus:border-brand-navy focus:outline-none";
const LABEL = "mb-1.5 block text-left text-[11px] uppercase tracking-wider text-text-secondary";

function BetaForm({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    // Honeypot: real people never tick the hidden box. Pretend success so bots learn nothing.
    if (form.get("botcheck")) return setStatus("done");
    const get = (key: string) => String(form.get(key) ?? "");

    setStatus("sending");
    setError("");
    try {
      await submitBetaSignup({
        firstName: get("firstName"),
        lastName: get("lastName"),
        email: get("email"),
        phone: get("phone"),
        source: get("source"),
      });
      setStatus("done");
    } catch (err) {
      setError(err instanceof BetaSignupError ? err.message : "Something went wrong. Try again.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div role="status">
        <p className="rounded-2xl bg-positive p-4 text-sm type-item-title text-positive-ink">
          You’re on the list! We’ll email you as soon as the beta opens.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-brand-navy text-base type-button text-white transition-colors hover:bg-primary-hover"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="beta-first" className={LABEL}>
            First name
          </label>
          <input
            id="beta-first"
            name="firstName"
            required
            autoComplete="given-name"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="beta-last" className={LABEL}>
            Last name
          </label>
          <input
            id="beta-last"
            name="lastName"
            required
            autoComplete="family-name"
            className={FIELD}
          />
        </div>
      </div>
      <div>
        <label htmlFor="beta-email" className={LABEL}>
          Email
        </label>
        <input
          id="beta-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="alex@email.com"
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor="beta-phone" className={LABEL}>
          Phone
        </label>
        <input
          id="beta-phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor="beta-source" className={LABEL}>
          How did you hear about us? <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <input id="beta-source" name="source" maxLength={200} className={FIELD} />
      </div>
      {/* Honeypot (bots fill it, people never see it). */}
      <input
        type="checkbox"
        name="botcheck"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />
      {error && (
        <p role="alert" className="text-sm type-meta text-error-ink">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="flex h-13 w-full items-center justify-center rounded-full bg-primary text-base type-button text-white transition-colors enabled:hover:bg-primary-hover disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Join the beta"}
      </button>
      <p className="text-xs type-meta text-text-secondary">
        We’ll only use your details to invite you to the beta. See our{" "}
        <LegalDialog doc="privacy">Privacy Policy</LegalDialog>.
      </p>
    </form>
  );
}

/** Landing CTA: opens the beta-tester sign-up form in a modal. */
export function BetaSignupButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open && (
        <Dialog
          title="Sign up as a beta tester"
          description="Be among the first to try ForkThis!"
          onClose={() => setOpen(false)}
          lockBackdrop
        >
          <BetaForm onClose={() => setOpen(false)} />
        </Dialog>
      )}
    </>
  );
}
