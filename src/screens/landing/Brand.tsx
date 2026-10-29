import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

/** Orange fork-and-spoon tile plus a light "ForkThis!" wordmark with an orange "!". */
export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-xl bg-accent text-on-accent"
      >
        <Icon name="forkSpoon" size={20} />
      </span>
      <span className="text-xl type-body tracking-tight">
        ForkThis<span className="text-accent">!</span>
      </span>
    </span>
  );
}
