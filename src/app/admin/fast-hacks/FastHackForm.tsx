"use client";

import { useState } from "react";
import { AdminEditor } from "../_components/AdminEditor";
import {
  TextInput,
  TextArea,
  ListInput,
  listToText,
  textToList,
} from "../_components/fields";
import { adminApi, type AdminFastHack } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "../_components/admin-form.module.css";

interface FormState {
  title: string;
  outcome: string;
  description: string;
  goalTags: string;
  restaurantId: string;
  menuItemId: string;
}

function seed(item: AdminFastHack | null): FormState {
  return {
    title: item?.title ?? "",
    outcome: item?.outcome ?? "",
    description: item?.description ?? "",
    goalTags: listToText(item?.goalTags),
    restaurantId: item?.restaurantId ?? "",
    menuItemId: item?.menuItemId ?? "",
  };
}

export function FastHackForm({ id }: { id: string | null }) {
  const [form, setForm] = useState<FormState>(() => seed(null));
  const [seededFor, setSeededFor] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <AdminEditor<AdminFastHack>
      id={id}
      listHref={ROUTES.admin.fastHacks}
      titleNew="New Fast Hack"
      titleEdit="Edit Fast Hack"
      editHref={(newId) => ROUTES.admin.fastHack(newId)}
      api={adminApi.fastHacks}
      currentStatus={(item) => item?.status}
      buildPayload={() => ({
        title: form.title.trim(),
        outcome: form.outcome.trim(),
        description: form.description.trim(),
        goalTags: textToList(form.goalTags),
        restaurantId: form.restaurantId.trim() || undefined,
        menuItemId: form.menuItemId.trim() || undefined,
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
            <TextInput
              label="Title"
              required
              value={form.title}
              onChange={(v) => set("title", v)}
            />
            <TextInput
              label="Outcome"
              required
              value={form.outcome}
              onChange={(v) => set("outcome", v)}
              hint="The benefit, e.g. “More steady energy through lunch”."
            />
            <TextArea
              label="Description"
              required
              rows={3}
              value={form.description}
              onChange={(v) => set("description", v)}
            />
            <ListInput
              label="Goal tags"
              value={form.goalTags}
              onChange={(v) => set("goalTags", v)}
            />
            <div className={styles.grid2}>
              <TextInput
                label="Restaurant ID (optional)"
                value={form.restaurantId}
                onChange={(v) => set("restaurantId", v)}
              />
              <TextInput
                label="Menu item ID (optional)"
                value={form.menuItemId}
                onChange={(v) => set("menuItemId", v)}
              />
            </div>
          </>
        );
      }}
    </AdminEditor>
  );
}
