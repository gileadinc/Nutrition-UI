"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { AppImage } from "@/components/AppImage";
import { Icon, type IconName } from "@/components/Icon";
import { POSITIVE } from "@/components/styles";
import { Link, useNavigate } from "@/lib/nav";
import { fitsToday, type Fit } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

export interface DetailStat {
  value: string;
  unit: string;
  label: string;
}

export interface DetailNeighbourLink {
  to: string;
  title: string;
}

const ROUND_BTN =
  "flex size-11 items-center justify-center rounded-full border border-border-default bg-white transition-colors hover:border-text-neutral-400 hover:bg-brand-warm-gray active:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none";

function NeighbourButton({
  item,
  direction,
}: {
  item?: DetailNeighbourLink;
  direction: "prev" | "next";
}) {
  const label = direction === "prev" ? "Previous" : "Next";
  const icon = direction === "prev" ? "chevronLeft" : "chevronRight";
  return item ? (
    <Link
      to={item.to}
      replace
      aria-label={`${label}: ${item.title}`}
      title={`${label}: ${item.title}`}
      className={ROUND_BTN}
    >
      <Icon name={icon} size={16} color="var(--color-text-primary)" />
    </Link>
  ) : (
    <span
      aria-hidden
      className="flex size-11 items-center justify-center rounded-full border border-border-divider text-text-neutral-500"
    >
      <Icon name={icon} size={16} color="var(--color-text-neutral-400)" />
    </span>
  );
}

function FitBadge({ fit }: { fit: Fit }) {
  if (!fitsToday(fit)) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] type-meta",
        POSITIVE,
      )}
    >
      <Icon name="checkCircle" size={14} color="var(--color-positive-ink)" />
      Fits today
    </span>
  );
}

/**
 * Full-page detail layout: back button, hero image beside the title and stats, a main column
 * with an optional "at a glance" aside, and a sticky action footer.
 */
export function DetailPage({
  image,
  badge,
  title,
  subtitle,
  lede,
  stats,
  backLabel = "Back",
  fallbackRoute,
  footer,
  fit,
  prev,
  next,
  meta,
  aside,
  children,
}: {
  image: string;
  badge?: string;
  title: string;
  subtitle?: string;
  lede?: string;
  stats?: DetailStat[];
  backLabel?: string;
  fallbackRoute: string;
  footer: ReactNode;
  fit?: Fit;
  prev?: DetailNeighbourLink;
  next?: DetailNeighbourLink;
  meta?: { icon: IconName; label: string }[];
  aside?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="relative flex min-h-dvh flex-col bg-brand-cream">
      <div className="mx-auto w-full max-w-6xl flex-1 px-5 pb-10 pt-4 md:px-8 md:pt-6 lg:px-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (history.length > 1 ? navigate(-1) : navigate(fallbackRoute))}
            aria-label={backLabel === "Back" ? "Back" : `Back to ${backLabel}`}
            className="tap-44 relative flex h-11 items-center gap-2 rounded-full border border-border-default bg-white pl-3 pr-4 text-[13px] type-button text-text-primary transition-colors hover:border-text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <Icon name="arrowBack" size={16} color="currentColor" />
            {backLabel}
          </button>
          <span className="flex-1" />
          {(prev || next) && (
            <span className="flex shrink-0 items-center gap-1">
              <NeighbourButton item={prev} direction="prev" />
              <NeighbourButton item={next} direction="next" />
            </span>
          )}
        </div>
        <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-center md:gap-10">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border-divider bg-white md:aspect-[5/4]">
            <AppImage
              src={image}
              alt=""
              priority
              sizes="(min-width: 768px) 45vw, 100vw"
              className="size-full object-cover"
            />
            {badge && (
              <span className="absolute bottom-4 left-4 rounded-full bg-teal-action px-3 py-1 text-[13px] type-meta uppercase tracking-[0.02em] text-on-selected">
                {badge}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {subtitle && (
                <p className="min-w-0 truncate text-[13px] type-button leading-5 text-primary">
                  {subtitle}
                </p>
              )}
              {meta && meta.length > 0 && (
                <ul
                  aria-label="Quick facts"
                  className="flex flex-wrap items-center gap-x-3 gap-y-1"
                >
                  {meta.map((m) => (
                    <li
                      key={m.label}
                      className="inline-flex items-center gap-1 text-[13px] type-meta text-text-secondary"
                    >
                      <Icon name={m.icon} size={14} color="currentColor" />
                      {m.label}
                    </li>
                  ))}
                </ul>
              )}
              {fit && <FitBadge fit={fit} />}
            </div>
            <h1 className="mt-2 text-[28px] type-display leading-9 tracking-[-1.2px] text-brand-navy md:text-[32px] md:leading-10">
              {title}
            </h1>
            {lede && (
              <p className="mt-2 text-[15px] leading-6 type-body text-text-secondary">{lede}</p>
            )}
            {stats && stats.length > 0 && (
              <dl
                data-testid="detail-stats"
                className={cn(
                  "mt-5 grid gap-2.5",
                  stats.length >= 3 ? "grid-cols-3" : "grid-cols-2",
                )}
              >
                {stats.map((s, i) => (
                  <div
                    key={s.label}
                    className={cn(
                      "flex flex-col rounded-2xl px-3.5 py-3",
                      i === 0 ? "bg-accent-soft" : i === 1 ? "bg-teal-500/10" : "bg-navy-50",
                    )}
                  >
                    <dd
                      className={cn(
                        "text-[26px] leading-8 type-numeral tabular-nums tracking-[-0.8px] md:text-[28px]",
                        i === 0 ? "text-accent-ink" : "text-brand-navy",
                      )}
                    >
                      {s.value}
                      <span className="ml-1 text-[13px] tracking-normal text-text-secondary">
                        {s.unit}
                      </span>
                    </dd>
                    <dt className="text-[12px] type-meta text-text-secondary">{s.label}</dt>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
        <div
          className={cn(
            "mt-8 grid gap-8 md:mt-10",
            aside && "lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10",
          )}
        >
          {aside && (
            <aside
              aria-label="At a glance"
              className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1"
            >
              {aside}
            </aside>
          )}
          <div
            className={cn(
              "flex min-w-0 flex-col gap-6",
              aside ? "lg:col-start-1 lg:row-start-1" : "mx-auto w-full max-w-3xl",
            )}
          >
            {children}
          </div>
        </div>
      </div>
      <div
        data-testid="detail-footer"
        className="sticky bottom-[60px] z-20 border-t border-border-divider bg-white px-5 pb-3 pt-3 md:bottom-0 md:px-8 md:py-4 lg:px-10"
      >
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4">
          <div className="hidden min-w-0 flex-1 md:block">
            <p className="truncate text-[15px] type-item-title text-text-primary">{title}</p>
            <p className="truncate text-[13px] type-meta text-text-secondary">
              {subtitle}
              {stats &&
                stats.length > 1 &&
                ` · ${stats[0].value} ${stats[0].unit} · ${stats[1].value}${stats[1].unit} ${stats[1].label.toLowerCase()}`}
            </p>
          </div>
          <div className="flex w-full gap-3 md:w-auto md:max-w-xl md:flex-none">{footer}</div>
        </div>
      </div>
    </div>
  );
}

/** A footer button with a short caption underneath. */
export function FooterAction({
  caption,
  className,
  children,
}: {
  caption: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-1 flex-col items-stretch gap-1.5", className)}>
      {children}
      <p className="text-center text-[12px] leading-4 type-meta text-text-secondary">{caption}</p>
    </div>
  );
}

/** Titled block in the "at a glance" column. */
export function AsideSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border-divider pt-5">
      <h2 className="text-onb-body type-section-title text-brand-navy">{title}</h2>
      <div className="mt-3 flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

const SMALL_BTN =
  "tap-44 relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-onb-meta type-button transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none";

/** What to say at the restaurant counter: tick lines off, copy them, or show them full screen. */
export function CounterScript({ lines, restaurant }: { lines: string[]; restaurant: string }) {
  const headingId = useId();
  const viewId = useId();
  const [said, setSaid] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [viewing, setViewing] = useState(false);
  const toggle = (i: number) =>
    setSaid((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.map((l, i) => `${i + 1}. ${l}`).join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable
    }
  };
  // "Ask for it on the side" lines carry their reason after a separator.
  const split = (line: string) => {
    const [ask, ...why] = line.split(/\s+[\u2014\u2013\u00b7]\s+/);
    return { ask, why: why.join(" · ") };
  };
  useEffect(() => {
    if (!viewing) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setViewing(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewing]);

  return (
    <section
      aria-labelledby={headingId}
      data-testid="counter-script"
      className="panel overflow-hidden"
    >
      <header className="bg-navy-50 px-4 py-4 md:px-5">
        <p className="onb-eyebrow">At {restaurant}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2
            id={headingId}
            className="min-w-0 flex-1 text-[18px] leading-6 type-section-title tracking-[-0.6px] text-brand-navy"
          >
            What to say at the counter
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setViewing(true)}
              aria-haspopup="dialog"
              className={cn(SMALL_BTN, "bg-primary text-white hover:bg-primary-hover")}
            >
              <Icon name="expand" size={14} color="currentColor" />
              Show at the counter
            </button>
            <button
              type="button"
              onClick={copy}
              className={cn(
                SMALL_BTN,
                "border border-border-default bg-white text-text-primary hover:bg-brand-warm-gray",
              )}
            >
              <Icon name="copy" size={14} color="var(--color-primary)" />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div aria-hidden className="flex flex-1 gap-1">
            {lines.map((l, i) => (
              <span
                key={`${i}-${l}`}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors motion-reduce:transition-none",
                  said.includes(i) ? "bg-primary" : "bg-white",
                )}
              />
            ))}
          </div>
          <p
            aria-live="polite"
            className="shrink-0 text-[12px] type-meta tabular-nums text-text-secondary"
          >
            {said.length === 0
              ? `${lines.length} lines`
              : said.length === lines.length
                ? "All said"
                : `${said.length} of ${lines.length} said`}
          </p>
        </div>
      </header>
      <ol className="flex flex-col px-2 py-2 md:px-3">
        {lines.map((line, i) => {
          const done = said.includes(i);
          const { ask, why } = split(line);
          return (
            <li key={`${i}-${line}`}>
              <button
                type="button"
                aria-pressed={done}
                onClick={() => toggle(i)}
                className="group flex min-h-11 w-full items-start gap-3.5 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-brand-warm-gray focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-onb-meta type-row-figure tabular-nums transition-colors motion-reduce:transition-none",
                    done
                      ? "bg-selected text-on-selected"
                      : "bg-navy-50 text-brand-navy group-hover:bg-white",
                  )}
                >
                  {done ? <Icon name="tick" size={14} color="currentColor" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-[15px] leading-6 type-item-title",
                      done ? "text-text-secondary line-through" : "text-text-primary",
                    )}
                  >
                    {ask}
                  </span>
                  {why && (
                    <span className="block text-[13px] leading-5 type-meta text-text-secondary">
                      {why}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <footer className="flex items-center justify-between gap-3 border-t border-border-divider px-4 py-3 md:px-5">
        <p className="text-onb-meta type-meta text-text-secondary">
          Tap a line to tick it off as you say it.
        </p>
        {said.length > 0 && (
          <button
            type="button"
            onClick={() => setSaid([])}
            className="tap-44 relative shrink-0 text-onb-meta type-button text-primary"
          >
            Start over
          </button>
        )}
      </footer>
      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center md:p-6"
          onClick={() => setViewing(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={viewId}
            data-testid="counter-view"
            className="max-h-[90dvh] w-full overflow-y-auto rounded-t-[24px] bg-brand-cream px-5 pb-6 md:max-w-xl md:rounded-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 pt-5 md:pt-7">
              <div className="min-w-0 flex-1">
                <p className="onb-eyebrow">Show this at {restaurant}</p>
                <h2
                  id={viewId}
                  className="mt-1 text-[24px] leading-8 type-display tracking-[-0.9px] text-brand-navy"
                >
                  Your order
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewing(false)}
                aria-label="Close"
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy-soft text-brand-navy"
              >
                <Icon name="close" size={18} color="currentColor" />
              </button>
            </div>
            <ol className="mt-5 flex flex-col gap-4 pb-4">
              {lines.map((line, i) => {
                const { ask, why } = split(line);
                return (
                  <li key={`${i}-${line}`} className="flex items-start gap-4">
                    <span
                      aria-hidden
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-[16px] type-row-figure tabular-nums text-white"
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[20px] leading-7 type-item-title text-text-primary">
                        {ask}
                      </span>
                      {why && (
                        <span className="block text-[15px] leading-6 type-meta text-text-secondary">
                          {why}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}

/** "Why it works for you": the swaps as chips, how it's built, and what it does for the goal. */
export function WhyItWorks({
  intro,
  build,
  benefits,
}: {
  intro: string;
  build: string[];
  benefits: string[];
}) {
  const id = useId();
  const chips = intro
    .split(/\s*·\s*/)
    .map((c) => c.trim())
    .filter(Boolean);
  return (
    <section aria-labelledby={id} className="border-t border-border-divider pt-5">
      <h2 id={id} className="text-onb-body type-section-title text-brand-navy">
        Why it works for you
      </h2>
      {chips.length > 1 ? (
        <div className="mt-3">
          <h3 className="eyebrow text-[12px]">The swaps</h3>
          <ul aria-label="The swaps" className="mt-2 flex flex-wrap gap-2">
            {chips.map((c) => (
              <li
                key={c}
                className="rounded-full bg-primary-soft px-3.5 py-1.5 text-[13px] type-button text-primary"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        intro && <p className="mt-3 text-onb-body text-text-secondary">{intro}</p>
      )}
      {build.length > 0 && (
        <div className="mt-5">
          <h3 className="eyebrow text-[12px]">How it&apos;s built</h3>
          <ul className="mt-2 flex flex-col gap-2.5">
            {build.map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 text-[14px] leading-5 type-meta text-text-primary"
              >
                <span
                  aria-hidden
                  className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-navy-50"
                >
                  <span className="size-1.5 rounded-full bg-primary" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}
      {benefits.length > 0 && (
        <div className="mt-5">
          <h3 className="eyebrow text-[12px]">What it does for your goal</h3>
          <ul className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {benefits.map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 rounded-2xl bg-teal-500/10 px-3.5 py-3 text-[14px] leading-5 type-meta text-text-primary"
              >
                <span className="mt-0.5 shrink-0">
                  <Icon name="checkCircle" size={18} color="var(--color-brand-navy)" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** Small card for the "Similar" grid. */
export function SimilarCard({
  image,
  title,
  subtitle,
  calories,
  protein,
  tag,
  fits,
  to,
}: {
  image: string;
  title: string;
  subtitle?: string;
  calories: number;
  protein: number;
  tag?: string;
  fits?: boolean;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="panel group flex h-full flex-col overflow-hidden transition-colors hover:border-brand-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none"
    >
      <span className="relative block aspect-[4/3] w-full overflow-hidden bg-white">
        <AppImage
          src={image}
          alt=""
          sizes="(min-width: 1024px) 220px, 45vw"
          className="size-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105"
        />
        {tag && (
          <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-white px-2.5 py-0.5 text-onb-meta type-meta text-brand-navy">
            {tag}
          </span>
        )}
        {fits && (
          <span
            className={cn(
              "absolute bottom-2 left-2 rounded-full px-2.5 py-0.5 text-onb-meta type-meta",
              POSITIVE,
            )}
          >
            Fits today
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 p-3">
        <span className="line-clamp-2 min-h-10 text-onb-body type-item-title text-text-primary">
          {title}
        </span>
        {subtitle && (
          <span className="truncate text-onb-meta type-meta text-text-secondary">{subtitle}</span>
        )}
        <span className="mt-1.5 flex flex-col gap-0.5 text-onb-meta tabular-nums">
          <span className="type-row-figure text-brand-navy">{calories} kcal</span>
          <span className="type-meta text-text-secondary">{protein} g protein</span>
        </span>
      </span>
    </Link>
  );
}

export interface ComparisonOrder {
  name: string;
  calories: number;
  protein: number;
}

/** "How it compares": your order against a baseline order, with calorie and protein bars. */
export function HowItCompares({
  intro,
  yourTag = "Your order",
  baselineTag = "The usual",
  yours,
  baseline,
}: {
  intro: string;
  yourTag?: string;
  baselineTag?: string;
  yours: ComparisonOrder;
  baseline: ComparisonOrder;
}) {
  const id = useId();
  const saved = baseline.calories - yours.calories;
  const extraProtein = yours.protein - baseline.protein;
  const maxKcal = Math.max(yours.calories, baseline.calories, 1);
  const maxProtein = Math.max(yours.protein, baseline.protein, 1);
  const rows = [
    { ...yours, tag: yourTag, ours: true },
    { ...baseline, tag: baselineTag, ours: false },
  ];
  return (
    <section aria-labelledby={id} className="panel overflow-hidden">
      <header className="px-4 pt-4 md:px-5">
        <h2
          id={id}
          className="text-[18px] leading-6 type-section-title tracking-[-0.6px] text-brand-navy"
        >
          How it compares
        </h2>
        <p className="mt-0.5 text-onb-meta type-meta text-text-secondary">{intro}</p>
      </header>
      {(saved > 0 || extraProtein > 0) && (
        <dl className="mt-3 grid grid-cols-2 gap-2.5 px-4 md:px-5">
          {saved > 0 && (
            <div className={cn("rounded-2xl px-3.5 py-3", POSITIVE)}>
              <dd className="text-[24px] leading-7 type-numeral tabular-nums tracking-[-0.6px]">
                {"\u2212"}
                {saved}
                <span className="ml-1 text-[13px] tracking-normal">kcal</span>
              </dd>
              <dt className="text-[12px] type-meta">fewer calories</dt>
            </div>
          )}
          {extraProtein > 0 && (
            <div className={cn("rounded-2xl px-3.5 py-3", POSITIVE)}>
              <dd className="text-[24px] leading-7 type-numeral tabular-nums tracking-[-0.6px]">
                +{extraProtein}
                <span className="ml-1 text-[13px] tracking-normal">g</span>
              </dd>
              <dt className="text-[12px] type-meta">more protein</dt>
            </div>
          )}
        </dl>
      )}
      <ul className="mt-3 flex flex-col gap-1 px-2 pb-3 md:px-3">
        {rows.map((r) => (
          <li key={r.tag} className={cn("rounded-2xl px-2.5 py-3", r.ours && "bg-brand-teal-soft")}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] type-button uppercase tracking-[0.04em]",
                  r.ours ? "bg-primary text-white" : "bg-brand-warm-gray text-text-secondary",
                )}
              >
                {r.tag}
              </span>
              <p className="min-w-0 flex-1 truncate text-onb-body type-item-title text-text-primary">
                {r.name}
              </p>
            </div>
            <dl className="mt-2.5 grid grid-cols-[3.25rem_minmax(0,1fr)_4.5rem] items-center gap-x-3 gap-y-2 text-onb-meta">
              <dt className="type-meta text-text-secondary">Calories</dt>
              <dd aria-hidden className="h-2 overflow-hidden rounded-full bg-white">
                <span
                  className="block h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
                  style={{
                    width: `${Math.round((r.calories / maxKcal) * 100)}%`,
                    backgroundColor: r.ours
                      ? "var(--color-accent-graphic)"
                      : "var(--color-text-neutral-400)",
                  }}
                />
              </dd>
              <dd className="text-right type-row-figure tabular-nums text-text-primary">
                {r.calories} kcal
              </dd>
              <dt className="type-meta text-text-secondary">Protein</dt>
              <dd aria-hidden className="h-2 overflow-hidden rounded-full bg-white">
                <span
                  className="block h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
                  style={{
                    width: `${Math.round((r.protein / maxProtein) * 100)}%`,
                    backgroundColor: r.ours
                      ? "var(--color-brand-navy)"
                      : "var(--color-text-neutral-400)",
                  }}
                />
              </dd>
              <dd className="text-right type-row-figure tabular-nums text-text-primary">
                {r.protein} g
              </dd>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
