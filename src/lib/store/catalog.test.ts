import { describe, expect, it, vi } from "vitest";
import type { Paginated } from "@/lib/api";
import { fetchAllPages } from "./catalog";

const page = (items: number[], p: number, total: number, hasNextPage: boolean): Paginated<number> => ({
  items,
  pagination: { page: p, limit: 100, total, totalPages: 4, hasNextPage },
});

describe("fetchAllPages", () => {
  it("walks every page until hasNextPage is false (301 recipes → 4 pages)", async () => {
    const sizes = [100, 100, 100, 1];
    const fetchPage = vi.fn(async (p: number) =>
      page(
        Array.from({ length: sizes[p - 1] }, (_, i) => (p - 1) * 100 + i),
        p,
        301,
        p < 4,
      ),
    );
    const res = await fetchAllPages(fetchPage);
    expect(fetchPage.mock.calls.map((c) => c[0])).toEqual([1, 2, 3, 4]);
    expect(res.items).toHaveLength(301);
    expect(new Set(res.items).size).toBe(301);
    expect(res.pagination).toMatchObject({ total: 301, hasNextPage: false });
  });

  it("makes a single request when everything fits on one page", async () => {
    const fetchPage = vi.fn(async () => page([1, 2, 3], 1, 3, false));
    const res = await fetchAllPages(fetchPage);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(res.items).toEqual([1, 2, 3]);
  });

  it("stops at the safety cap if the API never reports the last page", async () => {
    const fetchPage = vi.fn(async (p: number) => page([p], p, 9999, true));
    const res = await fetchAllPages(fetchPage);
    expect(fetchPage).toHaveBeenCalledTimes(20);
    expect(res.items).toHaveLength(20);
  });

  it("propagates a failure from any page instead of returning a partial list", async () => {
    const fetchPage = vi.fn(async (p: number) => {
      if (p === 2) throw new Error("boom");
      return page([p], p, 300, true);
    });
    await expect(fetchAllPages(fetchPage)).rejects.toThrow("boom");
  });
});
