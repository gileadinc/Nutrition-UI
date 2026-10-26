"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { Link } from "@/lib/nav";
import { useIsLg, useReducedMotion } from "@/lib/hooks";
import { useProfile } from "@/lib/store";
import { GOAL_LABEL } from "@/lib/nutrition";
import {
  ICON_WELL,
  LINK_ACTION,
  NO_MOTION,
  PAGE_TITLE,
  SECTION_TITLE,
  SELECTED_CHIP,
  SPRING_SOFT,
} from "@/components/styles";

/* ------------------------------------------------------------ CheckMark */

/** Small tick used inside selected chips. */
export function CheckMark({ size = 14 }: { size?: number }) {
  return (
    <span aria-hidden="true" className="inline-flex shrink-0">
      <Icon name="tick" size={size} color="var(--color-on-selected)" />
    </span>
  );
}

/* ---------------------------------------------------------- TwoColumn */

/** Content + sticky 20rem sidebar at xl. */
export function TwoColumn({
  children,
  sidebar,
  sidebarLabel,
  mobileSidebar = "after",
  className,
  sidebarClassName,
}: {
  children: ReactNode;
  sidebar: ReactNode;
  sidebarLabel: string;
  mobileSidebar?: "before" | "after";
  className?: string;
  sidebarClassName?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start 2xl:gap-10",
        className,
      )}
    >
      <div className={cn("min-w-0", mobileSidebar === "before" && "order-2 xl:order-1")}>
        {children}
      </div>
      <aside
        aria-label={sidebarLabel}
        className={cn(
          "min-w-0",
          mobileSidebar === "before" ? "order-1 xl:order-2" : "order-2",
          "xl:sticky xl:top-24",
          sidebarClassName,
        )}
      >
        {sidebar}
      </aside>
    </div>
  );
}

/* ------------------------------------------------- RelatedPagesPanel */

interface RelatedLink {
  label: string;
  detail: string;
  to: string;
  icon: IconName;
}

function relatedFor(pathname: string): { eyebrow: string; title: string; links: RelatedLink[] } {
  if (pathname.startsWith("/track")) {
    return {
      eyebrow: "TRACKING WORKSPACE",
      title: "Keep today current",
      links: [
        { label: "Track dashboard", detail: "Today at a glance", to: "/track", icon: "activity" },
        {
          label: "Log a meal",
          detail: "Calories and macros",
          to: "/track/log-meal",
          icon: "forkSpoon",
        },
        { label: "Add water", detail: "Update hydration", to: "/track/water", icon: "droplet" },
        {
          label: "History & insights",
          detail: "See trends over time",
          to: "/track/insights",
          icon: "chartIncrease",
        },
      ],
    };
  }
  if (pathname.startsWith("/you") || pathname === "/shopping-list") {
    return {
      eyebrow: "YOUR ACCOUNT",
      title: "Plan and preferences",
      links: [
        { label: "Profile overview", detail: "Your plan at a glance", to: "/you", icon: "person" },
        { label: "Saved items", detail: "Hacks and recipes", to: "/you/saved", icon: "bookmark" },
        {
          label: "Shopping list",
          detail: "Ingredients to pick up",
          to: "/shopping-list",
          icon: "shoppingCart",
        },
        {
          label: "Notifications",
          detail: "Reminders and updates",
          to: "/you/notifications",
          icon: "bell",
        },
      ],
    };
  }
  if (pathname.startsWith("/recipes") || pathname.startsWith("/cook")) {
    return {
      eyebrow: "COOKING WORKSPACE",
      title: "From idea to table",
      links: [
        {
          label: "Browse recipes",
          detail: "Meals picked for you",
          to: "/recipes",
          icon: "tabRecipes",
        },
        {
          label: "Search recipes",
          detail: "Find an ingredient or dish",
          to: "/search?scope=recipes",
          icon: "search",
        },
        {
          label: "Shopping list",
          detail: "Review what you need",
          to: "/shopping-list",
          icon: "shoppingCart",
        },
      ],
    };
  }
  return {
    eyebrow: "FORKTHIS WORKSPACE",
    title: "Useful shortcuts",
    links: [
      { label: "Home", detail: "Recommendations for today", to: "/home", icon: "tabHome" },
      { label: "Fast Hacks", detail: "Smarter restaurant orders", to: "/fast-hacks", icon: "bolt" },
      { label: "Recipes", detail: "Cook around your goal", to: "/recipes", icon: "tabRecipes" },
    ],
  };
}

/** Right-hand "related pages" panel used by PageContainer variant="focused". */
export function RelatedPagesPanel({ pathname }: { pathname: string }) {
  const { profile } = useProfile();
  const c = relatedFor(pathname);
  return (
    <div className="border-l border-border-divider pl-6">
      <p className="eyebrow">{c.eyebrow}</p>
      <h2 className="mt-1 text-lg type-section-title text-brand-navy">{c.title}</h2>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-teal-soft px-3 py-2.5">
        <Icon name="target" size={17} color="var(--color-brand-navy)" />
        <span className="min-w-0 flex-1 truncate text-xs type-meta text-brand-navy">
          {GOAL_LABEL[profile?.goal ?? "maintain"]} goal
        </span>
      </div>
      <nav aria-label="Related pages" className="mt-4 flex flex-col">
        {c.links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="group flex items-center gap-3 border-b border-border-divider py-3.5 last:border-b-0"
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl",
                ICON_WELL,
              )}
            >
              <Icon name={l.icon} size={17} color="var(--color-icon-well-ink)" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[17px] type-item-title text-text-primary">
                {l.label}
              </span>
              <span className="mt-0.5 block truncate type-meta text-[15px] text-text-secondary">
                {l.detail}
              </span>
            </span>
            <Icon name="chevronRight" size={15} color="var(--color-text-neutral-400)" />
          </Link>
        ))}
      </nav>
    </div>
  );
}

/* -------------------------------------------------------- PageContainer */

/**
 * Standard page wrapper: centred column with responsive padding + settle animation.
 * `variant="focused"` adds the related-pages sidebar at xl (pass the current `pathname`).
 */
export function PageContainer({
  children,
  background = "bg-brand-cream",
  className,
  variant = "wide",
  pathname,
}: {
  children: ReactNode;
  background?: string;
  className?: string;
  variant?: "wide" | "focused";
  pathname?: string;
}) {
  const content =
    variant === "focused" ? (
      <TwoColumn
        sidebarLabel="Related pages"
        sidebar={<RelatedPagesPanel pathname={pathname ?? ""} />}
        sidebarClassName="hidden xl:block"
      >
        {children}
      </TwoColumn>
    ) : (
      children
    );
  return (
    <div className={cn("min-h-full w-full", background)}>
      <div
        className={cn(
          "page-settle mx-auto w-full px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10 2xl:px-12",
          variant === "focused" ? "max-w-[1400px]" : "max-w-[1680px]",
          className,
        )}
      >
        {content}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- Bento grid */

const CONTAINER = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const CELL = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: SPRING_SOFT },
};

/** 12-col staggered grid; children should be <BentoCell> with `lg:col-span-*`. */
export function BentoGrid({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  const wide = useIsLg();
  const reduced = useReducedMotion();
  return (
    <motion.div
      data-slot="bento-grid"
      data-layout={wide ? "bento" : "stack"}
      aria-label={label}
      role={label ? "group" : undefined}
      variants={CONTAINER}
      initial={!reduced && "hidden"}
      animate="visible"
      transition={reduced ? NO_MOTION : undefined}
      className={cn("grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12", className)}
    >
      {children}
    </motion.div>
  );
}

export function BentoCell({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
}) {
  const reduced = useReducedMotion();
  const Tag = as === "section" ? motion.section : motion.div;
  return (
    <Tag
      data-slot="bento-cell"
      variants={reduced ? undefined : CELL}
      className={cn("min-w-0 lg:col-span-12", className)}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------ Headers / links */

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  actionsInline = false,
  onBack,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  actionsInline?: boolean;
  onBack?: () => void;
  className?: string;
}) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        actionsInline ? "flex items-start gap-3" : "flex flex-col gap-3 sm:flex-row sm:items-end",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full border border-border-default bg-white"
          >
            <Icon name="arrowBack" size={20} color="var(--color-text-primary)" />
          </button>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {eyebrow && (
            <p className="type-eyebrow text-[15px] tracking-[-0.495px] text-primary">{eyebrow}</p>
          )}
          <h1 className={PAGE_TITLE}>{title}</h1>
          {subtitle && (
            <div className="type-meta text-[17px] tracking-[-0.3px] text-text-secondary">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">{actions}</div>
      )}
    </header>
  );
}

/** "See all >" style link/button. */
export function SectionLink({
  to,
  onPress,
  children,
}: {
  to?: string;
  onPress?: () => void;
  children: ReactNode;
}) {
  const inner = (
    <>
      {children}
      <Icon name="chevronRight" size={14} color="var(--color-primary)" />
    </>
  );
  return to ? (
    <Link to={to} className={LINK_ACTION}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onPress} className={LINK_ACTION}>
      {inner}
    </button>
  );
}

export function SectionHeader({
  id,
  title,
  subtitle,
  meta,
  action,
  className,
}: {
  id?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  action?: { label: string; to?: string; onPress?: () => void };
  className?: string;
}) {
  return (
    <div data-slot="section-header" className={cn("flex items-end gap-3", className)}>
      <div className="min-w-0 flex-1">
        <h2 id={id} className={SECTION_TITLE}>
          {title}
        </h2>
        {subtitle && (
          <p className="type-meta text-xs leading-4 tracking-[-0.54px] text-text-secondary">
            {subtitle}
          </p>
        )}
      </div>
      {meta && (
        <span className="type-meta shrink-0 pb-0.5 text-xs text-text-secondary">{meta}</span>
      )}
      {action && (
        <SectionLink to={action.to} onPress={action.onPress}>
          {action.label}
        </SectionLink>
      )}
    </div>
  );
}

/** Section heading with optional location label and link, used on Home. */
export function SectionTitle({
  children,
  action,
  actionTo,
  onAction,
  location,
  onLocation,
}: {
  children: ReactNode;
  action?: string;
  actionTo?: string;
  onAction?: () => void;
  location?: string;
  /** Makes the location label tappable (e.g. to ask for the device location). */
  onLocation?: () => void;
}) {
  const locationClass =
    "flex min-w-0 flex-1 items-center gap-1 text-xs type-meta tracking-[-0.54px] text-text-secondary";
  return (
    <div className="flex items-center gap-3">
      <h2 className={cn(SECTION_TITLE, "min-w-0")}>{children}</h2>
      {location && onLocation ? (
        <button type="button" onClick={onLocation} className={cn(locationClass, "text-left")}>
          <Icon name="location" size={14} color="var(--color-primary)" />
          <span className="truncate">{location}</span>
        </button>
      ) : location ? (
        <span className={locationClass}>
          <Icon name="location" size={14} color="var(--color-primary)" />
          <span className="truncate">{location}</span>
        </span>
      ) : (
        <span className="flex-1" />
      )}
      {action && actionTo && <SectionLink to={actionTo}>{action}</SectionLink>}
      {action && !actionTo && onAction && <SectionLink onPress={onAction}>{action}</SectionLink>}
    </div>
  );
}

/** Horizontal snap rail on mobile, 2-3 col grid from md. */
export function Rail({ children }: { children: ReactNode }) {
  return (
    <div className="rail-scroll -mx-5 -mb-4 flex snap-x gap-3 overflow-x-auto px-5 pb-5 md:mx-0 md:mb-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-1 lg:grid-cols-3">
      {children}
    </div>
  );
}

/** Scrollable multi-select chip row; "All" clears. */
export function FilterChips({
  options,
  selected,
  onToggle,
  onClear,
  label,
}: {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  onClear: () => void;
  label?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="rail-scroll -mx-5 -mt-1 flex gap-2 overflow-x-auto px-5 pt-1 pb-1 md:mx-0 md:px-0"
    >
      {options.map((opt) => {
        const isAll = opt === "All";
        const active = isAll ? selected.length === 0 : selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => (isAll ? onClear() : onToggle(opt))}
            className={cn(
              "tap-44 relative flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[17px]",
              active ? SELECTED_CHIP : "border-border-default bg-white text-text-secondary",
              active ? "type-button" : "type-button-secondary",
            )}
          >
            {active && <CheckMark />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/** Mobile listing header used on Home/Fast Hacks/Recipes (eyebrow, title, search bar, filter button). */
export function ListingHeader({
  eyebrow,
  title,
  subtitle,
  searchHint,
  searchTo,
  topActionTo,
  topActionIcon = "sparkles",
  topActionLabel = "Quick tour",
  titleFontSize = 24,
  onFilter,
  savedCount,
  savedTo,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  searchHint: string;
  searchTo: string;
  topActionTo?: string;
  topActionIcon?: IconName;
  topActionLabel?: string;
  titleFontSize?: number;
  onFilter?: () => void;
  savedCount?: number;
  savedTo?: string;
}) {
  return (
    <header className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-[15px] type-meta tracking-[-0.495px] text-primary">{eyebrow}</p>
          )}
          <h1
            className={cn(
              PAGE_TITLE,
              "mt-1 truncate text-[length:var(--page-title-size)] md:text-[32px]",
            )}
            style={{ "--page-title-size": `${titleFontSize}px` } as React.CSSProperties}
          >
            {title}
          </h1>
          <p className="mt-0.5 truncate text-[17px] type-meta tracking-[-0.585px] text-text-secondary md:hidden">
            {subtitle}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {savedCount !== undefined && savedTo && (
            <SavedCountLink count={savedCount} to={savedTo} />
          )}
          {topActionTo && (
            <Link
              to={topActionTo}
              title={topActionLabel}
              aria-label={topActionLabel}
              className="tap-44 relative flex size-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-white md:hidden"
            >
              <Icon name={topActionIcon} size={20} color="var(--color-text-primary)" />
            </Link>
          )}
        </div>
      </div>
      <p className="mt-1 hidden truncate text-[17px] type-meta text-text-secondary md:block">
        {subtitle}
      </p>
      <div className="mt-3 flex gap-2 md:hidden">
        <div className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full border border-border-default bg-white px-4 focus-within:border-focus">
          <Link to={searchTo} className="flex min-w-0 flex-1 items-center gap-3 self-stretch">
            <span className="shrink-0">
              <Icon name="search" size={20} color="var(--color-text-secondary)" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm type-meta tracking-[-0.63px] text-text-secondary">
              {searchHint}
            </span>
          </Link>
          {onFilter && (
            <button
              type="button"
              onClick={onFilter}
              title="Filters"
              aria-label="Filters"
              className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-full"
            >
              <Icon name="filterSliders" size={18} color="var(--color-text-secondary)" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

/** Heart pill with the saved-items count. */
export function SavedCountLink({ count, to }: { count: number; to: string }) {
  return (
    <Link
      to={to}
      title="Saved items"
      aria-label={`${count} saved items`}
      className="tap-44 relative flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border-default bg-navy-50 px-3 text-sm type-button tracking-[-0.63px] text-primary"
    >
      <Icon name="heart" size={16} color="var(--color-primary)" />
      {count}
    </Link>
  );
}
