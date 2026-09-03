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
import { adminApi, type AdminRestaurant } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "../_components/admin-form.module.css";

interface FormState {
  name: string;
  city: string;
  state: string;
  category: string;
  summary: string;
  distanceMiles: string;
  latitude: string;
  longitude: string;
  testedOrderCount: string;
  imageUrl: string;
  bestForGoals: string;
}

function seed(item: AdminRestaurant | null): FormState {
  return {
    name: item?.name ?? "",
    city: item?.city ?? "",
    state: item?.state ?? "",
    category: item?.category ?? "",
    summary: item?.summary ?? "",
    distanceMiles: item?.distanceMiles != null ? String(item.distanceMiles) : "",
    latitude: item?.latitude != null ? String(item.latitude) : "",
    longitude: item?.longitude != null ? String(item.longitude) : "",
    testedOrderCount: item?.testedOrderCount != null ? String(item.testedOrderCount) : "",
    imageUrl: item?.imageUrl ?? "",
    bestForGoals: listToText(item?.bestForGoals),
  };
}

export function RestaurantForm({ id }: { id: string | null }) {
  const [form, setForm] = useState<FormState>(() => seed(null));
  const [seededFor, setSeededFor] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <AdminEditor<AdminRestaurant>
      id={id}
      listHref={ROUTES.admin.restaurants}
      titleNew="New restaurant"
      titleEdit="Edit restaurant"
      editHref={(newId) => ROUTES.admin.restaurant(newId)}
      api={adminApi.restaurants}
      currentStatus={(item) => item?.status}
      buildPayload={() => ({
        name: form.name.trim(),
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        category: form.category.trim() || undefined,
        summary: form.summary.trim() || undefined,
        distanceMiles: numOrUndef(form.distanceMiles),
        latitude: numOrUndef(form.latitude),
        longitude: numOrUndef(form.longitude),
        testedOrderCount: numOrUndef(form.testedOrderCount),
        imageUrl: form.imageUrl.trim() || undefined,
        bestForGoals: textToList(form.bestForGoals),
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
              label="Name"
              required
              value={form.name}
              onChange={(v) => set("name", v)}
            />
            <div className={styles.grid2}>
              <TextInput label="City" value={form.city} onChange={(v) => set("city", v)} />
              <TextInput label="State" value={form.state} onChange={(v) => set("state", v)} />
            </div>
            <div className={styles.grid2}>
              <TextInput
                label="Category"
                value={form.category}
                onChange={(v) => set("category", v)}
                placeholder="Cafe, Fast casual…"
              />
              <NumberInput
                label="Tested order count"
                value={form.testedOrderCount}
                onChange={(v) => set("testedOrderCount", v)}
              />
            </div>
            <TextArea
              label="Summary"
              rows={3}
              value={form.summary}
              onChange={(v) => set("summary", v)}
            />
            <div className={styles.grid4}>
              <NumberInput
                label="Distance (mi)"
                value={form.distanceMiles}
                onChange={(v) => set("distanceMiles", v)}
              />
              <NumberInput
                label="Latitude"
                value={form.latitude}
                onChange={(v) => set("latitude", v)}
              />
              <NumberInput
                label="Longitude"
                value={form.longitude}
                onChange={(v) => set("longitude", v)}
              />
            </div>
            <TextInput
              label="Image URL"
              value={form.imageUrl}
              onChange={(v) => set("imageUrl", v)}
              placeholder="https://…"
            />
            <ListInput
              label="Best for goals"
              value={form.bestForGoals}
              onChange={(v) => set("bestForGoals", v)}
            />
          </>
        );
      }}
    </AdminEditor>
  );
}
