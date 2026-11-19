import { ICONS, type IconName } from "./icons";

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

/** Lucide icon set, mapped by the same names as the deployed build. */
export function Icon({
  name,
  size = 20,
  color = "currentColor",
  strokeWidth = 1.75,
  className,
  title,
}: IconProps) {
  const Glyph = ICONS[name];
  return (
    <Glyph
      focusable="false"
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden={!title || undefined}
      aria-label={title}
      role={title ? "img" : undefined}
    />
  );
}
