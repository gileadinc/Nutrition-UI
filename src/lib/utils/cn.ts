import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** Font-weight-carrying typography utilities defined in globals.css. */
const TYPE_CLASSES = [
  "type-display",
  "type-numeral",
  "type-section-title",
  "type-item-title",
  "type-row-figure",
  "type-button",
  "type-button-secondary",
  "type-eyebrow",
  "type-body",
  "type-supporting",
  "type-unit",
  "type-meta",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: { "font-weight": TYPE_CLASSES },
    theme: {
      text: [
        "onb-display",
        "onb-display-lg",
        "onb-hero",
        "onb-hero-lg",
        "onb-chapter",
        "onb-chapter-lg",
        "onb-photo",
        "onb-photo-sm",
        "onb-body",
        "onb-meta",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
