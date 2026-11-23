"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, PageContainer, SearchField } from "@/components";
import { AppImage } from "@/components/AppImage";
import { discoveryApi, getErrorMessage, type MenuItem, type Recipe } from "@/lib/api";
import { useDebouncedValue } from "@/lib/hooks";
import { Link, useNavigate, useSearchParams } from "@/lib/nav";
import { fitFor, fitsToday, type Budget } from "@/lib/nutrition";
import { useDayBudget, useFastHacks, useRecentSearches, useRecipes } from "@/lib/store";
import { nearParams, useUserLocation } from "@/lib/location";
import { cn } from "@/lib/utils";
import { SELECTED_CHIP } from "@/components/styles";
import { humanize, menuItemToHack, toHackVM, toRecipeVM } from "./adapt";

const SUGGESTIONS = [
  "High protein under 500 calories",
  "Something nearby I can grab in 15 minutes",
  "Vegetarian dinner I can cook tonight",
  "Low carb lunch",
];

/** Quick filters: toggling one adds/removes its phrase in the query. */
const FILTERS = [
  { label: "High protein", phrase: "high protein" },
  { label: "Under 500 kcal", phrase: "under 500 calories" },
  { label: "Ready in 15 min", phrase: "under 15 minutes" },
  { label: "Vegetarian", phrase: "vegetarian" },
  { label: "Low carb", phrase: "low carb" },
];
const hasPhrase = (q: string, phrase: string) => q.toLowerCase().includes(phrase);
const togglePhrase = (q: string, phrase: string) => {
  const at = q.toLowerCase().indexOf(phrase);
  if (at === -1) return `${q.trim()} ${phrase}`.trim();
  return `${q.slice(0, at)} ${q.slice(at + phrase.length)}`.replace(/\s{2,}/g, " ").trim();
};

/** Which numbers a hit was matched on, for the "matched on …" line. */
const whyFor = (query: string, h: { calories: number; protein: number }) => {
  const why: string[] = [];
  if (/(under|below|less than)\s*\d+\s*(calories|kcal|cal)/i.test(query))
    why.push(`${h.calories} kcal`);
  if (/protein/i.test(query)) why.push(`${h.protein}g protein`);
  return why;
};

const FITS_QUERY = "high protein under 500 calories";

type Scope = "all" | "recipes" | "hacks";
const scopeOf = (v: string | null): Scope => (v === "recipes" || v === "hacks" ? v : "all");

const COPY: Record<Scope, { label: string; title: string; placeholder: string }> = {
  all: {
    label: "Search food and recipes",
    title: "What are you hungry for?",
    placeholder: 'Try "chicken" or "high protein under 500"',
  },
  recipes: {
    label: "Search recipes",
    title: "Find a recipe",
    placeholder: 'Try "chicken" or "vegetarian under 30 minutes"',
  },
  hacks: {
    label: "Search fast hacks",
    title: "Find a fast hack",
    placeholder: 'Try "chipotle" or "high protein under 500"',
  },
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
        subtitle: [h.restaurant, h.distanceMi != null ? `${h.distanceMi} mi` : null]
          .filter(Boolean)
          .join(" · "),
        image: h.image,
        calories: h.calories,
        protein: h.protein,
        to: `/hack/${h.id}`,
      });
    }
  }
  return { hacks, recipes };
}

const chipClass = (on: boolean) =>
  cn(
    "tap-44 relative flex shrink-0 items-center rounded-full border px-4 py-2 text-[13px] tracking-[-0.585px]",
    on
      ? cn(SELECTED_CHIP, "type-button")
      : "type-button-secondary border-border-default bg-white text-text-primary hover:border-text-neutral-400",
  );

export function SearchScreen() {
  const navigate = useNavigate();
  const { budget } = useDayBudget();
  const { recent, remember, clear } = useRecentSearches();
  const [params, setParams] = useSearchParams();
  const scope = scopeOf(params.get("scope"));
  const copy = COPY[scope];
  const [value, setValue] = useState(() => params.get("q") ?? "");
  const [show, setShow] = useState<Scope>("all");
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
  const { coords } = useUserLocation();
  const hacksRes = useFastHacks({ limit: 24, ...nearParams(coords) });
  const recipesRes = useRecipes({ limit: 24 });

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
          setState({
            forQuery: debounced + scope,
            hacks: [],
            recipes: [],
            error: getErrorMessage(err),
          });
      });
    return () => {
      off = true;
    };
  }, [debounced, scope]);

  // "Fits your day": high-protein, under-500 picks that still fit today's budget.
  const fitsList = useMemo(() => {
    const hackHits: Hit[] = (hacksRes.data?.items ?? []).map((raw) => {
      const h = toHackVM(raw);
      return {
        id: h.id,
        title: h.title,
        subtitle: [h.restaurant, h.distanceMi != null ? `${h.distanceMi} mi` : null]
          .filter(Boolean)
          .join(" · "),
        image: h.image,
        calories: h.calories,
        protein: h.protein,
        to: `/hack/${h.id}`,
      };
    });
    const recipeHits: Hit[] = (recipesRes.data?.items ?? []).map((raw) => {
      const r = toRecipeVM(raw);
      return {
        id: r.id,
        title: r.title,
        subtitle: [r.time, r.badge].filter(Boolean).join(" · ") || "Recipe",
        image: r.image,
        calories: r.calories,
        protein: r.protein,
        to: `/recipes/${r.id}`,
      };
    });
    return [...hackHits, ...recipeHits]
      .filter((h) => h.calories > 0 && h.calories < 500 && h.protein >= 30)
      .filter((h) => fitsToday(fitFor(h, budget)))
      .sort((x, y) => y.protein - x.protein)
      .slice(0, 4);
  }, [hacksRes.data, recipesRes.data, budget]);

  const fresh = q !== "" && state.forQuery === debounced + scope && debounced === q;
  const showHacks = scope !== "recipes" && show !== "recipes";
  const showRecipes = scope !== "hacks" && show !== "hacks";
  const hacks = useMemo(
    () => (fresh && scope !== "recipes" ? state.hacks : []),
    [fresh, scope, state],
  );
  const recipes = useMemo(
    () => (fresh && scope !== "hacks" ? state.recipes : []),
    [fresh, scope, state],
  );
  const flat = useMemo(
    () => [...(showHacks ? hacks : []), ...(showRecipes ? recipes : [])],
    [hacks, recipes, showHacks, showRecipes],
  );
  const total = flat.length;
  const all = hacks.length + recipes.length;
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
  const activeId = activeIdx >= 0 ? flat[activeIdx].id : null;

  return (
    <PageContainer variant="focused" pathname="/search">
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="tap-44 relative mt-1 flex size-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-white"
        >
          <Icon name="arrowBack" size={20} color="var(--color-text-primary)" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] leading-9 type-display tracking-[-1.2px] text-brand-navy">
            {copy.title}
          </h1>
          <p className="mt-1 text-[14px] type-meta text-text-secondary">
            Search the way you would ask: a food, a goal, a limit, or all three.
          </p>
        </div>
      </div>
      <div className="mt-5">
        <SearchField
          id="search"
          inputRef={input}
          label={copy.label}
          size="lg"
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
        <div
          role="group"
          aria-label="Quick filters"
          className="rail-scroll -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
        >
          {FILTERS.map((f) => {
            const on = hasPhrase(value, f.phrase);
            return (
              <button
                key={f.phrase}
                type="button"
                aria-pressed={on}
                onClick={() => setValue((v) => togglePhrase(v, f.phrase))}
                className={chipClass(on)}
              >
                {on && <Icon name="tick" size={14} color="currentColor" className="mr-1.5" />}
                {f.label}
              </button>
            );
          })}
        </div>
      </div>
      {scope !== "all" && (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 text-[13px] type-meta text-text-secondary">
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
          <p role="status" className="mt-6 text-[13px] type-meta text-text-secondary">
            Searching…
          </p>
        ) : state.error ? (
          <section className="panel mt-6 p-6 text-center">
            <Icon name="alert" size={24} color="var(--color-text-secondary)" />
            <p className="mt-2 text-sm type-section-title text-text-primary">
              Search isn&apos;t working right now
            </p>
            <p className="mt-1 text-[13px] type-meta text-text-secondary">{state.error}</p>
          </section>
        ) : all === 0 ? (
          <section className="panel mt-8 p-6 text-center">
            <span aria-hidden>
              <AppImage
                src="/img/search/empty-line"
                alt=""
                sizes="160px"
                className="mx-auto h-auto w-40"
              />
            </span>
            <p className="mt-2 text-sm type-section-title text-text-primary">
              Nothing matched “{q}”
            </p>
            <p className="mt-1 text-[13px] type-meta text-text-secondary">
              Try a shorter phrase, or browse the full catalogues.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link to="/fast-hacks" className="tap-24 text-[13px] type-button text-primary">
                Browse Fast Hacks
              </Link>
              <Link to="/recipes" className="tap-24 text-[13px] type-button text-primary">
                Browse Recipes
              </Link>
            </div>
          </section>
        ) : (
          <div id="search-results" className="mt-6 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className="text-[13px] type-meta text-text-secondary" role="status">
                <span className="type-row-figure text-text-primary">{total}</span>
                {total === 1 ? " result" : " results"}
                {scope === "all" &&
                  show === "all" &&
                  ` · ${hacks.length} to order, ${recipes.length} to cook`}
              </p>
              {scope === "all" && hacks.length > 0 && recipes.length > 0 && (
                <div role="group" aria-label="Show" className="flex gap-2">
                  {(
                    [
                      ["all", "All", all],
                      ["hacks", "Eat out", hacks.length],
                      ["recipes", "Cook", recipes.length],
                    ] as const
                  ).map(([key, label, n]) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={show === key}
                      onClick={() => setShow(key)}
                      className={chipClass(show === key)}
                    >
                      {label} <span className="ml-1.5 tabular-nums opacity-80">{n}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {showHacks && (
              <ResultGroup
                title="Eat out"
                hits={hacks}
                query={q}
                emptyNote="Nothing on the restaurant side matches this."
                activeId={activeId}
                budget={budget}
                onOpen={open}
              />
            )}
            {showRecipes && (
              <ResultGroup
                title="Cook"
                hits={recipes}
                query={q}
                emptyNote="Nothing in the recipe catalogue matches this."
                activeId={activeId}
                budget={budget}
                onOpen={open}
              />
            )}
          </div>
        )
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10">
          <div className="flex min-w-0 flex-col gap-8">
            {recent.length > 0 && (
              <section aria-label="Recent searches">
                <div className="flex items-center">
                  <h2 className="eyebrow flex-1 text-[13px]">Recent</h2>
                  <button
                    type="button"
                    onClick={clear}
                    className="tap-24 text-[12px] type-button-secondary text-text-secondary"
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
                        className="flex items-center gap-1.5 rounded-full border border-border-default bg-white px-3.5 py-1.5 text-[13px] type-button-secondary text-text-primary hover:border-text-neutral-400"
                      >
                        <Icon name="history" size={13} color="var(--color-text-secondary)" />
                        {r}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section aria-label="Try asking">
              <h2 className="eyebrow text-[13px]">Try asking</h2>
              <div className="mt-3 flex flex-col gap-2">
                {SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setValue(sug);
                      input.current?.focus();
                    }}
                    className="panel group flex items-center gap-3 p-3.5 text-left transition-colors hover:border-brand-navy"
                  >
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-soft"
                    >
                      <Icon name="sparkles" size={15} color="var(--color-accent-ink)" />
                    </span>
                    <span className="min-w-0 flex-1 text-[14px] type-meta text-text-primary">
                      {sug}
                    </span>
                    <Icon name="chevronRight" size={15} color="var(--color-text-neutral-400)" />
                  </button>
                ))}
              </div>
            </section>
            <section aria-label="Browse the catalogues">
              <h2 className="eyebrow text-[13px]">Rather browse?</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  to="/fast-hacks"
                  className="panel flex min-h-14 items-center justify-between gap-2 px-4 text-[14px] type-button text-brand-navy hover:border-brand-navy"
                >
                  Fast Hacks <Icon name="chevronRight" size={15} color="currentColor" />
                </Link>
                <Link
                  to="/recipes"
                  className="panel flex min-h-14 items-center justify-between gap-2 px-4 text-[14px] type-button text-brand-navy hover:border-brand-navy"
                >
                  Recipes <Icon name="chevronRight" size={15} color="currentColor" />
                </Link>
              </div>
            </section>
          </div>
          {fitsList.length > 0 && (
            <section aria-label="Fits your day" className="min-w-0">
              <h2 className="eyebrow text-[13px]">Fits your day</h2>
              <p className="mt-1 text-[13px] type-meta tabular-nums text-text-secondary">
                {budget.calories.remaining.toLocaleString("en-US")} kcal left · most protein first
              </p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {fitsList.map((h) => (
                  <HitCard
                    key={h.id}
                    hit={h}
                    fits
                    active={false}
                    why={whyFor(FITS_QUERY, h)}
                    onOpen={open}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </PageContainer>
  );
}

function ResultGroup({
  title,
  hits,
  query,
  emptyNote,
  activeId,
  budget,
  onOpen,
}: {
  title: string;
  hits: Hit[];
  query: string;
  emptyNote: string;
  activeId: string | null;
  budget: Budget;
  onOpen: (to: string) => void;
}) {
  return (
    <section aria-label={title}>
      <h2 className="eyebrow text-[13px]">
        {title} · {hits.length}
      </h2>
      {hits.length === 0 ? (
        <p className="mt-2 text-[13px] type-meta text-text-secondary">{emptyNote}</p>
      ) : (
        <ul className="mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {hits.map((h) => (
            <HitCard
              key={h.id}
              hit={h}
              fits={fitsToday(fitFor(h, budget))}
              active={activeId === h.id}
              why={whyFor(query, h)}
              onOpen={onOpen}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function HitCard({
  hit,
  fits,
  active,
  why,
  onOpen,
}: {
  hit: Hit;
  fits: boolean;
  active: boolean;
  why: string[];
  onOpen: (to: string) => void;
}) {
  return (
    <li id={`result-${hit.id}`}>
      <button
        type="button"
        onClick={() => onOpen(hit.to)}
        aria-current={active || undefined}
        className={cn(
          "panel group flex w-full items-center gap-3.5 p-3 text-left transition-colors hover:border-brand-navy",
          active && "border-primary",
        )}
      >
        <AppImage
          src={hit.image}
          alt=""
          sizes="88px"
          className="size-[4.5rem] shrink-0 rounded-xl object-cover"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] type-item-title text-text-primary">
            {hit.title}
          </span>
          <span className="block truncate text-[12px] type-meta text-text-secondary">
            {humanize(hit.subtitle)}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] tabular-nums">
            <span className="rounded-full bg-navy-50 px-2 py-0.5 text-brand-navy">
              {hit.calories} kcal
            </span>
            <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-brand-navy">
              {hit.protein} g protein
            </span>
            {fits && (
              <span className="rounded-full bg-positive px-2 py-0.5 text-positive-ink">
                Fits today
              </span>
            )}
          </span>
          {why.length > 0 && (
            <span className="mt-1 block truncate text-[12px] type-meta text-text-secondary">
              matched on {why.join(" · ")}
            </span>
          )}
        </span>
        <Icon name="chevronRight" size={16} color="var(--color-text-neutral-400)" />
      </button>
    </li>
  );
}
