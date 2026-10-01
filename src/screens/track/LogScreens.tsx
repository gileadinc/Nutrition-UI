"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { MiniRing } from "@/components/Charts";
import { AppImage } from "@/components/AppImage";
import { AppTextField } from "@/components/TextField";
import { PageContainer } from "@/components/Layout";
import { Skeleton } from "@/components/Feedback";
import { PrimaryButton, SecondaryButton } from "@/components/Button";
import { SearchField } from "@/components/Shell/SearchField";
import { RingsByDay } from "@/components/Track/MetricCharts";
import {
  ChipRow,
  LogSectionTitle,
  ProgressCard,
  QuickList,
  TodayPanel,
  TrackLogLayout,
  usePortionSheet,
} from "@/components/Track/LogParts";
import { Link, useBack, useNavigate, useParams, useSearchParams } from "@/lib/nav";
import { useDebouncedValue, useNow } from "@/lib/hooks";
import {
  MEAL_TYPES,
  mealApi,
  mealForTime,
  mealLabel,
  ozToMl,
  parseMealLabel,
  type MealLabel,
} from "@/lib/nutrition";
import {
  toast,
  useFastHacks,
  useRecipes,
  useRequireAccount,
  useTrackingActions,
} from "@/lib/store";
import {
  dayCalories,
  dayProtein,
  dayWaterOz,
  mealToInput,
  useAllEntries,
  useTrackDays,
  entryTitle,
  type TrackMeal,
} from "@/lib/track";
import { cn } from "@/lib/utils";

const f = (n: number) => n.toLocaleString("en-US");

/** Whole-number parse bounded to (0, max]; null if invalid. */
const whole = (s: string, max: number) => {
  const n = Number(s.trim());
  return !Number.isFinite(n) || !Number.isInteger(n) || n <= 0 || n > max ? null : n;
};

function useTodayMeals() {
  const { days } = useTrackDays(1);
  const requireAccount = useRequireAccount();
  const { log, remove } = useTrackingActions();
  const today = days[0];
  const meals = [...today.meals].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  const onRemove = async (m: TrackMeal) => {
    if (!requireAccount("Tracking")) return;
    try {
      await remove(m.id);
      toast.success(`${m.title} removed`, {
        action: { label: "Undo", run: () => void log(mealToInput(m)) },
      });
    } catch {
      toast.error("Couldn't remove that entry");
    }
  };
  return { today, meals, onRemove };
}

function TodayMealsPanel() {
  const { meals, onRemove } = useTodayMeals();
  const kcal = meals.reduce((s, m) => s + m.calories, 0);
  return (
    <TodayPanel
      title="Today's meals"
      total={meals.length ? `${f(kcal)} kcal` : undefined}
      empty="Nothing logged yet today."
      rows={meals.map((m) => ({
        id: m.id,
        title: m.title,
        at: m.loggedAt,
        meta: `${m.mealType} · ${m.calories} kcal · ${m.protein}g protein`,
        onRemove: () => void onRemove(m),
      }))}
      footer={
        <Link to="/track/meals" className="tap-24 text-[13px] type-button text-primary">
          Meal history
        </Link>
      }
    />
  );
}

function CaloriesToday() {
  const { today } = useTodayMeals();
  return (
    <ProgressCard
      label="Calories today"
      value={dayCalories(today)}
      goal={today.calorieGoal}
      unit="kcal"
      moreIsBetter={false}
      extra={`Protein ${dayProtein(today)} of ${today.proteinGoal} g`}
    />
  );
}

/* ---------------------------------------------------- Log meal picker */

export function LogMealPickerScreen() {
  const [params] = useSearchParams();
  const [meal, setMeal] = useState<MealLabel>(() => parseMealLabel(params.get("meal")) ?? mealForTime());
  const portion = usePortionSheet(meal);
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query.trim(), 250);
  const hacks = useFastHacks({ search: q || undefined, limit: 8 });
  const recipes = useRecipes({ search: q || undefined, limit: 8 });
  const entries = useAllEntries();

  const recents = useMemo(() => {
    const map = new Map<string, { entry: TrackMeal; count: number }>();
    const sorted = [...(entries.data ?? [])]
      .filter((e) => (e.calories ?? 0) > 0)
      .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
    for (const e of sorted) {
      const key = entryTitle(e).toLowerCase();
      const cur = map.get(key);
      if (cur) cur.count += 1;
      else
        map.set(key, {
          count: 1,
          entry: {
            id: e.entryId,
            title: entryTitle(e),
            mealType: mealLabel(e.mealType),
            loggedAt: e.loggedAt,
            calories: Math.round(e.calories ?? 0),
            protein: Math.round(e.protein ?? 0),
            carbs: Math.round(e.carbs ?? 0),
            fat: Math.round(e.fat ?? 0),
            sourceType: e.sourceType,
            sourceItemId: e.sourceItemId,
          },
        });
    }
    const list = [...map.values()].slice(0, 4);
    const t = query.trim().toLowerCase();
    return t ? list.filter((r) => r.entry.title.toLowerCase().includes(t)) : list;
  }, [entries.data, query]);

  const catalogue = [
    ...(hacks.data?.items ?? []).map((h) => ({
      key: `hack-${h.id}`,
      title: h.title,
      source: String(h.restaurantName ?? h.restaurant ?? "Fast hack"),
      image: h.imageUrl,
      calories: Math.round(h.calories ?? 0),
      protein: Math.round(h.protein ?? 0),
      carbs: Math.round(Number(h.carbs ?? 0)),
      fat: Math.round(Number(h.fat ?? 0)),
      sourceType: "fast_hack" as const,
      sourceItemId: h.id,
    })),
    ...(recipes.data?.items ?? []).map((r) => ({
      key: `recipe-${r.id}`,
      title: r.title,
      source: `${r.prepTimeMinutes} min`,
      image: r.imageUrl,
      calories: Math.round(r.calories),
      protein: Math.round(r.protein),
      carbs: Math.round(r.carbs),
      fat: Math.round(r.fat),
      sourceType: "recipe" as const,
      sourceItemId: r.id,
    })),
  ];
  const loading = hacks.isLoading || recipes.isLoading;

  return (
    <TrackLogLayout
      title="Log meal"
      subtitle="Tap a meal to choose the portion. Undo is in the notification."
      asideLabel="Today's meals"
      aside={<TodayMealsPanel />}
    >
      <CaloriesToday />
      <div className="mt-5">
        <ChipRow label="Logging as" options={MEAL_TYPES} value={meal} onChange={setMeal} />
      </div>
      <div className="mt-4 flex gap-2">
        <SearchField
          label="Search meals"
          value={query}
          onChange={setQuery}
          placeholder="Search meals"
          className="flex-1"
        />
        <Link
          to={`/track/log-meal/custom?type=${meal}`}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-border-default bg-white px-4 text-[13px] type-button-secondary text-text-primary transition-colors hover:border-text-neutral-400"
        >
          <Icon name="pencilEdit" size={15} color="var(--color-text-primary)" />
          Enter it yourself
        </Link>
      </div>
      {recents.length > 0 && (
        <section className="mt-6" aria-label="Log again">
          <LogSectionTitle>Log again</LogSectionTitle>
          <QuickList
            label="Recent meals"
            items={recents.map(({ entry, count }) => ({
              key: entry.title,
              title: entry.title,
              icon: "history",
              meta: `${entry.calories} kcal · ${entry.protein}g protein${count > 1 ? ` · logged ${count}×` : ""}`,
              onAdd: () =>
                portion.open({
                  title: entry.title,
                  subtitle: "Logged before",
                  calories: entry.calories,
                  protein: entry.protein,
                  carbs: entry.carbs,
                  fat: entry.fat,
                  sourceType: (entry.sourceType as "custom" | "recipe" | "fast_hack" | null) ?? "custom",
                  sourceItemId: entry.sourceItemId ?? undefined,
                }),
            }))}
          />
        </section>
      )}
      <section className="mt-6" aria-label="From the catalogue">
        <LogSectionTitle>From the catalogue</LogSectionTitle>
        {loading && catalogue.length === 0 ? (
          <CatalogueSkeleton />
        ) : catalogue.length === 0 ? (
          <p className="panel p-4 text-[13px] type-meta text-text-secondary">
            Nothing matches “{query.trim()}”.{" "}
            <Link to={`/track/log-meal/custom?type=${meal}`} className="type-button text-primary">
              Enter it yourself
            </Link>
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {catalogue.map((c) => (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() =>
                    portion.open({
                      title: c.title,
                      subtitle: c.source,
                      calories: c.calories,
                      protein: c.protein,
                      carbs: c.carbs,
                      fat: c.fat,
                      sourceType: c.sourceType,
                      sourceItemId: c.sourceItemId,
                    })
                  }
                  className="panel flex w-full items-center gap-3 p-2.5 text-left transition-colors hover:border-text-neutral-400"
                >
                  <AppImage
                    src={c.image}
                    alt=""
                    sizes="64px"
                    className="size-16 shrink-0 rounded-xl object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm type-item-title text-text-primary">{c.title}</span>
                    <span className="block truncate text-xs type-meta text-text-secondary">{c.source}</span>
                    <span className="mt-0.5 block text-xs type-meta tabular-nums text-text-primary">
                      {c.calories} kcal · {c.protein}g protein
                    </span>
                  </span>
                  <span className="mr-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary">
                    <Icon name="plusSign" size={16} color="#fff" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {portion.sheet}
    </TrackLogLayout>
  );
}

/** Placeholder rows shaped like the catalogue cards while hacks and recipes load. */
function CatalogueSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading catalogue">
      <span className="sr-only">Loading catalogue…</span>
      <ul aria-hidden="true" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="panel flex items-center gap-3 p-2.5">
            <Skeleton className="size-16 shrink-0 rounded-xl" />
            <span className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </span>
            <Skeleton className="mr-1 size-8 shrink-0 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------ Custom meal */

export function LogMealScreen() {
  const [params] = useSearchParams();
  const back = useBack("/track");
  const navigate = useNavigate();
  const requireAccount = useRequireAccount();
  const { log, remove } = useTrackingActions();
  const { today } = useTodayMeals();
  const typed = parseMealLabel(params.get("type"));
  const [name, setName] = useState("");
  const [meal, setMeal] = useState<MealLabel>(typed ?? mealForTime());
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [errors, setErrors] = useState<{ title?: string; calories?: string; protein?: string }>({});
  const eaten = dayCalories(today);
  const kcal = whole(calories, 5000);

  const submit = async () => {
    const e = {
      title: name.trim() ? undefined : "Name the meal so you can recognise it later.",
      calories: kcal === null ? "Enter calories between 1 and 5000." : undefined,
      protein:
        whole(protein, 500) === null && protein.trim() !== "0" && protein.trim() !== ""
          ? "Enter protein in grams (0–500)."
          : undefined,
    };
    setErrors(e);
    if (Object.values(e).some(Boolean) || kcal === null || !requireAccount("Tracking")) return;
    try {
      const entry = await log({
        mealType: mealApi(meal),
        sourceType: "custom",
        calories: kcal,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        notes: name.trim(),
      });
      toast.success(`${name.trim()} logged`, {
        body: `${meal} · ${kcal} kcal`,
        action: { label: "Undo", run: () => void remove(entry.entryId) },
        link: { label: "View in Track", href: "/track", run: () => navigate("/track") },
      });
      back();
    } catch {
      navigate("/track/log-error/meal");
    }
  };

  return (
    <TrackLogLayout
      title="Log a meal"
      subtitle="Name and calories are all you need."
      asideLabel="Today's meals"
      aside={<TodayMealsPanel />}
    >
      <form
        className="panel flex flex-col gap-5 p-4 md:p-5"
        onSubmit={(ev) => {
          ev.preventDefault();
          void submit();
        }}
      >
        <ChipRow label="Meal" options={MEAL_TYPES} value={meal} onChange={setMeal} />
        <AppTextField label="What did you eat?" value={name} error={errors.title} onChange={setName} />
        <AppTextField
          label="Calories"
          type="number"
          value={calories}
          error={errors.calories}
          onChange={setCalories}
        />
        <fieldset>
          <legend className="text-sm type-item-title text-text-primary">
            Macros <span className="type-meta text-text-secondary">(optional)</span>
          </legend>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:gap-3">
            <AppTextField
              label="Protein (g)"
              type="number"
              value={protein}
              error={errors.protein}
              onChange={setProtein}
            />
            <AppTextField label="Carbs (g)" type="number" value={carbs} onChange={setCarbs} />
            <AppTextField label="Fat (g)" type="number" value={fat} onChange={setFat} />
          </div>
        </fieldset>
        <div
          className="rounded-2xl bg-brand-warm-gray px-4 py-3 text-[13px] type-meta text-text-secondary"
          aria-live="polite"
        >
          {kcal === null ? (
            `Today so far: ${f(eaten)} of ${f(today.calorieGoal)} kcal.`
          ) : (
            <>
              Brings today to{" "}
              <span className="type-row-figure text-text-primary">
                {f(eaten + kcal)} of {f(today.calorieGoal)} kcal
              </span>
              .
            </>
          )}
        </div>
        <PrimaryButton type="submit" label="Log meal" />
      </form>
    </TrackLogLayout>
  );
}

/* --------------------------------------------------------- Log water */

const CUSTOM_STOPS = Array.from({ length: 12 }, (_, i) => (i + 1) * 4);
const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

function AmountSlider({
  value,
  onChange,
  stops,
  label,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  stops: number[];
  label: string;
  unit: string;
}) {
  const idx = Math.max(0, stops.indexOf(value));
  return (
    <div data-slot="amount-slider" className="mt-3">
      <input
        type="range"
        aria-label={label}
        aria-valuetext={`${value} ${unit}`}
        min={0}
        max={stops.length - 1}
        step={1}
        value={idx}
        onChange={(e) => onChange(stops[Number(e.target.value)])}
        className="h-9 w-full cursor-grab touch-none appearance-none rounded-xl bg-brand-warm-gray accent-brand-navy active:cursor-grabbing"
      />
    </div>
  );
}

export function LogWaterScreen() {
  const [params] = useSearchParams();
  const requireAccount = useRequireAccount();
  const { addWater, remove } = useTrackingActions();
  const now = useNow(60_000);
  const { days } = useTrackDays(7);
  const today = days[days.length - 1];
  const oz = dayWaterOz(today);
  const goal = Math.round(today.waterGoalOz);
  const [custom, setCustom] = useState(params.get("custom") === "1");
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState<string | undefined>();
  const [showAll, setShowAll] = useState(false);

  const week = days.map((d) => ({
    oz: dayWaterOz(d),
    label: new Date(`${d.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "narrow" }),
  }));
  const metDays = week.filter((d) => d.oz >= goal).length;

  const add = async (n: number) => {
    if (!requireAccount("Tracking")) return;
    try {
      const entry = await addWater(ozToMl(n));
      toast.success(`${n} oz logged`, {
        body: "Hydration updated for today.",
        action: { label: "Undo", run: () => void remove(entry.entryId) },
      });
    } catch {
      toast.error("Couldn't log water", { body: "Check your connection and try again." });
    }
  };

  const status =
    oz > goal ? `${oz - goal} oz over goal` : oz === goal ? "Goal reached today" : `${goal - oz} oz to go`;

  const drinks = [...today.hydration].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  const rows = drinks
    .reduce<{ w: (typeof drinks)[number]; total: number }[]>(
      (acc, w) => [...acc, { w, total: (acc[acc.length - 1]?.total ?? 0) + w.ounces }],
      [],
    )
    .reverse();
  const shown = showAll ? rows : rows.slice(0, 5);
  const ago = (iso: string) => {
    const m = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
    return m < 1 ? "Just now" : m < 60 ? `${m} min ago` : timeOf(iso);
  };
  const pickedOz = whole(amount, 999) ?? 0;

  return (
    <TrackLogLayout
      title="Water"
      subtitle={`Daily goal ${goal} oz`}
      asideLabel="This week's water"
      aside={
        <section aria-label="This week's water">
          <div className="flex items-baseline gap-2">
            <h2 className="eyebrow flex-1 text-[13px]">This week</h2>
            <Link to="/track/water/history" className="tap-24 text-[13px] type-button text-primary">
              History
            </Link>
          </div>
          <div className="panel mt-2.5 px-3 pb-3 pt-4">
            <RingsByDay
              values={week.map((d) => d.oz)}
              goal={goal}
              labels={week.map((d) => d.label)}
              highlightLast
            />
            <p className="mt-3 text-center text-xs type-meta text-text-secondary">
              Goal met on{" "}
              <span className="type-row-figure text-text-primary">{metDays} of 7 days</span>
            </p>
          </div>
        </section>
      }
    >
      <section className="panel px-5 pb-5 pt-6" aria-label="Log water">
        <div className="flex flex-col items-center">
          <WaterRing oz={oz} goal={goal} />
          <p className="mt-3 text-sm type-meta text-text-primary" aria-live="polite">
            {status}
          </p>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-2">
          {[8, 12, 16].map((n, i) => (
            <button
              key={n}
              type="button"
              onClick={() => void add(n)}
              className={cn(
                "flex h-12 items-center justify-center rounded-2xl text-sm type-button tracking-[-0.54px] transition-colors",
                i === 0 ? "bg-teal-action text-on-selected" : "bg-brand-teal-soft text-brand-navy",
              )}
            >
              +{n} oz
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCustom((c) => !c)}
            aria-expanded={custom}
            className={cn(
              "flex h-12 items-center justify-center rounded-2xl text-sm type-button tracking-[-0.54px] transition-colors",
              custom ? "bg-selected text-on-selected" : "bg-brand-warm-gray text-text-neutral-600",
            )}
          >
            Custom
          </button>
        </div>
        {custom && (
          <form
            className="mt-4 rounded-2xl bg-brand-cream p-4"
            onSubmit={(ev) => {
              ev.preventDefault();
              const n = whole(amount, 200);
              if (n === null) {
                setErr("Enter an amount between 1 and 200 oz.");
                return;
              }
              void add(n);
              setCustom(false);
            }}
          >
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="inline-flex items-baseline type-numeral tabular-nums text-brand-navy text-[40px] leading-none">
                {pickedOz}
              </span>
              <span className="text-sm type-unit text-text-secondary">oz</span>
            </div>
            <AmountSlider
              label="Water amount"
              unit="oz"
              stops={CUSTOM_STOPS}
              value={whole(amount, 999) ?? CUSTOM_STOPS[0]}
              onChange={(v) => {
                setAmount(String(v));
                setErr(undefined);
              }}
            />
            <div
              aria-hidden="true"
              className="mt-1.5 flex justify-between text-[11px] type-meta tabular-nums text-text-secondary"
            >
              <span>{CUSTOM_STOPS[0]} oz</span>
              <span>{CUSTOM_STOPS[CUSTOM_STOPS.length - 1]} oz</span>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <AppTextField
                  label="Custom amount (oz)"
                  type="number"
                  value={amount}
                  error={err}
                  onChange={(v) => {
                    setAmount(v);
                    setErr(undefined);
                  }}
                />
              </div>
              <button
                type="submit"
                className="h-12 shrink-0 rounded-2xl bg-primary px-5 text-sm type-button text-white sm:h-14"
              >
                Add custom amount
              </button>
            </div>
          </form>
        )}
      </section>
      <section className="mt-5" aria-label="Today's water">
        <div className="flex items-baseline gap-2">
          <h2 className="eyebrow flex-1 text-[13px]">Today</h2>
          {drinks.length > 0 && (
            <span className="text-xs type-meta text-text-secondary">
              {drinks.length} {drinks.length === 1 ? "drink" : "drinks"} ·{" "}
              <span className="type-row-figure text-text-primary">{oz} oz</span>
            </span>
          )}
        </div>
        {drinks.length === 0 ? (
          <p className="panel mt-2.5 px-4 py-5 text-center text-[13px] type-meta text-text-secondary">
            Nothing logged yet. Tap an amount above and it shows up here.
          </p>
        ) : (
          <>
            <ul className="panel mt-2.5 divide-y divide-border-divider overflow-hidden">
              {shown.map(({ w, total }) => (
                <li key={w.id} className="group flex h-12 items-center gap-3 pl-4 pr-1.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-teal-soft">
                    <Icon name="droplet" size={13} color="var(--color-brand-navy)" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-sm type-row-figure tabular-nums text-text-primary">{w.ounces} oz</span>
                    <span className="ml-2 text-xs type-meta text-text-secondary">{ago(w.loggedAt)}</span>
                  </span>
                  <span className="shrink-0 text-xs type-meta tabular-nums text-text-neutral-500">
                    {total} oz <span className="text-text-neutral-400">total</span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${w.ounces} oz logged at ${timeOf(w.loggedAt)}`}
                    onClick={async () => {
                      if (!requireAccount("Tracking")) return;
                      try {
                        await remove(w.id);
                        toast.success(`${w.ounces} oz removed`, {
                          action: {
                            label: "Undo",
                            run: () => void addWater(ozToMl(w.ounces)),
                          },
                        });
                      } catch {
                        toast.error("Couldn't remove that entry");
                      }
                    }}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-text-neutral-400 transition-colors hover:bg-brand-warm-gray"
                  >
                    <Icon name="close" size={14} color="currentColor" />
                  </button>
                </li>
              ))}
            </ul>
            {rows.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAll((s) => !s)}
                aria-expanded={showAll}
                className="tap-24 mt-2 w-full justify-center text-[13px] type-button text-primary"
              >
                {showAll ? "Show less" : `Show all ${rows.length} (${rows.length - shown.length} more)`}
              </button>
            )}
          </>
        )}
      </section>
    </TrackLogLayout>
  );
}


function WaterRing({ oz, goal }: { oz: number; goal: number }) {
  return (
    <MiniRing
      value={oz}
      goal={goal}
      size={224}
      stroke={22}
      color="var(--color-graphic)"
      overlap
      label={`${oz} of ${goal} oz today`}
    >
      <span className="text-[44px] type-numeral leading-none tracking-[-1.9px] text-brand-navy">{oz}</span>
      <span className="mt-1 text-xs type-meta text-text-secondary">of {goal} oz</span>
    </MiniRing>
  );
}

/* --------------------------------------------------------- Log error */

const ERRORS: Record<
  string,
  {
    noun: string;
    attempt: string;
    retryPath: string;
    secondaryAction: string;
    errorMessage: string;
    noticeTitle: string;
    noticeBody: string;
  }
> = {
  drink: {
    noun: "Drink",
    attempt: "Water log",
    retryPath: "/track/water",
    secondaryAction: "Set Reminder",
    errorMessage: "We were unable to save your drink log. Don't worry - we'll remind you to try again.",
    noticeTitle: "Hydration log not saved",
    noticeBody: "Your water goal is unchanged until this drink is saved successfully.",
  },
  meal: {
    noun: "Meal",
    attempt: "Meal log",
    retryPath: "/track/log-meal",
    secondaryAction: "Save Draft",
    errorMessage: "We were unable to save your meal log. Don't worry - you can try again or keep it for later.",
    noticeTitle: "Meal log not saved",
    noticeBody: "Your calorie and macro totals will update after the meal is saved successfully.",
  },
};

export function TrackLogErrorScreen() {
  const { type = "meal" } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const c = ERRORS[type] ?? ERRORS.meal;
  const attempt = params.get("attempt") || c.attempt;
  return (
    <PageContainer variant="focused" pathname="/track/log-error">
      <div className="flex flex-col items-center text-center">
        <span
          className="flex size-16 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--color-accent-soft)" }}
        >
          <Icon name="alert" size={32} color="var(--color-accent-ink)" />
        </span>
        <h1
          role="status"
          className="mt-3 text-2xl type-display leading-8 tracking-[-1.08px] text-brand-navy"
        >
          Couldn&apos;t Log {c.noun}
        </h1>
        <p className="mt-2 text-[13px] type-meta leading-[1.4] tracking-[-0.585px] text-text-neutral-500">
          {c.errorMessage}
        </p>
      </div>
      <div className="panel mt-6 p-5">
        <div className="flex items-center gap-3">
          <p className="min-w-0 flex-1 truncate text-xs type-eyebrow tracking-[-0.54px] text-text-neutral-500">
            ATTEMPTED LOG
          </p>
          <Icon name="alert" size={16} color="var(--color-accent-ink)" />
        </div>
        <hr className="my-4 border-border-divider" />
        <p className="flex items-center gap-2.5 text-sm type-item-title tracking-[-0.63px] text-text-primary">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-primary" />
          {attempt}
        </p>
      </div>
      <div
        className="mt-6 flex items-start gap-3 rounded-2xl border p-4"
        style={{
          backgroundColor: "var(--color-missed-dose-surface)",
          borderColor: "color-mix(in srgb, var(--color-accent-ink) 25%, transparent)",
        }}
      >
        <Icon name="alert" size={18} color="var(--color-accent-ink)" />
        <div className="min-w-0 flex-1">
          <p className="text-sm type-item-title tracking-[-0.63px] text-text-primary">{c.noticeTitle}</p>
          <p className="mt-1 text-xs type-meta leading-[1.45] tracking-[-0.54px] text-text-secondary">
            {c.noticeBody}
          </p>
        </div>
      </div>
      <div className="mt-12 flex flex-col gap-3">
        <PrimaryButton label="Try Again" onPress={() => navigate(c.retryPath)} />
        <SecondaryButton label={c.secondaryAction} onPress={() => navigate("/track")} />
      </div>
    </PageContainer>
  );
}
