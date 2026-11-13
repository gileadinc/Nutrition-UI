"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { MiniRing } from "@/components/Charts";
import { Dialog } from "@/components/Collections";
import { EYEBROW } from "@/components/Track/Dashboard";
import { Link } from "@/lib/nav";
import { dayCalories, dayCarbs, dayFat, dayProtein, dayWaterOz, type TrackDay } from "@/lib/track";
import {
  OVERVIEW_ITEMS,
  useOverviewLayout,
  useOverviewTipDismissed,
  type OverviewId,
} from "@/lib/track/overview";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const ITEM = Object.fromEntries(OVERVIEW_ITEMS.map((i) => [i.id, i])) as Record<
  OverviewId,
  (typeof OVERVIEW_ITEMS)[number]
>;

/** Daily limits shown on cards the API has no totals for (sugar / sodium are not tracked yet). */
const LIMIT = { sugar: "Stay under 50 g", sodium: "Stay under 2,300 mg" } as const;

export interface OverviewData {
  day: TrackDay;
  /** Latest weigh-in in lb, if any. */
  weightLb: number | null;
  weightNote: string;
  medication: { value: string; note: string } | null;
  onAddWater?: () => void;
}

interface CardModel {
  id: OverviewId;
  label: string;
  icon: IconName;
  /** Display value, or null when nothing is recorded. */
  value: string | null;
  unit: string;
  note: string;
  to: string;
  ring?: { value: number; goal: number; color: string };
  quick?: { label: string; text: string; run: () => void };
}

function model(id: OverviewId, d: OverviewData): CardModel {
  const { day } = d;
  const base = { id, label: ITEM[id].label, icon: ITEM[id].icon };
  const insights = (m: string) => `/track/insights?metric=${encodeURIComponent(m)}`;
  switch (id) {
    case "calories":
      return {
        ...base,
        value: fmt(dayCalories(day)),
        unit: "kcal",
        note: `of ${fmt(day.calorieGoal)} kcal`,
        to: insights("Calories"),
        ring: { value: dayCalories(day), goal: day.calorieGoal, color: "var(--color-accent-graphic)" },
      };
    case "protein":
      return {
        ...base,
        value: fmt(dayProtein(day)),
        unit: "g",
        note: `of ${fmt(day.proteinGoal)} g`,
        to: insights("Protein"),
        ring: { value: dayProtein(day), goal: day.proteinGoal, color: "var(--color-brand-navy)" },
      };
    case "carbs":
      return {
        ...base,
        value: fmt(dayCarbs(day)),
        unit: "g",
        note: `of ${fmt(day.carbsGoal)} g`,
        to: insights("Carbs"),
        ring: { value: dayCarbs(day), goal: day.carbsGoal, color: "var(--color-navy-300)" },
      };
    case "fat":
      return {
        ...base,
        value: fmt(dayFat(day)),
        unit: "g",
        note: `of ${fmt(day.fatGoal)} g`,
        to: insights("Fat"),
        ring: { value: dayFat(day), goal: day.fatGoal, color: "var(--color-orange-400)" },
      };
    case "sugar":
    case "sodium":
      return {
        ...base,
        value: null,
        unit: id === "sugar" ? "g" : "mg",
        note: LIMIT[id],
        to: "/track/insights",
      };
    case "water": {
      const oz = dayWaterOz(day);
      return {
        ...base,
        value: fmt(oz),
        unit: "oz",
        note: `of ${fmt(day.waterGoalOz)} oz`,
        to: "/track/water",
        ring: { value: oz, goal: day.waterGoalOz, color: "var(--color-graphic)" },
        quick: d.onAddWater && { label: "Add 8 oz of water", text: "+8 oz", run: d.onAddWater },
      };
    }
    case "activeMinutes":
      return {
        ...base,
        value: fmt(day.activeMinutes),
        unit: "min",
        note: `of ${fmt(day.activeGoal)} min`,
        to: "/track/activity",
        ring: { value: day.activeMinutes, goal: day.activeGoal, color: "var(--color-graphic)" },
      };
    case "weight":
      return {
        ...base,
        value: d.weightLb === null ? null : d.weightLb.toFixed(1),
        unit: "lb",
        note: d.weightNote,
        to: "/track/weight",
      };
    case "medication":
      return {
        ...base,
        value: d.medication?.value ?? null,
        unit: "",
        note: d.medication?.note ?? "None scheduled",
        to: "/track/medication",
      };
  }
}

function OverviewCard({ m }: { m: CardModel }) {
  const pct = m.ring && m.ring.goal > 0 ? Math.round((m.ring.value / m.ring.goal) * 100) : 0;
  const recorded = m.value !== null;
  return (
    <li className="relative">
      <Link
        to={m.to}
        aria-label={`${m.label}: ${recorded ? `${m.value} ${m.unit}` : "not recorded"}, ${m.note}. Open details`}
        className="flex h-full min-h-[18rem] flex-col rounded-[18px] border border-border-default bg-white p-4 shadow-card hover:shadow-card-hover motion-safe:transition-shadow"
      >
        <span className="flex items-center gap-2">
          <Icon name={m.icon} size={14} color="var(--color-text-neutral-500)" />
          <span className="min-w-0 flex-1 truncate text-[13px] type-item-title tracking-[-0.585px] text-text-neutral-500">
            {m.label}
          </span>
        </span>
        <span className="flex flex-1 items-center justify-center py-3">
          {m.ring ? (
            <MiniRing
              value={m.ring.value}
              goal={m.ring.goal}
              size={132}
              stroke={14}
              color={m.ring.color}
              overlap
              label={`${m.label} ${pct}% of goal`}
            >
              <span className="text-[30px] type-numeral leading-none tracking-[-1.1px] tabular-nums text-text-primary">
                {m.value}
              </span>
              <span className="mt-0.5 text-[13px] type-meta text-text-neutral-500">{m.unit}</span>
              <span className="text-[13px] type-meta tabular-nums text-text-neutral-500">{pct}%</span>
            </MiniRing>
          ) : (
            <span className="flex flex-col items-center text-center">
              <span className="text-[30px] type-numeral leading-none tracking-[-1.1px] tabular-nums text-text-primary">
                {m.value ?? "–"}
              </span>
              {m.unit && recorded && (
                <span className="mt-1 text-[13px] type-meta text-text-neutral-500">{m.unit}</span>
              )}
              {!recorded && (
                <span className="mt-2 text-[13px] type-meta text-text-neutral-500">Not recorded</span>
              )}
            </span>
          )}
        </span>
        <span className="block text-center text-[13px] type-meta leading-5 text-text-secondary">{m.note}</span>
      </Link>
      {m.quick && (
        <button
          type="button"
          aria-label={m.quick.label}
          onClick={m.quick.run}
          className="tap-44 absolute right-3 top-3 inline-flex h-8 items-center justify-center rounded-full bg-brand-teal-soft px-3 text-[13px] type-button text-brand-navy hover:bg-teal-100"
        >
          {m.quick.text}
        </button>
      )}
    </li>
  );
}

/** The customisable Track overview: header with Edit, the "make it yours" tip, and the cards. */
export function TrackOverview({ data }: { data: OverviewData }) {
  const layout = useOverviewLayout();
  const [editing, setEditing] = useState(false);
  const [tour, setTour] = useState(false);
  const [tipDismissed, dismissTip] = useOverviewTipDismissed();

  return (
    <section aria-labelledby="track-overview" className="border-t border-border-divider pt-5">
      <div className="flex items-center gap-3">
        <h2 id="track-overview" className={cn(EYEBROW, "min-w-0 flex-1 text-brand-navy")}>
          Overview
        </h2>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="tap-44 relative inline-flex items-center gap-1.5 text-[13px] type-button text-primary"
        >
          <Icon name="pencilEdit" size={14} color="var(--color-primary)" />
          Edit
        </button>
      </div>
      {!tipDismissed && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl bg-brand-warm-gray px-4 py-2.5 text-[13px]">
          <p className="min-w-0 flex-1 type-meta text-text-secondary">New: make this overview yours.</p>
          <button
            type="button"
            onClick={() => {
              setTour(true);
              setEditing(true);
            }}
            className="tap-44 relative type-button text-brand-navy"
          >
            Take the tour
          </button>
          <button type="button" onClick={dismissTip} className="tap-44 relative type-meta text-text-secondary">
            Dismiss
          </button>
        </div>
      )}
      {layout.showing.length === 0 ? (
        <p className="panel mt-3 p-4 text-[13px] type-meta text-text-secondary">
          Nothing is showing. Use Edit to add the metrics you want here.
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {layout.showing.map((id) => (
            <OverviewCard key={id} m={model(id, data)} />
          ))}
        </ul>
      )}
      {editing && (
        <EditOverviewDialog
          layout={layout}
          tour={tour}
          onTour={() => setTour((t) => !t)}
          onClose={() => {
            setEditing(false);
            setTour(false);
            dismissTip();
          }}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------ Edit dialog */

const ROUND_BTN =
  "tap-44 relative flex size-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-white text-text-primary hover:border-text-neutral-400 disabled:cursor-not-allowed disabled:text-text-neutral-400 disabled:hover:border-border-default";

function EditOverviewDialog({
  layout,
  tour,
  onTour,
  onClose,
}: {
  layout: ReturnType<typeof useOverviewLayout>;
  tour: boolean;
  onTour: () => void;
  onClose: () => void;
}) {
  const { showing, hidden, move, remove, add, reset } = layout;
  return (
    <Dialog
      title="Edit overview"
      description="Choose what shows on Track, and in what order."
      onClose={onClose}
      className="md:max-w-[450px]"
    >
      {tour && (
        <ol className="mb-4 list-decimal space-y-1 rounded-2xl bg-brand-warm-gray py-3 pl-8 pr-4 text-[13px] type-meta text-text-secondary">
          <li>Use the up and down arrows to change the order.</li>
          <li>Use the minus button to hide a metric.</li>
          <li>Use the plus button under Not showing to bring one back.</li>
        </ol>
      )}
      <h3 className="eyebrow text-[13px]">Showing</h3>
      <ul className="mt-1 divide-y divide-border-divider">
        {showing.map((id, i) => (
          <li key={id} className="flex items-center gap-2 py-2">
            <span className="min-w-0 flex-1 truncate text-[13px] type-item-title text-text-primary">
              {ITEM[id].label}
            </span>
            <button
              type="button"
              aria-label={`Move ${ITEM[id].label} up`}
              disabled={i === 0}
              onClick={() => move(id, -1)}
              className={ROUND_BTN}
            >
              <Icon name="arrowUpSmall" size={16} color="currentColor" />
            </button>
            <button
              type="button"
              aria-label={`Move ${ITEM[id].label} down`}
              disabled={i === showing.length - 1}
              onClick={() => move(id, 1)}
              className={ROUND_BTN}
            >
              <Icon name="arrowDownSmall" size={16} color="currentColor" />
            </button>
            <button
              type="button"
              aria-label={`Hide ${ITEM[id].label}`}
              onClick={() => remove(id)}
              className={ROUND_BTN}
            >
              <Icon name="minusSign" size={16} color="currentColor" />
            </button>
          </li>
        ))}
        {showing.length === 0 && (
          <li className="py-3 text-[13px] type-meta text-text-secondary">Nothing showing.</li>
        )}
      </ul>
      {hidden.length > 0 && (
        <>
          <h3 className="eyebrow mt-5 text-[13px]">Not showing</h3>
          <ul className="mt-1 divide-y divide-border-divider">
            {hidden.map((id) => (
              <li key={id} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1 truncate text-[13px] type-meta text-text-secondary">
                  {ITEM[id].label}
                </span>
                <button
                  type="button"
                  aria-label={`Show ${ITEM[id].label}`}
                  onClick={() => add(id)}
                  className={ROUND_BTN}
                >
                  <Icon name="plusSign" size={16} color="currentColor" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="mt-6 flex items-center gap-4">
        <button type="button" onClick={reset} className="tap-44 relative text-[13px] type-meta text-text-secondary">
          Reset to default
        </button>
        <button
          type="button"
          onClick={onTour}
          aria-pressed={tour}
          className="tap-44 relative text-[13px] type-button text-primary"
        >
          Take the tour
        </button>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto h-12 rounded-full bg-primary px-8 text-[13px] type-button text-white hover:bg-primary-hover"
        >
          Done
        </button>
      </div>
    </Dialog>
  );
}
