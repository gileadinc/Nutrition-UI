"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  BentoCell,
  BentoGrid,
  EmptyState,
  FilterChips,
  FoodCard,
  RatingBadge,
  GuestFeatureGate,
  Icon,
  ListingHeader,
  PageContainer,
  PrimaryButton,
  Rail,
  SectionHeader,
  Skeleton,
} from "@/components";
import type { IconName } from "@/components";
import { LINK_ACTION, SECTION_TITLE } from "@/components/styles";
import { useIsLg, useScrollToTopOnMount } from "@/lib/hooks";
import { Link, useSearchParams } from "@/lib/nav";
import { GOAL_LABEL, fitFor, type Budget } from "@/lib/nutrition";
import {
  firstNameOf,
  startGuestSession,
  useAppSession,
  useDayBudget,
  useFastHacks,
  useHome,
  useProfile,
  useRecipes,
  useSaved,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import { toHackVM, toRecipeVM, type HackVM, type RecipeVM } from "./adapt";

const EAT_OUT_CHIPS = [
  "All",
  "Under 500 calories",
  "High protein",
  "Nearby",
  "Ready in 15 min",
  "Vegetarian",
  "Low carb",
];
const COOK_CHIPS = [
  "All",
  "High protein",
  "Lower calorie",
  "Quick meals",
  "Easy prep",
  "Meal prep",
  "Vegetarian",
  "Low carb",
];

const hackMatches = (h: HackVM, chip: string) => {
  switch (chip) {
    case "High protein":
      return h.protein >= 30;
    case "Under 500 calories":
      return h.calories < 500;
    case "Vegetarian":
      return h.tags.includes("Vegan");
    case "Low carb":
      return h.carbs <= 35;
    case "Nearby":
      return h.distanceMi != null && h.distanceMi <= 2;
    case "Ready in 15 min":
      return h.tags.includes("Quick") || h.tags.includes("Quick & Easy");
    default:
      return true;
  }
};
const recipeMatches = (r: RecipeVM, chip: string) => {
  switch (chip) {
    case "High protein":
      return r.tags.includes("High Protein");
    case "Lower calorie":
      return r.tags.includes("Under 500 kcal");
    case "Quick meals":
      return r.tags.includes("Quick & Easy");
    case "Easy prep":
      return r.minutes <= 20;
    case "Meal prep":
      return r.tags.includes("Meal Prep");
    case "Vegetarian":
      return r.tags.includes("Veggie");
    case "Low carb":
      return r.carbs <= 30;
    default:
      return true;
  }
};

const SHORTCUTS: { title: string; short: string; icon: IconName; to: string }[] = [
  { title: "Log Meal", short: "Meal", icon: "forkSpoon", to: "/track/log-meal" },
  { title: "Add Drink", short: "Water", icon: "droplet", to: "/track/water" },
  { title: "Log Activity", short: "Activity", icon: "activity", to: "/track/activity" },
  { title: "Log Medication", short: "Medication", icon: "medication", to: "/track/medication" },
  { title: "Log Weight", short: "Weight", icon: "weightScale", to: "/track/weight" },
];

const TOUR = [
  {
    title: "Smart Search",
    body: "Type or ask anything naturally. We will help you discover healthy local restaurant foods, recipes to cook, or log nutritional values.",
  },
  {
    title: "Eat Out Wisely",
    body: "Find menu hacks and nutritional choices from popular dining spots near you, calibrated instantly to your target daily limits.",
  },
  {
    title: "Custom Cook Mode",
    body: "Explore recipes tailored to your active ingredients or preference. Filter instantly by high protein, speed, or minimal prep options.",
  },
  {
    title: "Logging & Tracking",
    body: "Quickly review your daily nutrition, log dishes, and watch your targets update dynamically as you eat and move throughout the week.",
  },
];
const TOUR_KEY = "forkthis.homeTourDone";
const tourDone = () => {
  try {
    return window.localStorage.getItem(TOUR_KEY) === "1";
  } catch {
    return false;
  }
};

function FirstRunTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const item = TOUR[step];
  const last = step === TOUR.length - 1;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="first-run-tour-title"
      className="panel fixed inset-x-4 bottom-[76px] z-40 p-5 md:inset-x-auto md:bottom-6 md:right-6 md:w-[24rem]"
    >
      <p className="text-[13px] type-meta text-text-secondary">
        Quick tour · Step {step + 1} of {TOUR.length}
      </p>
      <h2
        id="first-run-tour-title"
        tabIndex={-1}
        className="mt-1.5 text-lg type-section-title text-brand-navy outline-none"
      >
        {item.title}
      </h2>
      <p className="mt-2 type-meta text-[13px] leading-5 text-text-secondary">{item.body}</p>
      <div className="mt-5 flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-2xl px-3 text-sm type-button-secondary text-text-secondary hover:bg-navy-soft"
        >
          Skip tour
        </button>
        <span className="flex-1" />
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="h-11 rounded-2xl px-3 text-sm type-button-secondary text-brand-navy hover:bg-navy-soft"
          >
            Back
          </button>
        )}
        <PrimaryButton
          size="medium"
          label={last ? "Done" : "Next"}
          className="h-11 w-auto px-5"
          onPress={() => (last ? onClose() : setStep(step + 1))}
        />
      </div>
    </section>,
    document.body,
  );
}

const RING = 178;
const RING_STROKE = 12;
const RING_C = RING / 2;
const RING_R0 = 83;

/** Today's progress: three concentric rings + selectable summary. */
function TodayProgress({ budget }: { budget: Budget }) {
  const [sel, setSel] = useState(0);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setSettled(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  const rows = [
    {
      label: "Calories",
      value: budget.calories.consumed,
      goal: budget.calories.goal,
      unit: "kcal",
      color: "var(--color-accent-graphic)",
      ink: "var(--color-accent-ink)",
    },
    {
      label: "Protein",
      value: budget.protein.consumed,
      goal: budget.protein.goal,
      unit: "g",
      color: "var(--color-brand-navy)",
      ink: "var(--color-brand-navy)",
    },
    {
      label: "Water",
      value: budget.water.consumed,
      goal: budget.water.goal,
      unit: "oz",
      color: "var(--color-graphic)",
      ink: "var(--color-brand-navy)",
    },
  ];
  const cur = rows[sel];
  const left = Math.max(0, cur.goal - cur.value);
  const frac = (r: (typeof rows)[number]) =>
    r.goal === 0 ? 0 : Math.min(1, Math.max(0, r.value / r.goal));
  const fmt = (n: number) => n.toLocaleString("en-US");
  return (
    <div className="rounded-[18px] border border-border-default bg-white px-[18px] pb-[18px] pt-4 shadow-card">
      <div className="flex items-center gap-3">
        <h2 className={cn(SECTION_TITLE, "min-w-0 flex-1 truncate")}>Today&apos;s progress</h2>
        <Link to="/track" className={LINK_ACTION}>
          View progress
          <Icon name="chevronRight" size={14} color="var(--color-primary)" />
        </Link>
      </div>
      <div className="mt-[14px] flex flex-col items-center">
        <svg
          width={RING}
          height={RING}
          viewBox={`0 0 ${RING} ${RING}`}
          role="img"
          data-testid="home-progress-rings"
          aria-label={rows.map((r) => `${r.label}: ${r.value} of ${r.goal} ${r.unit}`).join(", ")}
        >
          {rows.map((r, i) => {
            const radius = RING_R0 - i * 18;
            const circ = 2 * Math.PI * radius;
            return (
              <g key={r.label}>
                <circle
                  cx={RING_C}
                  cy={RING_C}
                  r={radius}
                  fill="none"
                  stroke={r.color}
                  strokeOpacity={0.14}
                  strokeWidth={RING_STROKE}
                />
                <circle
                  cx={RING_C}
                  cy={RING_C}
                  r={radius}
                  fill="none"
                  stroke={r.color}
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${circ * frac(r) * (settled ? 1 : 0)} ${circ}`}
                  transform={`rotate(-90 ${RING_C} ${RING_C})`}
                  strokeOpacity={frac(r) === 0 ? 0 : 1}
                  className="transition-[stroke-dasharray] duration-1000 ease-out motion-reduce:transition-none"
                />
              </g>
            );
          })}
          <text
            x={RING_C}
            y={RING_C}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-brand-navy text-[13px] type-meta"
          >
            Today
          </text>
        </svg>
      </div>
      <div className="mt-[14px] flex gap-1.5">
        {rows.map((r, i) => {
          const on = sel === i;
          return (
            <button
              key={r.label}
              type="button"
              aria-pressed={on}
              onClick={() => setSel(i)}
              className="flex flex-1 flex-col items-center rounded-[10px] px-1.5 py-[9px]"
              style={
                on
                  ? { backgroundColor: `color-mix(in srgb, ${r.color} 8%, transparent)` }
                  : undefined
              }
            >
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{ backgroundColor: r.color }}
              />
              <span
                className={cn(
                  "mt-[5px] max-w-full truncate text-[10.5px] type-button tracking-[-0.4725px]",
                  !on && "text-text-secondary",
                )}
                style={on ? { color: r.ink } : undefined}
              >
                {r.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 rounded-xl bg-brand-cream px-[14px] pb-[11px] pt-3 text-center">
        <p
          data-testid="home-progress-total"
          className="truncate text-2xl type-numeral leading-8 tracking-[-1.08px]"
          style={{ color: cur.ink }}
        >
          {fmt(cur.value)} / {fmt(cur.goal)} {cur.unit}
        </p>
        <p className="mt-0.5 text-xs type-meta leading-4 tracking-[-0.54px] text-text-secondary">
          {left === 0 ? `${cur.label} goal reached` : `${fmt(left)} ${cur.unit} remaining today`}
        </p>
      </div>
    </div>
  );
}

function ProgressColumn({ withShortcuts, budget }: { withShortcuts: boolean; budget: Budget }) {
  const saved = useSaved();
  const progress = <TodayProgress budget={budget} />;
  if (!withShortcuts) return progress;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] xl:grid-cols-1">
      {progress}
      <section
        aria-labelledby="home-log-heading"
        className="panel flex flex-col p-4 shadow-card"
      >
        <h3 id="home-log-heading" className="eyebrow text-[11px]">
          Log something
        </h3>
        <div className="mt-3 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2 lg:grid-cols-[minmax(0,1fr)] xl:grid-cols-[repeat(2,minmax(0,1fr))]">
          {SHORTCUTS.map((s, i) => (
            <Link
              key={s.title}
              to={s.to}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-xl border border-border-default px-3 py-2.5 text-[13px] type-button-secondary text-text-primary hover:bg-brand-warm-gray lg:py-3.5 xl:py-2.5",
                i === SHORTCUTS.length - 1 &&
                  SHORTCUTS.length % 2 === 1 &&
                  "col-span-2 lg:col-span-1 xl:col-span-2",
              )}
            >
              <Icon name={s.icon} size={15} color="var(--color-primary)" />
              {s.short}
            </Link>
          ))}
        </div>
        <Link
          to="/you/saved"
          className="tap-24 tap-44 relative mt-4 flex items-center gap-2 self-start text-[13px] type-button-secondary text-text-secondary lg:mt-auto lg:pt-4 xl:mt-4 xl:pt-0"
        >
          <Icon name="bookmark" size={15} color="var(--color-primary)" />
          {saved.count === 0 ? "Nothing saved yet" : `${saved.count} saved`}
        </Link>
      </section>
    </div>
  );
}

export function HomeScreen() {
  useScrollToTopOnMount();
  const { profile } = useProfile();
  const { budget } = useDayBudget();
  const saved = useSaved();
  const lg = useIsLg();
  const home = useHome();
  const hacksRes = useFastHacks({ limit: 12 });
  const recipesRes = useRecipes({ limit: 12 });
  const [params, setParams] = useSearchParams();
  const [eatChips, setEatChips] = useState<string[]>([]);
  const [cookChips, setCookChips] = useState<string[]>([]);
  const guidanceTour = home.signedIn.data?.guidance?.showQuickTour ?? false;
  const [dismissed, setDismissed] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const showTour =
    mounted && !dismissed && !tourDone() && (params.get("tour") === "1" || guidanceTour);

  const hacks = useMemo(() => (hacksRes.data?.items ?? []).map((h) => toHackVM(h)), [hacksRes.data]);
  const recipes = useMemo(() => {
    const fromHome = home.signedIn.data?.recommendations.recipes ?? home.guest.data?.featuredRecipes;
    const src = fromHome && fromHome.length > 0 ? fromHome : (recipesRes.data?.items ?? []);
    return src.map(toRecipeVM);
  }, [home.signedIn.data, home.guest.data, recipesRes.data]);

  const closeTour = () => {
    try {
      window.localStorage.setItem(TOUR_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
    if (params.has("tour")) {
      const next = new URLSearchParams(params);
      next.delete("tour");
      setParams(next, { replace: true });
    }
  };

  const name = firstNameOf(profile) ?? "there";
  // Same default the deployed app shows when no goal has been set yet.
  const goal = GOAL_LABEL[profile?.goal ?? "maintain"];
  const eatOut = hacks.filter((h) => eatChips.every((c) => hackMatches(h, c)));
  const cook = recipes.filter((r) => cookChips.every((c) => recipeMatches(r, c)));
  const toggle = (set: typeof setEatChips) => (c: string) =>
    set((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  const loadingHacks = hacksRes.isLoading && !hacksRes.data;
  const loadingRecipes = recipes.length === 0 && (recipesRes.isLoading || home.signedIn.isLoading || home.guest.isLoading);

  return (
    <PageContainer className="max-w-[1680px]">
      {showTour && <FirstRunTour onClose={closeTour} />}
      <ListingHeader
        eyebrow={`HI, ${name.toUpperCase()}`}
        title="What fits today?"
        titleFontSize={26}
        subtitle="Food choices shaped around your goal and day."
        searchHint="Ask for a high-protein option nearby"
        searchTo="/search"
        topActionTo="/you/notifications"
        topActionIcon="bell"
        topActionLabel="Notifications"
      />
      <BentoGrid className="mt-6">
        <BentoCell className="xl:col-span-8">
          <FilterChips
            label="Filter eat-out suggestions"
            options={EAT_OUT_CHIPS}
            selected={eatChips}
            onToggle={toggle(setEatChips)}
            onClear={() => setEatChips([])}
          />
          <div className="mt-6">
            <SectionHeader
              title="Eat Out near you"
              subtitle={`Picked for your ${goal.toLowerCase()} goal`}
              action={{ label: "See all", to: "/fast-hacks" }}
            />
          </div>
          <div className="mt-3">
            {loadingHacks ? (
              <Skeleton className="h-56 w-full" />
            ) : eatOut.length === 0 ? (
              <EmptyState
                icon="filterSliders"
                title="Nothing fits that combination"
                body="Try dropping one of the selected filters."
                action={{ label: "Clear filters", onPress: () => setEatChips([]) }}
              />
            ) : (
              <Rail>
                {eatOut.slice(0, 6).map((h) => (
                  <FoodCard
                    key={h.id}
                    image={h.image}
                    title={h.title}
                    subtitle={h.restaurant}
                    brandName={h.restaurant}
                    leadingBadge={h.distanceMi !== null ? `${h.distanceMi} mi` : undefined}
                    badge={h.restaurant}
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
                ))}
              </Rail>
            )}
          </div>
        </BentoCell>
        <BentoCell className="xl:sticky xl:top-24 xl:col-span-4 xl:col-start-9 xl:row-span-2 xl:row-start-1 xl:self-start">
          <ProgressColumn withShortcuts={lg} budget={budget} />
        </BentoCell>
        <BentoCell className="xl:col-span-8">
          <SectionHeader title="Cook at home" action={{ label: "See all Cook", to: "/recipes" }} />
          <div className="mt-3.5">
            <FilterChips
              label="Filter recipes"
              options={COOK_CHIPS}
              selected={cookChips}
              onToggle={toggle(setCookChips)}
              onClear={() => setCookChips([])}
            />
          </div>
          <div className="mt-3">
            {loadingRecipes ? (
              <Skeleton className="h-56 w-full" />
            ) : cook.length === 0 ? (
              <EmptyState
                icon="filterSliders"
                title="Nothing fits that combination"
                body="Try dropping one of the selected filters."
                action={{ label: "Clear filters", onPress: () => setCookChips([]) }}
              />
            ) : (
              <Rail>
                {cook.slice(0, 6).map((r) => (
                  <FoodCard
                    key={r.id}
                    image={r.image}
                    title={r.title}
                    leadingBadge={r.time || undefined}
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
                ))}
              </Rail>
            )}
          </div>
        </BentoCell>
      </BentoGrid>
    </PageContainer>
  );
}

/** `/guest`: Home behind the "needs an account" sheet. */
export function GuestScreen() {
  const session = useAppSession();
  const [params] = useSearchParams();
  useEffect(() => {
    if (session.ready && !session.isSignedIn && !session.isGuest) void startGuestSession();
  }, [session.ready, session.isSignedIn, session.isGuest]);
  return (
    <>
      <HomeScreen />
      <GuestFeatureGate feature={params.get("feature") ?? undefined} />
    </>
  );
}
