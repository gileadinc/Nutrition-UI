"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, PageContainer, SearchField } from "@/components";
import { AppImage } from "@/components/AppImage";
import { discoveryApi, getErrorMessage, type MenuItem, type Recipe } from "@/lib/api";
import { useDebouncedValue } from "@/lib/hooks";
import { Link, useNavigate, useSearchParams } from "@/lib/nav";
import { fitFor, fitsToday, type Budget } from "@/lib/nutrition";
import { useDayBudget, useRecentSearches } from "@/lib/store";
import { UI } from "@/content";
import { cn } from "@/lib/utils";
import { humanize, menuItemToHack, toRecipeVM } from "./adapt";

const SUGGESTIONS = [
  "High protein under 500 calories",
  "Something nearby I can grab in 15 minutes",
  "Vegetarian dinner I can cook tonight",
  "Low carb lunch",
];

type Scope = "all" | "recipes" | "hacks";
const scopeOf = (v: string | null): Scope => (v === "recipes" || v === "hacks" ? v : "all");

const COPY: Record<Scope, { label: string; placeholder: string }> = {
  all: {
    label: "Search food and recipes",
    placeholder: 'Try "chicken bowl" or "high protein under 500"',
  },
  recipes: {
    label: "Search recipes",
    placeholder: 'Try "chicken bowl" or "vegetarian under 30 minutes"',
  },
  hacks: { label: "Search fast hacks", placeholder: 'Try "bowl" or "high protein under 500"' },
};

interface Hit {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  calories: number;
  protein: number;
  to: string;
}

function toHits(items: unknown[]): { hacks: Hit[]; recipes: Hit[] } {
  const hacks: Hit[] = [];
  const recipes: Hit[] = [];
  for (const raw of items) {
    const it = raw as { type?: string };
    if (it.type === "recipe") {
      const r = toRecipeVM(raw as Recipe);
      recipes.push({
        id: r.id,
        title: r.title,
        subtitle: [r.time, r.badge].filter(Boolean).join(" · ") || "Recipe",
        image: r.image,
        calories: r.calories,
        protein: r.protein,
        to: `/recipes/${r.id}`,
      });
    } else if (it.type === "menu_item" || it.type === "fast_hack") {
      const h = menuItemToHack(raw as MenuItem);
      hacks.push({
        id: h.id,
        title: h.title,
        subtitle: h.restaurant,
        image: h.image,
        calories: h.calories,
        protein: h.protein,
        to: `/hack/${h.id}`,
      });
    }
  }
  return { hacks, recipes };
}

export function SearchScreen() {
  const navigate = useNavigate();
  const { budget } = useDayBudget();
  const { recent, remember, clear } = useRecentSearches();
  const [params, setParams] = useSearchParams();
  const scope = scopeOf(params.get("scope"));
  const copy = COPY[scope];
  const [value, setValue] = useState(() => params.get("q") ?? "");
  const [active, setActive] = useState({ forQuery: "", index: -1 });
  const input = useRef<HTMLInputElement>(null);
  const q = value.trim();
  const debounced = useDebouncedValue(q, 250);
  const [state, setState] = useState<{
    forQuery: string;
    hacks: Hit[];
    recipes: Hit[];
    error: string | null;
  }>({ forQuery: "", hacks: [], recipes: [], error: null });

  useEffect(() => {
    if (!debounced) return;
    let off = false;
    discoveryApi
      .searchDiscovery({
        query: debounced,
        limit: 20,
        type: scope === "recipes" ? "recipe" : scope === "hacks" ? "menu_item" : undefined,
      })
      .then((res) => {
        if (!off) setState({ forQuery: debounced + scope, ...toHits(res.items), error: null });
      })
      .catch((err) => {
        if (!off)
          setState({ forQuery: debounced + scope, hacks: [], recipes: [], error: getErrorMessage(err) });
      });
    return () => {
      off = true;
    };
  }, [debounced, scope]);

  const fresh = q !== "" && state.forQuery === debounced + scope && debounced === q;
  const hacks = useMemo(() => (fresh && scope !== "recipes" ? state.hacks : []), [fresh, scope, state]);
  const recipes = useMemo(() => (fresh && scope !== "hacks" ? state.recipes : []), [fresh, scope, state]);
  const flat = useMemo(() => [...hacks, ...recipes], [hacks, recipes]);
  const total = flat.length;
  const activeIdx = active.forQuery === value ? active.index : -1;
  const setIdx = (i: number) => setActive({ forQuery: value, index: i });

  const open = (to: string) => {
    if (q) remember(q);
    navigate(to);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (total === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((activeIdx + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx(activeIdx <= 0 ? total - 1 : activeIdx - 1);
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      open(flat[activeIdx].to);
    } else if (e.key === "Enter" && q) remember(q);
  };
  const loading = q !== "" && !fresh;

  return (
    <PageContainer variant="focused" pathname="/search">
      <h1 className="sr-only">{copy.label}</h1>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-white"
        >
          <Icon name="arrowBack" size={20} color="var(--color-text-primary)" />
        </button>
        <SearchField
          id="search"
          inputRef={input}
          label={copy.label}
          size="lg"
          className="flex-1"
          autoFocus
          value={value}
          onChange={setValue}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={total > 0}
          aria-controls="search-results"
          aria-activedescendant={activeIdx >= 0 ? `result-${flat[activeIdx].id}` : undefined}
          placeholder={copy.placeholder}
          inputClassName="text-sm placeholder:text-text-neutral-500"
        />
      </div>
      {scope !== "all" && (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 text-[17px] type-meta text-text-secondary">
          <span>{scope === "recipes" ? "Recipes only." : "Fast hacks only."}</span>
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(params);
              next.delete("scope");
              if (q) next.set("q", q);
              else next.delete("q");
              setParams(next, { replace: true });
            }}
            className="inline-flex min-h-11 items-center type-button text-primary"
          >
            Search everything
          </button>
        </p>
      )}
      {q ? (
        loading ? (
          <p role="status" className="mt-6 text-[17px] type-meta text-text-secondary">
            Searching…
          </p>
        ) : state.error ? (
          <section className="panel mt-6 p-6 text-center">
            <Icon name="alert" size={24} color="var(--color-text-secondary)" />
            <p className="mt-2 text-sm type-section-title text-text-primary">Search isn&apos;t working right now</p>
            <p className="mt-1 text-[17px] type-meta text-text-secondary">{state.error}</p>
          </section>
        ) : total === 0 ? (
          <section className="panel mt-6 p-6 text-center">
            <Icon name="search" size={24} color="var(--color-text-secondary)" />
            <p className="mt-2 text-sm type-section-title text-text-primary">Nothing matched “{q}”</p>
            <p className="mt-1 text-[17px] type-meta text-text-secondary">
              Try a shorter phrase, or browse the full catalogues.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link to="/fast-hacks" className="tap-24 text-[17px] type-button text-primary">
                Browse Fast Hacks
              </Link>
              <Link to="/recipes" className="tap-24 text-[17px] type-button text-primary">
                Browse Recipes
              </Link>
            </div>
          </section>
        ) : (
          <div id="search-results" className="mt-5 flex flex-col gap-6">
            <p className="text-[17px] type-meta text-text-secondary" role="status">
              <span className="type-row-figure text-text-primary">{total}</span>
              {total === 1 ? " result" : " results"}
              {scope === "all" && ` · ${hacks.length} to order, ${recipes.length} to cook`}
            </p>
            {scope !== "recipes" && (
              <ResultGroup
                title="Eat out"
                hits={hacks}
                emptyNote="Nothing on the restaurant side matches this."
                activeId={activeIdx >= 0 ? flat[activeIdx].id : null}
                budget={budget}
                onOpen={open}
              />
            )}
            {scope !== "hacks" && (
              <ResultGroup
                title="Cook"
                hits={recipes}
                emptyNote="Nothing in the recipe catalogue matches this."
                activeId={activeIdx >= 0 ? flat[activeIdx].id : null}
                budget={budget}
                onOpen={open}
              />
            )}
          </div>
        )
      ) : (
        <>
          {recent.length > 0 && (
            <section className="mt-6">
              <div className="flex items-center">
                <h2 className="eyebrow flex-1 text-[17px]">Recent</h2>
                <button
                  type="button"
                  onClick={clear}
                  className="tap-24 text-[16px] type-button-secondary text-text-neutral-500"
                >
                  Clear
                </button>
              </div>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {recent.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      onClick={() => setValue(r)}
                      className="flex items-center gap-1.5 rounded-full border border-border-default bg-white px-3.5 py-1.5 text-[17px] type-button-secondary text-text-primary"
                    >
                      <Icon name="history" size={13} color="var(--color-text-neutral-500)" />
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="mt-6">
            <h2 className="eyebrow text-[17px]">Try asking</h2>
            <div className="mt-3 flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setValue(s);
                    input.current?.focus();
                  }}
                  className="panel flex items-center gap-3 p-3.5 text-left"
                >
                  <Icon name="sparkles" size={16} color="var(--color-accent-ink)" />
                  <span className="text-[17px] type-meta text-text-primary">{s}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </PageContainer>
  );
}

function ResultGroup({
  title,
  hits,
  emptyNote,
  activeId,
  budget,
  onOpen,
}: {
  title: string;
  hits: Hit[];
  emptyNote: string;
  activeId: string | null;
  budget: Budget;
  onOpen: (to: string) => void;
}) {
  return (
    <section aria-label={title}>
      <h2 className="eyebrow text-[17px]">
        {title} · {hits.length}
      </h2>
      {hits.length === 0 ? (
        <p className="mt-2 text-[17px] type-meta text-text-secondary">{emptyNote}</p>
      ) : (
        <ul className="mt-2.5 flex flex-col gap-2">
          {hits.map((h) => {
            const fit = fitFor(h, budget);
            return (
              <li key={h.id} id={`result-${h.id}`}>
                <button
                  type="button"
                  onClick={() => onOpen(h.to)}
                  aria-current={activeId === h.id || undefined}
                  className={cn(
                    "panel flex w-full items-center gap-3 p-3 text-left transition-colors",
                    activeId === h.id && "border-primary",
                  )}
                >
                  <AppImage
                    src={h.image}
                    alt=""
                    sizes="64px"
                    className="size-14 shrink-0 rounded-xl object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm type-item-title text-text-primary">
                      {h.title}
                    </span>
                    <span className="block truncate text-xs type-meta text-text-secondary">
                      {humanize(h.subtitle)} · {h.calories} kcal · {h.protein}g protein
                    </span>
                  </span>
                  {fitsToday(fit) && (
                    <span className="shrink-0 rounded-full bg-positive px-2.5 py-1 text-[15px] type-meta text-positive-ink">
                      {UI.fitsBadge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

