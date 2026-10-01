"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { BUCKETS, bucketOf, meloActions, relativeTime, useMelo, type MeloChat } from "@/lib/melo";
import { toast } from "@/lib/store";
import { SearchField } from "@/components/Shell/SearchField";

const preview = (c: MeloChat) => c.turns.find((t) => t.role === "assistant")?.text ?? "";

const matches = (c: MeloChat, q: string) => {
  const n = q.trim().toLowerCase();
  return !n || c.title.toLowerCase().includes(n) || preview(c).toLowerCase().includes(n);
};

function Empty({ icon, title, body }: { icon: "history" | "search"; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-icon-well">
        <Icon name={icon} size={20} color="var(--color-icon-well-ink)" />
      </span>
      <p className="mt-3 text-sm type-section-title text-text-primary">{title}</p>
      <p className="mt-1 text-xs type-meta text-text-secondary">{body}</p>
    </div>
  );
}

/** All saved chats, grouped Today / This week / Earlier, with search and delete (undo). */
export function MeloChatList({
  query,
  onQueryChange,
  onOpen,
  autoFocusSearch,
  dense,
}: {
  query?: string;
  onQueryChange?: (q: string) => void;
  onOpen: (id: string) => void;
  autoFocusSearch?: boolean;
  dense?: boolean;
}) {
  const [local, setLocal] = useState("");
  const q = query ?? local;
  const setQ = onQueryChange ?? setLocal;
  const history = useMelo((s) => s.history);
  const activeId = useMelo((s) => s.activeId);
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [now] = useState(() => Date.now());

  const visible = history.filter((c) => matches(c, q));
  const groups = BUCKETS.map((label) => ({
    label,
    entries: visible.filter((c) => bucketOf(c.updatedAt, now) === label),
  })).filter((g) => g.entries.length > 0);

  const del = (c: MeloChat) => {
    const rows = [...(root.current?.querySelectorAll<HTMLElement>("[data-melo-row]") ?? [])];
    const i = rows.findIndex((r) => r.dataset.meloRow === c.id);
    const nextId = rows[i + 1]?.dataset.meloRow ?? rows[i - 1]?.dataset.meloRow;
    const rec = meloActions.remove(c.id);
    if (!rec) return;
    toast.info("Chat deleted", { body: c.title, action: { label: "Undo", run: () => meloActions.restore(rec) } });
    requestAnimationFrame(() => {
      const target = nextId
        ? root.current?.querySelector<HTMLElement>(`[data-melo-row="${CSS.escape(nextId)}"]`)
        : null;
      (target ?? search.current)?.focus();
    });
  };

  return (
    <div ref={root} className="flex flex-col gap-4">
      <SearchField
        id="melo-history-search"
        label="Search conversations"
        value={q}
        onChange={setQ}
        placeholder="Search your chats"
        size="lg"
        inputClassName="text-base md:text-[15px]"
        inputRef={search}
        autoFocus={autoFocusSearch}
      />
      {history.length === 0 ? (
        <Empty icon="history" title="No chats yet" body="Your conversations with Melo will show up here." />
      ) : groups.length === 0 ? (
        <Empty
          icon="search"
          title={`No conversations match “${q.trim()}”`}
          body="Try a dish, a restaurant or a nutrient."
        />
      ) : (
        groups.map((g) => (
          <section key={g.label} aria-label={g.label}>
            <h2 className="px-1 text-xs type-section-title text-text-secondary">{g.label}</h2>
            <ul className="mt-1 flex flex-col">
              {g.entries.map((c) => {
                const active = c.id === activeId;
                const sub = dense ? "" : preview(c);
                return (
                  <li
                    key={c.id}
                    className={cn(
                      "group/row relative flex items-center rounded-[14px] transition-colors",
                      active ? "bg-icon-well" : "hover:bg-icon-well",
                    )}
                  >
                    {active && (
                      <span aria-hidden="true" className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-indicator" />
                    )}
                    <button
                      type="button"
                      data-melo-row={c.id}
                      onClick={() => onOpen(c.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex w-full min-w-0 flex-1 items-center gap-3 rounded-[14px] py-2.5 pl-3 pr-1 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
                        dense ? "min-h-11" : "min-h-[60px]",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="min-w-0 flex-1 truncate text-[14px] type-item-title text-text-primary">
                            {c.title}
                          </span>
                          <span className="shrink-0 text-[11px] type-meta text-text-neutral-500">
                            {relativeTime(c.updatedAt, now)}
                          </span>
                        </span>
                        {sub && (
                          <span className="mt-0.5 block truncate text-[13px] type-meta leading-5 text-text-secondary">
                            {sub}
                          </span>
                        )}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${c.title}`}
                      onClick={() => del(c)}
                      className="flex size-11 shrink-0 items-center justify-center rounded-full text-text-neutral-500 transition-opacity hover:text-error-red focus-visible:opacity-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within/row:opacity-100 [@media(hover:hover)]:group-hover/row:opacity-100"
                    >
                      <Icon name="trash" size={16} color="currentColor" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
