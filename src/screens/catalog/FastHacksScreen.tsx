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
  QuickPicks,
  RangeSlider,
  StatePanel,
} from "@/components";
import { getErrorMessage } from "@/lib/api";
import { useFilterParams } from "@/lib/hooks";
import { fitFor } from "@/lib/nutrition";
import { useDayBudget, useFastHacks, useSaved } from "@/lib/store";
import { nearParams, useAskForLocation, useUserLocation } from "@/lib/location";
import { mealOfHack, toHackVM, type HackVM } from "./adapt";

const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "calories", label: "Fewest calories" },
  { value: "protein", label: "Most protein" },
];

/** Goal focus chips: a hack matches when it satisfies any selected goal. */
const GOALS: Record<string, (h: HackVM) => boolean> = {
  "High protein": (h) => h.protein >= 30,
  "Lower carb": (h) => h.carbs <= 30,
  "Under 500 kcal": (h) => h.calories < 500,
};
const MEALS = [
  { value: "breakfast", label: "Breakfast", icon: "mealBreakfast" },
  { value: "lunch", label: "Lunch", icon: "mealLunch" },
  { value: "dinner", label: "Dinner", icon: "mealDinner" },
  { value: "snack", label: "Snacks", icon: "mealSnack" },
] as const;
const DEF = { maxCalories: 1000, minProtein: 0 };
const SPARSE = 2;

interface F {
  meal: string | null;
  fitsToday: boolean;
  remainingCalories: number;
  goals: string[];
  restaurants: string[];
  maxCalories: number;
  minProtein: number;
}

const passes = (h: HackVM, f: F) =>
  !(
    (f.meal !== null && mealOfHack(h) !== f.meal) ||
    (f.fitsToday && h.calories > f.remainingCalories) ||
    h.calories > f.maxCalories ||
    h.protein < f.minProtein ||
    (f.goals.length > 0 && !f.goals.some((g) => GOALS[g]?.(h))) ||
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
    meal: f.get("meal"),
    fitsToday: f.get("fits") === "1",
    remainingCalories: budget.calories.remaining,
    goals: f.getAll("goal"),
    restaurants: f.getAll("at"),
    maxCalories: f.getNumber("kcal", DEF.maxCalories),
    minProtein: f.getNumber("protein", DEF.minProtein),
  };
  const countWith = (o: Partial<F>) => all.filter((h) => passes(h, { ...cur, ...o })).length;
  const goalOptions = Object.keys(GOALS).map((v) => ({
    value: v,
    label: v,
    count: countWith({ goals: [...cur.goals.filter((g) => g !== v), v] }),
  }));
  const mealOptions = MEALS.map((m) => ({
    value: m.value,
    label: m.label,
    icon: m.icon,
    count: countWith({ meal: m.value }),
  }));
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
    ...cur.goals.map((g) => ({ label: g, remove: () => f.toggle("goal", g) })),
    ...cur.restaurants.map((r) => ({ label: r, remove: () => f.toggle("at", r) })),
    ...(cur.maxCalories < DEF.maxCalories
      ? [{ label: `Under ${cur.maxCalories} kcal`, remove: () => f.set("kcal", null) }]
      : []),
    ...(cur.minProtein > 0
      ? [{ label: `${cur.minProtein}g+ protein`, remove: () => f.set("protein", null) }]
      : []),
  ];
  const resetFilters = () => f.clear(["fits", "goal", "at", "kcal", "protein", "adv"]);
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
            label: "Under 600 kcal",
            pressed: cur.maxCalories === 600,
            count: countWith({ maxCalories: 600 }),
            onPress: () =>
              f.setNumber("kcal", cur.maxCalories === 600 ? DEF.maxCalories : 600, DEF.maxCalories),
          },
        ]}
      />
      {restaurantOptions.length > 0 && (
        <FilterSection
          title="Restaurant"
          summary={summary([cur.restaurants.join(", ")])}
          active={cur.restaurants.length > 0}
          defaultOpen
        >
          <CheckList
            legend="Restaurant"
            noun="restaurants"
            alwaysSearch
            options={restaurantOptions}
            selected={cur.restaurants}
            onToggle={(v) => f.toggle("at", v)}
          />
        </FilterSection>
      )}
      <FilterSection
        title="Meal type"
        summary={summary([MEALS.find((m) => m.value === cur.meal)?.label ?? false])}
        active={cur.meal !== null}
        defaultOpen
      >
        <ChipGroup
          legend="Meal type"
          options={mealOptions}
          selected={cur.meal ? [cur.meal] : []}
          onToggle={(v) => f.set("meal", cur.meal === v ? null : v)}
        />
      </FilterSection>
      <FilterSection
        title="Goal focus"
        summary={summary([cur.goals.join(", ")])}
        active={cur.goals.length > 0}
        defaultOpen
      >
        <ChipGroup
          legend="Goal focus"
          options={goalOptions}
          selected={cur.goals}
          onToggle={(v) => f.toggle("goal", v)}
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
          id={`${p}hack-protein`}
          label="Protein floor"
          min={0}
          max={60}
          step={5}
          value={cur.minProtein}
          format={(v) => (v === 0 ? "Any" : `${v}g or more`)}
          onChange={(v) => f.setNumber("protein", v, DEF.minProtein)}
        />
        <RangeSlider
          id={`${p}hack-calories`}
          label="Calorie ceiling"
          min={250}
          max={DEF.maxCalories}
          step={50}
          value={cur.maxCalories}
          format={(v) => (v >= DEF.maxCalories ? "Any" : `Under ${v} kcal`)}
          onChange={(v) => f.setNumber("kcal", v, DEF.maxCalories)}
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
            counts={{
              all: countWith({ meal: null }),
              breakfast: countWith({ meal: "breakfast" }),
              lunch: countWith({ meal: "lunch" }),
              dinner: countWith({ meal: "dinner" }),
              snack: countWith({ meal: "snack" }),
            }}
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
