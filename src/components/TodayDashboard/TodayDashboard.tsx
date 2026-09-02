"use client";

import { ReactNode, useMemo } from "react";
import { Flame, Droplet, ListChecks, Target } from "lucide-react";
import type { DailySummary, NutritionEntry, MealType } from "@/lib/api";
import styles from "./TodayDashboard.module.css";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const MACROS = [
  { key: "protein", label: "Protein", color: "var(--chart-1, #12A9A0)" },
  { key: "carbs", label: "Carbs", color: "var(--chart-2, #E8663A)" },
  { key: "fat", label: "Fat", color: "var(--chart-3, #4b8f89)" },
] as const;

function Ring({
  percent,
  label,
  value,
  sub,
}: {
  percent: number;
  label: string;
  value: string;
  sub: string;
}) {
  const p = Math.max(0, Math.min(100, percent));
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (p / 100) * circ;
  return (
    <div className={styles.ring}>
      <svg
        viewBox="0 0 120 120"
        className={styles.ringSvg}
        role="img"
        aria-label={`${label}: ${value}, ${Math.round(p)}% of target`}
      >
        <circle cx="60" cy="60" r={r} className={styles.ringTrack} strokeWidth="12" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          className={styles.ringFill}
          strokeWidth="12"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className={styles.ringLabel}>
        <span className={styles.ringValue}>{value}</span>
        <span className={styles.ringSub}>{sub}</span>
      </div>
    </div>
  );
}

export interface TodayDashboardProps {
  summary: DailySummary;
  /** When provided, renders the per-meal calorie breakdown chart. */
  entries?: NutritionEntry[];
}

export function TodayDashboard({ summary, entries }: TodayDashboardProps) {
  const calTarget = summary.targets.calories || 0;
  const calTotal = summary.totals.calories || 0;
  const calRemaining = summary.remaining.calories ?? Math.max(0, calTarget - calTotal);
  const calPercent =
    summary.progressPercent.calories ?? (calTarget ? (calTotal / calTarget) * 100 : 0);

  const water = summary.totals.waterMl ?? 0;
  const waterTarget = summary.targets.waterMl;

  const byMeal = useMemo(() => {
    if (!entries) return null;
    const acc: Record<string, number> = {};
    for (const e of entries) {
      acc[e.mealType] = (acc[e.mealType] ?? 0) + (e.calories ?? 0);
    }
    const max = Math.max(1, ...Object.values(acc));
    return MEAL_ORDER.map((meal) => ({
      meal,
      calories: Math.round(acc[meal] ?? 0),
      pct: ((acc[meal] ?? 0) / max) * 100,
    }));
  }, [entries]);

  const loggedMeals = byMeal
    ? byMeal.filter((m) => m.calories > 0).length
    : Math.min(summary.entryCount, 4);

  return (
    <div className={styles.dashboard}>
      <div className={styles.topRow}>
        <Ring
          percent={calPercent}
          label="Calories"
          value={`${Math.round(calTotal)}`}
          sub={`of ${Math.round(calTarget)} kcal`}
        />

        <div className={styles.macroBars}>
          {MACROS.map(({ key, label, color }) => {
            const total = summary.totals[key] ?? 0;
            const target = summary.targets[key] ?? 0;
            const pct = Math.min(100, summary.progressPercent[key] ?? 0);
            const remaining = summary.remaining[key] ?? Math.max(0, target - total);
            return (
              <div key={key} className={styles.macroBar}>
                <div className={styles.macroBarHead}>
                  <span className={styles.macroBarLabel}>
                    <span className={styles.dot} style={{ background: color }} />
                    {label}
                  </span>
                  <span className={styles.macroBarValue}>
                    {Math.round(total)} / {Math.round(target)} g
                  </span>
                </div>
                <div className={styles.track}>
                  <div className={styles.fill} style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className={styles.macroBarRemaining}>{Math.round(remaining)} g left</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.statRow}>
        <Stat icon={<Flame />} value={`${Math.round(calRemaining)}`} label="kcal left" />
        <Stat
          icon={<Droplet />}
          value={`${Math.round(water)}${waterTarget ? ` / ${Math.round(waterTarget)}` : ""}`}
          label="ml water"
        />
        <Stat icon={<ListChecks />} value={`${summary.entryCount}`} label="entries" />
        <Stat icon={<Target />} value={`${loggedMeals}/4`} label="meals" />
      </div>

      {byMeal ? (
        <div className={styles.chart}>
          <p className={styles.chartTitle}>Calories by meal</p>
          {byMeal.every((m) => m.calories === 0) ? (
            <p className={styles.chartEmpty}>Log a meal to see the breakdown.</p>
          ) : (
            <div className={styles.bars}>
              {byMeal.map(({ meal, calories, pct }) => (
                <div key={meal} className={styles.barGroup}>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.bar}
                      style={{ height: `${Math.max(pct, calories > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                  <span className={styles.barValue}>{calories || "—"}</span>
                  <span className={styles.barLabel}>
                    {meal[0].toUpperCase() + meal.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
