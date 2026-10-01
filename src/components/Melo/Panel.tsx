"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { Link } from "@/lib/nav";
import { firstNameOf, useDayBudget, useProfile } from "@/lib/store";
import { useTrackDays } from "@/lib/track";
import { QUICK_PROMPTS, STARTERS, meloActions, useMelo, useMeloCatalog } from "@/lib/melo";
import { MeloComposer } from "./Composer";
import { MeloAnswer, MeloMark, TypingIndicator, UserBubble } from "./Bubbles";

const ICON_BTN =
  "flex size-11 shrink-0 items-center justify-center rounded-full border border-border-default bg-white transition-colors hover:border-text-neutral-400 hover:bg-icon-well focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

function Today({ consumed, goal, protein, proteinGoal, personalised, onNavigate }: {
  consumed: number;
  goal: number;
  protein: number;
  proteinGoal: number;
  personalised: boolean;
  onNavigate: () => void;
}) {
  const cal = `${consumed.toLocaleString("en-US")} of ${goal.toLocaleString("en-US")} kcal`;
  const pro = `${protein} of ${proteinGoal}g protein`;
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
        <span className="block text-[11px] type-meta leading-4 text-text-secondary">
          Today so far{personalised ? "" : " · default goals"}
        </span>
        <span className="block text-[13px] type-row-figure leading-5 text-text-primary">
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

function Chat({ onNavigate }: { onNavigate: () => void }) {
  const turns = useMelo((s) => s.turns);
  const typing = useMelo((s) => s.isTyping);
  const { budget } = useDayBudget();
  const { days } = useTrackDays(7);
  const catalog = useMeloCatalog();
  const { profile } = useProfile();
  const name = firstNameOf(profile);

  // Latest data for send-time (answers are computed from what is on screen).
  const ctx = useRef({ budget, days, catalog });
  useEffect(() => {
    ctx.current = { budget, days, catalog };
  });

  const scroller = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(true);
  const scrollEnd = () => scroller.current?.scrollTo?.({ top: scroller.current.scrollHeight });

  const send = (text: string) => {
    meloActions.send(text, ctx.current);
    setPinned(true);
    scrollEnd();
  };

  useEffect(() => {
    if (pinned && turns.length > 0) scrollEnd();
  }, [turns.length, typing, pinned]);

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
          className="h-full overflow-y-auto overscroll-contain px-4 py-5"
        >
          {turns.length === 0 ? (
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
              <div>
                <h2 className="type-display text-[22px] leading-7 text-text-primary">
                  {name ? `Hi ${name}, what’s on the plate?` : "Hi, what’s on the plate?"}
                </h2>
                <p className="mt-1.5 text-sm leading-5 text-text-secondary">
                  Ask about eating out, cooking or how today is going. I answer from your log and the catalogue.
                </p>
              </div>
              <Today
                consumed={budget.calories.consumed}
                goal={budget.calories.goal}
                protein={budget.protein.consumed}
                proteinGoal={budget.protein.goal}
                personalised={budget.personalised}
                onNavigate={onNavigate}
              />
              <section aria-labelledby="melo-starters">
                <h3 id="melo-starters" className="sr-only">
                  Start with a question
                </h3>
                <ul data-testid="melo-starters" className="panel grid grid-cols-2 overflow-hidden">
                  {STARTERS.map((s, i) => (
                    <li
                      key={s.text}
                      className={cn("border-border-divider", i % 2 === 0 && "border-r", i < 2 && "border-b")}
                    >
                      <button
                        type="button"
                        onClick={() => send(s.text)}
                        className="flex size-full min-h-[104px] flex-col items-start gap-2.5 p-3.5 text-left transition-colors hover:bg-icon-well focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                      >
                        <span className="flex items-center gap-2">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-icon-well">
                            <Icon name={s.icon as IconName} size={15} color="var(--color-icon-well-ink)" />
                          </span>
                          <span className="text-xs type-meta text-text-secondary">{s.intent}</span>
                        </span>
                        <span className="text-[14px] type-item-title leading-[19px] text-text-primary">
                          {s.text}
                        </span>
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
                        className="flex min-h-11 items-center rounded-full border border-border-default bg-white px-4 text-[13px] type-button-secondary text-text-primary transition-colors hover:border-text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        {p}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : (
            <>
              <div
                role="log"
                aria-live="polite"
                aria-label="Conversation with Melo"
                className="mx-auto flex max-w-2xl flex-col gap-7"
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
                <div className="mx-auto mt-7 max-w-2xl">
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
            className="absolute bottom-3 left-1/2 flex min-h-11 -translate-x-1/2 items-center gap-1.5 rounded-full border border-border-default bg-white pl-3 pr-4 text-[13px] type-button-secondary text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-safe:animate-[melo-rise_180ms_ease-out_backwards]"
          >
            <Icon name="arrowDownSmall" size={16} color="var(--color-primary)" />
            Latest
          </button>
        )}
      </div>
      <div className="border-t border-border-divider bg-white px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2.5">
        <div className="mx-auto max-w-2xl">
          <MeloComposer
            onSend={send}
            disabled={typing}
            placeholder={turns.length === 0 ? "Ask Melo…" : "Ask a follow-up…"}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/** The Melo chat popup: bottom sheet on mobile, floating card on lg. */
export function MeloPanel({ pathname }: { pathname: string }) {
  const hasTurns = useMelo((s) => s.turns.length > 0);
  const root = useRef<HTMLElement>(null);
  const [opener] = useState(() => (typeof document === "undefined" ? null : document.activeElement));
  const [openedOn] = useState(pathname);

  const close = () => {
    const samePage = openedOn === pathname;
    meloActions.close();
    requestAnimationFrame(() => {
      if (samePage && opener instanceof HTMLElement && opener.isConnected) opener.focus();
    });
  };
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });

  useEffect(() => {
    const el = root.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!e.defaultPrevented) closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !el) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Close Melo"
        tabIndex={-1}
        onClick={close}
        className="fixed inset-0 z-40 bg-text-primary/35 lg:hidden"
      />
      <section
        ref={root}
        role="dialog"
        aria-modal="true"
        aria-label="Melo"
        className="fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col overflow-hidden rounded-t-[24px] bg-white motion-safe:animate-[drawer-in_260ms_cubic-bezier(0.215,0.61,0.355,1)_backwards] lg:inset-x-auto lg:bottom-6 lg:right-6 lg:h-[min(44rem,85dvh)] lg:w-[26rem] lg:rounded-[24px] lg:border lg:border-border-default"
        style={{ boxShadow: "var(--shadow-raised)" }}
      >
        <span aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-border-default lg:hidden" />
        <header className="flex items-center gap-2.5 border-b border-border-divider py-2 pl-4 pr-2.5">
          <MeloMark size={32} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[17px] type-section-title leading-6 text-text-primary">Ask Melo</h2>
            <p className="truncate text-xs type-meta leading-4 text-text-secondary">Answers from your day</p>
          </div>
          <div className="relative flex shrink-0 items-center gap-1.5">
            {hasTurns && (
              <button type="button" aria-label="New chat" onClick={() => meloActions.newChat()} className={ICON_BTN}>
                <Icon name="pencilEdit" size={18} color="var(--color-primary)" />
              </button>
            )}
            <button type="button" aria-label="Close Melo" onClick={close} className={ICON_BTN}>
              <Icon name="close" size={18} color="var(--color-primary)" />
            </button>
          </div>
        </header>
        <Chat onNavigate={() => meloActions.close()} />
      </section>
    </>
  );
}
