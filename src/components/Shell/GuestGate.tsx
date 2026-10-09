"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { PrimaryButton, SecondaryButton } from "@/components/Button";
import { discoveryApi, type FeatureGate } from "@/lib/api";
import { useIsDesktop } from "@/lib/hooks";
import { useLocation, useNavigate } from "@/lib/nav";
import { GuestGateContext } from "@/lib/store/gate";
import { ICON_WELL } from "@/components/styles";

const PERKS = [
  { icon: "shield", label: "Secure" },
  { icon: "lock", label: "No credit card" },
  { icon: "tick", label: "Free forever" },
] as const;

const FALLBACK_COPY: Pick<FeatureGate, "description" | "ctaLabel"> = {
  description:
    "Tracking meals, saving favourites and personalised recommendations need somewhere to save to. Creating an account is free and takes about a minute — no credit card required.",
  ctaLabel: "Create free account",
};

const gateCache = new Map<string, FeatureGate>();
const gateKey = (feature: string) =>
  feature
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Account-gate copy from `GET /api/discovery/feature-gates/{key}`; static copy until it loads (or if it fails). */
function useGateCopy(feature: string | undefined) {
  const key = feature ? gateKey(feature) : "";
  const [loaded, setLoaded] = useState<FeatureGate | null>(null);
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    discoveryApi
      .getFeatureGate(key)
      .then((g) => {
        gateCache.set(key, g);
        if (!cancelled) setLoaded(g);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [key]);
  const gate = (key && gateCache.get(key)) || loaded;
  return {
    description: gate?.description || FALLBACK_COPY.description,
    ctaLabel: gate?.ctaLabel || FALLBACK_COPY.ctaLabel,
  };
}

/**
 * "This needs an account" sheet. Rendered by <GuestGateProvider> and by the
 * `/guest` screen (pass `feature` from `?feature=`).
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
  const copy = useGateCopy(feature);
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
          "w-full bg-white px-6 pb-6 pt-3",
          desktop ? "max-w-md rounded-3xl p-8" : "rounded-t-[32px]",
        )}
        style={{ boxShadow: "var(--shadow-raised)" }}
      >
        {!desktop && <div className="mx-auto h-1 w-10 rounded-2xl bg-border-default" />}
        <div className="mt-5 flex flex-col items-center text-center">
          <span className={cn("flex size-16 items-center justify-center rounded-full", ICON_WELL)}>
            <Icon name="shield" size={32} color="var(--color-icon-well-ink)" />
          </span>
          <h1
            className="mt-4 text-[32px] type-display text-text-primary"
            style={{ letterSpacing: "-1.26px", lineHeight: "34px" }}
          >
            {feature ? `${feature} needs an account` : "This feature needs an account"}
          </h1>
          <p className="mt-4 text-[19px] text-text-secondary">{copy.description}</p>
          <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2.5">
            {PERKS.map((p) => (
              <li key={p.label} className="flex items-center gap-1.5">
                <Icon name={p.icon} size={16} color="var(--color-brand-navy)" />
                <span className="text-[17px] type-meta text-text-secondary">{p.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex w-full flex-col gap-3">
            <PrimaryButton
              label={copy.ctaLabel}
              onPress={() =>
                navigate(next ? `/signup?next=${encodeURIComponent(next)}` : "/signup")
              }
            />
            <SecondaryButton
              label="Continue browsing"
              onPress={() => (onDismiss ? onDismiss() : navigate("/home", { replace: true }))}
            />
          </div>
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
