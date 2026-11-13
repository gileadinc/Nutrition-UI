"use client";

import { lockBodyScroll } from "@/lib/hooks/scrollLock";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { CheckMark, PageContainer, TwoColumn } from "@/components/Layout";
import { PrimaryButton } from "@/components/Button";
import { useBack } from "@/lib/nav";
import { ICON_WELL, SELECTED_CHIP } from "@/components/styles";
import {
  MEAL_TYPES,
  PORTION_STEPS,
  mealApi,
  mealForTime,
  portionGlyph,
  portionLabel,
  scaleMacros,
  type MealLabel,
} from "@/lib/nutrition";
import { toast, useProfile, useRequireAccount, useTrackingActions } from "@/lib/store";
import { useNavigate } from "@/lib/nav";

/* -------------------------------------------------------------- Layout */

export function TrackLogLayout({
  title,
  subtitle,
  aside,
  asideLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  aside?: ReactNode;
  asideLabel?: string;
  children: ReactNode;
}) {
  const back = useBack("/track");
  const body = <div className="mx-auto w-full max-w-4xl xl:mx-0">{children}</div>;
  return (
    <PageContainer className="max-w-[1400px]">
      <header className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Go back"
          onClick={back}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-white transition-colors hover:border-text-neutral-400"
        >
          <Icon name="arrowBack" size={20} color="var(--color-text-primary)" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-[26px] type-display leading-7 tracking-[-1px] text-brand-navy md:text-2xl">
            {title}
          </h1>
          {subtitle && <p className="truncate text-[17px] type-meta text-text-secondary">{subtitle}</p>}
        </div>
      </header>
      <div className="mt-5 md:mt-6">
        {aside ? (
          <TwoColumn sidebarLabel={asideLabel ?? "Today"} sidebar={aside}>
            {body}
          </TwoColumn>
        ) : (
          body
        )}
      </div>
    </PageContainer>
  );
}

export function ProgressCard({
  label,
  value,
  goal,
  unit,
  color = "var(--color-primary)",
  moreIsBetter = true,
  extra,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color?: string;
  moreIsBetter?: boolean;
  extra?: string;
}) {
  const f = (n: number) => Math.round(n).toLocaleString("en-US");
  const diff = goal - value;
  const text =
    goal <= 0
      ? ""
      : diff > 0
        ? `${f(diff)} ${unit} ${moreIsBetter ? "to go" : "left"}`
        : diff === 0
          ? "Goal reached"
          : `${f(-diff)} ${unit} ${moreIsBetter ? "past goal" : "over"}`;
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <section aria-label={`${label} today`} className="panel px-4 py-3.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[16px] type-meta text-text-secondary">{label}</span>
        <span className="text-[19px] type-row-figure tabular-nums tracking-[-0.5px] text-text-primary">
          {f(value)}
          <span className="type-unit text-text-secondary">
            {" "}
            / {f(goal)} {unit}
          </span>
        </span>
        <span className="ml-auto text-[16px] type-meta text-text-secondary">{text}</span>
      </div>
      <div aria-hidden="true" className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-brand-warm-gray">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      {extra && <p className="mt-2 text-[16px] type-meta text-text-secondary">{extra}</p>}
    </section>
  );
}

export function LogSectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-2 flex items-baseline gap-2", className)}>
      <h2 className="eyebrow flex-1 text-[16px]">{children}</h2>
      {action}
    </div>
  );
}

export interface QuickItem {
  key: string;
  title: string;
  icon: IconName;
  meta: string;
  tag?: string;
  onAdd: () => void;
}

export function QuickList({ items, label }: { items: QuickItem[]; label: string }) {
  return (
    <ul aria-label={label} className="panel divide-y divide-border-divider overflow-hidden">
      {items.map((e) => (
        <li key={e.key}>
          <button
            type="button"
            onClick={e.onAdd}
            className="flex min-h-[60px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-brand-warm-gray/60"
          >
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", ICON_WELL)}>
              <Icon name={e.icon} size={16} color="var(--color-icon-well-ink)" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm type-item-title text-text-primary">{e.title}</span>
                {e.tag && (
                  <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[14px] type-meta text-text-primary">
                    {e.tag}
                  </span>
                )}
              </span>
              <span className="block truncate text-xs type-meta text-text-secondary">{e.meta}</span>
            </span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary">
              <Icon name="plusSign" size={16} color="#fff" />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export interface PanelRow {
  id: string;
  title: string;
  at?: string;
  meta: string;
  onRemove?: () => void;
}

export function TodayPanel({
  title,
  total,
  rows,
  empty,
  footer,
}: {
  title: string;
  total?: string;
  rows: PanelRow[];
  empty: string;
  footer?: ReactNode;
}) {
  return (
    <section aria-label={title} className="panel px-4 pb-2 pt-3.5">
      <div className="flex items-baseline gap-2">
        <h2 className="eyebrow flex-1 text-[16px]">{title}</h2>
        {total && (
          <span className="text-[16px] type-row-figure tabular-nums text-text-primary">{total}</span>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="py-3 text-[17px] type-meta text-text-secondary">{empty}</p>
      ) : (
        <ul className="mt-1 divide-y divide-border-divider">
          {rows.map((r) => (
            <li key={r.id} className="flex min-h-12 items-center gap-2 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] type-item-title text-text-primary">{r.title}</span>
                <span className="block truncate text-[16px] type-meta tabular-nums text-text-secondary">
                  {r.at ? `${timeOf(r.at)} · ` : ""}
                  {r.meta}
                </span>
              </span>
              {r.onRemove && (
                <button
                  type="button"
                  aria-label={`Remove ${r.title}`}
                  onClick={r.onRemove}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-brand-warm-gray"
                >
                  <Icon name="close" size={14} color="var(--color-text-secondary)" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {footer && <div className="border-t border-border-divider py-2.5">{footer}</div>}
    </section>
  );
}

export function ChipRow<T extends string | number>({
  label,
  options,
  value,
  onChange,
  format = (v) => String(v),
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
}) {
  return (
    <fieldset>
      <legend className="text-sm type-item-title text-text-primary">{label}</legend>
      <div
        className={cn(
          "mt-2 gap-2",
          options.length <= 4 ? "grid grid-cols-4 sm:flex sm:flex-wrap" : "flex flex-wrap",
        )}
      >
        {options.map((o) => (
          <button
            key={String(o)}
            type="button"
            aria-pressed={value === o}
            onClick={() => onChange(o)}
            className={cn(
              "tap-44 relative flex h-9 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-1 text-[16px] transition-colors sm:px-3.5 sm:text-[17px]",
              value === o
                ? cn(SELECTED_CHIP, "type-button")
                : "type-button-secondary border-border-default bg-white text-text-secondary hover:border-text-neutral-400",
            )}
          >
            {value === o && <CheckMark size={12} />}
            {format(o)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/* ------------------------------------------------------- Portion sheet */

export interface PortionItem {
  title: string;
  subtitle: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sourceType: "fast_hack" | "recipe" | "custom";
  sourceItemId?: string;
}

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Figure({ value, unit, className }: { value: number; unit: string; className?: string }) {
  return (
    <span>
      <span className={cn("text-[26px] type-row-figure tabular-nums tracking-[-0.6px]", className)}>
        {value.toLocaleString("en-US")}
      </span>{" "}
      {unit}
    </span>
  );
}

function PortionSheet({
  item,
  defaultMealType,
  onClose,
  onLog,
}: {
  item: PortionItem;
  defaultMealType: MealLabel;
  onClose: () => void;
  onLog: (servings: number, meal: MealLabel) => void;
}) {
  const titleId = useId();
  const labelId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const { profile } = useProfile();
  const surgery = profile?.surgicalContext === "Recovering from surgery";
  const [servings, setServings] = useState<number | null>(surgery ? null : 1);
  const [meal, setMeal] = useState<MealLabel>(defaultMealType);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const prev = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const f = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      const a = document.activeElement;
      if (e.shiftKey && (a === first || a === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && a === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const unlockScroll = lockBodyScroll();
    window.addEventListener("keydown", onKey, true);
    panel.current?.focus();
    return () => {
      unlockScroll();
      window.removeEventListener("keydown", onKey, true);
      if (prev?.isConnected) prev.focus();
    };
  }, []);
  const scaled = servings === null ? null : scaleMacros(item, servings);
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-8">
      <button
        type="button"
        aria-label="Close portion picker"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 size-full cursor-default bg-black/50 motion-safe:animate-[fade-in_200ms_ease-out]"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid="portion-sheet"
        className="drawer-panel relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] focus:outline-none md:max-w-md md:rounded-[24px] md:border md:border-border-default md:px-7 md:pb-7"
      >
        <span aria-hidden="true" className="mx-auto mt-3 block h-1 w-9 rounded-full bg-border-default md:hidden" />
        <header className="flex items-start gap-3 pt-3 md:pt-7">
          <div className="min-w-0 flex-1">
            <p className="text-[17px] type-meta text-text-secondary">How much did you have?</p>
            <h2 id={titleId} className="mt-1 text-xl type-section-title leading-7 tracking-[-0.9px] text-brand-navy">
              {item.title}
            </h2>
            <p className="mt-0.5 truncate text-[17px] type-meta text-text-secondary">{item.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-warm-gray"
          >
            <Icon name="close" size={16} color="var(--color-text-primary)" />
          </button>
        </header>
        {surgery && (
          <p className="mt-4 flex items-start gap-2.5 rounded-2xl bg-brand-teal-soft px-4 py-3 text-[17px] leading-5 text-text-primary type-meta">
            <span className="mt-0.5 shrink-0">
              <Icon name="info" size={16} color="var(--color-brand-navy)" />
            </span>
            <span>
              <span className="type-item-title">Recovering from surgery? Portions matter.</span> Choose
              the amount you actually had.
            </span>
          </p>
        )}
        <p id={labelId} className="mt-5 text-sm type-item-title text-text-primary">
          Portion
        </p>
        <div role="radiogroup" aria-labelledby={labelId} className="mt-2 grid grid-cols-[repeat(4,minmax(0,1fr))] gap-2">
          {PORTION_STEPS.map((p) => {
            const on = servings === p;
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={portionLabel(p)}
                onClick={() => setServings(p)}
                className={cn(
                  "flex h-12 min-w-0 items-center justify-center gap-1 rounded-full border text-[21px] tabular-nums transition-colors",
                  on
                    ? cn(SELECTED_CHIP, "type-button")
                    : "type-button-secondary border-border-default bg-white text-text-primary hover:border-text-neutral-400",
                )}
              >
                {on && <CheckMark size={14} />}
                {portionGlyph(p)}
              </button>
            );
          })}
        </div>
        <div
          className="mt-4 rounded-2xl bg-brand-warm-gray px-4 py-3"
          aria-live="polite"
          data-testid="portion-readout"
        >
          {scaled === null ? (
            <p className="text-[17px] type-meta text-text-secondary">Choose a portion to see what it adds.</p>
          ) : (
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[17px] type-meta text-text-secondary">
              <Figure value={scaled.calories} unit="kcal" className="text-accent-ink" />
              <Figure value={scaled.protein} unit="g protein" className="text-text-primary" />
            </p>
          )}
        </div>
        <div className="mt-5">
          <ChipRow label="Meal" options={MEAL_TYPES} value={meal} onChange={setMeal} />
        </div>
        <PrimaryButton
          className="mt-6"
          label="Log it"
          disabled={servings === null}
          onPress={() => servings !== null && onLog(servings, meal)}
        />
      </div>
    </div>
  );
}

/** Portion sheet + logging. `open(item)` shows the sheet; confirming creates the entry. */
export function usePortionSheet(defaultMealType?: MealLabel) {
  const requireAccount = useRequireAccount();
  const { log, remove } = useTrackingActions();
  const navigate = useNavigate();
  const [item, setItem] = useState<PortionItem | null>(null);

  const open = (next: PortionItem) => {
    if (requireAccount("Tracking")) setItem(next);
  };

  const onLog = async (servings: number, meal: MealLabel) => {
    if (!item) return;
    const picked = item;
    setItem(null);
    const m = scaleMacros(picked, servings);
    try {
      const entry = await log({
        mealType: mealApi(meal),
        sourceType: picked.sourceType,
        sourceItemId: picked.sourceItemId,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        notes: picked.title,
      });
      toast.success(`${picked.title} logged`, {
        body: `${meal} · ${m.calories} kcal · ${m.protein}g protein`,
        action: { label: "Undo", run: () => void remove(entry.entryId) },
        link: { label: "View in Track", href: "/track", run: () => navigate("/track") },
      });
    } catch {
      toast.error(`Couldn't log ${picked.title}`, {
        body: "Check your connection and try again.",
        action: { label: "Try again", run: () => void onLogAgain(picked, servings, meal) },
      });
    }
  };

  const onLogAgain = async (picked: PortionItem, servings: number, meal: MealLabel) => {
    const m = scaleMacros(picked, servings);
    try {
      await log({
        mealType: mealApi(meal),
        sourceType: picked.sourceType,
        sourceItemId: picked.sourceItemId,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        notes: picked.title,
      });
      toast.success(`${picked.title} logged`);
    } catch {
      navigate("/track/log-error/meal");
    }
  };

  const sheet =
    item && typeof document !== "undefined"
      ? createPortal(
          <PortionSheet
            item={item}
            defaultMealType={defaultMealType ?? mealForTime()}
            onClose={() => setItem(null)}
            onLog={(s, m) => void onLog(s, m)}
          />,
          document.body,
        )
      : null;
  return { open, sheet };
}
