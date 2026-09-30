import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AppImage } from "@/components/AppImage";

/**
 * Composable food card. Usage:
 *
 *   <ProductCard>
 *     <ProductCardImage src="/img/..." sizes="252px" />
 *     <ProductCardContent>
 *       <ProductCardTitle>..</ProductCardTitle>
 *       <ProductCardSubtitle>..</ProductCardSubtitle>
 *       <ProductCardMetric>..</ProductCardMetric>
 *     </ProductCardContent>
 *   </ProductCard>
 *
 * Most screens should use the higher-level <FoodCard>.
 */
export function ProductCard({
  className,
  elevated = true,
  children,
  ...rest
}: { elevated?: boolean } & ComponentPropsWithoutRef<"article">) {
  return (
    <article
      data-slot="product-card"
      className={cn(
        "group/card relative flex flex-col overflow-hidden rounded-[18px] border border-border-default/[0.82] bg-white",
        elevated &&
          "shadow-food-card motion-safe:transition-shadow motion-safe:duration-300 hover:shadow-card-hover has-[a:focus-visible]:shadow-card-hover",
        className,
      )}
      {...rest}
    >
      {children}
    </article>
  );
}

export function ProductCardImage({
  src,
  sizes,
  className,
  imageClassName,
  children,
}: {
  src?: string | null;
  sizes?: string;
  className?: string;
  imageClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-slot="product-card-image"
      className={cn("relative shrink-0 overflow-hidden bg-brand-warm-gray", className)}
    >
      <AppImage
        src={src}
        alt=""
        sizes={sizes}
        className={cn(
          "size-full object-cover",
          "motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out",
          "motion-safe:group-hover/card:scale-[1.04] motion-safe:group-has-[a:focus-visible]/card:scale-[1.04]",
          imageClassName,
        )}
      />
      {children}
    </div>
  );
}

export function ProductCardBadge({
  position = "start",
  className,
  children,
}: {
  position?: "start" | "end";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      data-slot="product-card-badge"
      className={cn(
        "absolute top-[10px] flex h-[22px] items-center rounded-full px-2 text-[11px] type-meta leading-none tracking-[-0.495px]",
        position === "start" ? "left-[10px]" : "right-[10px]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProductCardContent({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-slot="product-card-content"
      className={cn("flex min-h-0 flex-1 flex-col bg-white", className)}
    >
      {children}
    </div>
  );
}

export function ProductCardTitle({
  as: Tag = "h3",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Tag
      data-slot="product-card-title"
      className={cn("line-clamp-2 type-item-title text-text-primary", className)}
    >
      {children}
    </Tag>
  );
}

export function ProductCardSubtitle({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <p
      data-slot="product-card-subtitle"
      className={cn("truncate type-meta text-text-neutral-400", className)}
    >
      {children}
    </p>
  );
}

export function ProductCardMetric({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <p
      data-slot="product-card-metric"
      className={cn("min-w-0 truncate type-meta text-brand-navy", className)}
    >
      {children}
    </p>
  );
}
