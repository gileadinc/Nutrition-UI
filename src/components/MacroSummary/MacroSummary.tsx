import type { DailySummary } from "@/lib/api";
import styles from "./MacroSummary.module.css";

const MACROS = [
  { key: "calories", label: "Calories", unit: "" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
] as const;

export function MacroSummary({ summary }: { summary: DailySummary }) {
  return (
    <div className={styles.grid}>
      {MACROS.map(({ key, label, unit }) => {
        const total = summary.totals[key] ?? 0;
        const target = summary.targets[key] ?? 0;
        const pct = Math.min(100, summary.progressPercent[key] ?? 0);
        return (
          <div key={key} className={styles.macro}>
            <div className={styles.macroHead}>
              <span className={styles.macroLabel}>{label}</span>
              <span className={styles.macroValue}>
                {Math.round(total)}
                {unit} <span className={styles.macroTarget}>/ {Math.round(target)}{unit}</span>
              </span>
            </div>
            <div className={styles.track}>
              <div className={styles.fill} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
