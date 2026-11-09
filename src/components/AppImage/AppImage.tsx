"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";

const WIDTHS = [640, 1024, 1600] as const;

/** Local image basenames (no extension) get the responsive webp treatment. */
const isLocalBase = (src: string) => src.startsWith("/img/") && !/\.\w{3,4}$/.test(src);

export interface AppImageProps {
  /**
   * Either a local base path such as `/img/food-cards-v2/01-chicken-bowl`
   * (rendered as `${base}-{640|1024|1600}.webp` with a srcSet) or any full URL
   * (rendered as-is, e.g. an API `imageUrl`).
   */
  src?: string | null;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
}

/**
 * Responsive webp image with a neutral placeholder if it fails to load (or has
 * no src).
 */
export function AppImage({
  src,
  alt,
  sizes = "100vw",
  className,
  priority = false,
}: AppImageProps) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) {
    return (
      <div
        data-testid="app-image-placeholder"
        role="img"
        aria-label={alt}
        className={cn("flex items-center justify-center bg-brand-warm-gray", className)}
      >
        <Icon name="image" size={20} color="var(--color-text-neutral-400)" />
      </div>
    );
  }
  const local = isLocalBase(src);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-optimised static webp set, remote URLs are arbitrary
    <img
      src={local ? `${src}-1024.webp` : src}
      srcSet={local ? WIDTHS.map((w) => `${src}-${w}.webp ${w}w`).join(", ") : undefined}
      sizes={local ? sizes : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={className}
      onError={() => setFailed(src)}
    />
  );
}
