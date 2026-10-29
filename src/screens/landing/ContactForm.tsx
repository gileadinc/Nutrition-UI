"use client";

import { useState, type FormEvent } from "react";

const MAX = 600;
const FIELD =
  "w-full rounded-2xl border border-border-divider bg-navy-soft px-4 py-3.5 text-sm type-meta text-text-primary placeholder:text-text-neutral-400 focus:border-brand-navy focus:outline-none";
const LABEL =
  "mb-1.5 flex justify-between text-[11px] uppercase tracking-wider text-text-secondary";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[2rem] border border-border-divider bg-white p-6 shadow-card md:p-8"
    >
      <h3 className="text-2xl type-display text-text-primary">Send us a note</h3>
      <p className="mb-5 text-sm type-meta text-text-secondary">Takes less than a minute.</p>
      {sent ? (
        <p
          role="status"
          className="rounded-2xl bg-positive p-4 text-sm type-item-title text-positive-ink"
        >
          Thanks — your note was received in this preview. Nothing was sent or stored.
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="c-name" className={LABEL}>
              Name
            </label>
            <input
              id="c-name"
              name="name"
              required
              autoComplete="name"
              placeholder="Alex Rivera"
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="c-email" className={LABEL}>
              Email
            </label>
            <input
              id="c-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="alex@email.com"
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="c-message" className={LABEL}>
              Message
              <span>
                {message.length}/{MAX}
              </span>
            </label>
            <textarea
              id="c-message"
              name="message"
              required
              rows={5}
              maxLength={MAX}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what would make ForkThis! more useful…"
              className={`${FIELD} min-h-32 max-h-60 resize-y`}
            />
          </div>
          <button
            type="submit"
            className="flex h-13 w-full items-center justify-between rounded-full bg-text-primary py-1.5 pl-6 pr-1.5 text-sm type-button text-white transition-opacity hover:opacity-90"
          >
            Send message
            <span
              aria-hidden
              className="flex size-10 items-center justify-center rounded-full bg-accent"
            >
              ↗
            </span>
          </button>
          <p className="text-xs type-meta text-text-secondary">
            Form preview: nothing is sent or stored. Do not include medical, financial, or other
            sensitive information.
          </p>
        </div>
      )}
    </form>
  );
}
