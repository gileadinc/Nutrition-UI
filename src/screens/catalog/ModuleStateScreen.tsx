"use client";

import { Icon, PageContainer, PageHeader, PrimaryButton, SecondaryButton } from "@/components";
import type { IconName } from "@/components";
import { useNavigate, useParams } from "@/lib/nav";

const STATUS_ICON: Record<string, IconName> = {
  idle: "info",
  loading: "refresh",
  populated: "checkCircle",
  empty: "database",
  error: "alert",
  offline: "offline",
  permissionDenied: "lock",
};
const STATUS_COLOR: Record<string, string> = {
  idle: "var(--color-text-secondary)",
  loading: "var(--color-text-secondary)",
  populated: "var(--color-status-good)",
  empty: "var(--color-text-secondary)",
  error: "var(--color-status-low)",
  offline: "var(--color-status-over)",
  permissionDenied: "var(--color-status-over)",
};
const MODULES: Record<string, { title: string; backPath: string }> = {
  home: { title: "Home", backPath: "/home" },
  "fast-hacks": { title: "Fast Hacks", backPath: "/fast-hacks" },
  recipes: { title: "Recipes", backPath: "/recipes" },
  track: { title: "Track", backPath: "/track" },
  you: { title: "You", backPath: "/you" },
  assistant: { title: "Assistant", backPath: "/assistant" },
};
const FALLBACK = { title: "Module", backPath: "/home" };
const MESSAGE: Record<string, string> = {
  idle: "Nothing to show yet.",
  loading: "Loading your data...",
  populated: "Everything is up to date.",
  empty: "Nothing here yet.",
  error: "Something went wrong loading this module.",
  offline: "You're offline. Your data is safe on this device.",
  permissionDenied: "This needs a permission that has not been granted.",
};

/** Generic module status screen (loading / empty / error / offline / permission). */
export function ModuleStateScreen() {
  const { module = "", state = "idle" } = useParams<{ module: string; state: string }>();
  const navigate = useNavigate();
  const mod = MODULES[module] ?? FALLBACK;
  const status = state in MESSAGE ? state : "idle";
  const loading = status === "loading";
  const populated = status === "populated";
  return (
    <PageContainer variant="focused" pathname={`/state/${module}/${state}`}>
      <PageHeader
        title={mod.title}
        subtitle={populated ? "Ready to continue" : "Your progress stays on this device."}
        onBack={() => navigate(mod.backPath)}
      />
      <div className="h-7" />
      <section
        role={loading ? "status" : undefined}
        aria-live={loading ? "polite" : undefined}
        className="panel flex flex-col items-center gap-4 p-6 text-center"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <span
          data-testid="state-panel-icon"
          className="flex size-12 items-center justify-center rounded-full bg-brand-warm-gray"
        >
          <Icon name={STATUS_ICON[status]} size={24} color={STATUS_COLOR[status]} />
        </span>
        <h2
          className="text-lg type-section-title text-brand-navy"
          style={{ letterSpacing: "-0.81px" }}
        >
          {populated ? "Back on track" : mod.title}
        </h2>
        <p className="text-sm text-text-secondary">{MESSAGE[status]}</p>
        <div className="flex w-full flex-col gap-3 pt-2">
          <PrimaryButton
            label={populated ? "Continue" : "Try again"}
            disabled={loading}
            onPress={() => navigate(mod.backPath)}
          />
          {!populated && <SecondaryButton label="Go back" onPress={() => navigate(mod.backPath)} />}
        </div>
      </section>
    </PageContainer>
  );
}
