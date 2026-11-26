"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, PageContainer, SearchField } from "@/components";
import { AppImage } from "@/components/AppImage";
import { discoveryApi, getErrorMessage, type MenuItem, type Recipe } from "@/lib/api";
import { useDebouncedValue } from "@/lib/hooks";
import { Link, useNavigate, useSearchParams } from "@/lib/nav";
import { fitFor, fitsToday, type Budget } from "@/lib/nutrition";
import { useAllFastHacks, useAllRecipes, useDayBudget, useRecentSearches } from "@/lib/store";
import { nearParams, useUserLocation } from "@/lib/location";
import { cn } from "@/lib/utils";
import { SELECTED_CHIP } from "@/components/styles";
import {
  humanize,
  menuItemToHack,
  toHackVM,
  toRecipeVM,
  type HackVM,
  type RecipeVM,
} from "./adapt";

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

/** What a free-text query asks for: loose words plus numeric / dietary limits. */
interface Parsed {
  terms: string[];
  minProtein: number | null;
  maxCalories: number | null;
  maxMinutes: number | null;
  diets: string[];
}

const FILLER = new Set(
  (
    "a an the i me my we can could would should will to for of on at in with and or but " +
    "something anything nearby near grab get find show give some want need looking " +
    "meal meals food dinner lunch breakfast snack tonight today now quick quickly cook cooking eat"
  ).split(" "),
);

function parseQuery(query: string): Parsed {
  let rest = ` ${query.toLowerCase()} `;
  const take = (re: RegExp) => {
    const m = rest.match(re);
    if (m) rest = rest.replace(re, " ");
    return m;
  };
  const out: Parsed = {
    terms: [],
    minProtein: null,
    maxCalories: null,
    maxMinutes: null,
    diets: [],
  };
  const grams = take(/\s(\d+)\s*g\+?\s*protein\s/);
  if (grams) out.minProtein = Number(grams[1]);
  else if (take(/\shigh[- ]protein\s/)) out.minProtein = 25;
  const mins = take(/\s(?:under|below|within|in|less than)\s*(\d+)\s*(?:minutes|mins|min)\s/);
  if (mins) out.maxMinutes = Number(mins[1]);
  const kcal = take(/\s(?:under|below|less than)\s*(\d+)\s*(?:calories|kcal|cal)?\s/);
  if (kcal) out.maxCalories = Number(kcal[1]);
  if (take(/\svegetarian\s/)) out.diets.push("Vegetarian");
  if (take(/\svegan\s/)) out.diets.push("Vegan");
  if (take(/\slow[- ]carb\s/)) out.diets.push("Low carb");
  out.terms = rest.split(/[^a-z0-9&-]+/).filter((w) => w.length > 1 && !FILLER.has(w));
  return out;
}

const understoodAs = (p: Parsed) => [
  ...p.terms.map((t) => `\u201c${t}\u201d`),
  ...(p.minProtein ? [`${p.minProtein} g+ protein`] : []),
  ...(p.maxCalories ? [`Under ${p.maxCalories} kcal`] : []),
  ...(p.maxMinutes ? [`Under ${p.maxMinutes} min`] : []),
  ...p.diets,
];

/** Does a hit satisfy the numeric / dietary limits in the query? */
function matchesLimits(h: Hit, p: Parsed) {
  if (p.minProtein != null && h.protein < p.minProtein) return false;
  if (p.maxCalories != null && !(h.calories > 0 && h.calories <= p.maxCalories)) return false;
  if (p.maxMinutes != null && h.minutes != null && h.minutes > p.maxMinutes) return false;
  for (const d of p.diets) {
    if (d === "Low carb" && !(h.carbs > 0 && h.carbs <= (h.minutes != null ? 30 : 35)))
      return false;
    if ((d === "Vegetarian" || d === "Vegan") && !h.tags.some((t) => /veg|plant/i.test(t)))
      return false;
  }
  return true;
}

/** Which numbers a hit was matched on, for the "matched on ..." line. */
const whyFor = (p: Parsed, h: { calories: number; protein: number }) => {
  const why: string[] = [];
  if (p.maxCalories != null) why.push(`${h.calories} kcal`);
  if (p.minProtein != null) why.push(`${h.protein}g protein`);
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
  carbs: number;
  /** Recipes only. */
  minutes: number | null;
  tags: string[];
  to: string;
}

const hackToHit = (h: HackVM): Hit => ({
  id: h.id,
  title: h.title,
  subtitle: [h.restaurant, h.distanceMi != null ? `${h.distanceMi} mi` : null]
    .filter(Boolean)
    .join(" · "),
  image: h.image,
  calories: h.calories,
  protein: h.protein,
  carbs: h.carbs,
  minutes: null,
  tags: h.tags,
  to: `/hack/${h.id}`,
});

const recipeToHit = (r: RecipeVM): Hit => ({
  id: r.id,
  title: r.title,
  subtitle: [r.time, r.badge].filter(Boolean).join(" · ") || "Recipe",
  image: r.image,
  calories: r.calories,
  protein: r.protein,
  carbs: r.carbs,
  minutes: r.minutes,
  tags: r.tags,
  to: `/recipes/${r.id}`,
});

function toHits(items: unknown[]): { hacks: Hit[]; recipes: Hit[] } {
  const hacks: Hit[] = [];
  const recipes: Hit[] = [];
  for (const raw of items) {
    const it = raw as { type?: string };
    if (it.type === "recipe") recipes.push(recipeToHit(toRecipeVM(raw as Recipe)));
    else if (it.type === "menu_item" || it.type === "fast_hack")
      hacks.push(hackToHit(menuItemToHack(raw as MenuItem)));
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
  const parsed = useMemo(() => parseQuery(q), [q]);
  const termsKey = parsed.terms.join(" ");
  const debouncedTerms = useDebouncedValue(termsKey, 250);
  const [state, setState] = useState<{
    forQuery: string;
    hacks: Hit[];
    recipes: Hit[];
    error: string | null;
  }>({ forQuery: "", hacks: [], recipes: [], error: null });
  const { coords } = useUserLocation();
  const hacksRes = useAllFastHacks(nearParams(coords));
  const recipesRes = useAllRecipes();

  // Free-text words go to the backend search; numeric and dietary limits are applied below.
  useEffect(() => {
    if (!debouncedTerms) return;
    let off = false;
    discoveryApi
      .searchDiscovery({
        query: debouncedTerms,
        limit: 30,
        type: scope === "recipes" ? "recipe" : scope === "hacks" ? "menu_item" : undefined,
      })
      .then((res) => {
        if (!off) setState({ forQuery: debouncedTerms + scope, ...toHits(res.items), error: null });
      })
      .catch((err) => {
        if (!off)
          setState({
            forQuery: debouncedTerms + scope,
            hacks: [],
            recipes: [],
            error: getErrorMessage(err),
          });
      });
    return () => {
      off = true;
    };
  }, [debouncedTerms, scope]);

  // The catalogue: used when the query has no free-text words ("high protein") and for "Fits your day".
  const catalogue = useMemo(
    () => ({
      hacks: (hacksRes.data?.items ?? []).map((raw) => hackToHit(toHackVM(raw))),
      recipes: (recipesRes.data?.items ?? []).map((raw) => recipeToHit(toRecipeVM(raw))),
    }),
    [hacksRes.data, recipesRes.data],
  );

  // "Fits your day": high-protein, under-500 picks that still fit today's budget.
  const fitsParsed = useMemo(() => parseQuery(FITS_QUERY), []);
  const fitsList = useMemo(
    () =>
      [...catalogue.hacks, ...catalogue.recipes]
        .filter((h) => matchesLimits(h, fitsParsed))
        .filter((h) => fitsToday(fitFor(h, budget)))
        .sort((x, y) => y.protein - x.protein)
        .slice(0, 4),
    [catalogue, budget, fitsParsed],
  );

  const byText = termsKey !== "";
  const fresh =
    q !== "" &&
    (byText
      ? state.forQuery === debouncedTerms + scope && debouncedTerms === termsKey
      : !(hacksRes.isLoading || recipesRes.isLoading));
  const showHacks = scope !== "recipes" && show !== "recipes";
  const showRecipes = scope !== "hacks" && show !== "hacks";
  const hacks = useMemo(() => {
    if (!fresh || scope === "recipes") return [];
    return (byText ? state.hacks : catalogue.hacks).filter((h) => matchesLimits(h, parsed));
  }, [fresh, scope, byText, state, catalogue, parsed]);
  const recipes = useMemo(() => {
    if (!fresh || scope === "hacks") return [];
    return (byText ? state.recipes : catalogue.recipes).filter((h) => matchesLimits(h, parsed));
  }, [fresh, scope, byText, state, catalogue, parsed]);
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
  const understood = understoodAs(parsed);
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
        ) : byText && state.error ? (
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
            {understood.length > 0 && (
              <p className="flex flex-wrap items-center gap-2 text-[12px] type-meta text-text-secondary">
                Understood as
                {understood.map((u) => (
                  <span key={u} className="rounded-full bg-navy-50 px-2.5 py-1 text-brand-navy">
                    {u}
                  </span>
                ))}
              </p>
            )}
            {showHacks && (
              <ResultGroup
                title="Eat out"
                hits={hacks}
                parsed={parsed}
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
                parsed={parsed}
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
                    why={whyFor(fitsParsed, h)}
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
  parsed,
  emptyNote,
  activeId,
  budget,
  onOpen,
}: {
  title: string;
  hits: Hit[];
  parsed: Parsed;
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
              why={whyFor(parsed, h)}
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
