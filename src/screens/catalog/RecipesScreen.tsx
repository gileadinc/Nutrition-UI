"use client";

import { useMemo, useState } from "react";
import {
  AppliedFilters,
  BudgetPills,
  CategoryPills,
  CenteredShell,
  ChipGroup,
  EmptyState,
  FilterSection,
  FilterSheet,
  FitsTodayToggle,
  FoodCard,
  Icon,
  ListPageSkeleton,
  ListingToolbar,
  PageContainer,
  QuickPicks,
  RangeSlider,
  SectionTitle,
  StatePanel,
  matchesGroups,
  replaceInGroup,
  groupOf,
} from "@/components";
import { useFilterParams } from "@/lib/hooks";
import { Link } from "@/lib/nav";
import { recipeNutrition, useCustomRecipes } from "@/lib/store/customRecipes";
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
const MEALS = ["breakfast", "lunch", "dinner", "snack", "dessert"] as const;
const DEF = { maxMinutes: 999, maxCalories: 800, minProtein: 0, maxIngredients: 12 };
const SPARSE = 2;

interface F {
  fitsToday: boolean;
  remainingCalories: number;
  category: string | null;
  tags: string[];
  maxMinutes: number;
  maxCalories: number;
  minProtein: number;
  maxIngredients: number;
}

const passes = (r: RecipeVM, f: F) =>
  !(
    (f.fitsToday && r.calories > f.remainingCalories) ||
    (f.category !== null && r.category !== f.category) ||
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
  const mine = useCustomRecipes();

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
    maxMinutes: f.getNumber("mins", DEF.maxMinutes),
    maxCalories: f.getNumber("kcal", DEF.maxCalories),
    minProtein: f.getNumber("protein", DEF.minProtein),
    maxIngredients: f.getNumber("items", DEF.maxIngredients),
  };
  const countWith = (o: Partial<F>) => all.filter((r) => passes(r, { ...cur, ...o })).length;
  const dietOptions = GROUPS.diet.map((v) => ({
    value: v,
    label: v,
    count: countWith({ tags: replaceInGroup(GROUPS, cur.tags, v) }),
  }));
  const dietSelected = cur.tags.filter((t) => groupOf(GROUPS, t) === "diet");

  const results = all
    .filter((r) => passes(r, cur))
    .sort((a, b) => {
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
    ...(cur.maxCalories < DEF.maxCalories
      ? [{ label: `Under ${cur.maxCalories} kcal`, remove: () => f.set("kcal", null) }]
      : []),
    ...(cur.minProtein > 0
      ? [{ label: `${cur.minProtein}g+ protein`, remove: () => f.set("protein", null) }]
      : []),
    ...(cur.maxMinutes < DEF.maxMinutes
      ? [{ label: `Ready in ${cur.maxMinutes} min or less`, remove: () => f.set("mins", null) }]
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
  const filterKeys = ["fits", "tag", "kcal", "protein", "items", "mins", "adv"];
  const resetFilters = () => f.clear(filterKeys);
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
      <QuickPicks
        options={[
          {
            label: "30g+ protein",
            pressed: cur.minProtein === 30,
            count: countWith({ minProtein: 30 }),
            onPress: () => f.setNumber("protein", cur.minProtein === 30 ? 0 : 30, DEF.minProtein),
          },
          {
            label: "Under 500 kcal",
            pressed: cur.maxCalories === 500,
            count: countWith({ maxCalories: 500 }),
            onPress: () =>
              f.setNumber("kcal", cur.maxCalories === 500 ? DEF.maxCalories : 500, DEF.maxCalories),
          },
          {
            label: "8 ingredients or fewer",
            pressed: cur.maxIngredients === 8,
            count: countWith({ maxIngredients: 8 }),
            onPress: () =>
              f.setNumber(
                "items",
                cur.maxIngredients === 8 ? DEF.maxIngredients : 8,
                DEF.maxIngredients,
              ),
          },
        ]}
      />
      <FilterSection
        title="Diet & goals"
        summary={summary([dietSelected.join(", ")])}
        active={dietSelected.length > 0}
        defaultOpen
      >
        <ChipGroup
          legend="Diet & goals"
          options={dietOptions}
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

  const card = (r: RecipeVM) => (
    <FoodCard
      key={r.id}
      layout="discover"
      image={r.image}
      title={r.title}
      subtitle={[r.time, r.badge].filter(Boolean).join(" · ") || undefined}
      leadingBadge={r.time || undefined}
      badge={r.badge || undefined}
      meta={`${r.calories} kcal · ${r.protein}g protein`}
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
    <PageContainer className="max-w-7xl">
      <section
        data-testid="catalogue-top-block"
        aria-label="Browse and filter"
        className="relative z-30 border-b border-border-divider bg-brand-cream pb-3 xl:sticky xl:top-16"
      >
        <ListingToolbar
          title="CookThis!"
          compact
          showDesktopFilters
          actions={
            <Link
              to="/recipes/new"
              aria-label="New recipe"
              className="tap-44 relative flex h-11 items-center gap-1.5 rounded-full bg-primary px-3 text-[13px] type-button text-white md:px-4"
            >
              <Icon name="plusSign" size={14} color="currentColor" />
              <span className="hidden md:inline">New recipe</span>
            </Link>
          }
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
        <BudgetPills />
        <div className="mt-3">
          <CategoryPills
            selected={cur.category}
            onSelect={(c) => f.set("meal", c)}
            counts={{
              all: countWith({ category: null }),
              ...Object.fromEntries(MEALS.map((m) => [m, countWith({ category: m })])),
            }}
          />
        </div>
      </section>
      <AppliedFilters filters={applied} onClearAll={resetFilters} />
      <div className="@container min-w-0 flex-1">
        {mine.length > 0 && (
          <section aria-label="My recipes" className="mt-6">
            <SectionTitle>My recipes</SectionTitle>
            <div className="rail-scroll -mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0 md:@2xl:grid md:@2xl:grid-cols-3 md:@2xl:gap-4 md:@2xl:overflow-visible md:[&>*]:w-64! md:@2xl:[&>*]:w-auto!">
              {mine.map((r) => {
                const n = recipeNutrition(r);
                return (
                  <FoodCard
                    key={r.id}
                    image={r.photo}
                    title={r.title}
                    leadingBadge="Mine"
                    badge={`${r.servings} ${r.servings === 1 ? "serving" : "servings"}`}
                    meta={`${n.perServing.calories} kcal · ${Math.round(n.perServing.protein)}g protein`}
                    to={`/recipes/mine/${r.id}`}
                    layout="rail"
                  />
                );
              })}
            </div>
          </section>
        )}
        <section aria-label="Recipe results" className="mt-4">
          {results.length === 0 ? (
            <EmptyState
              icon="search"
              title="No recipes match that"
              body={hint}
              action={{ label: "Clear filters", onPress: clearAll }}
            />
          ) : (
            <ul
              aria-label="Recipes"
              className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4"
            >
              {results.map((r) => (
                <li key={r.id} className="min-w-0">
                  {card(r)}
                </li>
              ))}
            </ul>
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
