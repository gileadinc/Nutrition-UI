import type { DailySummary } from "@/lib/api";
import styles from "./MacroSummary.module.css";

const MACROS = [
  { key: "calories", label: "Calories", unit: "" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
] as const;

function formatDate(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function MacroSummary({ summary }: { summary: DailySummary }) {
  const water = summary.totals.waterMl ?? 0;
  const waterTarget = summary.targets.waterMl;

  return (
    <div>
      <div className={styles.meta}>
        <span>{formatDate(summary.date)}</span>
        <span aria-hidden="true">·</span>
        <span>
          {summary.entryCount} {summary.entryCount === 1 ? "entry" : "entries"} logged
        </span>
      </div>

      <div className={styles.grid}>
        {MACROS.map(({ key, label, unit }) => {
          const total = summary.totals[key] ?? 0;
          const target = summary.targets[key] ?? 0;
          const remaining = summary.remaining[key] ?? Math.max(0, target - total);
          const pct = Math.min(100, summary.progressPercent[key] ?? 0);
          return (
            <div key={key} className={styles.macro}>
              <div className={styles.macroHead}>
                <span className={styles.macroLabel}>{label}</span>
                <span className={styles.macroValue}>
                  {Math.round(total)}
                  {unit}{" "}
                  <span className={styles.macroTarget}>
                    / {Math.round(target)}
                    {unit}
                  </span>
                </span>
              </div>
              <div className={styles.track}>
                <div className={styles.fill} style={{ width: `${pct}%` }} />
              </div>
              <span className={styles.macroRemaining}>
                {Math.round(remaining)}
                {unit} left
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.water}>
        <span className={styles.macroLabel}>Water</span>
        <span className={styles.macroValue}>
          {Math.round(water)} ml
          {typeof waterTarget === "number" ? (
            <span className={styles.macroTarget}> / {Math.round(waterTarget)} ml</span>
          ) : null}
        </span>
      </div>
    </div>
  );
}
