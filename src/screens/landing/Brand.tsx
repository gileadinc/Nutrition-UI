import { cn } from "@/lib/utils";

/** Orange ForkThis! mark (cropped from the design) plus a light wordmark with an orange "!". */
export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- small static brand asset */}
      <img src="/img/landing/logo.webp" alt="" width={36} height={36} className="size-9" />
      <span className="text-xl type-body tracking-tight">
        ForkThis<span className="text-accent">!</span>
      </span>
    </span>
  );
}
