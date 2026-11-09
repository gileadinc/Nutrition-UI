"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { PrimaryButton, SecondaryButton } from "@/components/Button";
import {
  MeloAnswer,
  MeloChat,
  MeloChatList,
  MeloHeader,
  MeloIconButton,
  TypingIndicator,
  UserBubble,
  VoiceSettings,
} from "@/components/Melo";
import { Link, useBack, useNavigate, useParams, useSearchParams } from "@/lib/nav";
import { MELO_COPY } from "@/content";
import { answer, meloActions, useMelo, useMeloContext, type MeloTurn } from "@/lib/melo";

const SUBTITLE = MELO_COPY.subtitle;

function NewChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary pl-3.5 pr-4 text-[17px] type-button text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <Icon name="pencilEdit" size={16} color="currentColor" />
      New chat
    </button>
  );
}

function Narrow({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full w-full">
      <div className="page-settle mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------ /assistant */

/** Full-page Melo: chat list on lg, the same chat as the popup in the main pane. */
export function AssistantScreen() {
  const back = useBack("/home");
  const [params, setParams] = useSearchParams();
  const ctx = useMeloContext();
  const activeId = useMelo((s) => s.activeId);
  const handled = useRef(false);
  const context = params.get("context")?.trim() ?? "";

  // `?context=` starts a fresh chat seeded with that question, answered from the live data.
  const ready = ctx.catalog.length > 0;
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    if (!context || ready) return;
    const t = setTimeout(() => setWaited(true), 1500);
    return () => clearTimeout(t);
  }, [context, ready]);
  useEffect(() => {
    if (handled.current || !context || !(ready || waited)) return;
    handled.current = true;
    meloActions.newChat();
    meloActions.send(context, ctx.get(), { immediate: true });
    setParams({}, { replace: true });
  }, [context, ready, waited, ctx, setParams]);

  return (
    <div className="page-settle flex h-[calc(100dvh-76px)] w-full gap-4 md:h-[calc(100dvh-108px)] md:p-4 lg:p-5">
      <aside aria-label="Conversations" className="hidden w-72 shrink-0 flex-col gap-3 overflow-y-auto pr-3 lg:flex xl:w-80">
        <div className="flex items-center justify-between gap-2 pt-1">
          <h2 className="text-[19px] type-section-title text-text-primary">Chats</h2>
          <NewChatButton onClick={() => meloActions.newChat()} />
        </div>
        <MeloChatList dense onOpen={(id) => meloActions.reopen(id)} />
      </aside>
      <section
        aria-label="Chat with Melo"
        className="flex min-h-0 min-w-0 flex-1 flex-col bg-white md:panel md:overflow-hidden"
      >
        <MeloHeader
          title="Melo"
          subtitle={SUBTITLE}
          onBack={back}
          className="border-b border-border-divider px-3 py-2 md:px-5 md:py-3 md:[&>button:first-child]:hidden"
          actions={
            <>
              <VoiceSettings />
              <MeloIconButton label="History" icon="history" to="/assistant/history" className="lg:hidden" />
              <MeloIconButton
                label="New chat"
                icon="pencilEdit"
                onClick={() => meloActions.newChat()}
                className="lg:hidden"
              />
            </>
          }
        />
        <MeloChat key={activeId} size="page" onNavigate={() => {}} autoFocus />
      </section>
    </div>
  );
}

/* ------------------------------------------------- /assistant/history|search */

function HistoryBase({ search }: { search: boolean }) {
  const back = useBack("/assistant");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const history = useMelo((s) => s.history);
  const term = q.trim();
  const count = history.filter((c) => !term || c.title.toLowerCase().includes(term.toLowerCase())).length;
  return (
    <Narrow>
      <MeloHeader
        title={search ? "Search chats" : "Chats"}
        subtitle={`${history.length} conversation${history.length === 1 ? "" : "s"}`}
        onBack={back}
        actions={
          <NewChatButton
            onClick={() => {
              meloActions.newChat();
              navigate("/assistant");
            }}
          />
        }
      />
      <p aria-live="polite" className="sr-only">
        {term ? `${count} ${count === 1 ? "match" : "matches"} for “${term}”` : ""}
      </p>
      <div className="mt-5">
        <MeloChatList
          query={q}
          onQueryChange={(v) => {
            setQ(v);
            setParams(v.trim() ? { q: v } : {}, { replace: true });
          }}
          autoFocusSearch={search}
          onOpen={(id) => {
            meloActions.reopen(id);
            navigate("/assistant");
          }}
        />
      </div>
      {term && (
        <Link
          to={`/assistant?context=${encodeURIComponent(term)}`}
          className="mt-5 flex min-h-12 items-center gap-3 rounded-[14px] border border-border-default bg-white p-3 transition-colors hover:border-text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-icon-well">
            <Icon name="sparkles" size={17} color="var(--color-icon-well-ink)" />
          </span>
          <span className="min-w-0 flex-1 truncate text-[18px] type-button text-primary">Ask Melo about “{term}”</span>
          <Icon name="chevronRight" size={16} color="var(--color-primary)" />
        </Link>
      )}
    </Narrow>
  );
}

export const AssistantHistoryScreen = () => <HistoryBase search={false} />;
export const AssistantSearchScreen = () => <HistoryBase search />;

/* --------------------------------------------------- /assistant/context/[type] */

/** A one-shot answer to a question raised from elsewhere (a meal, an order or the user's goal), from real data. */
export function AssistantContextScreen() {
  const { type = "meal" } = useParams<{ type: string }>();
  const [params] = useSearchParams();
  const back = useBack("/assistant");
  const navigate = useNavigate();
  const ctx = useMeloContext();
  const [at] = useState(() => Date.now());
  const id = params.get("id");

  const item = useMemo(
    () => (id ? ctx.catalog.find((i) => i.id === id && i.kind === (type === "hack" ? "hack" : "recipe")) : undefined),
    [ctx.catalog, id, type],
  );
  const question =
    type === "goal"
      ? "How am I doing this week?"
      : type === "hack"
        ? item
          ? `How does ${item.title} fit my goals?`
          : "What can I order that fits?"
        : item
          ? `How does ${item.title} fit my goals?`
          : "What fits the rest of my day?";
  const reply = useMemo(
    () => answer(question, { budget: ctx.budget, days: ctx.days, catalog: ctx.catalog }),
    [question, ctx.budget, ctx.days, ctx.catalog],
  );
  const asked: MeloTurn = { id: -1, role: "user", text: question, at };
  const turn: MeloTurn = { id: 0, role: "assistant", text: reply.text, at, rule: reply.rule, links: reply.links };

  return (
    <Narrow>
      <MeloHeader title="Ask Melo" subtitle={SUBTITLE} onBack={back} />
      <div className="mt-6 flex flex-col gap-7">
        <UserBubble turn={asked} />
        <MeloAnswer turn={turn} isLatest={false} showActions={false} onFollowUp={() => {}} onNavigate={() => {}} />
        <PrimaryButton
          size="medium"
          label="Continue in chat"
          onPress={() => navigate(`/assistant?context=${encodeURIComponent(question)}`)}
        />
      </div>
    </Narrow>
  );
}

/* ---------------------------------------------------- /assistant/state/[state] */

const TONE = {
  well: { ink: "var(--color-icon-well-ink)", well: "bg-icon-well" },
  error: { ink: "var(--color-error-red)", well: "bg-brand-warm-gray" },
  muted: { ink: "var(--color-text-neutral-500)", well: "bg-brand-warm-gray" },
} as const;

const STATES = MELO_COPY.states;

export function AssistantStateScreen() {
  const { state = "empty" } = useParams<{ state: string }>();
  const back = useBack("/assistant");
  const navigate = useNavigate();
  const [at] = useState(() => Date.now());

  if (state === "typing")
    return (
      <Narrow>
        <MeloHeader title="Ask Melo" subtitle={SUBTITLE} onBack={back} />
        <div className="mt-6 flex flex-col gap-7">
          <UserBubble turn={{ id: -1, role: "user", text: "What can I order that fits?", at }} />
          <TypingIndicator />
        </div>
      </Narrow>
    );

  const copy = STATES[state] ?? STATES.empty;
  return (
    <Narrow>
      <MeloHeader title="Ask Melo" subtitle={SUBTITLE} onBack={back} />
      <section
        aria-labelledby="melo-state-title"
        className="mx-auto mt-10 flex max-w-sm flex-col items-center text-center md:mt-16"
      >
        <span className={cn("flex size-16 items-center justify-center rounded-full", TONE[copy.tone].well)}>
          <Icon name={copy.icon} size={30} color={TONE[copy.tone].ink} />
        </span>
        <h2 id="melo-state-title" className="mt-4 text-lg type-section-title text-text-primary">
          {copy.title}
        </h2>
        <p className="mt-1.5 text-sm leading-5 text-text-secondary">{copy.body}</p>
        <div className="mt-6 flex w-full flex-col gap-2.5">
          <PrimaryButton size="medium" label={copy.primary.label} onPress={() => navigate(copy.primary.to)} />
          {copy.secondary && (
            <SecondaryButton label={copy.secondary.label} onPress={() => navigate(copy.secondary!.to)} />
          )}
        </div>
      </section>
    </Narrow>
  );
}
