"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { UI } from "@/content";
import { useUserLocation } from "@/lib/location";

const COPY = UI.location;

/**
 * Asks (on tap, never on load) for the user's location so eat-out results can be filtered to
 * restaurants nearby. Collapses to a one-line status once location is on.
 */
export function LocationPrompt({ className }: { className?: string }) {
  const { coords, status, request, clear } = useUserLocation();
  const locating = status === "locating";

  if (coords && status === "granted") {
    return (
      <div
        role="status"
        className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-border-default bg-white px-4 py-2.5",
          className,
        )}
      >
        <Icon name="location" size={18} color="var(--color-primary)" />
        <span className="min-w-0 flex-1 text-[17px] type-meta text-text-primary">
          {COPY.active}
        </span>
        <button
          type="button"
          onClick={clear}
          className="min-h-9 rounded-full border border-border-default bg-white px-3.5 text-[15px] type-button text-primary hover:border-text-neutral-400"
        >
          {COPY.clear}
        </button>
      </div>
    );
  }

  const problem =
    status === "denied"
      ? COPY.denied
      : status === "unavailable"
        ? COPY.unavailable
        : status === "unsupported"
          ? COPY.unsupported
          : null;

  return (
    <section
      aria-label={COPY.title}
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-border-default bg-white px-3.5 py-2.5",
        className,
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-icon-well">
        <Icon name="location" size={18} color="var(--color-icon-well-ink)" />
      </span>
      <div className="min-w-0 flex-1 basis-56">
        <h2 className="text-[17px] leading-5 type-section-title text-brand-navy">{COPY.title}</h2>
        <p className="text-[15px] leading-5 type-meta text-text-secondary">{COPY.body}</p>
        {problem && (
          <p role="alert" className="mt-1 text-[15px] leading-5 type-meta text-error-red">
            {problem}
          </p>
        )}
      </div>
      {status !== "unsupported" && (
        <button
          type="button"
          onClick={request}
          disabled={locating}
          className="h-9 shrink-0 rounded-full bg-primary px-4 text-[15px] type-button text-on-primary transition-colors enabled:hover:bg-primary-hover disabled:opacity-60"
        >
          {locating ? COPY.locating : status === "idle" ? COPY.allow : COPY.retry}
        </button>
      )}
    </section>
  );
}
