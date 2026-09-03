"use client";

import { useState } from "react";
import { AdminEditor } from "../_components/AdminEditor";
import {
  TextInput,
  TextArea,
  NumberInput,
  ListInput,
  listToText,
  textToList,
  numOrUndef,
} from "../_components/fields";
import { adminApi, type AdminMenuItem } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "../_components/admin-form.module.css";

interface FormState {
  restaurantId: string;
  restaurantName: string;
  name: string;
  description: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  whyThisWorks: string;
  imageUrl: string;
  goalTags: string;
  swaps: string;
  whatToOrder: string;
}

function seed(item: AdminMenuItem | null): FormState {
  return {
    restaurantId: item?.restaurantId ?? "",
    restaurantName: item?.restaurantName ?? "",
    name: item?.name ?? "",
    description: item?.description ?? "",
    calories: item?.calories != null ? String(item.calories) : "",
    protein: item?.protein != null ? String(item.protein) : "",
    carbs: item?.carbs != null ? String(item.carbs) : "",
    fat: item?.fat != null ? String(item.fat) : "",
    whyThisWorks: item?.whyThisWorks ?? "",
    imageUrl: item?.imageUrl ?? "",
    goalTags: listToText(item?.goalTags),
    swaps: listToText(item?.swaps),
    whatToOrder: listToText(item?.whatToOrder),
  };
}

export function MenuItemForm({ id }: { id: string | null }) {
  const [form, setForm] = useState<FormState>(() => seed(null));
  const [seededFor, setSeededFor] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <AdminEditor<AdminMenuItem>
      id={id}
      listHref={ROUTES.admin.menuItems}
      titleNew="New menu item"
      titleEdit="Edit menu item"
      editHref={(newId) => ROUTES.admin.menuItem(newId)}
      api={adminApi.menuItems}
      currentStatus={(item) => item?.status}
      buildPayload={() => ({
        restaurantId: form.restaurantId.trim(),
        restaurantName: form.restaurantName.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        calories: numOrUndef(form.calories),
        protein: numOrUndef(form.protein),
        carbs: numOrUndef(form.carbs),
        fat: numOrUndef(form.fat),
        whyThisWorks: form.whyThisWorks.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        goalTags: textToList(form.goalTags),
        swaps: textToList(form.swaps),
        whatToOrder: textToList(form.whatToOrder),
      })}
    >
      {(item) => {
        const key = item?.id ?? "new";
        if (seededFor !== key) {
          setSeededFor(key);
          if (item) setForm(seed(item));
        }
        return (
          <>
            <div className={styles.grid2}>
              <TextInput
                label="Restaurant ID"
                required
                value={form.restaurantId}
                onChange={(v) => set("restaurantId", v)}
                hint="The id of an existing restaurant."
              />
              <TextInput
                label="Restaurant name"
                required
                value={form.restaurantName}
                onChange={(v) => set("restaurantName", v)}
              />
            </div>
            <TextInput
              label="Name"
              required
              value={form.name}
              onChange={(v) => set("name", v)}
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
            <TextArea
              label="Why this works"
              rows={2}
              value={form.whyThisWorks}
              onChange={(v) => set("whyThisWorks", v)}
            />
            <TextInput
              label="Image URL"
              value={form.imageUrl}
              onChange={(v) => set("imageUrl", v)}
              placeholder="https://…"
            />
            <ListInput
              label="Goal tags"
              value={form.goalTags}
              onChange={(v) => set("goalTags", v)}
            />
            <ListInput
              label="What to order"
              value={form.whatToOrder}
              onChange={(v) => set("whatToOrder", v)}
            />
            <ListInput label="Swaps" value={form.swaps} onChange={(v) => set("swaps", v)} />
          </>
        );
      }}
    </AdminEditor>
  );
}
