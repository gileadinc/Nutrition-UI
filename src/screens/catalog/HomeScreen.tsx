"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
  SectionLink,
  Skeleton,
} from "@/components";
import { SECTION_TITLE } from "@/components/styles";
import { profileApi } from "@/lib/api";
import { useIsLg, useScrollToTopOnMount } from "@/lib/hooks";
import { Link, useSearchParams } from "@/lib/nav";
import { fitFor, GOAL_LABEL, type Budget } from "@/lib/nutrition";
import {
  firstNameOf,
  invalidate,
  startGuestSession,
  useAppSession,
  useDayBudget,
  useFastHacks,
  useHome,
  useProfile,
  useRecipes,
  useSaved,
} from "@/lib/store";
import { HOME, UI } from "@/content";
import { nearParams, useAskForLocation, usePlaceLabel, useUserLocation } from "@/lib/location";
import { cn } from "@/lib/utils";
import { useLogSheet } from "@/components/Track/LogSheet";
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

const TOUR = HOME.tour;
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
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusedStep = useRef(-1);
  const item = TOUR[step];
  const last = step === TOUR.length - 1;
  // Move focus to the step title whenever the step changes.
  useEffect(() => {
    if (focusedStep.current === step) return;
    focusedStep.current = step;
    headingRef.current?.focus({ preventScroll: true });
  });
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
        ref={headingRef}
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
          className="h-11 rounded-full px-3 text-sm type-button-secondary text-text-secondary hover:bg-navy-soft"
        >
          Skip tour
        </button>
        <span className="flex-1" />
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="h-11 rounded-full px-3 text-sm type-button-secondary text-brand-navy hover:bg-navy-soft"
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

const RING_VB = 104;
const RING_STROKE = 10;
const RING_C = RING_VB / 2;
const RING_R = 47;

/** Today's progress: three small rings (calories / protein / water) and a selectable summary. */
function TodayProgress({ budget }: { budget: Budget }) {
  const [sel, setSel] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
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
  const active = hover ?? sel;
  const cur = rows[active];
  const frac = (r: (typeof rows)[number]) =>
    r.goal === 0 ? 0 : Math.min(1, Math.max(0, r.value / r.goal));
  const pct = (r: (typeof rows)[number]) => Math.round(frac(r) * 100);
  const fmt = (n: number) => n.toLocaleString("en-US");
  const circ = 2 * Math.PI * RING_R;
  const remaining =
    cur.value > cur.goal
      ? `${fmt(cur.value - cur.goal)} ${cur.unit} over goal`
      : cur.goal - cur.value <= 0
        ? "Goal reached"
        : `${fmt(cur.goal - cur.value)} ${cur.unit} remaining today`;
  return (
    <div className="panel @container px-4 pb-4 pt-4 md:px-5">
      <div className="flex items-center gap-3">
        <h2 className={cn(SECTION_TITLE, "min-w-0 flex-1 truncate")}>Today&apos;s progress</h2>
        <SectionLink to="/track">View progress</SectionLink>
      </div>
      <div
        role="group"
        data-testid="home-progress-rings"
        aria-label={rows.map((r) => `${r.label}: ${r.value} of ${r.goal} ${r.unit}`).join(", ")}
        className="mt-4 grid grid-cols-3 gap-1.5 @sm:gap-3"
        onMouseLeave={() => setHover(null)}
      >
        {rows.map((r, i) => {
          const on = active === i;
          return (
            <button
              key={r.label}
              type="button"
              aria-pressed={sel === i}
              aria-label={`${r.label}, ${fmt(r.value)} of ${fmt(r.goal)} ${r.unit}`}
              onClick={() => setSel(i)}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className={cn(
                "tap-44 group relative flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-3 transition-[opacity,background-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none",
                !on && "opacity-55",
              )}
              style={{
                backgroundColor: on ? `color-mix(in srgb, ${r.color} 8%, white)` : undefined,
              }}
            >
              <span aria-hidden className="relative block aspect-square w-full max-w-[104px]">
                <svg viewBox={`0 0 ${RING_VB} ${RING_VB}`} className="absolute inset-0 size-full">
                  <circle
                    cx={RING_C}
                    cy={RING_C}
                    r={RING_R}
                    fill="none"
                    stroke={r.color}
                    strokeOpacity={0.14}
                    strokeWidth={RING_STROKE}
                  />
                  <circle
                    cx={RING_C}
                    cy={RING_C}
                    r={RING_R}
                    fill="none"
                    stroke={r.color}
                    strokeWidth={RING_STROKE}
                    strokeLinecap="round"
                    strokeDasharray={`${circ * frac(r) * (settled ? 1 : 0)} ${circ}`}
                    transform={`rotate(-90 ${RING_C} ${RING_C})`}
                    strokeOpacity={frac(r) === 0 ? 0 : 1}
                    className="transition-[stroke-dasharray] duration-1000 ease-out motion-reduce:transition-none"
                  />
                </svg>
                <span className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="text-[clamp(15px,5.5cqw,22px)] leading-none type-numeral tabular-nums tracking-[-0.8px]"
                    style={{ color: r.ink }}
                  >
                    {fmt(r.value)}
                  </span>
                  <span className="mt-0.5 text-[12px] leading-4 type-meta text-text-secondary">
                    {r.unit}
                  </span>
                </span>
              </span>
              <span className="flex min-w-0 max-w-full flex-col items-center">
                <span className="max-w-full truncate text-[13px] type-item-title text-text-primary">
                  {r.label}
                </span>
                <span className="text-[12px] type-meta tabular-nums text-text-secondary">
                  {pct(r)}%
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div aria-live="polite" data-testid="home-progress-center" className="mt-3 text-center">
        <div key={cur.label} className="motion-safe:animate-[fade-in_200ms_ease-out]">
          <p className="text-[12px] uppercase tracking-[0.08em] type-meta text-text-secondary">
            {cur.label}
          </p>
          <p
            data-testid="home-progress-total"
            className="mt-0.5 text-[16px] leading-6 type-row-figure tabular-nums"
            style={{ color: cur.ink }}
          >
            {fmt(cur.value)} / {fmt(cur.goal)} {cur.unit}
          </p>
          <p className="text-[12px] leading-4 type-meta text-text-secondary">{remaining}</p>
        </div>
      </div>
    </div>
  );
}

function ProgressColumn({ withShortcuts, budget }: { withShortcuts: boolean; budget: Budget }) {
  const saved = useSaved();
  const progress = <TodayProgress budget={budget} />;
  if (!withShortcuts) return progress;
  return (
    <div className="flex flex-col gap-3">
      {progress}
      <Link
        to="/you/saved"
        className="tap-24 tap-44 relative gap-2 self-start text-[13px] type-button-secondary text-text-secondary"
      >
        <Icon name="bookmark" size={15} color="var(--color-primary)" />
        {saved.count === 0 ? "Nothing saved yet" : `${saved.count} saved`}
      </Link>
    </div>
  );
}

export function HomeScreen() {
  useScrollToTopOnMount();
  const { profile } = useProfile();
  const logs = useLogSheet();
  const { budget } = useDayBudget();
  const saved = useSaved();
  const lg = useIsLg();
  const home = useHome();
  const { coords } = useUserLocation();
  useAskForLocation();
  const place = usePlaceLabel(coords);
  const hacksRes = useFastHacks({ limit: 12, ...nearParams(coords) });
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

  const hacks = useMemo(
    () => (hacksRes.data?.items ?? []).map((h) => toHackVM(h)),
    [hacksRes.data],
  );
  const recipes = useMemo(() => {
    const fromHome =
      home.signedIn.data?.recommendations.recipes ?? home.guest.data?.featuredRecipes;
    const src = fromHome && fromHome.length > 0 ? fromHome : (recipesRes.data?.items ?? []);
    return src.map(toRecipeVM);
  }, [home.signedIn.data, home.guest.data, recipesRes.data]);

  const closeTour = () => {
    try {
      window.localStorage.setItem(TOUR_KEY, "1");
    } catch {
      // ignore
    }
    // Remember it on the account too, so the tour doesn't come back on another device.
    if (home.signedIn.data) {
      void profileApi
        .updateExperienceState({ quickTourCompleted: true })
        .then(() => invalidate("home"))
        .catch(() => undefined);
    }
    setDismissed(true);
    if (params.has("tour")) {
      const next = new URLSearchParams(params);
      next.delete("tour");
      setParams(next, { replace: true });
    }
  };

  const name = firstNameOf(profile) ?? "there";
  const eatOut = hacks.filter((h) => eatChips.every((c) => hackMatches(h, c)));
  const cook = recipes.filter((r) => cookChips.every((c) => recipeMatches(r, c)));
  const toggle = (set: typeof setEatChips) => (c: string) =>
    set((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  const loadingHacks = hacksRes.isLoading && !hacksRes.data;
  const loadingRecipes =
    recipes.length === 0 &&
    (recipesRes.isLoading || home.signedIn.isLoading || home.guest.isLoading);

  return (
    <PageContainer className="max-w-7xl">
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
        action={
          <button
            type="button"
            onClick={() => logs.open("meal")}
            className="tap-44 relative flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-[15px] type-button text-white transition-colors hover:bg-primary-hover"
          >
            <Icon name="plusSign" size={18} color="currentColor" />
            Log a meal
          </button>
        }
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
            {coords && (
              <span className="flex min-h-11 max-w-full items-center gap-1 text-xs text-primary">
                <Icon name="location" size={14} />
                <span className="truncate">{place ?? UI.location.eyebrow}</span>
              </span>
            )}
            <SectionHeader
              title="Eat Out near you"
              subtitle={`Picked for your ${(profile?.goal ? GOAL_LABEL[profile.goal] : "your").toLowerCase()} goal`}
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
