"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";

export interface AppTextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password" | "tel" | "number";
  placeholder?: string;
  error?: string | null;
  hint?: string;
  autoComplete?: string;
  className?: string;
}

/** Floating-label text field with error/hint text and a password reveal toggle. */
export function AppTextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  hint,
  autoComplete,
  className,
}: AppTextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && revealed ? "text" : type;
  const raised = focused || value.length > 0;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        className={cn(
          "relative h-14 rounded-2xl border bg-white",
          "motion-safe:transition motion-safe:duration-150",
          error
            ? "border-error-red focus-within:ring-[3px] focus-within:ring-error-red/15"
            : "border-border-default hover:border-text-neutral-400 focus-within:border-focus focus-within:ring-[3px] focus-within:ring-focus/15 focus-within:hover:border-focus",
        )}
      >
        <input
          id={id}
          type={inputType}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "peer absolute inset-0 size-full rounded-2xl bg-transparent px-4 pb-1.5 pt-[22px] text-sm leading-5 text-text-primary",
            "outline-none placeholder:text-transparent focus:placeholder:text-text-neutral-400 placeholder:type-meta",
            isPassword && "pr-12",
          )}
        />
        <label
          htmlFor={id}
          data-raised={raised || undefined}
          className={cn(
            "pointer-events-none absolute left-4 top-[18px] origin-top-left truncate text-sm type-item-title leading-5",
            "motion-safe:transition-[translate,scale,color] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.34,1.4,0.64,1)]",
            "peer-autofill:-translate-y-[10px] peer-autofill:scale-[0.8]",
            raised && "-translate-y-[10px] scale-[0.8]",
            isPassword ? "max-w-[calc(100%-4.5rem)]" : "max-w-[calc(100%-2rem)]",
            error ? "text-error-red" : focused ? "text-primary" : "text-text-secondary",
          )}
        >
          {label}
        </label>
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Hide password" : "Show password"}
            className="absolute right-1.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-focus"
          >
            <Icon
              name={revealed ? "eyeOff" : "eye"}
              size={20}
              color="var(--color-text-secondary)"
            />
          </button>
        )}
      </div>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 px-1 text-xs type-meta text-error-red"
        >
          <Icon name="alert" size={14} color="currentColor" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="px-1 type-meta text-xs text-text-secondary">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
