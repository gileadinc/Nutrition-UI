"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataState } from "@/components/DataState";
import { Button } from "@/components/ui/button";
import { useApiResource } from "@/lib/hooks";
import { trackingApi, getErrorMessage, type NutritionEntry } from "@/lib/api";
import type { EntryInput } from "@/lib/api/endpoints/tracking";
import { EntryDialog } from "./EntryDialog";
import { TodayDashboard } from "./TodayDashboard";
import styles from "./page.module.css";

export default function TrackPage() {
  const summary = useApiResource(() => trackingApi.getDailySummary(), []);
  const entries = useApiResource(() => trackingApi.listEntries({ limit: 50 }), []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NutritionEntry | null>(null);

  function refreshAll() {
    summary.refetch();
    entries.refetch();
  }

  function openLog() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(entry: NutritionEntry) {
    setEditing(entry);
    setDialogOpen(true);
  }

  async function handleSubmit(payload: EntryInput) {
    if (editing) {
      await trackingApi.updateEntry(editing.entryId, payload);
      toast.success("Entry updated");
    } else {
      await trackingApi.createEntry(payload);
      toast.success("Meal logged");
    }
    refreshAll();
  }

  async function handleDelete(entryId: string) {
    try {
      await trackingApi.deleteEntry(entryId);
      toast.success("Entry deleted");
      refreshAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1 className={styles.heading}>Track</h1>
          <p className={styles.subheading}>
            Log what you eat and drink and watch today&apos;s totals.
          </p>
        </div>
        <Button type="button" onClick={openLog} className={styles.logButton}>
          <Plus className="size-4" />
          Log a meal
        </Button>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Today</h2>
        <DataState resource={summary}>
          {(data) => (
            <TodayDashboard summary={data} entries={entries.data?.items ?? []} />
          )}
        </DataState>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Today&apos;s entries</h2>
          <Button type="button" variant="outline" size="sm" onClick={openLog}>
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
        <DataState
          resource={entries}
          isEmpty={(d) => d.items.length === 0}
          emptyTitle="Nothing logged yet"
          emptyDescription="Tap “Log a meal” to add your first entry."
        >
          {(data) => (
            <ul className={styles.entries}>
              {data.items.map((entry) => (
                <li key={entry.entryId} className={styles.entry}>
                  <div className={styles.entryInfo}>
                    <p className={styles.entryMeal}>
                      {entry.mealType[0].toUpperCase() + entry.mealType.slice(1)}
                    </p>
                    <p className={styles.entryMacros}>
                      {[
                        entry.calories != null ? `${entry.calories} kcal` : null,
                        entry.protein != null ? `${entry.protein}p` : null,
                        entry.carbs != null ? `${entry.carbs}c` : null,
                        entry.fat != null ? `${entry.fat}f` : null,
                        entry.waterMl != null ? `${entry.waterMl}ml` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "No macros"}
                    </p>
                    {entry.notes ? <p className={styles.entryNotes}>{entry.notes}</p> : null}
                  </div>
                  <div className={styles.entryActions}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit entry"
                      title="Edit"
                      onClick={() => openEdit(entry)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className={styles.deleteButton}
                      aria-label="Delete entry"
                      title="Delete"
                      onClick={() => handleDelete(entry.entryId)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DataState>
      </section>

      <EntryDialog
        open={dialogOpen}
        entry={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
