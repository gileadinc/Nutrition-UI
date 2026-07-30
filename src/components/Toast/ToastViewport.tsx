"use client";

import { cn } from "@/lib/utils";
import { useDismissToast, useToastState } from "./ToastContext";
import styles from "./Toast.module.css";

export function ToastViewport() {
  const toasts = useToastState();
  const dismissToast = useDismissToast();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.viewport} aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.variant === "error" ? "alert" : "status"}
          className={cn(styles.toast, styles[toast.variant])}
        >
          <p className={styles.message}>{toast.message}</p>
          <button
            type="button"
            className={styles.dismiss}
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
