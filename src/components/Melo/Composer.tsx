"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";

const MAX_LINES = 5;

function autosize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  const cs = getComputedStyle(el);
  const line = parseFloat(cs.lineHeight) || 24;
  const pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  const max = line * MAX_LINES + pad;
  if (el.scrollHeight > 0) el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
}

/** Message box: Enter sends, Shift+Enter adds a line. */
export function MeloComposer({
  onSend,
  disabled,
  placeholder,
  autoFocus,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const canSend = !!value.trim() && !disabled;
  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    setValue("");
    if (ref.current) {
      ref.current.style.height = "";
      ref.current.style.overflowY = "hidden";
    }
    onSend(text);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        data-slot="melo-composer"
        data-state={disabled ? "sending" : "idle"}
        className="flex flex-wrap items-end rounded-[22px] border-[1.5px] border-border-default bg-white transition-colors focus-within:border-primary"
      >
        <textarea
          ref={ref}
          aria-label="Ask Melo"
          rows={1}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            autosize(e.target);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="block min-h-12 min-w-0 flex-1 resize-none bg-transparent py-3 pl-4 pr-1 text-base leading-6 text-text-primary placeholder:text-text-neutral-400 placeholder:type-meta focus:outline-none md:basis-full md:pb-1 md:pr-4 md:text-[15px]"
        />
        <div className="flex shrink-0 items-center gap-2 p-[3px] md:w-full md:pb-1.5 md:pl-4 md:pr-1.5 md:pt-0">
          <p
            aria-hidden="true"
            className="hidden min-w-0 flex-1 truncate text-[11px] type-meta text-text-neutral-500 md:block"
          >
            Enter to send · Shift + Enter for a new line
          </p>
          <button
            type="submit"
            aria-label="Send message"
            disabled={!canSend}
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {disabled ? (
              <span aria-hidden="true" className="flex items-center gap-0.5">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="size-1 rounded-full bg-current motion-safe:animate-[melo-dot_1.1s_ease-in-out_infinite]"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </span>
            ) : (
              <Icon name="arrowUpSmall" size={20} color="currentColor" strokeWidth={2} />
            )}
          </button>
        </div>
      </form>
      <p className="text-center text-[11px] type-meta leading-4 text-text-secondary">
        Melo suggests; you decide what to log.
      </p>
    </div>
  );
}
