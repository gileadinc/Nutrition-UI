"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { ActionButton, type ActionSpec } from "@/components/Button";

/* ------------------------------------------------------------ Skeletons */

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block animate-pulse rounded-md bg-brand-warm-gray motion-reduce:animate-none",
        className,
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="panel overflow-hidden">
      <Skeleton className="h-[150px] rounded-none md:h-44" />
      <div className="flex flex-col gap-2 p-3.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Suspense/loading fallback for listing pages. */
export function ListPageSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto w-full max-w-7xl px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10"
    >
      <span className="sr-only">Loading</span>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-64 max-w-full" />
      <Skeleton className="mt-3 h-3 w-80 max-w-full" />
      <div className="mt-8">
        <CardGridSkeleton count={6} />
      </div>
    </div>
  );
}

/** Loading fallback for hero-image detail pages. */
export function DetailPageSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="min-h-dvh">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-64 rounded-none md:h-80" />
      <div className="mx-auto w-full max-w-3xl px-5 pt-5 md:px-8 md:pt-8 lg:px-10">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="mt-3 h-7 w-2/3" />
        <Skeleton className="mt-2 h-3 w-1/3" />
        <div className="mt-6 flex flex-col gap-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/** Loading fallback for form pages. */
export function FormPageSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto w-full max-w-2xl px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10"
    >
      <span className="sr-only">Loading</span>
      <Skeleton className="h-8 w-48" />
      <div className="mt-6 flex flex-col gap-4">
        {Array.from({ length: fields }, (_, i) => (
          <span key={i}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-14 rounded-2xl" />
          </span>
        ))}
      </div>
      <Skeleton className="mt-6 h-14 rounded-2xl" />
    </div>
  );
}

/* ---------------------------------------------------------- State panels */

const TONES = {
  neutral: { bg: "bg-brand-warm-gray", color: "var(--color-text-secondary)" },
  warning: { bg: "bg-missed-dose-surface", color: "var(--color-status-over)" },
  error: { bg: "bg-error-soft", color: "var(--color-status-low)" },
} as const;

/** Full-page state (404, error, empty result) with up to two actions. */
export function StatePanel({
  icon,
  title,
  body,
  tone = "neutral",
  primary,
  secondary,
  detail,
  className,
}: {
  icon: IconName;
  title: string;
  body: string;
  tone?: keyof typeof TONES;
  primary?: ActionSpec;
  secondary?: ActionSpec;
  detail?: string;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-border-default bg-white px-6 py-10 text-center",
        className,
      )}
    >
      <span className={cn("flex size-14 items-center justify-center rounded-full", t.bg)}>
        <Icon name={icon} size={26} color={t.color} />
      </span>
      <h1 className="mt-5 text-onb-photo type-display text-brand-navy">{title}</h1>
      <p className="mt-2 max-w-md text-onb-body text-text-secondary">{body}</p>
      {(primary || secondary) && (
        <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
          {primary && <ActionButton action={primary} variant="primary" />}
          {secondary && <ActionButton action={secondary} variant="secondary" />}
        </div>
      )}
      {detail && (
        <p className="mt-6 max-w-md break-words font-mono type-meta text-onb-meta text-text-neutral-400">
          {detail}
        </p>
      )}
    </div>
  );
}

/** Inline empty state inside a page section. */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: ActionSpec;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-border-default bg-white px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-warm-gray">
        <Icon name={icon} size={22} color="var(--color-text-secondary)" />
      </span>
      <p className="mt-4 text-onb-body type-section-title text-text-primary">{title}</p>
      <p className="mt-1.5 max-w-sm type-meta text-onb-meta text-text-secondary">{body}</p>
      {action && (
        <div className="mt-5 w-full max-w-xs">
          <ActionButton action={action} variant="secondary" />
        </div>
      )}
    </div>
  );
}

/** Centres a StatePanel on the cream page background. */
export function CenteredShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-brand-cream px-5 py-12">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}

export function NotFoundPanel({ pathname }: { pathname?: string }) {
  return (
    <CenteredShell>
      <StatePanel
        icon="search"
        title="That page doesn't exist"
        body="The link may be out of date, or the address may have a typo. Everything else is still where you left it."
        primary={{ label: "Go to Home", to: "/home" }}
        secondary={{ label: "Browse Fast Hacks", to: "/fast-hacks" }}
        detail={pathname}
      />
    </CenteredShell>
  );
}

export function RouteErrorPanel({ error, reset }: { error?: Error; reset?: () => void }) {
  return (
    <CenteredShell>
      <StatePanel
        icon="alert"
        tone="error"
        title="This screen didn't load"
        body="Something failed while opening this page. Your account data is safe on our servers."
        primary={{
          label: reset ? "Try again" : "Reload the page",
          onPress: reset ?? (() => window.location.reload()),
        }}
        secondary={{ label: "Go to Home", to: "/home" }}
        detail={error?.message}
      />
    </CenteredShell>
  );
}

/** Last-resort boundary around the whole app. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ForkThis crashed:", error, info.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <CenteredShell>
        <StatePanel
          icon="alert"
          tone="error"
          title="ForkThis stopped responding"
          body="Reloading usually clears it. Nothing you have saved is affected."
          primary={{ label: "Reload the page", onPress: () => window.location.reload() }}
          secondary={{ label: "Start over", onPress: () => (window.location.href = "/") }}
          detail={this.state.error.message}
        />
      </CenteredShell>
    );
  }
}
