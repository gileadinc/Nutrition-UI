import { AppImage } from "@/components/AppImage";
import { Icon } from "@/components/Icon";

/** Restaurant logo images shipped in /public/img/restaurants. */
const RESTAURANT_LOGOS: Record<string, string> = {
  Chipotle: "/img/restaurants/chipotle",
  "Domino's": "/img/restaurants/dominos",
  Sweetgreen: "/img/restaurants/sweetgreen",
  "Chick-fil-A": "/img/restaurants/chick-fil-a",
  "Panera Bread": "/img/restaurants/panera-bread",
};

/** Restaurants shown as a single letter tile. */
const RESTAURANT_LETTERS: Record<string, string> = { Subway: "S" };

/** True when we have a brand mark for this restaurant name. */
export const hasBrandMark = (name: string) =>
  name in RESTAURANT_LOGOS || name in RESTAURANT_LETTERS;

const TILE =
  "flex size-[22px] shrink-0 items-center justify-center overflow-hidden rounded-[7px] border border-border-default bg-white";
const TILE_LG =
  "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-default bg-white";

/** 22px restaurant logo tile. Renders nothing for unknown restaurants. */
export function BrandMark({
  restaurant,
  initialFallback = false,
  size = "sm",
}: {
  restaurant: string;
  /** `lg` = 40px tile (Fast Hacks cards). */
  size?: "sm" | "lg";
  /** Show the site's restaurant icon when there is no logo on file. */
  initialFallback?: boolean;
}) {
  const logo = RESTAURANT_LOGOS[restaurant];
  const letter = RESTAURANT_LETTERS[restaurant];
  const large = size === "lg";
  const tile = large ? TILE_LG : TILE;
  if (logo) {
    return (
      <span
        title={restaurant}
        data-testid={`restaurant-brand-mark-${restaurant}`}
        className={`${tile} ${large ? "p-1" : "p-[3px]"}`}
      >
        <AppImage
          src={logo}
          alt=""
          sizes={large ? "44px" : "22px"}
          className="size-full object-contain"
        />
      </span>
    );
  }
  if (letter) {
    return (
      <span
        title={restaurant}
        data-testid={`restaurant-brand-mark-${restaurant}`}
        className={`${tile} ${large ? "text-[18px]" : "text-[12px]"} type-meta leading-none text-text-secondary`}
      >
        {letter}
      </span>
    );
  }
  if (initialFallback) {
    return (
      <span title={restaurant} data-testid={`restaurant-brand-mark-${restaurant}`} className={tile}>
        <Icon name="restaurant" size={large ? 20 : 14} color="var(--color-text-secondary)" />
      </span>
    );
  }
  return null;
}
