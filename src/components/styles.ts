/**
 * Shared Tailwind class strings from the deployed build. Import instead of
 * re-typing so screens stay visually identical.
 */

/** Selected chip / toggle button. */
export const SELECTED_CHIP = "border-transparent bg-selected text-on-selected";
/** Unselected chip / toggle button. */
export const UNSELECTED_CHIP = "border-border-default bg-white text-text-primary";
/** Switch track when on. */
export const SWITCH_ON = "bg-control-on";
/** Bordered control when on. */
export const CONTROL_ON = "border-control-on bg-control-on";
/** Round icon well. */
export const ICON_WELL = "bg-icon-well text-icon-well-ink";
/** Positive (teal) chip. */
export const POSITIVE = "bg-positive text-positive-ink";
export const PRIMARY_DISABLED =
  "disabled:cursor-not-allowed disabled:bg-primary-soft disabled:text-text-secondary";
export const OUTLINE_DISABLED =
  "disabled:cursor-not-allowed disabled:border-border-divider disabled:text-text-neutral-500";

/** Rounded pill surface used by search fields. */
export const PILL =
  "rounded-full border border-border-default bg-white motion-safe:transition motion-safe:duration-150 hover:border-text-neutral-400";

/** Page H1 (24px mobile, 28px md+). */
export const PAGE_TITLE =
  "type-display text-brand-navy text-[24px] leading-[1.15] tracking-[-1.08px] md:text-[28px] md:tracking-[-1.26px]";
export const META_TEXT = "type-meta text-[13px] tracking-[-0.3px] text-text-secondary";
export const SECTION_TITLE =
  "type-section-title text-[18px] leading-6 tracking-[-0.81px] text-brand-navy";
export const LINK_ACTION =
  "tap-24 tap-44 relative shrink-0 gap-0.5 type-button text-[13px] tracking-[-0.4px] text-primary hover:underline underline-offset-2";

/** Onboarding typography scale (from the deployed `type` chunk). */
export const ONB_TYPE = {
  display: "text-onb-display lg:text-onb-display-lg lg-short:text-onb-display",
  chapter: "text-onb-chapter lg:text-onb-chapter-lg",
  photo: "text-onb-photo sm:text-onb-photo-sm",
  hero: "text-onb-hero lg:text-onb-hero-lg",
  body: "text-onb-body",
  meta: "text-onb-meta",
} as const;

/** Vertical rhythm tokens used across the onboarding quiz. */
export const ONB_SPACING = {
  eyebrow: "mt-2",
  line: "mt-3",
  control: "mt-6",
  notes: "mt-4",
  notesGap: "gap-4",
  stack: "gap-3",
  options: "gap-2.5",
  siblings: "gap-4",
} as const;

/** framer-motion transitions. */
export const SPRING_SNAPPY = { type: "spring", stiffness: 500, damping: 30 } as const;
export const SPRING_SOFT = { type: "spring", stiffness: 400, damping: 22 } as const;
export const NO_MOTION = { duration: 0 } as const;
