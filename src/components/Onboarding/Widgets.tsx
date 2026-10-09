"use client";

import { useState, type ReactNode, type Ref } from "react";
import { cn } from "@/lib/utils";
import { AppImage, PhotoFade } from "@/components/AppImage";
import { Icon, type IconName } from "@/components/Icon";
import { CheckMark } from "@/components/Layout";
import { Logo } from "@/components/Shell/Logo";
import { useReducedMotion } from "@/lib/hooks";
import { ICON_WELL, ONB_SPACING, ONB_TYPE, SELECTED_CHIP } from "@/components/styles";

/** Split layout: sticky photo column (lg+) + content. `images[activeImage]` is shown. */
export function OnboardingSplit({
  images,
  activeImage = 0,
  imageClassName = "object-center",
  caption,
  children,
}: {
  images: string[];
  activeImage?: number;
  imageClassName?: string;
  caption?: ReactNode;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <div className="min-h-dvh bg-surface-white lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside
        aria-hidden
        className="relative hidden overflow-hidden bg-brand-navy lg:sticky lg:top-0 lg:block lg:h-dvh"
      >
        {images.map((src, i) => (
          <AppImage
            key={`${src}-${i}`}
            src={src}
            alt=""
            priority={i === activeImage}
            sizes="42vw"
            className={cn(
              "absolute inset-0 size-full object-cover",
              !reduced && "transition-opacity duration-700",
              imageClassName,
              i === activeImage ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
        <PhotoFade />
        {caption && <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">{caption}</div>}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Thin progress bar with "Step n of N · name" caption. */
export function StepProgress({
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
  const reduced = useReducedMotion();
  const text = complete
    ? `All ${total} steps · ${stepName}`
    : `Step ${current} of ${total} · ${stepName}`;
  const ratio = complete ? 1 : Math.min(1, Math.max(0, current / total));
  return (
    <div className="flex w-full flex-col gap-2">
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-navy-soft"
        role="progressbar"
        aria-valuenow={complete ? total : current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuetext={text}
        aria-label="Setup progress"
      >
        <span
          data-testid="progress-fill"
          className={cn(
            "block h-full w-full origin-left rounded-full bg-progress",
            !reduced && "onb-progress-fill",
          )}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
      <p className={cn("type-meta text-text-secondary", ONB_TYPE.meta)}>{text}</p>
    </div>
  );
}

/** One quiz step: sticky header (back + logo + progress), body, fixed footer actions. */
export function QuizStepLayout({
  images,
  activeImage,
  imageClassName,
  caption,
  header,
  onBack,
  backLabel = "Back",
  stepKey,
  direction = "forward",
  band,
  bandSize = "default",
  onSubmit,
  actions,
  wide = false,
  children,
}: {
  images: string[];
  activeImage?: number;
  imageClassName?: string;
  caption?: ReactNode;
  header?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  /** Changes per step to retrigger the enter animation. */
  stepKey: string;
  direction?: "forward" | "back";
  /** Mobile photo band image. */
  band?: string;
  bandSize?: "default" | "compact";
  onSubmit: () => void;
  actions: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <OnboardingSplit
      images={images}
      activeImage={activeImage}
      imageClassName={imageClassName}
      caption={caption}
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        onKeyDown={(e) => {
          const target = e.target as HTMLElement;
          if (
            e.key !== "Enter" ||
            e.defaultPrevented ||
            target.closest("button, a, input, textarea, select")
          )
            return;
          e.preventDefault();
          onSubmit();
        }}
        className="flex min-h-dvh flex-col lg:px-12"
      >
        <div
          data-testid="onboarding-column"
          className={cn(
            "contents lg:mx-auto lg:my-auto lg:flex lg:w-full lg:max-w-[34rem] lg:flex-col lg:py-10 lg-short:py-6",
            wide && "lg:max-w-[48rem] xl:max-w-[60rem]",
          )}
        >
          <header className="sticky top-0 z-10 bg-surface-white px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:static lg:p-0">
            <div className={cn("mx-auto flex w-full flex-col gap-3 lg:max-w-none", wide ? "max-w-[48rem]" : "max-w-[32rem]")}>
              <div className="flex h-11 items-center justify-between">
                {onBack ? (
                  <button
                    type="button"
                    onClick={onBack}
                    aria-label={backLabel}
                    className="flex size-11 items-center justify-center rounded-full border border-border-default bg-surface-card text-brand-navy transition-colors hover:bg-navy-soft"
                  >
                    <Icon name="arrowBack" size={20} />
                  </button>
                ) : (
                  <span className="size-11" aria-hidden />
                )}
                <Logo mark />
                <span className="size-11" aria-hidden />
              </div>
              {header}
            </div>
          </header>
          <main className="flex flex-1 flex-col overflow-x-clip pb-36 lg:flex-none lg:pb-0">
            <div
              key={stepKey}
              data-testid="quiz-step"
              className={cn(
                "mx-auto w-full lg:max-w-none",
                wide ? "max-w-[48rem]" : "max-w-[32rem]",
                !reduced && "onb-step-in",
                !reduced && direction === "back" && "onb-step-back",
              )}
            >
              {band && (
                <div
                  data-testid="photo-band"
                  className={cn(
                    "relative w-full overflow-hidden bg-navy-soft sm:mt-2 sm:rounded-t-2xl lg:hidden",
                    bandSize === "compact"
                      ? "h-[28dvh] min-h-40 sm:h-[34dvh] sm:min-h-48"
                      : "h-[34dvh] min-h-48",
                  )}
                >
                  <AppImage
                    src={band}
                    alt=""
                    priority
                    sizes="(min-width: 640px) 32rem, 100vw"
                    className="absolute inset-0 size-full object-cover object-center"
                  />
                  <PhotoFade />
                </div>
              )}
              <div className={cn("px-5 sm:px-0 lg:pt-10 lg-short:pt-8", band ? "pt-5" : "pt-1")}>
                {children}
              </div>
            </div>
          </main>
          <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border-divider bg-surface-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 lg:sticky lg:mt-4 lg:border-t-0 lg:px-0 lg:py-4">
            <div className={cn("mx-auto flex w-full items-center gap-3 lg:max-w-none", wide ? "max-w-[48rem]" : "max-w-[32rem]")}>
              {actions}
            </div>
          </footer>
        </div>
      </form>
    </OnboardingSplit>
  );
}

/** Eyebrow + title + optional body (used on reveal/summary steps). */
export function StepIntro({
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
      <p className={cn("mt-2 type-section-title text-brand-navy", ONB_TYPE.body)}>{title}</p>
      {body && <p className={cn("mt-1 text-text-secondary", ONB_TYPE.body)}>{body}</p>}
    </div>
  );
}

/** Question heading with optional "Why we ask" line. */
export function QuestionHeading({
  title,
  eyebrow,
  why,
  helper,
  size = "display",
  headingRef,
  headingId,
  lineId,
}: {
  title: string;
  eyebrow?: string;
  why?: string;
  helper?: string;
  size?: "display" | "chapter";
  headingRef?: Ref<HTMLHeadingElement>;
  headingId?: string;
  lineId?: string;
}) {
  return (
    <div className="flex flex-col">
      {eyebrow && <p className="onb-eyebrow">{eyebrow}</p>}
      <h1
        ref={headingRef}
        id={headingId}
        tabIndex={-1}
        className={cn(
          "type-display text-brand-navy outline-none",
          eyebrow && ONB_SPACING.eyebrow,
          size === "display" ? ONB_TYPE.display : ONB_TYPE.chapter,
        )}
      >
        {title}
      </h1>
      {why && (
        <p
          id={lineId}
          data-testid="why-we-ask"
          className={cn(ONB_SPACING.line, "text-text-secondary", ONB_TYPE.body)}
        >
          <span className="type-section-title text-text-primary">Why we ask:</span> {why}
        </p>
      )}
      {!why && helper && (
        <p id={lineId} className={cn(ONB_SPACING.line, "text-text-secondary", ONB_TYPE.body)}>
          {helper}
        </p>
      )}
    </div>
  );
}

/** Two-option pill toggle (e.g. ft/in vs cm). `leftSelected` true selects the left option. */
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
  onChange: (leftSelected: boolean) => void;
  label: string;
}) {
  const reduced = useReducedMotion();
  const [touched, setTouched] = useState(false);
  return (
    <div role="group" aria-label={label} className="flex w-fit rounded-full bg-navy-soft p-1">
      {[
        { text: left, active: leftSelected, value: true },
        { text: right, active: !leftSelected, value: false },
      ].map((o) => (
        <button
          key={o.text}
          type="button"
          aria-pressed={o.active}
          onClick={() => {
            setTouched(true);
            onChange(o.value);
          }}
          className={cn(
            "flex h-11 min-w-20 items-center justify-center gap-1.5 rounded-full px-4",
            ONB_TYPE.body,
            !reduced && "transition-colors",
            o.active
              ? cn(SELECTED_CHIP, "type-button")
              : "type-button-secondary text-brand-navy hover:bg-surface-card",
          )}
        >
          {o.active && (
            <span className={cn("inline-flex", !reduced && touched && "onb-pop")}>
              <CheckMark size={14} />
            </span>
          )}
          {o.text}
        </button>
      ))}
    </div>
  );
}

/** "Example - tap to enter yours" ghost button. */
export function ExampleHint({ onPress, className }: { onPress: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full px-3 type-button-secondary text-text-secondary hover:bg-navy-soft",
        ONB_TYPE.meta,
        className,
      )}
    >
      <Icon name="pencilEdit" size={16} color="currentColor" />
      Example — tap to enter yours
    </button>
  );
}

/** Inline error / success banner. */
export function InlineMessage({
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
      <span className={cn("type-body text-text-primary", ONB_TYPE.body)}>{message}</span>
    </div>
  );
}

/** Small reassurance line with an icon (privacy notes). */
export function Reassurance({ children, icon = "lock" }: { children: ReactNode; icon?: IconName }) {
  return (
    <p className={cn("flex items-start gap-2.5 type-meta text-text-secondary", ONB_TYPE.meta)}>
      <span className="mt-0.5 shrink-0">
        <Icon name={icon} size={16} color="var(--color-brand-navy)" />
      </span>
      <span>{children}</span>
    </p>
  );
}

/** Label / value row with an Edit button (review step). */
export function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: ReactNode;
  onEdit?: () => void;
}) {
  return (
    <div className="flex min-h-14 items-center gap-3 border-b border-border-divider py-1.5 last:border-b-0">
      <span className="min-w-0 flex-1">
        <span className={cn("block type-meta text-text-secondary", ONB_TYPE.meta)}>{label}</span>
        <span className={cn("block type-item-title text-text-primary", ONB_TYPE.body)}>
          {value}
        </span>
      </span>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${label}`}
          className={cn(
            "-mr-2 flex h-11 items-center rounded-full px-3 type-button text-primary hover:bg-primary-soft",
            ONB_TYPE.body,
          )}
        >
          Edit
        </button>
      )}
    </div>
  );
}

/** Icon + label + value + unit stat (reveal step). */
export function StatTile({
  icon,
  label,
  value,
  unit,
}: {
  icon: IconName;
  label: string;
  value: ReactNode;
  unit: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span
        aria-hidden
        className={cn("flex size-9 items-center justify-center rounded-full", ICON_WELL)}
      >
        <Icon name={icon} size={18} color="currentColor" />
      </span>
      <span className={cn("type-meta text-text-secondary", ONB_TYPE.meta)}>{label}</span>
      <span className="flex items-baseline gap-x-0.5 whitespace-nowrap">
        <span className={cn("type-row-figure tabular-nums text-brand-navy", ONB_TYPE.body)}>
          {value}
        </span>
        <span className={cn("type-meta text-text-secondary", ONB_TYPE.meta)}>{unit}</span>
      </span>
    </div>
  );
}
