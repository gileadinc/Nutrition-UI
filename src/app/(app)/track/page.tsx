"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { DataState } from "@/components/DataState";
import { MacroSummary } from "@/components/MacroSummary";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/ui/button";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { useApiResource } from "@/lib/hooks";
import { trackingApi, getErrorMessage, type MealType, type NutritionEntry } from "@/lib/api";
import styles from "./page.module.css";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const EMPTY_FORM = {
  mealType: "breakfast" as MealType,
  notes: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  waterMl: "",
};

export default function TrackPage() {
  const summary = useApiResource(() => trackingApi.getDailySummary(), []);
  const entries = useApiResource(() => trackingApi.listEntries({ limit: 50 }), []);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function num(value: string): number | undefined {
    if (value.trim() === "") return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function refreshAll() {
    summary.refetch();
    entries.refetch();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const payload = {
      mealType: form.mealType,
      notes: form.notes || undefined,
      calories: num(form.calories),
      protein: num(form.protein),
      carbs: num(form.carbs),
      fat: num(form.fat),
      waterMl: num(form.waterMl),
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await trackingApi.updateEntry(editingId, payload);
        toast.success("Entry updated");
      } else {
        await trackingApi.createEntry(payload);
        toast.success("Meal logged");
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      refreshAll();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(entry: NutritionEntry) {
    setEditingId(entry.entryId);
    setForm({
      mealType: entry.mealType,
      notes: entry.notes ?? "",
      calories: entry.calories?.toString() ?? "",
      protein: entry.protein?.toString() ?? "",
      carbs: entry.carbs?.toString() ?? "",
      fat: entry.fat?.toString() ?? "",
      waterMl: entry.waterMl?.toString() ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(entryId: string) {
    try {
      await trackingApi.deleteEntry(entryId);
      toast.success("Entry deleted");
      if (editingId === entryId) {
        setEditingId(null);
        setForm(EMPTY_FORM);
      }
      refreshAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.heading}>Track</h1>
        <p className={styles.subheading}>Log what you eat and drink and watch today&apos;s totals.</p>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Today</h2>
        <DataState resource={summary}>
          {(data) => <MacroSummary summary={data} />}
        </DataState>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{editingId ? "Edit entry" : "Log a meal"}</h2>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div>
            <label className={styles.label} htmlFor="mealType">
              Meal
            </label>
            <select
              id="mealType"
              className={styles.select}
              value={form.mealType}
              onChange={(e) => setForm({ ...form, mealType: e.target.value as MealType })}
            >
              {MEAL_TYPES.map((m) => (
                <option key={m} value={m}>
                  {m[0].toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.macroRow}>
            <TextField
              label="Calories"
              type="number"
              inputMode="numeric"
              value={form.calories}
              onChange={(e) => setForm({ ...form, calories: e.target.value })}
            />
            <TextField
              label="Protein (g)"
              type="number"
              inputMode="numeric"
              value={form.protein}
              onChange={(e) => setForm({ ...form, protein: e.target.value })}
            />
            <TextField
              label="Carbs (g)"
              type="number"
              inputMode="numeric"
              value={form.carbs}
              onChange={(e) => setForm({ ...form, carbs: e.target.value })}
            />
            <TextField
              label="Fat (g)"
              type="number"
              inputMode="numeric"
              value={form.fat}
              onChange={(e) => setForm({ ...form, fat: e.target.value })}
            />
            <TextField
              label="Water (ml)"
              type="number"
              inputMode="numeric"
              value={form.waterMl}
              onChange={(e) => setForm({ ...form, waterMl: e.target.value })}
            />
          </div>

          <TextField
            label="Notes (optional)"
            type="text"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}

          <div className={styles.actions}>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : editingId ? "Update entry" : "Log meal"}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Today&apos;s entries</h2>
        <DataState
          resource={entries}
          isEmpty={(d) => d.items.length === 0}
          emptyTitle="Nothing logged yet"
          emptyDescription="Your logged meals will appear here."
        >
          {(data) => (
            <ul className={styles.entries}>
              {data.items.map((entry) => (
                <li key={entry.entryId} className={styles.entry}>
                  <div>
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
                    <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(entry)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.entryId)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DataState>
      </section>
    </div>
  );
}
