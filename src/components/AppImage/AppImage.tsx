const WIDTHS = [640, 1024, 1600] as const;

export interface AppImageProps {
  /** Local base path without extension, e.g. `/img/auth/login-hero` → `-{640|1024|1600}.webp`. */
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
}

/** Responsive webp image from a pre-generated 640/1024/1600 set. */
export function AppImage({ src, alt, sizes = "100vw", className, priority = false }: AppImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-optimised static webp set
    <img
      src={`${src}-1024.webp`}
      srcSet={WIDTHS.map((w) => `${src}-${w}.webp ${w}w`).join(", ")}
      sizes={sizes}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={className}
    />
  );
}
