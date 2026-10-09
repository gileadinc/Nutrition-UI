"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { AppImage } from "@/components/AppImage";
import { POSITIVE } from "@/components/styles";
import { Link, useNavigate } from "@/lib/nav";
import { useIsDesktop } from "@/lib/hooks";
import { fitsToday, type Fit } from "@/lib/nutrition";
import { dietaryMatch, type DietaryRecipe } from "@/lib/nutrition";

export interface DetailNeighbour {
  to: string;
  title: string;
}

/** Full-page detail frame: sticky header, hero image, content column and sticky footer actions. */
export function DetailFrame({
  image,
  badge,
  title,
  subtitle,
  meta,
  fallbackRoute,
  footer,
  fit,
  prev,
  next,
  children,
}: {
  image?: string | null;
  badge?: string;
  title: string;
  subtitle?: string;
  /** Extra line under the title (e.g. rating summary). */
  meta?: ReactNode;
  fallbackRoute: string;
  footer: ReactNode;
  fit?: Fit;
  prev?: DetailNeighbour;
  next?: DetailNeighbour;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="relative flex min-h-dvh flex-col bg-brand-cream">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border-divider bg-brand-cream/95 px-3 py-1 backdrop-blur">
        <button
          type="button"
          aria-label="Close"
          onClick={() => (history.length > 1 ? navigate(-1) : navigate(fallbackRoute))}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-default bg-white"
        >
          <Icon name="close" size={16} color="var(--color-text-primary)" />
        </button>
        <p className="min-w-0 flex-1 truncate text-[17px] type-item-title tracking-[-0.3px] text-text-primary">
          {title}
        </p>
        {(prev || next) && (
          <span className="flex shrink-0 items-center gap-1">
            <Step item={prev} direction="prev" />
            <Step item={next} direction="next" />
          </span>
        )}
      </header>
      <div className="relative h-40 shrink-0 md:h-56">
        <AppImage src={image} alt="" priority sizes="100vw" className="size-full object-cover" />
        {badge && (
          <span className="absolute bottom-3 left-4 rounded-full bg-teal-action px-3 py-1 text-[17px] type-meta uppercase tracking-[0.02em] text-on-selected">
            {badge}
          </span>
        )}
      </div>
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 pb-8 pt-4 md:px-8 md:pt-6 lg:px-10">
        <div className="flex min-h-6 items-center justify-between gap-3">
          <p className="min-w-0 truncate text-[17px] type-meta leading-5 text-primary">{subtitle}</p>
          {fit && <FitsBadge fit={fit} />}
        </div>
        <h1 className="text-2xl type-display leading-8 tracking-[-1.08px] text-brand-navy">
          {title}
        </h1>
        {meta}
        <div className="mt-3 flex flex-col gap-5">{children}</div>
      </div>
      <div
        data-testid="detail-footer"
        className="sticky bottom-0 z-20 border-t border-border-divider bg-white px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:px-8 md:py-4 lg:px-10"
      >
        <div className="mx-auto flex w-full max-w-3xl gap-3 md:max-w-md md:justify-start">
          {footer}
        </div>
      </div>
    </div>
  );
}

function Step({ item, direction }: { item?: DetailNeighbour; direction: "prev" | "next" }) {
  const label = direction === "prev" ? "Previous" : "Next";
  const icon = direction === "prev" ? "chevronLeft" : "chevronRight";
  return item ? (
    <Link
      to={item.to}
      replace
      aria-label={`${label}: ${item.title}`}
      title={`${label}: ${item.title}`}
      className="flex size-11 items-center justify-center rounded-full border border-border-default bg-white"
    >
      <Icon name={icon} size={16} color="var(--color-text-primary)" />
    </Link>
  ) : (
    <span
      aria-hidden
      className="flex size-11 items-center justify-center rounded-full border border-border-divider text-text-neutral-400"
    >
      <Icon name={icon} size={16} color="var(--color-text-neutral-400)" />
    </span>
  );
}

function FitsBadge({ fit }: { fit: Fit }) {
  return fitsToday(fit) ? (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[17px] type-meta",
        POSITIVE,
      )}
    >
      <Icon name="checkCircle" size={14} color="var(--color-positive-ink)" />
      Fits today
    </span>
  ) : null;
}

/** kcal / protein / carbs / fat line. */
export function NutritionLine({
  calories,
  protein,
  carbs,
  fat,
  label = "Nutrition per order",
}: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  label?: string;
}) {
  const rows = [
    { value: `${calories}`, label: "kcal", tone: "text-accent-ink" },
    { value: `${protein}g`, label: "protein", tone: "text-text-primary" },
    { value: `${carbs}g`, label: "carbs", tone: "text-text-primary" },
    { value: `${fat}g`, label: "fat", tone: "text-text-primary" },
  ];
  return (
    <ul
      aria-label={label}
      data-testid="nutrition-line"
      className="flex flex-wrap items-baseline gap-x-4 gap-y-1"
    >
      {rows.map((r) => (
        <li key={r.label} className="flex items-baseline gap-1">
          <span className={cn("text-onb-body type-row-figure tabular-nums", r.tone)}>{r.value}</span>
          <span className="text-onb-meta type-meta text-text-secondary">{r.label}</span>
        </li>
      ))}
    </ul>
  );
}

const NUM =
  "flex size-6 shrink-0 items-center justify-center rounded-full bg-navy-50 text-onb-meta type-row-figure tabular-nums text-brand-navy";

/** Numbered "what to say / order at the counter" list. */
export function CounterScript({ lines, restaurant }: { lines: string[]; restaurant: string }) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      data-testid="counter-script"
      className="panel px-4 py-4 md:px-5"
    >
      <p className="onb-eyebrow">At {restaurant}</p>
      <h2 id={id} className="mt-1 text-onb-body type-section-title text-brand-navy">
        What to say at the counter
      </h2>
      <ol className="mt-3 flex flex-col gap-2.5">
        {lines.map((l, i) => (
          <li key={`${i}-${l}`} className="flex items-start gap-3">
            <span aria-hidden className={NUM}>
              {i + 1}
            </span>
            <span className="min-w-0 text-onb-body text-text-primary">{l}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function IngredientsPanel({ items, action }: { items: string[]; action?: ReactNode }) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      data-testid="recipe-ingredients"
      className="panel px-4 py-4 md:px-5"
    >
      <p className="onb-eyebrow">What you need</p>
      <h2 id={id} className="mt-1 text-onb-body type-section-title text-brand-navy">
        {items.length} {items.length === 1 ? "ingredient" : "ingredients"}
      </h2>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((it, i) => (
          <li key={`${i}-${it}`} className="flex items-start gap-3">
            <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-navy" />
            <span className="min-w-0 text-onb-body text-text-primary">{it}</span>
          </li>
        ))}
      </ul>
      {action && <div className="mt-4 border-t border-border-divider pt-3">{action}</div>}
    </section>
  );
}

export function MethodPanel({ steps }: { steps: string[] }) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      data-testid="recipe-method"
      className="border-t border-border-divider pt-5"
    >
      <h2 id={id} className="text-onb-body type-section-title text-brand-navy">
        Method
      </h2>
      <ol className="mt-3 flex flex-col gap-3">
        {steps.map((s, i) => (
          <li key={`${i}-${s}`} className="flex items-start gap-3">
            <span aria-hidden className={NUM}>
              {i + 1}
            </span>
            <span className="min-w-0 text-onb-body text-text-primary">{s}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border-divider pt-5">
      <h2 className="text-onb-body type-section-title text-brand-navy">{title}</h2>
      <div className="mt-3 flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

/** Collapsible section (closed by default). */
export function Disclosure({
  title,
  summary,
  children,
}: {
  title: string;
  summary?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <section className="border-t border-border-divider pt-2">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-11 w-full items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <span className="text-onb-body type-section-title text-brand-navy">{title}</span>
          {summary ? (
            <span className="min-w-0 flex-1 truncate text-onb-meta type-meta text-text-secondary">
              {summary}
            </span>
          ) : (
            <span className="flex-1" />
          )}
          <span
            className={cn(
              "shrink-0 motion-safe:transition-transform motion-safe:duration-200",
              open && "rotate-90",
            )}
          >
            <Icon name="chevronRight" size={18} color="var(--color-brand-navy)" />
          </span>
        </button>
      </h2>
      <div id={id} hidden={!open} className="pb-2 pt-2">
        {open && children}
      </div>
    </section>
  );
}

export function MedicalNote() {
  return (
    <p className="flex items-start gap-2 text-onb-meta type-meta text-text-secondary">
      <span className="mt-0.5 shrink-0">
        <Icon name="info" size={14} color="var(--color-text-secondary)" />
      </span>
      <span>
        General nutrition guidance, not medical advice. Check with your care team about your own
        situation, especially around surgery or a medical condition.
      </span>
    </p>
  );
}

export function CheckBullet({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2.5 text-[17px] leading-5 type-meta text-text-primary">
      <span className="mt-0.5 shrink-0">
        <Icon name="checkCircle" size={16} color="var(--color-brand-navy)" />
      </span>
      {children}
    </p>
  );
}

export function DotBullet({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2.5 text-[17px] leading-5 type-meta text-text-primary">
      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
      {children}
    </p>
  );
}

export function ProTip({ children }: { children: ReactNode }) {
  return (
    <section className="flex items-start gap-3 rounded-2xl bg-brand-teal-soft p-4">
      <span className="shrink-0">
        <Icon name="bulb" size={18} color="var(--color-brand-navy)" />
      </span>
      <div>
        <h2 className="text-[17px] type-section-title text-text-primary">Pro tip</h2>
        <p className="mt-1 text-[17px] leading-5 type-meta text-text-primary">{children}</p>
      </div>
    </section>
  );
}

/** Row link to a related recipe/hack. */
export function RelatedRow({
  image,
  title,
  subtitle,
  tag,
  to,
}: {
  image?: string | null;
  title: string;
  subtitle: string;
  tag?: string;
  to: string;
}) {
  return (
    <Link to={to} className="panel flex items-center gap-3 p-2.5">
      <AppImage
        src={image}
        alt=""
        sizes="80px"
        className="size-16 shrink-0 rounded-xl object-cover"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-onb-body type-item-title text-text-primary">
          {title}
        </span>
        <span className="block truncate text-onb-meta type-meta text-text-secondary">
          {subtitle}
        </span>
      </span>
      {tag && (
        <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-0.5 text-onb-meta type-meta text-primary">
          {tag}
        </span>
      )}
    </Link>
  );
}

export function RelatedHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-onb-body type-section-title text-brand-navy">{children}</h2>;
}

export function RestaurantNote() {
  return (
    <div
      className="flex items-start gap-2.5 rounded-2xl border p-3.5"
      style={{
        backgroundColor: "var(--color-missed-dose-surface)",
        borderColor: "color-mix(in srgb, var(--color-status-over) 35%, transparent)",
      }}
    >
      <span className="shrink-0">
        <Icon name="alert" size={18} color="var(--color-status-over)" />
      </span>
      <p className="text-[17px] leading-5 type-meta text-text-primary">
        Preparation varies by location. Confirm allergens and cooking methods with the restaurant
        before ordering.
      </p>
    </div>
  );
}

/** Warns when a recipe appears to contain one of the user's allergens. */
export function AllergenWarning({
  recipe,
  userAllergies,
}: {
  recipe: DietaryRecipe;
  userAllergies: string[];
}) {
  const flagged = dietaryMatch.flaggedFor(recipe, userAllergies);
  if (flagged.length === 0) return null;
  const names = flagged.map((f) => f.toLowerCase()).sort();
  const text = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return (
    <div
      className="flex items-start gap-2.5 rounded-2xl border p-3.5"
      style={{
        backgroundColor: "var(--color-missed-dose-surface)",
        borderColor: "color-mix(in srgb, var(--color-status-over) 35%, transparent)",
      }}
    >
      <span className="shrink-0">
        <Icon name="alert" size={18} color="var(--color-status-over)" />
      </span>
      <div>
        <p className="text-onb-body type-section-title text-text-primary">Contains {text}</p>
        <p className="mt-1 text-[17px] leading-5 type-meta text-text-secondary">
          Flagged from your profile. Ingredient lists can change — check the packaging.
        </p>
      </div>
    </div>
  );
}

/** Pick `limit` related items: same category first, then most shared tags, then catalogue order. */
export function relatedItems<T extends { id: string; category?: string }>(
  current: T,
  all: T[],
  tagsOf: (item: T) => string[],
  limit = 2,
): T[] {
  const mine = new Set(tagsOf(current).map((t) => t.toLowerCase()));
  const shared = (item: T) => tagsOf(item).filter((t) => mine.has(t.toLowerCase())).length;
  return all
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.id !== current.id)
    .map(({ item, index }) => ({
      item,
      index,
      sameCategory: +(item.category === current.category),
      tags: shared(item),
    }))
    .sort((a, b) => b.sameCategory - a.sameCategory || b.tags - a.tags || a.index - b.index)
    .slice(0, limit)
    .map(({ item }) => item);
}

/** md+: left list pane of siblings next to the detail content; below md: just the content. */
export function TwoPaneDetail({
  items,
  activeId,
  listLabel,
  listTitle,
  children,
}: {
  items: { id: string; title: string; subtitle: string; image?: string | null; to: string }[];
  activeId: string;
  listLabel: string;
  listTitle: string;
  children: ReactNode;
}) {
  const desktop = useIsDesktop();
  if (!desktop) return <>{children}</>;
  return (
    <div className="flex min-h-dvh">
      <nav
        aria-label={listLabel}
        className="sticky top-0 h-[var(--pane-h,100dvh)] w-80 shrink-0 self-start overflow-y-auto border-r border-border-divider bg-white p-4"
      >
        <h2 className="px-1 text-[17px] type-section-title text-text-neutral-600">{listTitle}</h2>
        <ul className="mt-3 flex flex-col gap-1.5">
          {items.map((it) => {
            const on = it.id === activeId;
            return (
              <li key={it.id}>
                <Link
                  to={it.to}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl p-2",
                    on ? "bg-primary-soft" : "hover:bg-brand-warm-gray",
                  )}
                >
                  <AppImage
                    src={it.image}
                    alt=""
                    sizes="64px"
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-[17px] type-item-title",
                        on ? "text-primary" : "text-text-primary",
                      )}
                    >
                      {it.title}
                    </span>
                    <span className="block truncate text-xs type-meta text-text-secondary">
                      {it.subtitle}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
