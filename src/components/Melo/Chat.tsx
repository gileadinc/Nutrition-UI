"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Link } from "@/lib/nav";
import { firstNameOf, useProfile } from "@/lib/store";
import {
  QUICK_PROMPTS,
  STARTERS,
  meloActions,
  relativeTime,
  stopSpeaking,
  useMelo,
  useMeloContext,
} from "@/lib/melo";
import { MeloComposer } from "./Composer";
import { MeloAnswer, TypingIndicator, UserBubble } from "./Bubbles";

export type ChatSize = "sheet" | "page";

function Today({ onNavigate }: { onNavigate: () => void }) {
  const { budget } = useMeloContext();
  const cal = `${budget.calories.consumed.toLocaleString("en-US")} of ${budget.calories.goal.toLocaleString("en-US")} kcal`;
  const pro = `${budget.protein.consumed} of ${budget.protein.goal}g protein`;
  return (
    <Link
      to="/track"
      onClick={onNavigate}
      data-testid="melo-today"
      aria-label={`Today so far: ${cal}, ${pro}. Open Track`}
      className="group flex min-h-12 items-center gap-3 rounded-2xl border border-border-divider bg-white px-3 py-2 transition-colors hover:border-text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft">
        <Icon name="fire" size={16} color="var(--color-accent-ink)" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] type-meta leading-4 text-text-secondary">
          Today so far{budget.personalised ? "" : " · default goals"}
        </span>
        <span className="block text-[17px] type-row-figure leading-5 text-text-primary">
          <span className="text-accent-ink">{cal}</span>
          <span aria-hidden="true" className="px-1.5 text-text-neutral-400">
            ·
          </span>
          {pro}
        </span>
      </span>
      <Icon name="chevronRight" size={16} color="var(--color-text-neutral-500)" />
    </Link>
  );
}

function RecentChats({ size, onNavigate }: { size: ChatSize; onNavigate: () => void }) {
  const history = useMelo((s) => s.history);
  const [now] = useState(() => Date.now());
  if (history.length === 0) return null;
  return (
    <section aria-labelledby="melo-recent" className={cn(size === "page" && "lg:hidden")}>
      <div className="flex items-center justify-between">
        <h3 id="melo-recent" className="text-xs type-section-title text-text-secondary">
          Recent chats
        </h3>
        <Link
          to="/assistant/history"
          onClick={onNavigate}
          className="flex min-h-9 items-center gap-0.5 rounded-full border border-border-default bg-white px-3 text-[17px] type-button text-primary"
        >
          See all
          <Icon name="chevronRight" size={14} color="var(--color-primary)" />
        </Link>
      </div>
      <ul className="mt-1 flex flex-col border-t border-border-divider">
        {history.slice(0, 3).map((c) => (
          <li key={c.id} className="border-b border-border-divider">
            <button
              type="button"
              onClick={() => meloActions.reopen(c.id)}
              className="flex min-h-12 w-full items-center gap-3 px-1 text-left transition-colors hover:bg-icon-well focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
            >
              <Icon name="history" size={16} color="var(--color-text-neutral-500)" />
              <span className="min-w-0 flex-1 truncate text-[18px] type-item-title text-text-primary">{c.title}</span>
              <span className="shrink-0 text-[15px] type-meta text-text-neutral-500">
                {relativeTime(c.updatedAt, now)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The conversation: empty state (starters, recent chats), turns, and the composer. */
export function MeloChat({
  size,
  onNavigate,
  autoFocus,
}: {
  size: ChatSize;
  onNavigate: () => void;
  autoFocus?: boolean;
}) {
  const turns = useMelo((s) => s.turns);
  const typing = useMelo((s) => s.isTyping);
  const ctx = useMeloContext();
  const { profile } = useProfile();
  const name = firstNameOf(profile);

  const scroller = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(true);
  const scrollEnd = () => scroller.current?.scrollTo?.({ top: scroller.current.scrollHeight });

  const send = (text: string, opts?: { viaVoice?: boolean }) => {
    meloActions.send(text, ctx.get(), opts);
    setPinned(true);
    scrollEnd();
  };

  useEffect(() => {
    if (pinned && turns.length > 0) scrollEnd();
  }, [turns.length, typing, pinned]);
  useEffect(() => () => stopSpeaking(), []);

  const wide = size === "page" ? "max-w-5xl" : "max-w-2xl";
  const latestAssistant = [...turns].reverse().find((t) => t.role === "assistant")?.id;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        <div
          ref={scroller}
          onScroll={(e) => {
            const el = e.currentTarget;
            setPinned(el.scrollHeight - el.scrollTop - el.clientHeight < 48);
          }}
          className={cn(
            "h-full overflow-y-auto overscroll-contain",
            size === "sheet" ? "px-4 py-5" : "px-4 py-6 md:px-8 md:py-8",
          )}
        >
          {turns.length === 0 ? (
            <div className={cn("mx-auto flex w-full flex-col gap-5", wide)}>
              <div>
                <h2
                  className={cn(
                    "type-display text-text-primary",
                    size === "sheet" ? "text-[26px] leading-7" : "text-[30px] leading-8 md:text-[32px] md:leading-9",
                  )}
                >
                  {name ? `Hi ${name}, what’s on the plate?` : "Hi, what’s on the plate?"}
                </h2>
                <p className="mt-1.5 text-sm leading-5 text-text-secondary">
                  Ask about eating out, cooking or how today is going. I answer from your log and the catalogue.
                </p>
              </div>
              <Today onNavigate={onNavigate} />
              <section aria-labelledby="melo-starters">
                <h3 id="melo-starters" className="sr-only">
                  Start with a question
                </h3>
                <ul data-testid="melo-starters" className={cn("panel grid grid-cols-2 overflow-hidden", size === "page" && "lg:grid-cols-4")}>
                  {STARTERS.map((s, i) => (
                    <li
                      key={s.text}
                      className={cn(
                        "border-border-divider",
                        i % 2 === 0 && "border-r",
                        i < 2 && "border-b",
                        size === "page" && "lg:border-b-0 lg:border-r lg:last:border-r-0",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => send(s.text)}
                        className="flex size-full min-h-[104px] flex-col items-start gap-2.5 p-3.5 text-left transition-colors hover:bg-icon-well focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                      >
                        <span className="flex items-center gap-2">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-icon-well">
                            <Icon name={s.icon} size={15} color="var(--color-icon-well-ink)" />
                          </span>
                          <span className="text-xs type-meta text-text-secondary">{s.intent}</span>
                        </span>
                        <span className="text-[18px] type-item-title leading-[23px] text-text-primary">{s.text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-label="Or ask about">
                <p aria-hidden="true" className="text-xs type-meta text-text-secondary">
                  Or ask about
                </p>
                <ul data-testid="melo-prompt-chips" className="mt-2 flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((p) => (
                    <li key={p}>
                      <button
                        type="button"
                        onClick={() => send(p)}
                        className="flex min-h-11 items-center rounded-full border border-border-default bg-white px-4 text-[17px] type-button-secondary text-text-primary transition-colors hover:border-text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        {p}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
              <RecentChats size={size} onNavigate={onNavigate} />
            </div>
          ) : (
            <>
              <div
                role="log"
                aria-live="polite"
                aria-label="Conversation with Melo"
                className={cn("mx-auto flex flex-col gap-7", wide)}
              >
                {turns.map((t) =>
                  t.role === "user" ? (
                    <UserBubble key={t.id} turn={t} />
                  ) : (
                    <MeloAnswer
                      key={t.id}
                      turn={t}
                      isLatest={t.id === latestAssistant && !typing}
                      onFollowUp={send}
                      onNavigate={onNavigate}
                    />
                  ),
                )}
              </div>
              {typing && (
                <div className={cn("mx-auto mt-7", wide)}>
                  <TypingIndicator />
                </div>
              )}
            </>
          )}
        </div>
        {!pinned && (
          <button
            type="button"
            aria-label="Jump to latest"
            onClick={() => {
              setPinned(true);
              scrollEnd();
            }}
            className="absolute bottom-3 left-1/2 flex min-h-11 -translate-x-1/2 items-center gap-1.5 rounded-full border border-border-default bg-white pl-3 pr-4 text-[17px] type-button-secondary text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-safe:animate-[melo-rise_180ms_ease-out_backwards]"
          >
            <Icon name="arrowDownSmall" size={16} color="var(--color-primary)" />
            Latest
          </button>
        )}
      </div>
      <div
        className={cn(
          "border-t border-border-divider bg-white px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2.5",
          size === "page" && "md:px-8",
        )}
      >
        <div className={cn("mx-auto", wide)}>
          <MeloComposer
            onSend={send}
            disabled={typing}
            placeholder={turns.length === 0 ? "Ask Melo…" : "Ask a follow-up…"}
            autoFocus={autoFocus}
          />
        </div>
      </div>
    </div>
  );
}
