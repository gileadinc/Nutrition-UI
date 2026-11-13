"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { AppImage } from "@/components/AppImage";
import { Link } from "@/lib/nav";
import {
  followUps,
  meloActions,
  spokenText,
  speak,
  stopSpeaking,
  useCanSpeak,
  useMelo,
  useSpeakingId,
  type MeloLink,
  type MeloTurn,
} from "@/lib/melo";
import { toast } from "@/lib/store";
import { leavesLabel } from "@/lib/nutrition";

/** The orange chef-hat tile used for Melo everywhere. */
export function MeloMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-[30%] bg-accent", className)}
      style={{ width: size, height: size }}
    >
      <Icon name="chefHat" size={Math.round(size * 0.5)} color="var(--color-on-accent)" />
    </span>
  );
}

const time = (at: number) =>
  new Date(at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const NUM = /(\d(?:[\d,.]*\d)?(?:\s?(?:kcal|g|oz|min|%|lb)(?![a-z]))?)/g;

/** Bold the numbers in an answer. */
function emphasise(text: string) {
  return text.split(NUM).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="type-row-figure text-text-primary">
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export function UserBubble({ turn }: { turn: MeloTurn }) {
  return (
    <div className="flex flex-col items-end gap-1 motion-safe:animate-[melo-rise_260ms_cubic-bezier(0.215,0.61,0.355,1)_backwards]">
      <p className="max-w-[80%] whitespace-pre-wrap break-words rounded-[20px] rounded-br-md bg-primary px-4 py-2.5 text-[14px] leading-6 text-white">
        <span className="sr-only">You said: </span>
        {turn.text}
      </p>
      <time
        dateTime={new Date(turn.at).toISOString()}
        className="pr-1 text-[13px] type-meta text-text-neutral-500"
      >
        {time(turn.at)}
      </time>
    </div>
  );
}

function DishCard({ link, onNavigate }: { link: MeloLink; onNavigate: () => void }) {
  const card = link.card!;
  return (
    <Link
      to={link.to}
      onClick={onNavigate}
      data-testid="melo-dish-card"
      className="group/dish flex min-h-[76px] items-center gap-3 p-2.5 pr-3 transition-colors hover:bg-icon-well focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
    >
      <span className="block size-14 shrink-0 overflow-hidden rounded-[12px]">
        <AppImage
          src={card.image}
          alt=""
          sizes="56px"
          className="size-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover/dish:scale-[1.05]"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] type-item-title leading-5 text-text-primary">
          {card.title}
        </span>
        <span className="block truncate text-xs type-meta leading-4 text-text-secondary">
          {card.subtitle}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs type-meta text-text-primary">
          <span>
            {card.calories} kcal · {card.protein}g protein
          </span>
          {card.leaves !== undefined && (
            <span className="rounded-full bg-positive px-2 py-0.5 text-[13px] type-meta text-positive-ink">
              {leavesLabel(card.leaves)}
            </span>
          )}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-0.5 text-[14px] type-button text-primary">
        <span className="hidden sm:inline">Open</span>
        <Icon name="chevronRight" size={16} color="var(--color-primary)" />
      </span>
    </Link>
  );
}

function LinkChips({ links, onNavigate }: { links: MeloLink[]; onNavigate: () => void }) {
  return (
    <ul aria-label="Related pages" className="flex flex-wrap gap-2">
      {links.map((l) => (
        <li key={`${l.label}-${l.to}`}>
          <Link
            to={l.to}
            onClick={onNavigate}
            className="flex min-h-11 items-center gap-1 rounded-full border border-border-default bg-white pl-4 pr-3 text-[14px] type-button-secondary text-primary transition-colors hover:border-text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {l.label}
            <Icon name="chevronRight" size={14} color="var(--color-primary)" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

const ACTION = "flex size-11 items-center justify-center rounded-full hover:bg-icon-well";

function AnswerActions({ turn }: { turn: MeloTurn }) {
  const feedback = useMelo((s) => s.feedback[turn.id]);
  const canSpeak = useCanSpeak();
  const speakingId = useSpeakingId();
  const sid = `melo-answer:${turn.id}`;
  const speaking = speakingId === sid;
  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("No clipboard");
      await navigator.clipboard.writeText(turn.text);
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy that answer");
    }
  };
  return (
    <div className="-ml-1.5 flex items-center text-text-secondary">
      <button type="button" aria-label="Copy answer" onClick={() => void copy()} className={ACTION}>
        <Icon name="copy" size={15} color="currentColor" />
      </button>
      {canSpeak && (
        <button
          type="button"
          aria-label={speaking ? "Stop reading aloud" : "Read answer aloud"}
          onClick={() =>
            speaking
              ? stopSpeaking()
              : speak(
                  sid,
                  spokenText(turn.text, (turn.links ?? []).flatMap((l) => (l.card ? [l.card] : []))),
                )
          }
          className={cn(ACTION, speaking && "bg-icon-well text-icon-well-ink")}
        >
          <Icon name={speaking ? "stop" : "speaker"} size={15} color="currentColor" />
        </button>
      )}
      <button
        type="button"
        aria-label="Helpful"
        aria-pressed={feedback === "up"}
        onClick={() => meloActions.setFeedback(turn.id, "up")}
        className={ACTION}
      >
        <Icon name="thumbsUp" size={15} color={feedback === "up" ? "var(--color-eyebrow)" : "currentColor"} />
      </button>
      <button
        type="button"
        aria-label="Not helpful"
        aria-pressed={feedback === "down"}
        onClick={() => meloActions.setFeedback(turn.id, "down")}
        className={ACTION}
      >
        <Icon name="thumbsDown" size={15} color={feedback === "down" ? "var(--color-eyebrow)" : "currentColor"} />
      </button>
    </div>
  );
}

export function MeloAnswer({
  turn,
  isLatest,
  onFollowUp,
  onNavigate,
  showActions = true,
}: {
  turn: MeloTurn;
  isLatest: boolean;
  onFollowUp: (text: string) => void;
  onNavigate: () => void;
  showActions?: boolean;
}) {
  const links = turn.links ?? [];
  const cards = links.filter((l) => l.card);
  const chips = links.filter((l) => !l.card);
  return (
    <article
      data-testid="melo-answer"
      aria-label="Melo’s answer"
      className="flex flex-col gap-3 motion-safe:animate-[melo-rise_260ms_cubic-bezier(0.215,0.61,0.355,1)_backwards]"
    >
      <p className="flex items-center gap-2 text-[13px] type-meta text-text-primary">
        <MeloMark size={24} />
        Melo
        <time
          dateTime={new Date(turn.at).toISOString()}
          className="text-[13px] type-meta text-text-neutral-500"
        >
          {time(turn.at)}
        </time>
      </p>
      <p className="text-[14px] leading-7 text-text-primary">
        <span className="sr-only">Melo said: </span>
        {emphasise(turn.text)}
      </p>
      {cards.length > 0 && (
        <ul aria-label="Suggested dishes" className="panel flex flex-col overflow-hidden">
          {cards.map((l) => (
            <li key={l.to} className="border-b border-border-divider last:border-b-0">
              <DishCard link={l} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      )}
      {chips.length > 0 && <LinkChips links={chips} onNavigate={onNavigate} />}
      {showActions && <AnswerActions turn={turn} />}
      {isLatest && (
        <div>
          <p aria-hidden="true" className="text-xs type-meta text-text-secondary">
            Ask next
          </p>
          <ul aria-label="Follow-up questions" className="mt-1 flex flex-col">
            {followUps(turn.rule ?? "fallback").map((p) => (
              <li key={p} className="border-b border-border-divider last:border-b-0">
                <button
                  type="button"
                  aria-label={`Follow up: ${p}`}
                  onClick={() => onFollowUp(p)}
                  className="flex min-h-11 w-full items-center gap-2.5 py-2 text-left text-[13px] type-button-secondary leading-5 text-text-primary transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <Icon name={"followUp" as IconName} size={16} color="var(--color-icon-well-ink)" />
                  <span className="min-w-0 flex-1">{p}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export function TypingIndicator() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-full items-center gap-2 text-[13px] type-meta text-text-secondary motion-safe:animate-[melo-rise_200ms_ease-out_backwards]"
    >
      <MeloMark size={24} />
      <span className="flex items-center gap-1" aria-hidden="true">
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            className="size-1.5 rounded-full bg-progress motion-safe:animate-[melo-dot_1.1s_ease-in-out_infinite]"
            style={{ animationDelay: `${d}ms` }}
          />
        ))}
      </span>
      Checking your log…
    </div>
  );
}
