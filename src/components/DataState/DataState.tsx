"use client";

import { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ErrorState";
import styles from "./DataState.module.css";

export interface DataStateProps<T> {
  resource: {
    data: T | null;
    error: string | null;
    isLoading: boolean;
    refetch: () => void;
  };
  /** Treat this data as "empty" (renders the empty slot instead of children). */
  isEmpty?: (data: T) => boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: (data: T) => ReactNode;
}

export function DataState<T>({
  resource,
  isEmpty,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  children,
}: DataStateProps<T>) {
  const { data, error, isLoading, refetch } = resource;

  if (isLoading && data === null) {
    return (
      <div className={styles.center}>
        <Spinner className={styles.spinner} />
        <span className={styles.loadingLabel}>Loading…</span>
      </div>
    );
  }

  if (error && data === null) {
    return (
      <ErrorState
        title="Couldn't load this"
        description={error}
        action={
          <Button type="button" variant="outline" onClick={refetch}>
            Try again
          </Button>
        }
      />
    );
  }

  if (data === null) return null;

  if (isEmpty?.(data)) {
    return (
      <div className={styles.center}>
        <p className={styles.emptyTitle}>{emptyTitle}</p>
        {emptyDescription ? <p className={styles.emptyDescription}>{emptyDescription}</p> : null}
      </div>
    );
  }

  return <>{children(data)}</>;
}
