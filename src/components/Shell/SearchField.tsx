"use client";

import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { PILL } from "@/components/styles";

const SIZES = {
  sm: { box: "h-10", text: "text-[14px]", icon: 15, pad: "pl-3.5" },
  md: { box: "h-11", text: "text-sm", icon: 16, pad: "pl-3.5" },
  lg: { box: "h-12", text: "text-[14px]", icon: 18, pad: "pl-4" },
} as const;

export interface SearchFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "size"
> {
  /** Accessible label (visually hidden). */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Custom clear handler; `false` hides the clear button. */
  onClear?: (() => void) | false;
  size?: keyof typeof SIZES;
  className?: string;
  inputClassName?: string;
  trailing?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
}

/** Pill search input with search icon and clear button. */
export function SearchField({
  label,
  value,
  onChange,
  onClear,
  size = "md",
  className,
  inputClassName,
  trailing,
  inputRef,
  id,
  ...rest
}: SearchFieldProps) {
  const s = SIZES[size];
  const clear = onClear === false ? undefined : (onClear ?? (() => onChange("")));
  return (
    <div
      className={cn(
        PILL,
        "flex min-w-0 items-center gap-2 pr-1",
        "focus-within:border-focus focus-within:ring-[3px] focus-within:ring-focus/15 focus-within:hover:border-focus",
        s.box,
        s.pad,
        className,
      )}
    >
      <span aria-hidden className="flex shrink-0">
        <Icon name="search" size={s.icon} color="var(--color-text-secondary)" />
      </span>
      <label className="flex min-w-0 flex-1 self-stretch">
        <span className="sr-only">{label}</span>
        <input
          id={id}
          ref={inputRef}
          type={rest.role === "combobox" ? "text" : "search"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "min-w-0 flex-1 bg-transparent pr-2 type-meta text-text-primary outline-none placeholder:text-text-neutral-400",
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
            s.text,
            inputClassName,
          )}
          {...rest}
        />
      </label>
      {clear && value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={clear}
          className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-icon-well focus-visible:outline-2 focus-visible:outline-focus"
        >
          <Icon name="close" size={14} color="var(--color-text-secondary)" />
        </button>
      )}
      {trailing}
    </div>
  );
}
