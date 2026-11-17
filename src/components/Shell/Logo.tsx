import { cn } from "@/lib/utils";

const SIZES = {
  sm: {
    gap: "gap-2.5",
    tile: "size-9 rounded-xl",
    letter: "text-onb-meta",
    wordmark: "text-base type-display",
  },
  md: {
    gap: "gap-2.5",
    tile: "size-10 rounded-xl",
    letter: "text-base",
    wordmark: "text-lg type-numeral",
  },
  lg: {
    gap: "gap-3",
    tile: "size-11 rounded-xl",
    letter: "text-lg",
    wordmark: "text-xl type-numeral",
  },
  xl: {
    gap: "gap-4",
    tile: "size-21 rounded-3xl",
    letter: "text-4xl",
    wordmark: "text-3xl type-numeral",
  },
} as const;

/** ForkThis! logo: "F!" tile plus wordmark. `mark` = tile only. `decorative` hides it from AT. */
export function Logo({
  size = "sm",
  stacked = false,
  tagline = false,
  decorative = false,
  mark = false,
  className,
}: {
  size?: keyof typeof SIZES;
  stacked?: boolean;
  tagline?: boolean;
  decorative?: boolean;
  mark?: boolean;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span
      data-testid="logo"
      aria-hidden={decorative || undefined}
      role={mark && !decorative ? "img" : undefined}
      aria-label={mark && !decorative ? "ForkThis!" : undefined}
      className={cn(
        "flex text-brand-navy",
        stacked ? "flex-col items-center" : "items-center",
        s.gap,
        className,
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center bg-primary [text-shadow:none]",
          s.tile,
        )}
      >
        <span data-logotype className={cn("type-numeral text-on-primary", s.letter)}>
          F!
        </span>
      </span>
      {!mark && (
        <span className="flex min-w-0 flex-col">
          <span className={cn("tracking-tight", s.wordmark)}>ForkThis!</span>
          {tagline && (
            <span className="text-xs type-meta text-text-secondary">
              Food Delivery &amp; Cooking Companion
            </span>
          )}
        </span>
      )}
    </span>
  );
}
