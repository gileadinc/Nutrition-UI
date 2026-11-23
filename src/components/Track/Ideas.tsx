"use client";

import { useId, useMemo, useState } from "react";
import { AppImage } from "@/components/AppImage";
import { Icon } from "@/components/Icon";
import { toHackVM, toRecipeVM } from "@/screens/catalog/adapt";
import { Link, useNavigate } from "@/lib/nav";
import { fitFor, fitsToday } from "@/lib/nutrition";
import { useDayBudget, useFastHacks, useRecipes } from "@/lib/store";
import { cn } from "@/lib/utils";
import { SheetFrame } from "./LogSheet";

interface Pick {
  key: string;
  kind: "out" | "cook";
  title: string;
  source: string;
  image: string;
  calories: number;
  protein: number;
  minutes: number;
  to: string;
}

type Show = "all" | "out" | "cook";
type Sort = "protein" | "calories" | "quick";

const SHOW: { value: Show; label: string }[] = [
  { value: "all", label: "All" },
  { value: "out", label: "Eat out" },
  { value: "cook", label: "Cook" },
];
const SORT: { value: Sort; label: string }[] = [
  { value: "protein", label: "Most protein" },
  { value: "calories", label: "Fewest calories" },
  { value: "quick", label: "Quickest" },
];

const kcal = (n: number) => n.toLocaleString("en-US");

/** Eat-out hacks and recipes that still fit what is left of today's calories. */
function usePicks(): Pick[] {
  const { budget } = useDayBudget();
  const hacks = useFastHacks({ limit: 50 });
  const recipes = useRecipes({ limit: 50 });
  return useMemo(() => {
    const out: Pick[] = (hacks.data?.items ?? []).map((raw) => {
      const h = toHackVM(raw);
      return {
        key: `hack-${h.id}`,
        kind: "out",
        title: h.title,
        source: h.restaurant,
        image: h.image,
        calories: h.calories,
        protein: h.protein,
        minutes: 5,
        to: `/hack/${h.id}`,
      };
    });
    const cook: Pick[] = (recipes.data?.items ?? []).map((raw) => {
      const r = toRecipeVM(raw);
      return {
        key: `recipe-${r.id}`,
        kind: "cook",
        title: r.title,
        source: r.time,
        image: r.image,
        calories: r.calories,
        protein: r.protein,
        minutes: r.minutes || 30,
        to: `/recipes/${r.id}`,
      };
    });
    return [...out, ...cook].filter((p) => p.calories > 0 && fitsToday(fitFor(p, budget)));
  }, [hacks.data, recipes.data, budget]);
}

/** "Ideas" pill on the calories card; opens the "Fits your day" dialog. Hidden when nothing fits. */
export function IdeasButton() {
  const { budget } = useDayBudget();
  const picks = usePicks();
  const [open, setOpen] = useState(false);
  if (budget.calories.remaining <= 0 || picks.length === 0) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="What fits your day"
        className="tap-44 relative flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-navy-soft px-3 text-[12px] type-button text-brand-navy transition-colors hover:bg-navy-100"
      >
        <Icon name="sparkles" size={13} color="currentColor" />
        Ideas
      </button>
      {open && <IdeasDialog picks={picks} onClose={() => setOpen(false)} />}
    </>
  );
}

function IdeasDialog({ picks, onClose }: { picks: Pick[]; onClose: () => void }) {
  const titleId = useId();
  const navigate = useNavigate();
  const { budget } = useDayBudget();
  const [show, setShow] = useState<Show>("all");
  const [sort, setSort] = useState<Sort>("protein");
  const { goal, remaining } = budget.calories;
  const eaten = Math.max(0, goal - remaining);
  const share = goal > 0 ? Math.min(1, Math.max(0, eaten / goal)) : 0;

  const shown = picks
    .filter((p) => show === "all" || p.kind === show)
    .sort((a, b) =>
      sort === "protein"
        ? b.protein - a.protein
        : sort === "calories"
          ? a.calories - b.calories
          : a.minutes - b.minutes,
    )
    .slice(0, 6);

  const pill = (on: boolean) =>
    cn(
      "tap-44 relative flex items-center rounded-full border px-3.5 py-2 text-[13px] tracking-[-0.585px]",
      on
        ? "border-transparent bg-selected text-on-selected type-button"
        : "type-button-secondary border-border-default bg-white text-text-primary",
    );

  return (
    <SheetFrame labelledBy={titleId} onClose={onClose} className="md:max-w-2xl">
      <header className="flex items-start gap-3 pt-3 md:pt-7">
        <div className="min-w-0 flex-1">
          <p className="eyebrow flex items-center gap-1.5 text-[12px]">
            <Icon name="sparkles" size={14} color="currentColor" /> Fits your day
          </p>
          <h2
            id={titleId}
            className="mt-1 text-[28px] leading-8 type-numeral tracking-[-1.2px] tabular-nums text-brand-navy"
          >
            {kcal(remaining)}{" "}
            <span className="text-base tracking-normal text-text-secondary">kcal left today</span>
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close ideas"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy-soft text-brand-navy"
        >
          <Icon name="close" size={18} color="currentColor" />
        </button>
      </header>

      <div className="mt-4">
        <div aria-hidden className="h-2 overflow-hidden rounded-full bg-navy-50">
          <div
            className="h-full rounded-full bg-accent-graphic"
            style={{ width: `${share * 100}%` }}
          />
        </div>
        <p className="mt-1.5 flex justify-between text-[12px] tabular-nums type-meta text-text-secondary">
          <span>{kcal(eaten)} eaten</span>
          <span>Goal {kcal(goal)} kcal</span>
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div role="group" aria-label="Show" className="flex gap-2">
          {SHOW.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-pressed={show === s.value}
              onClick={() => setShow(s.value)}
              className={pill(show === s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[13px] type-meta text-text-secondary">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="tap-44 relative h-10 rounded-full border border-border-default bg-white px-3 text-[13px] text-text-primary"
          >
            {SORT.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-navy-50 px-4 py-6 text-center text-sm text-text-secondary">
          Nothing here fits the rest of today. Try another filter.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {shown.map((p) => (
            <li key={p.key}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(p.to);
                }}
                aria-label={`Log ${p.title}`}
                className="tap-44 group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border-divider bg-white text-left transition-colors hover:border-brand-navy"
              >
                <span className="relative block h-28 w-full overflow-hidden bg-brand-warm-gray">
                  <AppImage src={p.image} alt="" className="size-full object-cover" />
                  <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[12px] type-button text-brand-navy">
                    {p.kind === "out" ? "Eat out" : "Cook"}
                  </span>
                </span>
                <span className="flex flex-1 flex-col gap-1 p-3">
                  <span className="truncate text-[14px] type-item-title text-text-primary">
                    {p.title}
                  </span>
                  <span className="truncate text-[12px] type-meta text-text-secondary">
                    {p.source}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-[12px] tabular-nums">
                    <span className="rounded-full bg-navy-50 px-2 py-0.5 text-brand-navy">
                      {p.calories} kcal
                    </span>
                    <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-brand-navy">
                      {p.protein} g protein
                    </span>
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-2 border-t border-border-divider pt-2 text-[12px] tabular-nums type-meta text-text-secondary">
                    {kcal(Math.max(0, remaining - p.calories))} kcal left after
                    <span
                      aria-hidden
                      className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border-default text-brand-navy transition-colors group-hover:border-brand-navy group-hover:bg-brand-navy group-hover:text-white"
                    >
                      <Icon name="plusSign" size={14} color="currentColor" />
                    </span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/fast-hacks?fits=1"
        onClick={onClose}
        className="mt-4 flex min-h-11 items-center justify-center rounded-full border border-brand-navy text-sm type-section-title text-brand-navy hover:bg-navy-soft"
      >
        Explore more ideas <Icon name="chevronRight" size={16} color="currentColor" />
      </Link>
    </SheetFrame>
  );
}
