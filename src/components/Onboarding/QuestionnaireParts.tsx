"use client";

import { useId, useRef, type ReactNode } from "react";
import { AppImage } from "@/components/AppImage";
import { Icon, type IconName } from "@/components/Icon";
import { useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/** Type and spacing tokens the questionnaire uses. */
export const E = {
  display: "text-[32px] leading-[36.8px] tracking-[-0.8px]",
  chapter: "text-[32px] leading-[36.8px] tracking-[-0.8px]",
  body: "text-onb-body",
  meta: "text-onb-meta",
  hero: "text-onb-hero lg:text-onb-hero-lg",
} as const;
export const D = {
  eyebrow: "mt-2",
  line: "mt-3",
  control: "mt-6",
  notes: "mt-4",
  notesGap: "gap-4",
  stack: "gap-3",
  siblings: "gap-4",
} as const;

/* ----------------------------------------------------------------- frame */

/** Padded canvas with a rounded photo card (crossfading between images) and the content column. */
export function QFrame({
  images,
  active,
  children,
}: {
  images: string[];
  active: number;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <div className="grid min-h-dvh gap-2.5 rounded-[20px] bg-auth-canvas p-2.5 lg:grid-cols-[minmax(0,653fr)_minmax(0,751fr)]">
      <aside
        aria-hidden
        className="relative hidden h-[min(30dvh,20rem)] overflow-hidden rounded-[20px] bg-surface-card md:block lg:sticky lg:top-2.5 lg:h-[calc(100dvh-1.25rem)] lg:min-h-[32rem]"
      >
        {images.map((src, i) => (
          <AppImage
            key={src + i}
            src={src}
            alt=""
            priority={i === active}
            sizes="(min-width: 1024px) 47vw, 100vw"
            className={cn(
              "absolute inset-0 size-full object-cover",
              !reduced && "transition-opacity duration-700",
              i === active ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Progress segments with the "n/total" count. */
export function Progress({
  current,
  total,
  stepName,
  complete = false,
}: {
  current: number;
  total: number;
  stepName: string;
  complete?: boolean;
}) {
  const n = complete ? total : Math.min(total, Math.max(0, current));
  const text = complete
    ? `All ${total} steps · ${stepName}`
    : `Step ${n} of ${total} · ${stepName}`;
  return (
    <div className="flex h-6 w-full items-center gap-4">
      <div
        className="flex min-w-0 flex-1 items-center gap-2"
        role="progressbar"
        aria-valuenow={n}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuetext={text}
        aria-label="Setup progress"
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            aria-hidden
            data-complete={i < n}
            className="relative h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-onboarding-progress-track"
          >
            <span
              className="absolute inset-0 origin-left rounded-full bg-accent-graphic"
              style={{ transform: `scaleX(${i < n ? 1 : 0})` }}
            />
          </span>
        ))}
      </div>
      <p aria-hidden className="shrink-0 text-sm type-display tabular-nums text-text-secondary">
        {n}/{total}
      </p>
    </div>
  );
}

/** The step layout: header, content column, footer with Back and the primary action. */
export function StepLayout({
  images,
  active,
  header,
  onBack,
  backLabel = "Back",
  stepKey,
  direction = "forward",
  onSubmit,
  actions,
  children,
}: {
  images: string[];
  active: number;
  header: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  stepKey: string;
  direction?: "forward" | "back";
  onSubmit: () => void;
  actions: ReactNode;
  children: ReactNode;
}) {
  const first = stepKey === "step-dob";
  const reveal = stepKey === "reveal";
  const reduced = useReducedMotion();
  return (
    <QFrame images={images} active={active}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        onKeyDown={(e) => {
          const t = e.target as HTMLElement;
          if (
            e.key !== "Enter" ||
            e.defaultPrevented ||
            t.closest("button, a, input, textarea, select, summary")
          )
            return;
          e.preventDefault();
          onSubmit();
        }}
        className="flex min-h-[calc(100dvh-1.25rem)] items-center justify-center px-5 py-8 lg:px-10 lg:py-10"
      >
        <div
          data-testid="onboarding-column"
          className={cn(
            "flex w-full max-w-[34rem] flex-col",
            !first && "lg:min-h-[min(942px,calc(100dvh-6.25rem))] lg:pt-6",
          )}
        >
          <header className="relative flex items-center gap-3">
            <div className="min-w-0 flex-1">{header}</div>
          </header>
          <main
            className={cn(
              "flex flex-1 flex-col overflow-x-clip",
              first ? "pt-10" : reveal ? "justify-center py-10" : "pt-8",
            )}
          >
            <div
              key={stepKey}
              data-testid="quiz-step"
              data-direction={direction}
              className={cn(!reduced && "onb-step-in")}
            >
              {children}
            </div>
          </main>
          <footer
            className={cn(
              "mt-8 flex items-center gap-3 pb-[env(safe-area-inset-bottom)] [&>button]:rounded-full",
              !first && "lg:mt-auto lg:pt-4",
            )}
          >
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="h-14 shrink-0 rounded-full px-4 type-button-secondary text-brand-navy hover:bg-navy-soft"
              >
                {backLabel}
              </button>
            )}
            {actions}
          </footer>
        </div>
      </form>
    </QFrame>
  );
}

/** Layout for the analyzing / save screens (no progress, optional Back). */
export function ResultLayout({
  images,
  active,
  onBack,
  children,
}: {
  images: string[];
  active: number;
  onBack?: () => void;
  children: ReactNode;
}) {
  const col = "mx-auto w-full max-w-[32rem] lg:max-w-[34rem]";
  return (
    <QFrame images={images} active={active}>
      <div className="flex min-h-dvh flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] lg:justify-center lg:px-12 lg:py-10">
        <main className={cn(col, "flex flex-1 flex-col overflow-x-clip lg:flex-none lg:pt-10")}>
          {children}
        </main>
        {onBack && (
          <footer className={cn(col, "mt-8")}>
            <button
              type="button"
              onClick={onBack}
              className="h-14 rounded-full px-4 type-button-secondary text-brand-navy hover:bg-navy-soft"
            >
              Back
            </button>
          </footer>
        )}
      </div>
    </QFrame>
  );
}

export function Caption({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="max-w-md">
      <p className="onb-eyebrow">{eyebrow}</p>
      <p className={cn("mt-2 type-section-title text-brand-navy", E.body)}>{title}</p>
      {body && <p className={cn("mt-1 text-text-secondary", E.body)}>{body}</p>}
    </div>
  );
}

export function Heading({
  title,
  eyebrow,
  why,
  helper,
  size = "display",
  headingId,
  lineId,
}: {
  title: string;
  eyebrow?: string;
  why?: string;
  helper?: string;
  size?: "display" | "chapter";
  headingId?: string;
  lineId?: string;
}) {
  return (
    <div className="flex flex-col">
      {eyebrow && <p className="onb-eyebrow">{eyebrow}</p>}
      <h1
        id={headingId}
        tabIndex={-1}
        className={cn(
          "type-display text-brand-navy outline-none",
          eyebrow && D.eyebrow,
          size === "display" ? E.display : E.chapter,
        )}
      >
        {title}
      </h1>
      {why && (
        <p
          id={lineId}
          data-testid="why-we-ask"
          className={cn(D.line, "whitespace-pre-line text-text-secondary", E.body)}
        >
          <span className="type-section-title text-text-primary">Why we ask:</span> {why}
        </p>
      )}
      {!why && helper && (
        <p id={lineId} className={cn(D.line, "whitespace-pre-line text-text-secondary", E.body)}>
          {helper}
        </p>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- controls */

export function UnitToggle({
  left,
  right,
  leftSelected,
  onChange,
  label,
}: {
  left: string;
  right: string;
  leftSelected: boolean;
  onChange: (left: boolean) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex w-fit self-start rounded-full bg-navy-soft p-0.5"
    >
      {[
        { text: left, active: leftSelected, value: true },
        { text: right, active: !leftSelected, value: false },
      ].map((o) => (
        <button
          key={o.text}
          type="button"
          aria-pressed={o.active}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex h-11 min-w-14 items-center justify-center gap-1.5 rounded-full px-3 transition-colors",
            E.meta,
            o.active
              ? "border-selected bg-selected text-on-selected type-button"
              : "type-button-secondary text-brand-navy hover:bg-surface-card",
          )}
        >
          {o.active && <Icon name="tick" size={14} color="var(--color-on-selected)" />}
          {o.text}
        </button>
      ))}
    </div>
  );
}

export function ExampleHint({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full px-3 type-button-secondary text-text-secondary hover:bg-navy-soft",
        E.meta,
      )}
    >
      <Icon name="pencilEdit" size={16} color="currentColor" />
      {label}
    </button>
  );
}

export function Message({
  message,
  success,
  id,
}: {
  message: string;
  success?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      role={success ? "status" : "alert"}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-4 py-3",
        success ? "bg-positive" : "bg-error-soft",
      )}
    >
      <Icon
        name={success ? "checkCircle" : "alert"}
        size={18}
        color={success ? "var(--color-positive-ink)" : "var(--color-status-low)"}
      />
      <span className={cn("type-body text-text-primary", E.body)}>{message}</span>
    </div>
  );
}

export function Reassurance({ children, icon = "lock" }: { children: ReactNode; icon?: IconName }) {
  return (
    <p className={cn("flex items-start gap-2.5 type-meta text-text-secondary", E.meta)}>
      <span className="mt-0.5 shrink-0">
        <Icon name={icon} size={16} color="var(--color-brand-navy)" />
      </span>
      <span>{children}</span>
    </p>
  );
}

export function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex min-h-14 items-center gap-3 border-b border-border-divider py-1.5 last:border-b-0">
      <span className="min-w-0 flex-1">
        <span className={cn("block type-meta text-text-secondary", E.meta)}>{label}</span>
        <span className={cn("block type-item-title text-text-primary", E.body)}>{value}</span>
      </span>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${label}`}
          className={cn(
            "-mr-2 flex h-11 items-center rounded-full px-3 type-button text-primary hover:bg-primary-soft",
            E.body,
          )}
        >
          Edit
        </button>
      )}
    </div>
  );
}

export function StatTile({
  icon,
  label,
  value,
  unit,
}: {
  icon: IconName;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-full bg-icon-well text-icon-well-ink"
      >
        <Icon name={icon} size={18} color="currentColor" />
      </span>
      <span className={cn("type-meta text-text-secondary", E.meta)}>{label}</span>
      <span className="flex items-baseline gap-x-0.5 whitespace-nowrap">
        <span className={cn("type-row-figure tabular-nums text-brand-navy", E.body)}>{value}</span>
        <span className={cn("type-meta text-text-secondary", E.meta)}>{unit}</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------ numeric controls */

const selectAll = (e: React.FocusEvent<HTMLInputElement>) => {
  const t = e.currentTarget;
  const v = t.value;
  t.select();
  requestAnimationFrame(() => {
    if (document.activeElement === t && t.value === v) t.setSelectionRange(0, v.length);
  });
};

export interface StepperField {
  id: string;
  label: string;
  unit: string;
  maxLength: number;
  value: string;
  onChange: (v: string) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Large numeric field(s) with − / + buttons. */
export function Stepper({
  name,
  value,
  min,
  max,
  step = 1,
  onStep,
  fields,
  invalid = false,
  example = false,
  describedBy,
  labelledBy,
}: {
  name: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onStep: (v: number) => void;
  fields: StepperField[];
  invalid?: boolean;
  example?: boolean;
  describedBy?: string;
  labelledBy?: string;
}) {
  const v = Math.round(value);
  const bump = (d: number) => onStep(clamp(v + d * step, min, max));
  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <div
        role="group"
        aria-labelledby={labelledBy}
        data-example={example || undefined}
        className={cn(
          "flex w-fit min-w-0 max-w-full items-baseline gap-x-1.5 rounded-xl border-b-2 px-1 pb-2 pt-1.5 focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand-navy",
          invalid
            ? "border-solid border-error-red"
            : example
              ? "border-dashed border-border-default"
              : "border-transparent",
        )}
      >
        {fields.map((f, i) => (
          <span key={f.id} className={cn("flex items-baseline gap-1", i > 0 && "ml-3")}>
            <input
              ref={f.inputRef}
              id={f.id}
              aria-label={f.label}
              inputMode="numeric"
              autoComplete="off"
              value={f.value}
              maxLength={f.maxLength}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              onFocus={selectAll}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                  e.preventDefault();
                  bump(e.key === "ArrowUp" ? 1 : -1);
                }
              }}
              onChange={(e) => f.onChange(e.target.value.replace(/\D/g, "").slice(0, f.maxLength))}
              className="min-w-0 bg-transparent text-center type-numeral tabular-nums outline-none selection:bg-teal-200 text-[32px] leading-[40px] tracking-[-0.8px] text-brand-navy transition-colors sm:text-[40px] sm:leading-[48px]"
              style={{ width: `${Math.max(1, f.value.length) + 0.2}ch` }}
            />
            <span aria-hidden className={cn("type-unit text-text-secondary", E.body)}>
              {f.unit}
            </span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <RoundButton
          kind="minus"
          label={`Decrease ${name}`}
          disabled={v <= min}
          onPress={() => bump(-1)}
        />
        <RoundButton
          kind="plus"
          label={`Increase ${name}`}
          disabled={v >= max}
          onPress={() => bump(1)}
        />
      </div>
    </div>
  );
}

function RoundButton({
  kind,
  label,
  onPress,
  disabled,
}: {
  kind: "minus" | "plus";
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      disabled={disabled}
      className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border-divider bg-brand-cream text-brand-navy enabled:hover:bg-navy-soft disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon
        name={kind === "minus" ? "minusSign" : "plusSign"}
        size={24}
        strokeWidth={2}
        color="currentColor"
      />
    </button>
  );
}

const DATE_PARTS = [
  { part: "month", label: "Month", placeholder: "MM", max: 2, autoComplete: "bday-month" },
  { part: "day", label: "Day", placeholder: "DD", max: 2, autoComplete: "bday-day" },
  { part: "year", label: "Year", placeholder: "YYYY", max: 4, autoComplete: "bday-year" },
] as const;

export const splitDob = (v: string) => {
  const [month = "", day = "", year = ""] = v.split("/");
  return { month, day, year };
};
const joinDob = ({ month, day, year }: { month: string; day: string; year: string }) =>
  month || day || year ? `${month}/${day}/${year}` : "";
export const dobComplete = (v: string) => {
  const p = splitDob(v);
  return p.month.length === 2 && p.day.length === 2 && p.year.length === 4;
};

/** Month / day / year boxes that auto-advance. */
export function DateField({
  value,
  onChange,
  invalid = false,
  describedBy,
  labelledBy,
  firstInputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  describedBy?: string;
  labelledBy?: string;
  firstInputRef?: React.Ref<HTMLInputElement>;
}) {
  const uid = useId();
  const parts = splitDob(value);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focusAt = (i: number) => {
    const el = refs.current[i];
    if (el) {
      el.focus();
      el.select();
    }
  };
  const set = (i: number, raw: string) => {
    const { part, max } = DATE_PARTS[i];
    let v = raw.replace(/\D/g, "").slice(0, max);
    if (v.length === 1 && ((part === "month" && v > "1") || (part === "day" && v > "3")))
      v = `0${v}`;
    onChange(joinDob({ ...parts, [part]: v }));
    if (v.length === max && i < DATE_PARTS.length - 1) focusAt(i + 1);
  };
  return (
    <div role="group" aria-labelledby={labelledBy} className="grid grid-cols-[1fr_1fr_2fr] gap-3">
      {DATE_PARTS.map((p, i) => {
        const id = `${uid}-${p.part}`;
        return (
          <div key={p.part} className="flex min-w-0 flex-col gap-2">
            <label htmlFor={id} className={cn("type-item-title text-text-secondary", E.meta)}>
              {p.label}
            </label>
            <input
              ref={(el) => {
                refs.current[i] = el;
                if (i === 0 && firstInputRef) {
                  if (typeof firstInputRef === "function") firstInputRef(el);
                  else (firstInputRef as { current: HTMLInputElement | null }).current = el;
                }
              }}
              id={id}
              inputMode="numeric"
              autoComplete={p.autoComplete}
              placeholder={p.placeholder}
              value={parts[p.part]}
              maxLength={p.max}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              onFocus={selectAll}
              onPaste={(e) => {
                const digits = e.clipboardData.getData("text").replace(/\D/g, "");
                if (digits.length < 5) return;
                e.preventDefault();
                onChange(
                  joinDob({
                    month: digits.slice(0, 2),
                    day: digits.slice(2, 4),
                    year: digits.slice(4, 8),
                  }),
                );
                focusAt(2);
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && e.currentTarget.value === "" && i > 0) {
                  e.preventDefault();
                  focusAt(i - 1);
                }
              }}
              onChange={(e) => set(i, e.target.value)}
              className={cn(
                "panel h-16 w-full min-w-0 px-1 text-center type-numeral tabular-nums outline-none selection:bg-teal-200 focus:ring-2 focus:ring-inset focus:ring-brand-navy lg:h-[4.5rem]",
                E.display,
                "placeholder:type-meta placeholder:text-text-neutral-500 placeholder:text-onb-body",
                invalid && "ring-2 ring-inset ring-error-red",
                "text-text-primary",
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
