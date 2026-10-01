"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { VOICE_MESSAGES, listen, useCanRecognize, type Listener } from "@/lib/melo";

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

function Levels() {
  return (
    <span aria-hidden="true" className="flex h-3.5 items-center gap-[3px]">
      {[
        [0, "h-2"],
        [180, "h-3.5"],
        [360, "h-2.5"],
        [540, "h-3"],
      ].map(([d, h]) => (
        <span
          key={d}
          className={cn(
            "w-[3px] origin-center rounded-full bg-control-on motion-safe:animate-[melo-level_900ms_ease-in-out_infinite]",
            h as string,
          )}
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </span>
  );
}

/** Message box: Enter sends, Shift+Enter adds a line, mic dictates (when the browser supports it). */
export function MeloComposer({
  onSend,
  disabled,
  placeholder,
  autoFocus,
}: {
  onSend: (text: string, opts?: { viaVoice?: boolean }) => void;
  disabled: boolean;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const micSupported = useCanRecognize();
  const ref = useRef<HTMLTextAreaElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const rec = useRef<Listener | null>(null);
  const viaVoice = useRef(false);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  useEffect(
    () => () => {
      rec.current?.abort();
      rec.current = null;
    },
    [],
  );
  useEffect(() => {
    const el = ref.current;
    if (el && el.value === value) autosize(el);
  }, [value]);

  const canSend = !!value.trim() && !disabled && !listening;
  const submit = () => {
    const text = value.trim();
    if (!text || disabled || listening) return;
    const voice = viaVoice.current;
    viaVoice.current = false;
    setValue("");
    setNote(null);
    if (ref.current) {
      ref.current.style.height = "";
      ref.current.style.overflowY = "hidden";
    }
    onSend(text, { viaVoice: voice });
  };

  const start = () => {
    setNote(null);
    const base = value.trim();
    let ended = false;
    const l = listen({
      onTranscript: (t) => {
        if (t) {
          viaVoice.current = true;
          setValue(base ? `${base} ${t}` : t);
        }
      },
      onEnd: (_reason, error) => {
        ended = true;
        rec.current = null;
        setListening(false);
        setStatus("Stopped listening");
        if (error) setNote(VOICE_MESSAGES[error]);
        const active = document.activeElement;
        if (!active || active === document.body || form.current?.contains(active)) ref.current?.focus();
      },
    });
    ref.current?.focus();
    if (l && !ended) {
      rec.current = l;
      setListening(true);
      setStatus("Listening");
    }
  };
  const stop = () => rec.current?.stop();

  return (
    <div className="flex flex-col gap-1.5">
      <form
        ref={form}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        data-slot="melo-composer"
        data-state={listening ? "listening" : disabled ? "sending" : "idle"}
        className={cn(
          "flex flex-wrap items-end rounded-[22px] border-[1.5px] bg-white transition-colors",
          listening ? "border-control-on" : "border-border-default focus-within:border-primary",
        )}
      >
        <textarea
          ref={ref}
          aria-label="Ask Melo"
          rows={1}
          value={value}
          onChange={(e) => {
            if (listening) {
              rec.current?.abort();
              rec.current = null;
              setListening(false);
            }
            if (!e.target.value.trim()) viaVoice.current = false;
            if (note) setNote(null);
            setValue(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (listening) stop();
              else submit();
            }
          }}
          placeholder={listening ? "Listening…" : placeholder}
          className="block min-h-12 min-w-0 flex-1 resize-none bg-transparent py-3 pl-4 pr-1 text-base leading-6 text-text-primary placeholder:text-text-neutral-400 placeholder:type-meta focus:outline-none md:basis-full md:pb-1 md:pr-4 md:text-[15px]"
        />
        <div className="flex shrink-0 items-center gap-2 p-[3px] md:w-full md:pb-1.5 md:pl-4 md:pr-1.5 md:pt-0">
          <p
            aria-hidden="true"
            className="hidden min-w-0 flex-1 truncate text-[11px] type-meta text-text-neutral-500 md:block"
          >
            Enter to send · Shift + Enter for a new line
          </p>
          {micSupported && (
            <button
              type="button"
              aria-label={listening ? "Stop listening" : "Speak your question"}
              aria-pressed={listening}
              onClick={listening ? stop : start}
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                listening
                  ? "bg-control-on text-on-selected"
                  : "text-text-secondary hover:bg-icon-well hover:text-text-primary",
              )}
            >
              <Icon name={listening ? "stop" : "mic"} size={listening ? 18 : 20} color="currentColor" />
            </button>
          )}
          <button
            type="submit"
            aria-label="Send message"
            disabled={!canSend}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-40"
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
      <div aria-live="polite" className="empty:hidden">
        {note && (
          <p data-testid="melo-voice-note" className="px-2 text-[13px] type-meta leading-5 text-text-primary">
            {note}
          </p>
        )}
      </div>
      {listening ? (
        <p
          data-testid="melo-listening"
          className="flex items-center justify-center gap-2 text-[11px] type-meta leading-4 text-icon-well-ink"
        >
          <Levels />
          Listening… pause to finish
        </p>
      ) : (
        <p className="text-center text-[11px] type-meta leading-4 text-text-secondary">
          Melo suggests; you decide what to log.
        </p>
      )}
      {micSupported && (
        <p role="status" data-testid="melo-voice-status" className="sr-only">
          {status}
        </p>
      )}
    </div>
  );
}
