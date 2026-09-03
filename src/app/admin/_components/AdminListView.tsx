"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { Plus, Search, ChevronRight } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { useApiResource, useDebouncedValue } from "@/lib/hooks";
import type { Paginated } from "@/lib/api";
import styles from "./admin-list.module.css";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Column takes remaining space and truncates. */
  primary?: boolean;
}

export interface AdminListViewProps<T extends { id: string }> {
  title: string;
  subtitle?: string;
  newHref: string;
  newLabel: string;
  rowHref: (row: T) => string;
  columns: Column<T>[];
  fetchPage: (params: { search?: string; limit: number }) => Promise<Paginated<T>>;
  searchPlaceholder?: string;
  emptyLabel?: string;
}

export function AdminListView<T extends { id: string }>({
  title,
  subtitle,
  newHref,
  newLabel,
  rowHref,
  columns,
  fetchPage,
  searchPlaceholder = "Search…",
  emptyLabel = "Nothing here yet.",
}: AdminListViewProps<T>) {
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 350);

  const resource = useApiResource(
    () => fetchPage({ search: debounced || undefined, limit: 50 }),
    [debounced],
  );

  const searching = resource.isLoading && resource.data !== null;

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1 className={styles.heading}>{title}</h1>
          {subtitle ? <p className={styles.subheading}>{subtitle}</p> : null}
        </div>
        <Link href={newHref}>
          <Button type="button">
            <Plus className="size-4" />
            {newLabel}
          </Button>
        </Link>
      </header>

      <div className={styles.searchField}>
        <Search className={styles.searchIcon} aria-hidden="true" />
        <input
          className={styles.searchInput}
          type="search"
          aria-label={searchPlaceholder}
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {searching ? <Spinner className={styles.searchSpinner} /> : null}
      </div>

      {resource.isLoading && resource.data === null ? (
        <div className={styles.center}>
          <Spinner />
        </div>
      ) : resource.error && resource.data === null ? (
        <ErrorState
          title="Couldn't load this"
          description={resource.error}
          action={
            <Button type="button" variant="outline" onClick={resource.refetch}>
              Try again
            </Button>
          }
        />
      ) : resource.data && resource.data.items.length === 0 ? (
        <div className={styles.center}>
          <p className={styles.emptyText}>
            {debounced ? `Nothing matches “${debounced}”.` : emptyLabel}
          </p>
        </div>
      ) : resource.data ? (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={c.primary ? styles.thPrimary : undefined}
                    >
                      {c.header}
                    </th>
                  ))}
                  <th aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {resource.data.items.map((row) => (
                  <tr key={row.id} className={styles.row}>
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={c.primary ? styles.tdPrimary : undefined}
                      >
                        <Link href={rowHref(row)} className={styles.cellLink}>
                          {c.render(row)}
                        </Link>
                      </td>
                    ))}
                    <td className={styles.tdChevron}>
                      <Link href={rowHref(row)} aria-label="Open" className={styles.cellLink}>
                        <ChevronRight className="size-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.count}>
            {resource.data.pagination.total} item
            {resource.data.pagination.total === 1 ? "" : "s"}
          </p>
        </>
      ) : null}
    </div>
  );
}
