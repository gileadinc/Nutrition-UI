import { cn } from "@/lib/utils";

/** Bottom (or full-height "copy") blur + wash overlay used on hero photos. */
export function PhotoFade({
  variant = "photo",
  className,
}: {
  variant?: "photo" | "copy";
  className?: string;
}) {
  return (
    <div
      aria-hidden
      data-testid="photo-fade"
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0",
        variant === "photo" ? "h-1/2" : "top-0 photo-fade-copy",
        className,
      )}
    >
      <div className="photo-fade-blur absolute inset-0" />
      <div className="photo-fade-wash absolute inset-0" />
    </div>
  );
}
