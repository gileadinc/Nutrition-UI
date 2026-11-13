"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "@/lib/nav";

/**
 * URL-backed filter state for listing pages. Everything lives in the query
 * string so filters survive refresh/back and can be linked to.
 *
 *   const f = useFilterParams({ vegan: "Vegan" }, ["sort"]);
 *   f.toggle("diet", "vegan"); f.set("sort", "quickest"); f.active // [{key,value,label}]
 *
 * @param labels   value/key -> human label for the applied-filter pills
 * @param ignore   keys that are not "filters" (excluded from `active`/`count`/`clear()`)
 */
export function useFilterParams(labels: Record<string, string> = {}, ignore: string[] = ["sort"]) {
  const [params, setParams] = useSearchParams();

  const edit = useCallback(
    (fn: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(params);
      fn(next);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  return useMemo(() => {
    const active = [...params.entries()]
      .filter(([k]) => !ignore.includes(k))
      .map(([key, value]) => ({ key, value, label: labels[value] ?? labels[key] ?? value }));
    return {
      get: (key: string) => params.get(key),
      getAll: (key: string) => params.getAll(key),
      getNumber: (key: string, fallback: number) => {
        const raw = params.get(key);
        const n = raw === null ? NaN : Number(raw);
        return Number.isFinite(n) ? n : fallback;
      },
      set: (key: string, value: string | null) =>
        edit((p) => {
          if (value === null || value === "") p.delete(key);
          else p.set(key, value);
        }),
      /** Store a number, removing the param when it equals `defaultValue`. */
      setNumber: (key: string, value: number, defaultValue: number) =>
        edit((p) => {
          if (value === defaultValue) p.delete(key);
          else p.set(key, String(value));
        }),
      toggle: (key: string, value: string) =>
        edit((p) => {
          const all = p.getAll(key);
          p.delete(key);
          for (const v of all.filter((x) => x !== value)) p.append(key, v);
          if (!all.includes(value)) p.append(key, value);
        }),
      active,
      /** Remove given keys, or every filter key (never `ignore`d keys) when omitted. */
      clear: (keys?: string[]) =>
        edit((p) => {
          for (const k of keys ?? [...new Set([...p.keys()])]) {
            if (!keys && ignore.includes(k)) continue;
            p.delete(k);
          }
        }),
      count: active.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `ignore` is a stable literal at call sites
  }, [params, edit, labels]);
}

export type FilterParams = ReturnType<typeof useFilterParams>;
