"use client";

import { ReactNode, createContext, useCallback, useContext, useRef, useState } from "react";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
}

export interface ShowToastOptions {
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, options?: ShowToastOptions) => string;
  dismissToast: (id: string) => void;
}

const DEFAULT_DURATION_MS = 5000;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, options: ShowToastOptions = {}) => {
      const id = crypto.randomUUID();
      const variant = options.variant ?? "info";
      const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;

      setToasts((current) => [...current, { id, variant, message }]);

      if (durationMs > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismissToast(id), durationMs),
        );
      }

      return id;
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): Pick<ToastContextValue, "showToast" | "dismissToast"> {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function useToastState(): Toast[] {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastState must be used within a ToastProvider");
  }
  return context.toasts;
}

export function useDismissToast(): (id: string) => void {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useDismissToast must be used within a ToastProvider");
  }
  return context.dismissToast;
}
