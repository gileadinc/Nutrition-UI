"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Link } from "@/lib/nav";
import { fallbackFoodImage } from "@/lib/foodImages";
import { BrandMark, hasBrandMark } from "./BrandMark";
import { SaveHeartButton } from "./SaveHeartButton";
import {
  ProductCard,
  ProductCardBadge,
  ProductCardContent,
  ProductCardImage,
  ProductCardMetric,
  ProductCardSubtitle,
  ProductCardTitle,
} from "./ProductCard";
import { type Fit } from "@/lib/nutrition/budget";

export interface FoodCardProps {
  /** Local image base or full URL. */
  image?: string | null;
  title: string;
  subtitle?: string;
  /** Metric line, e.g. "520 kcal · 42g protein". */
  meta: ReactNode;
  /** Right-aligned pill, or a restaurant name that has a brand mark (shown as a logo instead). */
  badge?: string;
  /** White badge over the image (top-left). */
  leadingBadge?: string;
  brandName?: string;
  saved?: boolean;
  /** Provide to show the save heart. */
  onSave?: () => void;
  to: string;
  /** Result of `fitFor()`; shows the fits badge when it fits. */
  fit?: Fit;
  /** `rail` = fixed 252px carousel card, `grid` = fills its cell, `compact` = short grid card,
   * `discover` = 4:3 photo, heart top-right and a 40px restaurant logo (Fast Hacks). */
  layout?: "rail" | "grid" | "compact" | "discover";
}

/** The standard recipe / hack / order card used on Home, Recipes, Fast Hacks, Search, Saved. */
export function FoodCard({
  image,
  title,
  subtitle,
  meta,
  badge,
  leadingBadge,
  brandName,
  saved,
  onSave,
  to,
  fit,
  layout = "rail",
}: FoodCardProps) {
  const brand = brandName ?? (badge && hasBrandMark(badge) ? badge : undefined);
  // A named restaurant always gets a mark (logo, or its initial); the text pill is for non-restaurant badges.
  const pill = brand ? undefined : badge;
  if (layout === "discover") {
    // Only restaurants we have a mark for get the large logo tile; anything else shows the text pill.
    const logoFor = brandName && hasBrandMark(brandName) ? brandName : undefined;
    return (
      <ProductCard className="h-full w-full">
        <Link
          to={to}
          className="flex min-h-0 flex-1 flex-col rounded-[18px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
        >
          <ProductCardImage
            src={image || fallbackFoodImage(title)}
            fit="contain"
            imageClassName="h-[94%] w-[94%]"
            sizes="(min-width: 1280px) 22rem, (min-width: 768px) 20rem, 252px"
            className="aspect-[4/3]"
          >
            {leadingBadge && (
              <ProductCardBadge className="border border-text-primary/[0.08] bg-white text-text-primary">
                {leadingBadge}
              </ProductCardBadge>
            )}
            {fit && fit.kind !== "over" && (
              <ProductCardBadge position="end" className="bg-positive text-positive-ink">
                Fits today
              </ProductCardBadge>
            )}
          </ProductCardImage>
          <span className="flex min-w-0 flex-1 flex-col justify-between gap-2 px-[14px] pb-3 pt-[12px]">
            <span className="min-w-0">
              <h3
                className={cn(
                  "type-item-title text-[15px] leading-[1.5] tracking-[-0.5px] text-text-primary",
                  onSave && "pr-8",
                )}
              >
                {title}
              </h3>
              {subtitle && (
                <span className="mt-1 block text-[12px] type-meta text-text-secondary">
                  {subtitle}
                </span>
              )}
            </span>
            <span className="mb-1.5 flex items-center gap-2">
              {logoFor && <BrandMark restaurant={logoFor} size="lg" initialFallback />}
              <span className="min-w-0 flex-1 text-[12px] type-row-figure tabular-nums text-text-primary">
                {meta}
              </span>
              {badge && !logoFor && (
                <span className="shrink-0 rounded-full border border-primary/[0.08] bg-navy-50 px-2 py-0.5 text-[12px] type-meta text-primary">
                  {badge}
                </span>
              )}
            </span>
          </span>
        </Link>
        {onSave && (
          <SaveHeartButton
            pressed={!!saved}
            onToggle={onSave}
            label={saved ? `Remove ${title} from saved` : `Save ${title}`}
            title={saved ? "Remove from saved" : "Save"}
            className="absolute right-[10px] top-[10px]"
          />
        )}
      </ProductCard>
    );
  }
  return (
    <ProductCard
      className={cn(
        layout === "rail" &&
          "h-[314px] w-[252px] shrink-0 [--image-h:214px] md:h-auto md:w-auto md:[--image-h:224px]",
        layout === "grid" && "h-full w-full [--image-h:188px]",
        layout === "compact" && "h-[248px] w-full [--image-h:168px]",
      )}
    >
      <Link
        to={to}
        className="flex min-h-0 flex-1 flex-col rounded-[18px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      >
        <ProductCardImage
          src={image || fallbackFoodImage(title)}
          sizes="(min-width: 1280px) 22rem, (min-width: 768px) 20rem, 252px"
          className="h-[var(--image-h)]"
        >
          {leadingBadge && (
            <ProductCardBadge className="border border-text-primary/[0.08] bg-white text-text-primary">
              {leadingBadge}
            </ProductCardBadge>
          )}
          {fit && fit.kind !== "over" && (
            <ProductCardBadge position="end" className="bg-positive text-positive-ink">
              Fits today
            </ProductCardBadge>
          )}
        </ProductCardImage>
        <ProductCardContent className="border-t border-border-default/70 px-[14px] pb-[10px] pt-[11px]">
          <ProductCardTitle
            className={cn("text-[15px] leading-[1.1] tracking-[-0.675px]", onSave && "pr-7")}
          >
            {title}
          </ProductCardTitle>
          {subtitle && (
            <ProductCardSubtitle className="mt-1 text-[12px] tracking-[-0.495px]">
              {subtitle}
            </ProductCardSubtitle>
          )}
          <div className="mt-auto flex items-center pt-2">
            {brand && (
              <span className="mr-[7px]">
                <BrandMark restaurant={brand} initialFallback />
              </span>
            )}
            <ProductCardMetric className="flex-1 text-[12px] leading-[1.1] tracking-[-0.5175px]">
              {meta}
            </ProductCardMetric>
            {pill && (
              <span className="ml-[7px] flex h-[22px] shrink-0 items-center rounded-full border border-primary/[0.08] bg-navy-50 px-2 text-[12px] type-meta leading-none tracking-[-0.495px] text-primary">
                {pill}
              </span>
            )}
          </div>
        </ProductCardContent>
      </Link>
      {onSave && (
        <SaveHeartButton
          pressed={!!saved}
          onToggle={onSave}
          label={saved ? `Remove ${title} from saved` : `Save ${title}`}
          title={saved ? "Remove from saved" : "Save"}
          className="absolute right-[10px] top-[calc(var(--image-h)-18px)]"
        />
      )}
    </ProductCard>
  );
}
