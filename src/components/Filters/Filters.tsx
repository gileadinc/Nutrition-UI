"use client";

import { lockBodyScroll } from "@/lib/hooks/scrollLock";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Link } from "@/lib/nav";
import { PrimaryButton } from "@/components/Button";
import { CheckMark, SavedCountLink } from "@/components/Layout";
import { BrandMark, hasBrandMark } from "@/components/Cards";
import { SearchField } from "@/components/Shell/SearchField";
import { PAGE_TITLE, PILL, SELECTED_CHIP, SWITCH_ON } from "@/components/styles";

export interface FacetOption {
  value: string;
  label: string;
  /** Number of results if this option were applied (0 disables unselected options). */
  count: number;
}

/** Small navy count bubble. */
export function CountBadge({ count }: { count: number }) {
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[15px] type-meta text-white">
      {count}
    </span>
  );
}

/** Persistent left filter column (lg+). */
export function FilterSidebar({
  activeCount,
  onReset,
  children,
}: {
  activeCount: number;
  onReset: () => void;
  children: ReactNode;
}) {
  return (
    <aside aria-label="Filters" className="hidden w-64 shrink-0 lg:block xl:w-72">
      <div className="panel sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col overflow-hidden">
        <div className="flex min-h-12 shrink-0 items-center gap-2 border-b border-border-divider px-4">
          <h2 className="text-[19px] type-section-title text-brand-navy">Filters</h2>
          {activeCount > 0 && <CountBadge count={activeCount} />}
          <button
            type="button"
            onClick={onReset}
            disabled={activeCount === 0}
            className="tap-44 relative ml-auto flex min-h-9 items-center rounded-full border border-border-default bg-white px-3.5 text-[17px] type-button text-primary disabled:cursor-not-allowed disabled:text-text-neutral-400"
          >
            Reset
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">{children}</div>
      </div>
    </aside>
  );
}

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  label: string;
  activeCount: number;
  onReset: () => void;
  /** Footer button text, e.g. "Show 12 recipes". */
  resultLabel: string;
  children: ReactNode;
}

/** Bottom sheet (mobile) / right drawer (md) with the same filter controls; hidden at lg+. */
export function FilterSheet(props: FilterSheetProps) {
  if (!props.open || typeof document === "undefined") return null;
  return createPortal(<SheetBody {...props} />, document.body);
}

function SheetBody({
  onClose,
  label,
  activeCount,
  onReset,
  resultLabel,
  children,
}: FilterSheetProps) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.getElementById("app-root");
    const wasInert = root?.hasAttribute("inert") ?? false;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const nodes = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const mql =
      typeof window.matchMedia === "function" ? window.matchMedia("(min-width: 1024px)") : null;
    const onMq = (e: MediaQueryListEvent) => {
      if (e.matches) closeRef.current();
    };
    const unlockScroll = lockBodyScroll();
    root?.setAttribute("inert", "");
    document.addEventListener("keydown", onKey);
    mql?.addEventListener?.("change", onMq);
    panel.current?.focus();
    return () => {
      unlockScroll();
      if (!wasInert) root?.removeAttribute("inert");
      document.removeEventListener("keydown", onKey);
      mql?.removeEventListener?.("change", onMq);
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end lg:hidden">
      <button
        type="button"
        aria-label="Close filters"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 size-full cursor-default bg-black/50 motion-safe:animate-[fade-in_200ms_ease-out]"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        data-testid="filter-sheet"
        className="filter-sheet-panel relative flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-[20px] bg-white focus:outline-none md:h-dvh md:max-h-none md:w-[420px] md:rounded-none md:rounded-l-[20px]"
      >
        <header className="shrink-0 border-b border-border-divider px-5 pb-2">
          <span
            aria-hidden
            className="mx-auto mt-2.5 block h-1 w-9 rounded-full bg-border-default md:hidden"
          />
          <div className="flex min-h-12 items-center gap-2 pt-1 md:pt-3">
            <h2 className="text-[24px] type-section-title tracking-[-0.9px] text-brand-navy">
              Filters
            </h2>
            {activeCount > 0 && <CountBadge count={activeCount} />}
            <button
              type="button"
              onClick={onReset}
              disabled={activeCount === 0}
              className="ml-auto flex min-h-11 items-center px-2 text-[18px] type-button text-primary disabled:cursor-not-allowed disabled:text-text-neutral-400"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-warm-gray"
            >
              <Icon name="close" size={16} color="var(--color-text-primary)" />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">{children}</div>
        <footer className="shrink-0 border-t border-border-divider bg-white px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <PrimaryButton label={resultLabel} onPress={onClose} />
          <p role="status" className="sr-only">
            {resultLabel.replace(/^Show /, "")}
          </p>
        </footer>
      </div>
    </div>
  );
}

/** Collapsible accordion section inside the sidebar/sheet. */
export function FilterSection({
  title,
  summary,
  active,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary: string;
  active?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen || !!active);
  const id = useId();
  return (
    <section className="border-b border-border-divider last:border-b-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
          className="flex min-h-14 w-full items-center gap-3 py-2.5 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[18px] type-item-title tracking-[-0.4px] text-brand-navy">
              {title}
            </span>
            {!open && (
              <span
                className={cn(
                  "mt-0.5 block truncate text-[16px] type-meta",
                  active ? "text-primary" : "text-text-secondary",
                )}
              >
                {summary}
              </span>
            )}
          </span>
          <span
            aria-hidden
            className={cn(
              "flex transition-transform motion-reduce:transition-none",
              open ? "-rotate-90" : "rotate-90",
            )}
          >
            <Icon name="chevronRight" size={16} color="var(--color-text-secondary)" />
          </span>
        </button>
      </h3>
      {open && (
        <div id={id} className="flex flex-col gap-5 pb-5">
          {children}
        </div>
      )}
    </section>
  );
}

/** "Fits what's left today" switch (needs the day's remaining kcal and match count). */
export function FitsTodayToggle({
  checked,
  count,
  remaining,
  over,
  goal,
  onChange,
}: {
  checked: boolean;
  count: number;
  remaining: number;
  over: number;
  goal: number;
  onChange: (next: boolean) => void;
}) {
  const id = useId();
  const disabled = count === 0 && !checked;
  const text =
    over > 0
      ? `${over.toLocaleString()} kcal over today's ${goal.toLocaleString()} — nothing fits, so this is off.`
      : count === 0
        ? `${remaining.toLocaleString()} kcal left, and nothing here is that small.`
        : `${remaining.toLocaleString()} kcal left · ${count} ${count === 1 ? "match" : "matches"}`;
  return (
    <div className="border-b border-border-divider py-4">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`Fits what's left today, ${count} ${count === 1 ? "result" : "results"}`}
        aria-describedby={id}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "flex min-h-14 w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors",
          checked ? "bg-primary-soft" : "bg-navy-soft",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <Icon
          name="target"
          size={18}
          color={checked ? "var(--color-primary)" : "var(--color-brand-navy)"}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[18px] type-item-title tracking-[-0.4px] text-brand-navy">
            Fits what&apos;s left today
          </span>
          <span id={id} className="mt-0.5 block text-[16px] type-meta text-text-secondary">
            {text}
          </span>
        </span>
        <span
          aria-hidden
          className={cn(
            "relative h-6 w-10 shrink-0 rounded-full transition-colors",
            checked ? SWITCH_ON : "bg-border-default",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform motion-reduce:transition-none",
              checked && "translate-x-4",
            )}
          />
        </span>
      </button>
    </div>
  );
}

/** Wrap-row of toggle chips with per-option counts (inside FilterSection). */
export function ChipGroup({
  legend,
  showLegend = false,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  showLegend?: boolean;
  options: FacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <fieldset>
      <legend
        className={cn(
          showLegend ? "mb-2 text-[16px] type-item-title text-text-secondary" : "sr-only",
        )}
      >
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o.value);
          const disabled = o.count === 0 && !on;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              aria-label={`${o.label}, ${o.count} ${o.count === 1 ? "result" : "results"}`}
              onClick={() => onToggle(o.value)}
              className={cn(
                "tap-44 relative flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[17px] transition-colors lg:min-h-9",
                on ? "type-button" : "type-button-secondary",
                on
                  ? SELECTED_CHIP
                  : disabled
                    ? "cursor-not-allowed border-dashed border-border-default bg-brand-warm-gray text-text-neutral-400"
                    : "border-border-default bg-white text-text-primary hover:border-primary",
              )}
            >
              {on && <CheckMark size={13} />}
              {o.label}
              <span
                aria-hidden
                className={cn(
                  "text-[15px] type-meta",
                  on
                    ? "text-on-selected/85"
                    : disabled
                      ? "text-text-neutral-400"
                      : "text-text-secondary",
                )}
              >
                {o.count}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Labelled range input with a value readout. */
export function RangeSlider({
  id,
  label,
  min,
  max,
  step,
  value,
  format,
  onChange,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[16px] type-item-title text-text-secondary">
          {label}
        </label>
        <span className="text-[17px] type-row-figure text-brand-navy">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-track h-11 w-full cursor-pointer"
        style={
          { "--fill": `${max === min ? 0 : ((value - min) / (max - min)) * 100}%` } as CSSProperties
        }
      />
    </div>
  );
}

/** Long checkbox list with search + "show all" (restaurants, cuisines...). */
export function CheckList({
  legend,
  noun,
  options,
  selected,
  onToggle,
  initialVisible = 5,
}: {
  legend: string;
  noun: string;
  options: FacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
  initialVisible?: number;
}) {
  const [query, setQuery] = useState("");
  const [all, setAll] = useState(false);
  const id = useId();
  const q = query.trim().toLowerCase();
  const matches = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  const shown =
    q || all ? matches : matches.filter((o, i) => i < initialVisible || selected.includes(o.value));
  const hidden = matches.length - shown.length;
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      {options.length > initialVisible && (
        <SearchField
          id={id}
          label={`Search ${noun}`}
          value={query}
          onChange={setQuery}
          placeholder={`Search ${noun}`}
          size="md"
          className="mb-2"
          inputClassName="text-[17px]"
        />
      )}
      <ul className="flex flex-col">
        {shown.map((o) => {
          const on = selected.includes(o.value);
          const disabled = o.count === 0 && !on;
          return (
            <li key={o.value}>
              <label
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-1",
                  disabled
                    ? "cursor-not-allowed text-text-neutral-400"
                    : "cursor-pointer text-text-primary hover:bg-brand-warm-gray",
                )}
              >
                <input
                  type="checkbox"
                  checked={on}
                  disabled={disabled}
                  onChange={() => onToggle(o.value)}
                  aria-label={`${o.label}, ${o.count} ${o.count === 1 ? "result" : "results"}`}
                  className="size-[18px] shrink-0 cursor-[inherit] accent-primary"
                />
                {hasBrandMark(o.value) ? (
                  <span className={cn(disabled && "opacity-50")}>
                    <BrandMark restaurant={o.value} />
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className="size-[22px] shrink-0 rounded-[7px] bg-brand-warm-gray"
                  />
                )}
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[17px] type-item-title",
                    disabled && "line-through",
                  )}
                >
                  {o.label}
                </span>
                <span aria-hidden className="text-[16px] type-meta text-text-secondary">
                  {o.count}
                </span>
              </label>
            </li>
          );
        })}
        {shown.length === 0 && (
          <li className="py-2 text-[17px] type-meta text-text-secondary">
            No {noun} match “{query}”.
          </li>
        )}
      </ul>
      {!q && (hidden > 0 || all) && (
        <button
          type="button"
          onClick={() => setAll(!all)}
          className="tap-44 relative mt-1 flex min-h-11 items-center text-[17px] type-button text-primary lg:min-h-9"
        >
          {all ? "Show fewer" : `Show all ${options.length} ${noun}`}
        </button>
      )}
    </fieldset>
  );
}

const ICON_BTN =
  "relative flex size-11 shrink-0 items-center justify-center rounded-full border motion-safe:transition motion-safe:duration-150";
const ICON_BTN_IDLE = "border-border-default bg-white hover:border-text-neutral-400";
const ICON_BTN_ON = "border-primary bg-primary-soft";

/** Listing page header with count, search shortcut, filters button and sort select. */
export function ListingToolbar({
  title,
  subtitle,
  count,
  noun,
  searchTo,
  savedCount,
  savedTo,
  activeCount,
  filtersOpen,
  onOpenFilters,
  sort,
  sortOptions,
  onSort,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  count: number;
  noun: string;
  searchTo: string;
  savedCount: number;
  savedTo: string;
  activeCount: number;
  filtersOpen: boolean;
  onOpenFilters: () => void;
  sort: string;
  sortOptions: { value: string; label: string }[];
  onSort: (value: string) => void;
}) {
  const sortLabel = sortOptions.find((o) => o.value === sort)?.label ?? sortOptions[0].label;
  const sortActive = sort !== sortOptions[0].value;
  const hint = count === 0 ? `Search ${noun}s` : `Search ${count} ${noun}${count === 1 ? "" : "s"}`;
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-x-3 md:gap-y-1">
      <h1 className={cn(PAGE_TITLE, "col-start-1 row-start-1 min-w-0 truncate")}>{title}</h1>
      <div className="col-start-2 row-start-1 flex justify-end md:col-start-3">
        <SavedCountLink count={savedCount} to={savedTo} />
      </div>
      <Link
        to={searchTo}
        className={cn(
          PILL,
          "col-start-1 row-start-2 flex h-11 min-w-0 items-center gap-3 px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus md:hidden",
        )}
      >
        <span className="shrink-0">
          <Icon name="search" size={18} color="var(--color-text-secondary)" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm type-meta tracking-[-0.63px] text-text-secondary">
          {hint}
        </span>
      </Link>
      <div className="col-start-2 row-start-2 flex items-center justify-end gap-2 md:row-start-1">
        <p
          role="status"
          aria-live="polite"
          className="sr-only text-[17px] type-meta whitespace-nowrap text-text-secondary md:not-sr-only md:mr-1"
        >
          <span className="type-row-figure text-text-primary">{count}</span> {noun}
          {count === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={onOpenFilters}
          aria-haspopup="dialog"
          aria-expanded={filtersOpen}
          aria-label={activeCount > 0 ? `Filters, ${activeCount} active` : "Filters"}
          title="Filters"
          className={cn(
            ICON_BTN,
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:hidden",
            activeCount > 0 ? ICON_BTN_ON : ICON_BTN_IDLE,
          )}
        >
          <Icon name="filterSliders" size={18} color="var(--color-primary)" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1">
              <CountBadge count={activeCount} />
            </span>
          )}
        </button>
        <SortMenu sort={sort} sortOptions={sortOptions} onSort={onSort} sortLabel={sortLabel} sortActive={sortActive} />
      </div>
      {subtitle && (
        <p className="col-span-full row-start-2 hidden truncate text-[17px] type-meta text-text-secondary md:block">
          {subtitle}
        </p>
      )}
    </header>
  );
}

/** Sort button + popover list (replaces the browser's native select list). */
function SortMenu({
  sort,
  sortOptions,
  onSort,
  sortLabel,
  sortActive,
}: {
  sort: string;
  sortOptions: { value: string; label: string }[];
  onSort: (value: string) => void;
  sortLabel: string;
  sortActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Sort: ${sortLabel}`}
        title={`Sort: ${sortLabel}`}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          ICON_BTN,
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          sortActive || open ? ICON_BTN_ON : ICON_BTN_IDLE,
        )}
      >
        <Icon name="sort" size={18} color="var(--color-primary)" />
        {sortActive && (
          <span
            aria-hidden
            data-testid="sort-active-dot"
            className="absolute top-1.5 right-1.5 size-2 rounded-full bg-selected"
          />
        )}
      </button>
      {open && (
        <ul
          id={menuId}
          role="listbox"
          aria-label="Sort by"
          className="panel absolute right-0 top-[calc(100%+8px)] z-40 w-52 overflow-hidden p-1.5 shadow-raised"
        >
          {sortOptions.map((o) => {
            const on = o.value === sort;
            return (
              <li key={o.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => {
                    onSort(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-[18px] hover:bg-brand-warm-gray",
                    on ? "type-button text-primary" : "type-meta text-text-primary",
                  )}
                >
                  {o.label}
                  {on && <CheckMark size={14} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Removable applied-filter pills. */
export function AppliedFilters({
  filters,
  onClearAll,
}: {
  filters: { label: string; remove: () => void }[];
  onClearAll: () => void;
}) {
  if (filters.length === 0) return null;
  return (
    <div className="flex items-center gap-2 pb-2.5">
      <ul
        aria-label="Applied filters"
        className="rail-scroll -my-1 flex min-w-0 flex-1 gap-2 overflow-x-auto py-1"
      >
        {filters.map((f) => (
          <li key={f.label} className="shrink-0">
            <button
              type="button"
              onClick={f.remove}
              aria-label={`Remove filter ${f.label}`}
              className="tap-44 relative flex h-9 items-center gap-1.5 rounded-full bg-primary-soft pr-2.5 pl-3 text-[16px] type-button whitespace-nowrap text-text-primary hover:bg-badge-apricot"
            >
              {f.label}
              <Icon name="close" size={11} color="var(--color-primary)" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClearAll}
        className="tap-44 relative flex h-9 shrink-0 items-center px-1 text-[16px] type-button-secondary text-text-secondary underline underline-offset-2"
      >
        Clear all
      </button>
    </div>
  );
}

/** Labelled chip group with its own Clear link (top-level facets). */
export function FacetGroup({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: FacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear?: () => void;
}) {
  if (options.length === 0) return null;
  return (
    <fieldset>
      <div className="flex items-baseline gap-2">
        <legend className="eyebrow">{label}</legend>
        {onClear && selected.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="tap-24 tap-44 relative ml-auto text-[15px] type-button text-primary"
          >
            Clear
          </button>
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o.value);
          const disabled = o.count === 0 && !on;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              aria-label={`${o.label}, ${o.count} ${o.count === 1 ? "result" : "results"}`}
              onClick={() => onToggle(o.value)}
              className={cn(
                "tap-44 relative flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[17px] transition-colors",
                on ? "type-button" : "type-button-secondary",
                on
                  ? SELECTED_CHIP
                  : disabled
                    ? "border-border-divider bg-white text-text-neutral-400"
                    : "border-border-default bg-white text-text-secondary hover:border-primary",
              )}
            >
              {on && <CheckMark size={13} />}
              {o.label}
              <span
                aria-hidden
                className={cn(
                  "text-[15px] type-meta",
                  on ? "text-on-selected/80" : "text-text-neutral-500",
                )}
              >
                {o.count}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** "Advanced" expander inside the filter panel. */
export function AdvancedFilters({
  open,
  onOpenChange,
  activeCount,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-border-divider pt-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="tap-44 relative flex min-h-9 w-full items-center gap-2 text-[17px] type-item-title text-text-primary"
      >
        <Icon name="filterSliders" size={15} color="var(--color-brand-navy)" />
        Advanced
        {activeCount > 0 && <CountBadge count={activeCount} />}
        <Icon
          name={open ? "arrowUpSmall" : "arrowDownSmall"}
          size={14}
          color="var(--color-text-secondary)"
        />
      </button>
      {open && <div className="mt-4 flex flex-col gap-5">{children}</div>}
    </div>
  );
}
