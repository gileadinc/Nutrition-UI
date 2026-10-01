"use client";

import { useMemo, useState } from "react";
import {
  AppliedFilters,
  CategoryChips,
  CenteredShell,
  CheckList,
  ChipGroup,
  EmptyState,
  FilterSection,
  FilterSheet,
  FilterSidebar,
  FitsTodayToggle,
  FoodCard,
  ListPageSkeleton,
  ListingToolbar,
  PageContainer,
  RangeSlider,
  SectionTitle,
  StatePanel,
  matchesGroups,
  replaceInGroup,
} from "@/components";
import { getErrorMessage } from "@/lib/api";
import { useFilterParams } from "@/lib/hooks";
import { HACK_FILTER, fitFor } from "@/lib/nutrition";
import { useDayBudget, useFastHacks, useSaved } from "@/lib/store";
import { toHackVM, type HackVM } from "./adapt";

const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "calories", label: "Fewest calories" },
  { value: "protein", label: "Most protein" },
];

const GROUPS: Record<string, string[]> = {
  diet: [HACK_FILTER.lowCal, HACK_FILTER.vegan, HACK_FILTER.keto, HACK_FILTER.bowls],
};
const DEF = { maxCalories: 800, minProtein: 0 };
const FEATURED = 3;
const SPARSE = 2;

interface F {
  fitsToday: boolean;
  remainingCalories: number;
  tags: string[];
  restaurants: string[];
  maxCalories: number;
  minProtein: number;
}

const passes = (h: HackVM, f: F) =>
  !(
    (f.fitsToday && h.calories > f.remainingCalories) ||
    h.calories > f.maxCalories ||
    h.protein < f.minProtein ||
    !matchesGroups(GROUPS, f.tags, h.tags) ||
    (f.restaurants.length > 0 && !f.restaurants.includes(h.restaurant))
  );

const summary = (parts: (string | false)[]) => parts.filter(Boolean).join(", ") || "Any";

export function FastHacksScreen() {
  const f = useFilterParams({}, ["sort", "adv"]);
  const [open, setOpen] = useState(false);
  const { data, error, isLoading, refresh } = useFastHacks({ limit: 100 });
  const saved = useSaved();
  const { budget } = useDayBudget();
  const all = useMemo(() => (data?.items ?? []).map((h) => toHackVM(h)), [data]);
  const savedCount = saved.items.filter((i) => i.itemType === "fast_hack").length;

  if (isLoading && !data)
    return (
      <PageContainer className="max-w-7xl">
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
  };
  const countWith = (o: Partial<F>) => all.filter((h) => passes(h, { ...cur, ...o })).length;
  const dietOptions = GROUPS.diet.map((v) => ({
    value: v,
    label: v,
    count: countWith({ tags: replaceInGroup(GROUPS, cur.tags, v) }),
  }));
  const dietSelected = cur.tags.filter((t) => GROUPS.diet.includes(t));
  const restaurantOptions = [...new Set(all.map((h) => h.restaurant).filter(Boolean))]
    .sort()
    .map((r) => ({ value: r, label: r, count: countWith({ restaurants: [r] }) }));

  const results = all.filter((h) => passes(h, cur)).sort((a, b) => {
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
    ...cur.restaurants.map((r) => ({ label: r, remove: () => f.toggle("at", r) })),
  ];
  const resetFilters = () => f.clear(["fits", "tag", "kcal", "protein", "at", "adv"]);
  const clearAll = () => f.clear();
  const pristine = applied.length === 0 && sort === "recommended";
  const featured = pristine ? results.slice(0, FEATURED) : [];
  const rest = results.filter((h) => !featured.includes(h));
  const sparse = !pristine && results.length > 0 && results.length <= SPARSE;

  const seen = new Set<string>();
  const restaurants = results.filter((h) => h.restaurant && !seen.has(h.restaurant) && seen.add(h.restaurant));

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

  const card = (h: HackVM, layout: "rail" | "grid") => (
    <FoodCard
      key={h.id}
      layout={layout}
      image={h.image}
      title={h.title}
      subtitle={layout === "rail" ? h.restaurant : h.restaurant}
      brandName={h.restaurant}
      leadingBadge={
        layout === "rail" && h.distanceMi !== null ? `${h.distanceMi} mi` : undefined
      }
      badge={layout === "rail" ? h.restaurant : h.badge || undefined}
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
      <ListingToolbar
        title="Fast Hacks"
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
      <div className="mt-1 flex gap-8 md:mt-5">
        <FilterSidebar activeCount={applied.length} onReset={resetFilters}>
          {panel("panel-")}
        </FilterSidebar>
        <div className="@container min-w-0 flex-1">
          <div className="sticky top-0 z-20 -mx-5 border-b border-border-divider bg-brand-cream px-5 md:top-16 md:mx-0 md:px-0">
            <CategoryChips selected={f.get("meal")} onSelect={(c) => f.set("meal", c)} />
            <AppliedFilters filters={applied} onClearAll={resetFilters} />
          </div>
          {featured.length > 0 && (
            <section aria-label="Featured near you" className="mt-6">
              <SectionTitle action="See all" actionTo="/search">
                Featured near you
              </SectionTitle>
              <div className="rail-scroll -mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0 md:@2xl:grid md:@2xl:grid-cols-3 md:@2xl:gap-4 md:@2xl:overflow-visible">
                {featured.map((h) => card(h, "rail"))}
              </div>
            </section>
          )}
          {featured.length > 0 && rest.length > 0 && (
            <div className="mt-8 border-t border-border-divider pt-6">
              <SectionTitle>More options</SectionTitle>
            </div>
          )}
          <section aria-label="All results" className={featured.length > 0 ? "mt-3" : "mt-5"}>
            {results.length === 0 ? (
              <EmptyState
                icon="database"
                title="Nothing matches those filters"
                body={hint}
                action={{ label: "Clear filters", onPress: clearAll }}
              />
            ) : (
              <div className="grid auto-rows-fr grid-cols-2 gap-3 @2xl:grid-cols-3 @2xl:gap-4 @5xl:grid-cols-4">
                {rest.map((h) => card(h, "grid"))}
              </div>
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
                  className="-mx-2 min-h-11 rounded-full px-2 text-[13px] type-button text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
          {pristine && restaurants.length > 0 && (
            <section
              aria-label="Restaurants near you"
              className="mt-10 border-t border-border-divider pt-6"
            >
              <SectionTitle>Restaurants near you</SectionTitle>
              <div className="rail-scroll -mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0">
                {restaurants.map((h) => (
                  <RestaurantCard
                    key={h.restaurant}
                    hack={h}
                    count={results.filter((x) => x.restaurant === h.restaurant).length}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
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

function RestaurantCard({ hack, count }: { hack: HackVM; count: number }) {
  return (
    <FoodCard
      layout="rail"
      image={hack.image}
      title={hack.restaurant}
      subtitle={`${count} goal-friendly ${count === 1 ? "hack" : "hacks"} to order`}
      meta={hack.distanceMi !== null ? `${hack.distanceMi} mi` : ""}
      to={`/hack/${hack.id}`}
    />
  );
}
