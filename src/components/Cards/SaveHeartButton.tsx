"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { useReducedMotion } from "@/lib/hooks";
import { SPRING_SNAPPY } from "@/components/styles";

/** Round white heart toggle (saved / not saved) with a tap + pop animation. */
export function SaveHeartButton({
  pressed,
  onToggle,
  label,
  title,
  size = 17,
  className,
}: {
  pressed: boolean;
  onToggle: () => void;
  label: string;
  title?: string;
  size?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-pressed={pressed}
      aria-label={label}
      title={title}
      whileTap={reduced ? undefined : { scale: 0.86 }}
      transition={SPRING_SNAPPY}
      className={cn(
        "tap-44 relative flex size-9 items-center justify-center rounded-full bg-white shadow-card",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        pressed ? "text-primary" : "text-text-neutral-400 hover:text-text-secondary",
        className,
      )}
    >
      <motion.span
        aria-hidden
        className="flex"
        initial={false}
        animate={pressed && !reduced ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <Icon
          name="heart"
          size={size}
          color="currentColor"
          className={cn(pressed && "[&_path]:fill-current")}
        />
      </motion.span>
    </motion.button>
  );
}
