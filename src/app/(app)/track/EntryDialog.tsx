"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/TextField";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { getErrorMessage, type MealType, type NutritionEntry } from "@/lib/api";
import type { EntryInput } from "@/lib/api/endpoints/tracking";
import styles from "./EntryDialog.module.css";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

type FormShape = {
  mealType: MealType;
  notes: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  waterMl: string;
};

const EMPTY: FormShape = {
  mealType: "breakfast",
  notes: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  waterMl: "",
};

function fromEntry(entry: NutritionEntry): FormShape {
  return {
    mealType: entry.mealType,
    notes: entry.notes ?? "",
    calories: entry.calories?.toString() ?? "",
    protein: entry.protein?.toString() ?? "",
    carbs: entry.carbs?.toString() ?? "",
    fat: entry.fat?.toString() ?? "",
    waterMl: entry.waterMl?.toString() ?? "",
  };
}

function num(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export interface EntryDialogProps {
  open: boolean;
  /** Present → editing that entry; absent → logging a new one. */
  entry?: NutritionEntry | null;
  onClose: () => void;
  onSubmit: (payload: EntryInput) => Promise<void>;
}

export function EntryDialog({ open, entry, onClose, onSubmit }: EntryDialogProps) {
  const editing = Boolean(entry);
  const [form, setForm] = useState<FormShape>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(entry ? fromEntry(entry) : EMPTY);
      setError(null);
      setSubmitting(false);
    }
  }, [open, entry]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const payload: EntryInput = {
      mealType: form.mealType,
      notes: form.notes || undefined,
      calories: num(form.calories),
      protein: num(form.protein),
      carbs: num(form.carbs),
      fat: num(form.fat),
      waterMl: num(form.waterMl),
    };

    if (
      payload.calories == null &&
      payload.protein == null &&
      payload.carbs == null &&
      payload.fat == null &&
      payload.waterMl == null
    ) {
      setError("Enter at least one value (calories, a macro, or water).");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogPrimitive.Root
      open={open}
      // Do not close on outside click…
      disablePointerDismissal
      // …and ignore the Escape key: only Cancel / a successful save closes it.
      onOpenChange={(nextOpen, details) => {
        if (nextOpen) return;
        if (details.reason === "escape-key") return;
        onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className={styles.backdrop} />
        <DialogPrimitive.Popup className={styles.popup}>
          <div className={styles.head}>
            <DialogPrimitive.Title className={styles.title}>
              {editing ? "Edit entry" : "Log a meal"}
            </DialogPrimitive.Title>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div>
              <label className={styles.label} htmlFor="entry-meal">
                Meal
              </label>
              <select
                id="entry-meal"
                className={styles.select}
                value={form.mealType}
                onChange={(e) =>
                  setForm({ ...form, mealType: e.target.value as MealType })
                }
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
              <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : editing ? "Save changes" : "Log meal"}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
