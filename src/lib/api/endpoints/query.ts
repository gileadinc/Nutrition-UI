/** Build a `?a=1&b=2` string, dropping null/undefined/empty values. */
export function toQuery(params: Record<string, unknown> | object | undefined): string {
  if (!params) return "";
  const pairs = Object.entries(params as Record<string, unknown>)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return pairs.length ? `?${pairs.join("&")}` : "";
}

export interface ListParams {
  search?: string;
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
