import { createElement } from "react";
import { ICON_DATA, type IconName } from "./iconData";

export interface IconProps {
  name: IconName;
  /** Pixel size (width = height). */
  size?: number;
  /** Any CSS color, e.g. `var(--color-primary)`; defaults to `currentColor`. */
  color?: string;
  strokeWidth?: number;
  className?: string;
  /** When set the icon becomes an `img` with this accessible label. */
  title?: string;
}

/** Hugeicons stroke-rounded icon set, ported from the deployed build. */
export function Icon({
  name,
  size = 20,
  color = "currentColor",
  strokeWidth = 1.5,
  className,
  title,
}: IconProps) {
  const nodes = ICON_DATA[name] ?? [];
  return createElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      color,
      className,
      strokeWidth,
      stroke: "currentColor",
      "aria-hidden": !title || undefined,
      "aria-label": title,
      role: title ? "img" : undefined,
    },
    nodes.map(([tag, attrs], i) =>
      createElement(tag, { ...attrs, strokeWidth, stroke: "currentColor", key: i }),
    ),
  );
}
