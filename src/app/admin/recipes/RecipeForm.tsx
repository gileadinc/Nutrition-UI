"use client";

import { useState } from "react";
import { AdminEditor } from "../_components/AdminEditor";
import {
  TextInput,
  TextArea,
  NumberInput,
  ListInput,
  SelectInput,
  listToText,
  textToList,
  numOrUndef,
} from "../_components/fields";
import { adminApi, type AdminRecipe } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "../_components/admin-form.module.css";

const CATEGORIES = [
  { value: "", label: "Not set" },
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
  { value: "cook_at_home", label: "Cook at home" },
];

interface FormState {
  title: string;
  description: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  prepTimeMinutes: string;
  servings: string;
  category: string;
  imageUrl: string;
  goalTags: string;
  ingredients: string;
  steps: string;
}

function seed(item: AdminRecipe | null): FormState {
  return {
    title: item?.title ?? "",
    description: item?.description ?? "",
    calories: item?.calories != null ? String(item.calories) : "",
    protein: item?.protein != null ? String(item.protein) : "",
    carbs: item?.carbs != null ? String(item.carbs) : "",
    fat: item?.fat != null ? String(item.fat) : "",
    prepTimeMinutes: item?.prepTimeMinutes != null ? String(item.prepTimeMinutes) : "",
    servings: item?.servings != null ? String(item.servings) : "",
    category: item?.category ?? "",
    imageUrl: item?.imageUrl ?? "",
    goalTags: listToText(item?.goalTags),
    ingredients: listToText(item?.ingredients),
    steps: listToText(item?.steps),
  };
}

export function RecipeForm({ id }: { id: string | null }) {
  const [form, setForm] = useState<FormState>(() => seed(null));
  const [seededFor, setSeededFor] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <AdminEditor<AdminRecipe>
      id={id}
      listHref={ROUTES.admin.recipes}
      titleNew="New recipe"
      titleEdit="Edit recipe"
      editHref={(newId) => ROUTES.admin.recipe(newId)}
      api={adminApi.recipes}
      currentStatus={(item) => item?.status}
      buildPayload={() => ({
        title: form.title.trim(),
        description: form.description.trim(),
        calories: numOrUndef(form.calories),
        protein: numOrUndef(form.protein),
        carbs: numOrUndef(form.carbs),
        fat: numOrUndef(form.fat),
        prepTimeMinutes: numOrUndef(form.prepTimeMinutes),
        servings: numOrUndef(form.servings),
        category: form.category || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        goalTags: textToList(form.goalTags),
        ingredients: textToList(form.ingredients),
        steps: textToList(form.steps),
      })}
    >
      {(item) => {
        // Re-seed once when the loaded item arrives.
        const key = item?.id ?? "new";
        if (seededFor !== key) {
          setSeededFor(key);
          if (item) setForm(seed(item));
        }
        return (
          <>
            <TextInput
              label="Title"
              required
              value={form.title}
              onChange={(v) => set("title", v)}
            />
            <TextArea
              label="Description"
              required
              rows={3}
              value={form.description}
              onChange={(v) => set("description", v)}
            />
            <div className={styles.grid4}>
              <NumberInput
                label="Calories"
                value={form.calories}
                onChange={(v) => set("calories", v)}
              />
              <NumberInput
                label="Protein (g)"
                value={form.protein}
                onChange={(v) => set("protein", v)}
              />
              <NumberInput
                label="Carbs (g)"
                value={form.carbs}
                onChange={(v) => set("carbs", v)}
              />
              <NumberInput label="Fat (g)" value={form.fat} onChange={(v) => set("fat", v)} />
            </div>
            <div className={styles.grid2}>
              <NumberInput
                label="Prep time (min)"
                value={form.prepTimeMinutes}
                onChange={(v) => set("prepTimeMinutes", v)}
              />
              <NumberInput
                label="Servings"
                value={form.servings}
                onChange={(v) => set("servings", v)}
              />
            </div>
            <div className={styles.grid2}>
              <SelectInput
                label="Category"
                value={form.category}
                onChange={(v) => set("category", v)}
                options={CATEGORIES}
              />
              <TextInput
                label="Image URL"
                value={form.imageUrl}
                onChange={(v) => set("imageUrl", v)}
                placeholder="https://…"
              />
            </div>
            <ListInput
              label="Goal tags"
              value={form.goalTags}
              onChange={(v) => set("goalTags", v)}
            />
            <ListInput
              label="Ingredients"
              value={form.ingredients}
              onChange={(v) => set("ingredients", v)}
            />
            <ListInput
              label="Steps"
              value={form.steps}
              onChange={(v) => set("steps", v)}
            />
          </>
        );
      }}
    </AdminEditor>
  );
}
