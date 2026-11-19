"use client";

import { AppImage } from "@/components/AppImage";
import { fallbackFoodImage } from "@/lib/foodImages";

/** Round food photo used in compact lists (falls back to a plate photo). */
export function FoodThumb({
  src,
  seed,
  size = 44,
}: {
  src?: string | null;
  seed: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className="relative shrink-0 overflow-hidden rounded-full bg-white"
      style={{ width: size, height: size }}
    >
      <AppImage
        src={src || fallbackFoodImage(seed)}
        alt=""
        sizes={`${size}px`}
        className="absolute inset-0 size-full object-cover"
      />
    </span>
  );
}
