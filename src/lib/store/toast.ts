"use client";

/**
 * App toasts (external store). Render <ToastViewport /> once (the root layout
 * does) and call from anywhere:
 *
 *   toast.success("Saved", { body: "Find it under You > Saved.", action: { label: "Undo", run } });
 *   toast.error("Couldn't save");   // errors stay until dismissed
 */

export type ToastTone = "success" | "error" | "info";

export interface ToastOptions {
  body?: string;
  action?: { label: string; run: () => void };
  link?: { label: string; href: string; run: () => void };
  /** ms; 0 = sticky. Default 5000 (errors default to sticky). */
  duration?: number;
}

export interface ToastItem extends ToastOptions {
  id: number;
  tone: ToastTone;
  title: string;
  duration: number;
}

const MAX_VISIBLE = 3;
let items: ToastItem[] = [];
let nextId = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const subscribeToasts = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
export const getToasts = () => items;

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

function push(tone: ToastTone, title: string, opts: ToastOptions = {}): number {
  const id = (nextId += 1);
  const duration = opts.duration ?? (tone === "error" ? 0 : 5000);
  items = [...items, { ...opts, id, tone, title, duration }];
  if (items.length > MAX_VISIBLE) items = items.slice(items.length - MAX_VISIBLE);
  emit();
  return id;
}

export const toast = {
  success: (title: string, opts?: ToastOptions) => push("success", title, opts),
  error: (title: string, opts?: ToastOptions) => push("error", title, opts),
  info: (title: string, opts?: ToastOptions) => push("info", title, opts),
  dismiss: dismissToast,
  reset: () => {
    items = [];
    emit();
  },
};
