"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppImage } from "@/components/AppImage";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { SecondaryButton } from "@/components/Button";
import { useIsDesktop } from "@/lib/hooks";
import { useLocation, useNavigate } from "@/lib/nav";
import { GuestGateContext } from "@/lib/store/gate";
import { ICON_WELL } from "@/components/styles";
import { GUEST_GATE, fill } from "@/content";

const PERKS = GUEST_GATE.perks;

/**
 * "This needs an account" dialog (bottom sheet on mobile). Rendered by <GuestGateProvider> and by
 * the `/guest` screen (pass `feature` from `?feature=`).
 */
export function GuestFeatureGate({
  feature,
  next,
  onDismiss,
}: {
  feature?: string;
  /** Where to return after sign-up. */
  next?: string;
  onDismiss?: () => void;
}) {
  const navigate = useNavigate();
  const desktop = useIsDesktop();
  const query = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex bg-black/55",
        desktop ? "items-center justify-center p-6" : "items-end",
      )}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Account required"
        className={cn(
          "w-full overflow-y-auto overflow-x-hidden bg-white",
          desktop
            ? "max-h-[calc(100dvh-3rem)] max-w-md rounded-3xl"
            : "max-h-[94dvh] rounded-t-[32px]",
        )}
        style={{ boxShadow: "var(--shadow-raised)" }}
      >
        <div className="relative overflow-hidden bg-teal-100 px-6 pt-3">
          <AppImage
            src="/design/gate-banner-bg.svg"
            alt=""
            className="pointer-events-none absolute inset-0 size-full"
          />
          {!desktop && <div className="relative mx-auto h-1 w-10 rounded-2xl bg-navy-200" />}
          <AppImage
            src="/design/gate-illustration.svg"
            alt=""
            className="relative mx-auto mt-2 block h-44 w-auto"
          />
        </div>
        <div className="px-6 pb-6 pt-5 text-center">
          <h1
            className="text-[26px] type-display text-text-primary"
            style={{ letterSpacing: "-1.26px", lineHeight: "32px" }}
          >
            {feature ? fill(GUEST_GATE.title.withFeature, { feature }) : GUEST_GATE.title.generic}
          </h1>
          <p className="mt-2 text-[15px] text-text-secondary">{GUEST_GATE.subtitle}</p>
          <ul className="mt-5 flex flex-col gap-3 text-left">
            {GUEST_GATE.features.map((f) => (
              <li key={f.title} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    ICON_WELL,
                  )}
                >
                  <Icon name={f.icon} size={20} color="var(--color-icon-well-ink)" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] type-item-title text-text-primary">
                    {f.title}
                  </span>
                  <span className="block text-[13px] type-meta text-text-secondary">{f.body}</span>
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => navigate(`/signup${query}`)}
            className="relative mt-6 flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-primary text-base type-button text-white transition-[background-color,transform] hover:bg-primary-hover active:scale-[0.98]"
            style={{ letterSpacing: "-0.48px" }}
          >
            <span className="relative">{GUEST_GATE.fallbackCta}</span>
            <span aria-hidden className="relative flex">
              <Icon name="chevronRight" size={20} color="currentColor" />
            </span>
          </button>
          <div className="mt-3">
            <SecondaryButton
              label={GUEST_GATE.dismiss}
              onPress={() => (onDismiss ? onDismiss() : navigate("/home", { replace: true }))}
            />
          </div>
          <p className="mt-3 text-[13px] text-text-secondary">
            {GUEST_GATE.alreadyHave}{" "}
            <button
              type="button"
              onClick={() => navigate(`/signin${query}`)}
              className="tap-44 relative type-button text-primary underline underline-offset-2"
            >
              {GUEST_GATE.logIn}
            </button>
          </p>
          <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {PERKS.map((p) => (
              <li key={p.label} className="flex items-center gap-1.5">
                <Icon name={p.icon} size={16} color="var(--color-brand-navy)" />
                <span className="text-[13px] type-meta text-text-secondary">{p.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Provides `useRequireAccount()` with an in-place modal (Escape closes it). Mounted by the (app) layout. */
export function GuestGateProvider({ children }: { children: ReactNode }) {
  const [feature, setFeature] = useState<string | null>(null);
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (feature === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setFeature(null);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [feature]);
  const value = useMemo(() => ({ request: setFeature }), []);
  return (
    <GuestGateContext.Provider value={value}>
      <div className="contents" inert={feature !== null}>
        {children}
      </div>
      {feature !== null && (
        <GuestFeatureGate
          feature={feature}
          next={`${pathname}${search}`}
          onDismiss={() => setFeature(null)}
        />
      )}
    </GuestGateContext.Provider>
  );
}
