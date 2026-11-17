"use client";

import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { CheckMark } from "@/components/Layout";
import { SELECTED_CHIP, UNSELECTED_CHIP } from "@/components/styles";

/** Meal-category options for recipe browsing. `category` matches `Recipe.category`. */
export const MEAL_CATEGORIES: { category: string | null; label: string; icon: IconName }[] = [
  { category: null, label: "All", icon: "riceBowl" },
  { category: "breakfast", label: "Breakfast", icon: "categoryBreakfast" },
  { category: "lunch", label: "Lunch", icon: "categoryLunch" },
  { category: "dinner", label: "Dinner", icon: "categoryDinner" },
  { category: "snack", label: "Snacks", icon: "apple" },
  { category: "dessert", label: "Desserts", icon: "categoryDessert" },
];

/** Single-select meal category chips (icon or pill variant). */
export function CategoryChips({
  selected,
  onSelect,
  label = "Filter by meal category",
  variant = "icons",
}: {
  selected: string | null;
  onSelect: (category: string | null) => void;
  label?: string;
  variant?: "icons" | "pills";
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="rail-scroll -mx-5 flex gap-2 overflow-x-auto px-5 py-2.5 md:mx-0 md:px-0"
    >
      {MEAL_CATEGORIES.map((c) => {
        const on = c.category === selected;
        return (
          <button
            key={c.label}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(c.category)}
            className={cn(
              "tap-44 relative flex h-9 shrink-0 items-center gap-1.5 rounded-full border text-[17px] transition-colors duration-200",
              variant === "pills" ? "px-4 tracking-[-0.63px]" : "pl-2.5 pr-3.5 tracking-[-0.585px]",
              on
                ? SELECTED_CHIP
                : variant === "pills"
                  ? UNSELECTED_CHIP
                  : "border-border-default bg-white text-text-primary hover:border-text-neutral-400",
              on ? "type-button" : "type-button-secondary",
            )}
          >
            {variant === "icons" && (
              <Icon
                name={c.icon}
                size={16}
                color={on ? "var(--color-on-selected)" : "var(--color-primary)"}
              />
            )}
            {on && <CheckMark size={variant === "pills" ? 14 : 11} />}
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---- facet-group helpers (single-select-per-group filtering) ---- */

/** Which group of `groups` (name -> values) contains `value`; "__other" when none. */
export const groupOf = (groups: Record<string, string[]>, value: string) =>
  Object.keys(groups).find((g) => groups[g].includes(value)) ?? "__other";

/**
 * AND across groups, OR within a group: does `itemTags` satisfy every group
 * that has a selected value in `selected`?
 */
export const matchesGroups = (
  groups: Record<string, string[]>,
  selected: string[],
  itemTags: string[],
) => {
  const byGroup = new Map<string, string[]>();
  for (const s of selected) {
    const g = groupOf(groups, s);
    byGroup.set(g, [...(byGroup.get(g) ?? []), s]);
  }
  for (const wanted of byGroup.values()) {
    if (!wanted.some((w) => itemTags.includes(w))) return false;
  }
  return true;
};

/** Toggle a value in single-select-per-group mode (replaces others in the same group). */
export const replaceInGroup = (
  groups: Record<string, string[]>,
  selected: string[],
  value: string,
) => [...selected.filter((s) => groupOf(groups, s) !== groupOf(groups, value)), value];
