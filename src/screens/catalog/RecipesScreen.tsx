"use client";

import { useMemo, useState } from "react";
import {
  AppliedFilters,
  CategoryChips,
  ChipGroup,
  EmptyState,
  FilterSection,
  FilterSheet,
  FilterSidebar,
  FitsTodayToggle,
  ListPageSkeleton,
  ListingToolbar,
  PageContainer,
  RangeSlider,
  SectionTitle,
  StatePanel,
  CenteredShell,
  FoodCard,
  RatingBadge,
  matchesGroups,
  replaceInGroup,
  groupOf,
} from "@/components";
import { useFilterParams } from "@/lib/hooks";
import { RECIPE_FILTER, dietaryMatch, fitFor } from "@/lib/nutrition";
import { useDayBudget, useProfile, useRecipes, useSaved } from "@/lib/store";
import { getErrorMessage } from "@/lib/api";
import { toRecipeVM, type RecipeVM } from "./adapt";

const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "quickest", label: "Quickest" },
  { value: "calories", label: "Fewest calories" },
  { value: "protein", label: "Most protein" },
  { value: "simplest", label: "Fewest ingredients" },
];

const GROUPS: Record<string, string[]> = {
  diet: [RECIPE_FILTER.highProtein, RECIPE_FILTER.underCalories, RECIPE_FILTER.veggie],
  effort: [RECIPE_FILTER.quickEasy, RECIPE_FILTER.mealPrep],
};
// Derived in `toRecipeVM` (the API has no difficulty field).
const DIFFICULTIES = ["Easy", "Medium"];
const DEF = { maxMinutes: 60, maxCalories: 800, minProtein: 0, maxIngredients: 12 };
const FEATURED = 3;
const SPARSE = 2;

interface F {
  fitsToday: boolean;
  remainingCalories: number;
  category: string | null;
  tags: string[];
  difficulties: string[];
  maxMinutes: number;
  maxCalories: number;
  minProtein: number;
  maxIngredients: number;
}

const passes = (r: RecipeVM, f: F) =>
  !(
    (f.fitsToday && r.calories > f.remainingCalories) ||
    (f.category !== null && r.category !== f.category) ||
    (f.difficulties.length > 0 && !f.difficulties.includes(r.badge)) ||
    (r.minutes > 0 && r.minutes > f.maxMinutes) ||
    r.calories > f.maxCalories ||
    r.protein < f.minProtein ||
    r.ingredients.length > f.maxIngredients ||
    !matchesGroups(GROUPS, f.tags, r.tags)
  );

const summary = (parts: (string | false)[]) => parts.filter(Boolean).join(", ") || "Any";

export function RecipesScreen() {
  const f = useFilterParams({}, ["sort", "adv"]);
  const [open, setOpen] = useState(false);
  const { data, error, isLoading, refresh } = useRecipes({ limit: 100 });
  const saved = useSaved();
  const { profile } = useProfile();
  const { budget } = useDayBudget();
  const prefs = profile?.dietaryPreferences ?? [];
  const allergies = profile?.allergies ?? [];

  const all = useMemo(() => (data?.items ?? []).map(toRecipeVM), [data]);
  const savedCount = saved.items.filter((i) => i.itemType === "recipe").length;

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
          title="Couldn't load recipes"
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
    category: f.get("meal"),
    tags: f.getAll("tag"),
    difficulties: f.getAll("level"),
    maxMinutes: f.getNumber("mins", DEF.maxMinutes),
    maxCalories: f.getNumber("kcal", DEF.maxCalories),
    minProtein: f.getNumber("protein", DEF.minProtein),
    maxIngredients: f.getNumber("items", DEF.maxIngredients),
  };
  const countWith = (o: Partial<F>) => all.filter((r) => passes(r, { ...cur, ...o })).length;
  const facet = (g: string) =>
    GROUPS[g].map((v) => ({
      value: v,
      label: v,
      count: countWith({ tags: replaceInGroup(GROUPS, cur.tags, v) }),
    }));
  const inGroup = (g: string) => cur.tags.filter((t) => groupOf(GROUPS, t) === g);

  const results = all.filter((r) => passes(r, cur)).sort((a, b) => {
    switch (sort) {
      case "quickest":
        return a.minutes - b.minutes;
      case "calories":
        return a.calories - b.calories;
      case "protein":
        return b.protein - a.protein;
      case "simplest":
        return a.ingredients.length - b.ingredients.length;
      default:
        return dietaryMatch.matchScore(b, prefs) - dietaryMatch.matchScore(a, prefs);
    }
  });

  const applied = [
    ...(cur.fitsToday ? [{ label: "Fits what's left", remove: () => f.set("fits", null) }] : []),
    ...cur.tags.map((t) => ({ label: t, remove: () => f.toggle("tag", t) })),
    ...cur.difficulties.map((d) => ({ label: d, remove: () => f.toggle("level", d) })),
    ...(cur.maxMinutes < DEF.maxMinutes
      ? [{ label: `Under ${cur.maxMinutes} min`, remove: () => f.set("mins", null) }]
      : []),
    ...(cur.maxCalories < DEF.maxCalories
      ? [{ label: `Under ${cur.maxCalories} kcal`, remove: () => f.set("kcal", null) }]
      : []),
    ...(cur.minProtein > 0
      ? [{ label: `${cur.minProtein}g+ protein`, remove: () => f.set("protein", null) }]
      : []),
    ...(cur.maxIngredients < DEF.maxIngredients
      ? [
          {
            label: `${cur.maxIngredients} ingredients or fewer`,
            remove: () => f.set("items", null),
          },
        ]
      : []),
  ];
  const filterKeys = ["fits", "tag", "level", "mins", "kcal", "protein", "items", "adv"];
  const resetFilters = () => f.clear(filterKeys);
  const clearAll = () => f.clear();
  const pristine = applied.length === 0 && cur.category === null && sort === "recommended";
  const featured = pristine ? results.slice(0, FEATURED) : [];
  const rest = results.filter((r) => !featured.includes(r));
  const sparse = !pristine && results.length > 0 && results.length <= SPARSE;

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
        title="Diet & goals"
        summary={summary([inGroup("diet").join(", ")])}
        active={inGroup("diet").length > 0}
        defaultOpen
      >
        <ChipGroup
          legend="Diet & goals"
          options={facet("diet")}
          selected={cur.tags}
          onToggle={(v) => f.toggle("tag", v)}
        />
      </FilterSection>
      <FilterSection
        title="Time & effort"
        summary={summary([
          cur.maxMinutes < DEF.maxMinutes && `Under ${cur.maxMinutes} min`,
          cur.difficulties.join(", "),
          inGroup("effort").join(", "),
        ])}
        active={
          cur.maxMinutes < DEF.maxMinutes || cur.difficulties.length > 0 || inGroup("effort").length > 0
        }
        defaultOpen
      >
        <RangeSlider
          id={`${p}max-minutes`}
          label="Time"
          min={5}
          max={DEF.maxMinutes}
          step={5}
          value={cur.maxMinutes}
          format={(v) => (v >= DEF.maxMinutes ? "Any" : `Under ${v} min`)}
          onChange={(v) => f.setNumber("mins", v, DEF.maxMinutes)}
        />
        <ChipGroup
          legend="Difficulty"
          showLegend
          options={DIFFICULTIES.map((d) => ({
            value: d,
            label: d,
            count: countWith({ difficulties: [d] }),
          }))}
          selected={cur.difficulties}
          onToggle={(v) => f.toggle("level", v)}
        />
        <ChipGroup
          legend="Style"
          showLegend
          options={facet("effort")}
          selected={cur.tags}
          onToggle={(v) => f.toggle("tag", v)}
        />
      </FilterSection>
      <FilterSection
        title="Nutrition & shopping"
        summary={summary([
          cur.minProtein > 0 && `${cur.minProtein}g+ protein`,
          cur.maxCalories < DEF.maxCalories && `Under ${cur.maxCalories} kcal`,
          cur.maxIngredients < DEF.maxIngredients && `${cur.maxIngredients} ingredients or fewer`,
        ])}
        active={
          cur.minProtein > 0 ||
          cur.maxCalories < DEF.maxCalories ||
          cur.maxIngredients < DEF.maxIngredients
        }
      >
        <RangeSlider
          id={`${p}recipe-protein`}
          label="Protein floor"
          min={0}
          max={50}
          step={5}
          value={cur.minProtein}
          format={(v) => (v === 0 ? "Any" : `${v}g or more`)}
          onChange={(v) => f.setNumber("protein", v, DEF.minProtein)}
        />
        <RangeSlider
          id={`${p}recipe-calories`}
          label="Calorie ceiling"
          min={200}
          max={DEF.maxCalories}
          step={50}
          value={cur.maxCalories}
          format={(v) => (v >= DEF.maxCalories ? "Any" : `Under ${v} kcal`)}
          onChange={(v) => f.setNumber("kcal", v, DEF.maxCalories)}
        />
        <RangeSlider
          id={`${p}max-ingredients`}
          label="Shopping load"
          min={3}
          max={DEF.maxIngredients}
          step={1}
          value={cur.maxIngredients}
          format={(v) => (v >= DEF.maxIngredients ? "Any" : `${v} ingredients or fewer`)}
          onChange={(v) => f.setNumber("items", v, DEF.maxIngredients)}
        />
      </FilterSection>
      {allergies.length > 0 && (
        <p className="my-4 rounded-xl bg-missed-dose-surface p-3 text-onb-meta type-meta text-text-primary">
          Recipes naming {allergies.length === 1 ? "your allergen" : "your allergens"} are flagged
          on the recipe itself. We can&apos;t confirm anything is free of them.
        </p>
      )}
    </>
  );

  const card = (r: RecipeVM, layout: "rail" | "grid") => (
    <FoodCard
      key={r.id}
      layout={layout}
      image={r.image}
      title={r.title}
      subtitle={layout === "grid" ? r.time : undefined}
      leadingBadge={layout === "rail" ? r.time || undefined : undefined}
      badge={r.badge || undefined}
      meta={
        <>
          {r.ratingCount > 0 && (
            <>
              <RatingBadge average={r.averageRating} count={r.ratingCount} />
              {" · "}
            </>
          )}
          {`${r.calories} kcal · ${r.protein}g protein`}
        </>
      }
      fit={fitFor(r, budget)}
      saved={saved.isSaved("recipe", r.id)}
      onSave={() =>
        void saved.toggle({
          itemType: "recipe",
          itemId: r.id,
          title: r.title,
          subtitle: r.time,
        })
      }
      to={`/recipes/${r.id}`}
    />
  );

  const hint = cur.fitsToday
    ? "Turn off “Fits what's left today” or allow more time to see more recipes."
    : "Remove a filter or pick another meal to see the full catalogue.";

  return (
    <PageContainer className="max-w-[1680px]">
      <ListingToolbar
        title="Recipes"
        subtitle="Delicious, healthy meals to hit your goals."
        count={results.length}
        noun="recipe"
        searchTo="/search?scope=recipes"
        savedCount={savedCount}
        savedTo="/you/saved?tab=recipes"
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
            <CategoryChips variant="pills" selected={cur.category} onSelect={(c) => f.set("meal", c)} />
            <AppliedFilters filters={applied} onClearAll={resetFilters} />
          </div>
          {featured.length > 0 && (
            <section aria-label="Featured for you" className="mt-6">
              <SectionTitle action="See all" actionTo="/search?scope=recipes">
                Featured for you
              </SectionTitle>
              <div className="rail-scroll -mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0 md:@2xl:grid md:@2xl:grid-cols-3 md:@2xl:gap-4 md:@2xl:overflow-visible md:[&>*]:w-64! md:@2xl:[&>*]:w-auto!">
                {featured.map((r) => card(r, "rail"))}
              </div>
            </section>
          )}
          {featured.length > 0 && rest.length > 0 && (
            <div className="mt-8 border-t border-border-divider pt-6">
              <SectionTitle>More recipes</SectionTitle>
            </div>
          )}
          <section aria-label="Recipe results" className={featured.length > 0 ? "mt-3" : "mt-5"}>
            {results.length === 0 ? (
              <EmptyState
                icon="database"
                title="No recipes match that"
                body={hint}
                action={{ label: "Clear filters", onPress: clearAll }}
              />
            ) : (
              <div className="grid auto-rows-fr grid-cols-2 gap-3 @2xl:grid-cols-3 @2xl:gap-4 @5xl:grid-cols-4">
                {rest.map((r) => card(r, "grid"))}
              </div>
            )}
            {sparse && (
              <div
                data-testid="sparse-note"
                className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border-divider pt-4"
              >
                <p className="text-onb-meta type-meta text-text-secondary">
                  {results.length === 1
                    ? "Only one recipe matches."
                    : `Only ${results.length} recipes match.`}{" "}
                  {hint}
                </p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="min-h-11 rounded-full border border-border-default bg-white px-4 text-onb-meta type-button text-primary hover:border-text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
      <FilterSheet
        open={open}
        onClose={() => setOpen(false)}
        label="Filter recipes"
        activeCount={applied.length}
        onReset={resetFilters}
        resultLabel={`Show ${results.length} ${results.length === 1 ? "recipe" : "recipes"}`}
      >
        {panel("sheet-")}
      </FilterSheet>
    </PageContainer>
  );
}
