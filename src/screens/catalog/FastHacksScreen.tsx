"use client";

import { useMemo, useState } from "react";
import {
  AppliedFilters,
  BudgetPills,
  CategoryPills,
  CenteredShell,
  CheckList,
  ChipGroup,
  EmptyState,
  FilterSection,
  FilterSheet,
  FitsTodayToggle,
  FoodCard,
  ListPageSkeleton,
  ListingToolbar,
  PageContainer,
  RangeSlider,
  StatePanel,
  matchesGroups,
  replaceInGroup,
} from "@/components";
import { getErrorMessage } from "@/lib/api";
import { useFilterParams } from "@/lib/hooks";
import { HACK_FILTER, fitFor } from "@/lib/nutrition";
import { useDayBudget, useFastHacks, useSaved } from "@/lib/store";
import { nearParams, useAskForLocation, useUserLocation } from "@/lib/location";
import { toHackVM, type HackVM } from "./adapt";

const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "calories", label: "Fewest calories" },
  { value: "protein", label: "Most protein" },
];

const GROUPS: Record<string, string[]> = {
  diet: [HACK_FILTER.lowCal, HACK_FILTER.vegan, HACK_FILTER.keto, HACK_FILTER.bowls],
  availability: [
    HACK_FILTER.nearby,
    HACK_FILTER.openNow,
    HACK_FILTER.freeDelivery,
    HACK_FILTER.deals,
  ],
  rating: [HACK_FILTER.topRated],
};
// The API has no rating, wait time, open-now, delivery or deals data, so those controls are shown but
// can't narrow results (chips stay disabled at 0). Distance only filters hacks that report one.
const DEF = { maxCalories: 800, minProtein: 0, maxDistance: 5, minRating: 0, maxEta: 45 };
const SPARSE = 2;

interface F {
  fitsToday: boolean;
  remainingCalories: number;
  tags: string[];
  restaurants: string[];
  maxCalories: number;
  minProtein: number;
  maxDistance: number;
  minRating: number;
  maxEta: number;
}

const passes = (h: HackVM, f: F) =>
  !(
    (f.fitsToday && h.calories > f.remainingCalories) ||
    (h.distanceMi != null && h.distanceMi > f.maxDistance) ||
    h.calories > f.maxCalories ||
    h.protein < f.minProtein ||
    !matchesGroups(GROUPS, f.tags, h.tags) ||
    (f.restaurants.length > 0 && !f.restaurants.includes(h.restaurant))
  );

const summary = (parts: (string | false)[]) => parts.filter(Boolean).join(", ") || "Any";

export function FastHacksScreen() {
  const f = useFilterParams({}, ["sort", "adv"]);
  const [open, setOpen] = useState(false);
  const { coords } = useUserLocation();
  useAskForLocation();
  const near = nearParams(coords);
  const { data, error, isLoading, refresh } = useFastHacks({ limit: 100, ...near });
  const saved = useSaved();
  const { budget } = useDayBudget();
  const all = useMemo(() => (data?.items ?? []).map((h) => toHackVM(h)), [data]);
  const savedCount = saved.items.filter((i) => i.itemType === "fast_hack").length;

  if (isLoading && !data)
    return (
      <PageContainer className="max-w-[1680px]">
        <ListPageSkeleton />
      </PageContainer>
    );
  if (error && !data)
    return (
      <CenteredShell>
        <StatePanel
          icon="alert"
          tone="error"
          title="Couldn't load Fast Hacks"
          body={getErrorMessage(error)}
          primary={{ label: "Try again", onPress: refresh }}
          secondary={{ label: "Go to Home", to: "/home" }}
        />
      </CenteredShell>
    );

  const sort = f.get("sort") ?? "recommended";
  const cur: F = {
    fitsToday: f.get("fits") === "1",
    remainingCalories: budget.calories.remaining,
    tags: f.getAll("tag"),
    restaurants: f.getAll("at"),
    maxCalories: f.getNumber("kcal", DEF.maxCalories),
    minProtein: f.getNumber("protein", DEF.minProtein),
    maxDistance: f.getNumber("mi", DEF.maxDistance),
    minRating: f.getNumber("rating", DEF.minRating),
    maxEta: f.getNumber("eta", DEF.maxEta),
  };
  const countWith = (o: Partial<F>) => all.filter((h) => passes(h, { ...cur, ...o })).length;
  const dietOptions = GROUPS.diet.map((v) => ({
    value: v,
    label: v,
    count: countWith({ tags: replaceInGroup(GROUPS, cur.tags, v) }),
  }));
  const optionsFor = (group: string) =>
    GROUPS[group].map((v) => ({
      value: v,
      label: v,
      count: countWith({ tags: replaceInGroup(GROUPS, cur.tags, v) }),
    }));
  const dietSelected = cur.tags.filter((t) => GROUPS.diet.includes(t));
  const availabilitySelected = cur.tags.filter((t) => GROUPS.availability.includes(t));
  const ratingSelected = cur.tags.filter((t) => GROUPS.rating.includes(t));
  const restaurantOptions = [...new Set(all.map((h) => h.restaurant).filter(Boolean))]
    .sort()
    .map((r) => ({ value: r, label: r, count: countWith({ restaurants: [r] }) }));

  const results = all
    .filter((h) => passes(h, cur))
    .sort((a, b) => {
      switch (sort) {
        case "calories":
          return a.calories - b.calories;
        case "protein":
          return b.protein - a.protein;
        default:
          return 0;
      }
    });

  const applied = [
    ...(cur.fitsToday ? [{ label: "Fits what's left", remove: () => f.set("fits", null) }] : []),
    ...cur.tags.map((t) => ({ label: t, remove: () => f.toggle("tag", t) })),
    ...(cur.maxCalories < DEF.maxCalories
      ? [{ label: `Under ${cur.maxCalories} kcal`, remove: () => f.set("kcal", null) }]
      : []),
    ...(cur.minProtein > 0
      ? [{ label: `${cur.minProtein}g+ protein`, remove: () => f.set("protein", null) }]
      : []),
    ...(cur.maxDistance < DEF.maxDistance
      ? [{ label: `Within ${cur.maxDistance} mi`, remove: () => f.set("mi", null) }]
      : []),
    ...(cur.minRating > 0
      ? [{ label: `${cur.minRating.toFixed(1)}★+`, remove: () => f.set("rating", null) }]
      : []),
    ...(cur.maxEta < DEF.maxEta
      ? [{ label: `Ready in ${cur.maxEta} min`, remove: () => f.set("eta", null) }]
      : []),
    ...cur.restaurants.map((r) => ({ label: r, remove: () => f.toggle("at", r) })),
  ];
  const resetFilters = () =>
    f.clear(["fits", "tag", "kcal", "protein", "mi", "rating", "eta", "at", "adv"]);
  const clearAll = () => f.clear();
  const sparse = applied.length > 0 && results.length > 0 && results.length <= SPARSE;

  const panel = (p: string) => (
    <>
      <FitsTodayToggle
        checked={cur.fitsToday}
        count={countWith({ fitsToday: true })}
        remaining={budget.calories.remaining}
        over={budget.calories.over}
        goal={budget.calories.goal}
        onChange={(on) => f.set("fits", on ? "1" : null)}
      />
      <FilterSection
        title="Diet & preferences"
        summary={summary([dietSelected.join(", ")])}
        active={dietSelected.length > 0}
        defaultOpen
      >
        <ChipGroup
          legend="Diet & preferences"
          options={dietOptions}
          selected={cur.tags}
          onToggle={(v) => f.toggle("tag", v)}
        />
      </FilterSection>
      <FilterSection
        title="Distance & availability"
        summary={summary([
          cur.maxDistance < DEF.maxDistance && `Up to ${cur.maxDistance} mi`,
          availabilitySelected.join(", "),
        ])}
        active={cur.maxDistance < DEF.maxDistance || availabilitySelected.length > 0}
        defaultOpen
      >
        <RangeSlider
          id={`${p}distance`}
          label="Distance"
          min={0.5}
          max={DEF.maxDistance}
          step={0.5}
          value={cur.maxDistance}
          format={(v) => (v >= DEF.maxDistance ? "Up to 5+ mi" : `Up to ${v} mi`)}
          onChange={(v) => f.setNumber("mi", v, DEF.maxDistance)}
        />
        <ChipGroup
          legend="Availability"
          showLegend
          options={optionsFor("availability")}
          selected={cur.tags}
          onToggle={(v) => f.toggle("tag", v)}
        />
      </FilterSection>
      <FilterSection
        title="Nutrition"
        summary={summary([
          cur.minProtein > 0 && `${cur.minProtein}g+ protein`,
          cur.maxCalories < DEF.maxCalories && `Under ${cur.maxCalories} kcal`,
        ])}
        active={cur.minProtein > 0 || cur.maxCalories < DEF.maxCalories}
      >
        <RangeSlider
          id={`${p}min-protein`}
          label="Protein floor"
          min={0}
          max={50}
          step={5}
          value={cur.minProtein}
          format={(v) => (v === 0 ? "Any" : `${v}g or more`)}
          onChange={(v) => f.setNumber("protein", v, DEF.minProtein)}
        />
        <RangeSlider
          id={`${p}max-calories`}
          label="Calorie ceiling"
          min={200}
          max={DEF.maxCalories}
          step={50}
          value={cur.maxCalories}
          format={(v) => (v >= DEF.maxCalories ? "Any" : `Under ${v} kcal`)}
          onChange={(v) => f.setNumber("kcal", v, DEF.maxCalories)}
        />
      </FilterSection>
      <FilterSection
        title="Rating & wait"
        summary={summary([
          cur.minRating > 0 && `${cur.minRating.toFixed(1)}★ and up`,
          ratingSelected.join(", "),
          cur.maxEta < DEF.maxEta && `Ready in ${cur.maxEta} min`,
        ])}
        active={cur.minRating > 0 || ratingSelected.length > 0 || cur.maxEta < DEF.maxEta}
      >
        <RangeSlider
          id={`${p}min-rating`}
          label="Rating"
          min={0}
          max={4.8}
          step={0.2}
          value={cur.minRating}
          format={(v) => (v === 0 ? "Any" : `${v.toFixed(1)}★ and up`)}
          onChange={(v) => f.setNumber("rating", v, DEF.minRating)}
        />
        <ChipGroup
          legend="Top rated"
          options={optionsFor("rating")}
          selected={cur.tags}
          onToggle={(v) => f.toggle("tag", v)}
        />
        <RangeSlider
          id={`${p}max-eta`}
          label="Ready within"
          min={5}
          max={DEF.maxEta}
          step={5}
          value={cur.maxEta}
          format={(v) => (v >= DEF.maxEta ? "Any wait" : `${v} min`)}
          onChange={(v) => f.setNumber("eta", v, DEF.maxEta)}
        />
      </FilterSection>
      <FilterSection
        title="Restaurant"
        summary={summary([cur.restaurants.join(", ")])}
        active={cur.restaurants.length > 0}
      >
        <CheckList
          legend="Restaurant"
          noun="restaurants"
          options={restaurantOptions}
          selected={cur.restaurants}
          onToggle={(v) => f.toggle("at", v)}
        />
      </FilterSection>
    </>
  );

  const card = (h: HackVM) => (
    <FoodCard
      key={h.id}
      layout="discover"
      image={h.image}
      title={h.title}
      subtitle={h.distanceMi !== null ? `${h.restaurant} · ${h.distanceMi} mi` : h.restaurant}
      brandName={h.restaurant}
      leadingBadge={h.distanceMi !== null ? `${h.distanceMi} mi` : undefined}
      badge={h.badge || undefined}
      meta={`${h.calories} kcal · ${h.protein}g protein`}
      fit={fitFor(h, budget)}
      saved={saved.isSaved("fast_hack", h.id)}
      onSave={() =>
        void saved.toggle({
          itemType: "fast_hack",
          itemId: h.id,
          title: h.title,
          subtitle: h.restaurant,
        })
      }
      to={`/hack/${h.id}`}
    />
  );

  const hint = cur.fitsToday
    ? "Turn off “Fits what's left today” to see more options."
    : "Remove a filter or pick another meal to see more options.";

  return (
    <PageContainer className="max-w-7xl">
      <section
        data-testid="catalogue-top-block"
        aria-label="Browse and filter"
        className="relative z-30 border-b border-border-divider bg-brand-cream pb-3 xl:sticky xl:top-16"
      >
        <ListingToolbar
          title="HackThis!"
          compact
          showDesktopFilters
          subtitle="Real restaurant orders adjusted for your goal."
          count={results.length}
          noun="hack"
          searchTo="/search?scope=hacks"
          savedCount={savedCount}
          savedTo="/you/saved?tab=hacks"
          activeCount={applied.length}
          filtersOpen={open}
          onOpenFilters={() => setOpen(true)}
          sort={sort}
          sortOptions={SORTS}
          onSort={(v) => f.set("sort", v === "recommended" ? null : v)}
        />
        <BudgetPills />
        <div className="mt-3">
          <CategoryPills
            selected={f.get("meal")}
            onSelect={(c) => f.set("meal", c)}
            counts={{ all: results.length }}
          />
        </div>
      </section>
      <AppliedFilters filters={applied} onClearAll={resetFilters} />
      <div className="@container min-w-0 flex-1">
        <section aria-label="All results" className="mt-4">
          {results.length === 0 ? (
            <EmptyState
              icon="database"
              title="Nothing matches those filters"
              body={hint}
              action={{ label: "Clear filters", onPress: clearAll }}
            />
          ) : (
            <ul
              aria-label="Hack results"
              className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4"
            >
              {results.map((h) => (
                <li key={h.id} className="min-w-0">
                  {card(h)}
                </li>
              ))}
            </ul>
          )}
          {sparse && (
            <div
              data-testid="sparse-note"
              className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border-divider pt-4"
            >
              <p className="text-[13px] leading-5 type-meta text-text-secondary">
                {results.length === 1
                  ? "Only one option matches."
                  : `Only ${results.length} options match.`}{" "}
                {hint}
              </p>
              <button
                type="button"
                onClick={clearAll}
                className="min-h-11 rounded-full border border-border-default bg-white px-4 text-[13px] type-button text-primary hover:border-text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>
      <FilterSheet
        open={open}
        onClose={() => setOpen(false)}
        label="Filter Fast Hacks"
        activeCount={applied.length}
        onReset={resetFilters}
        resultLabel={`Show ${results.length} ${results.length === 1 ? "result" : "results"}`}
      >
        {panel("sheet-")}
      </FilterSheet>
    </PageContainer>
  );
}
