"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { PageContainer, TwoColumn } from "@/components/Layout";
import { Link, useBack } from "@/lib/nav";
import { ICON_WELL } from "@/components/styles";

export const LINK_CLS = "tap-44 relative text-[13px] type-button text-primary underline-offset-2 hover:underline";
export const META = "type-meta text-[13px] leading-5 text-text-secondary";

/** Back-arrow page frame used by every /you sub-screen. */
export function ProfileLayout({
  title,
  subtitle,
  aside,
  asideLabel,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  aside?: ReactNode;
  asideLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const back = useBack("/you");
  const body = (
    <div className="mx-auto w-full max-w-2xl xl:mx-0">
      {children}
      {footer && (
        <div className="sticky bottom-[60px] z-20 -mx-5 mt-6 border-t border-border-divider bg-brand-cream px-5 py-3 md:static md:mx-0 md:border-t-0 md:bg-transparent md:px-0 md:py-0">
          {footer}
        </div>
      )}
    </div>
  );
  return (
    <PageContainer className="max-w-6xl">
      <header className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Go back"
          onClick={back}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-default bg-white transition-colors hover:border-text-neutral-400"
        >
          <Icon name="arrowBack" size={20} color="var(--color-text-primary)" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-[22px] type-display leading-7 tracking-[-1px] text-brand-navy md:text-2xl">
            {title}
          </h1>
          {subtitle && <p className={META}>{subtitle}</p>}
        </div>
      </header>
      <div className="mt-5 md:mt-6">
        {aside ? (
          <TwoColumn sidebarLabel={asideLabel ?? "Summary"} sidebar={aside}>
            {body}
          </TwoColumn>
        ) : (
          body
        )}
      </div>
    </PageContainer>
  );
}

export function FormSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-label={title} className={cn("mt-7 first:mt-0", className)}>
      <div className="mb-2.5 flex items-baseline gap-2">
        <h2 className="eyebrow flex-1 text-[12px]">{title}</h2>
        {action && <span className="shrink-0 text-[12px] type-meta text-text-secondary">{action}</span>}
      </div>
      {description && <div className="-mt-1 mb-3 type-meta text-[13px] leading-5 text-text-secondary">{description}</div>}
      {children}
    </section>
  );
}

export function RowGroup({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ul aria-label={label} className="panel divide-y divide-border-divider overflow-hidden shadow-card">
      {children}
    </ul>
  );
}

export function Row({
  icon,
  label,
  value,
  description,
  to,
  href,
  onPress,
  danger,
}: {
  icon: IconName;
  label: string;
  value?: ReactNode;
  description?: string;
  to?: string;
  href?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const chevron = (to !== undefined || href !== undefined) && !danger;
  const inner = (
    <>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          danger ? "bg-error-soft" : ICON_WELL,
        )}
      >
        <Icon name={icon} size={16} color={danger ? "var(--color-error-red)" : "var(--color-icon-well-ink)"} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-sm type-item-title", danger ? "text-error-red" : "text-text-primary")}>
          {label}
        </span>
        {description && <span className="block truncate type-meta text-xs text-text-secondary">{description}</span>}
      </span>
      {value != null && value !== "" && (
        <span className="max-w-[45%] shrink-0 truncate text-right type-meta text-[13px] text-text-secondary">{value}</span>
      )}
      {chevron && <Icon name="chevronRight" size={16} color="var(--color-text-neutral-400)" />}
    </>
  );
  const cls =
    "flex min-h-[56px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-brand-warm-gray/60";
  return (
    <li>
      {href !== undefined ? (
        <a href={href} className={cls}>
          {inner}
        </a>
      ) : to !== undefined ? (
        <Link to={to} className={cls}>
          {inner}
        </Link>
      ) : (
        <button type="button" onClick={onPress} className={cls}>
          {inner}
        </button>
      )}
    </li>
  );
}
