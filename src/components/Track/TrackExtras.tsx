"use client";

import { AppImage } from "@/components/AppImage";
import { Icon } from "@/components/Icon";
import { Link } from "@/lib/nav";
import type { FirstTimeState, MealRecommendation, Momentum } from "@/lib/api";
import { cn } from "@/lib/utils";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Logging streak and points from `GET /api/tracking/me/momentum`. */
export function MomentumCard({ momentum }: { momentum: Momentum }) {
  const stats = [
    { label: "Current streak", value: plural(momentum.currentStreak, "day", "days") },
    { label: "Longest streak", value: plural(momentum.longestStreak, "day", "days") },
    { label: "Points", value: String(momentum.points) },
  ];
  const { pointsPerEntry, dailyConsistencyBonus } = momentum.scoring;
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-teal-soft">
          <Icon name="fire" size={18} color="var(--color-brand-navy)" />
        </span>
        <p className="min-w-0 text-[17px] leading-5 type-meta text-text-secondary">
          {momentum.currentStreak > 0
            ? `You've logged ${plural(momentum.daysLogged, "day", "days")} so far. Keep it going.`
            : "Log a meal or water today to start a streak."}
        </p>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0 rounded-xl bg-navy-50 px-3 py-2.5">
            <dd className="truncate text-onb-body type-row-figure tabular-nums text-brand-navy">
              {s.value}
            </dd>
            <dt className="mt-0.5 truncate text-xs type-meta text-text-secondary">{s.label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-2.5 text-xs type-meta text-text-secondary">
        {pointsPerEntry} points per entry, plus {dailyConsistencyBonus} for logging each day.
      </p>
    </div>
  );
}

/** Meals that fit what's left of today's targets, from `GET /api/tracking/me/recommendations`. */
export function RecommendedMeals({
  items,
  remainingCalories,
}: {
  items: MealRecommendation[];
  remainingCalories: number;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[17px] type-meta text-text-secondary">
        {Math.round(remainingCalories).toLocaleString("en-US")} kcal left today. These fit best.
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((m) => (
          <li key={m.id}>
            <Link to={`/recipes/${m.id}`} className="panel flex items-center gap-3 p-2.5">
              <AppImage
                src={m.imageUrl}
                alt=""
                sizes="64px"
                className="size-16 shrink-0 rounded-xl object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-onb-body type-item-title text-text-primary">
                  {m.title}
                </span>
                <span className="block truncate text-onb-meta type-meta text-text-secondary">
                  {m.calories} kcal · {m.protein}g protein
                  {m.prepTimeMinutes ? ` · ${m.prepTimeMinutes} min` : ""}
                </span>
              </span>
              <Icon name="chevronRight" size={16} color="var(--color-text-neutral-500)" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const ACTIONS: Record<string, { label: string; to: string }> = {
  log_meal: { label: "Log a meal", to: "/track/log-meal" },
  log_water: { label: "Log water", to: "/track/water" },
  set_goal: { label: "Set your goal", to: "/you/personal-details" },
};

/** First-time guidance from `GET /api/tracking/me/first-time`; hidden once dismissed. */
export function GettingStarted({
  state,
  onDismiss,
  className,
}: {
  state: FirstTimeState;
  onDismiss: () => void;
  className?: string;
}) {
  if (!state.isFirstTime || state.guidanceCompleted) return null;
  const actions = state.suggestedActions.flatMap((a) => (ACTIONS[a] ? [{ key: a, ...ACTIONS[a] }] : []));
  if (actions.length === 0) return null;
  return (
    <section
      aria-label="Getting started"
      className={cn("flex items-start gap-3 rounded-2xl bg-brand-teal-soft p-4", className)}
    >
      <span className="shrink-0">
        <Icon name="bulb" size={18} color="var(--color-brand-navy)" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[17px] type-section-title text-text-primary">Start your tracking</h2>
        <p className="mt-1 text-[17px] leading-5 type-meta text-text-primary">
          Three quick steps to get your numbers moving.
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {actions.map((a) => (
            <Link key={a.key} to={a.to} className="tap-24 text-[17px] type-button text-primary">
              {a.label}
            </Link>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss getting started"
        className="-m-1.5 flex size-9 shrink-0 items-center justify-center p-1.5"
      >
        <Icon name="close" size={14} color="var(--color-text-neutral-500)" />
      </button>
    </section>
  );
}
