const DAY = 864e5;
const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const clockTime = (at: number) =>
  new Date(at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export type Bucket = "Today" | "This week" | "Earlier";
export const BUCKETS: Bucket[] = ["Today", "This week", "Earlier"];

export function bucketOf(at: number, now = Date.now()): Bucket {
  const today = startOfDay(now);
  return at >= today ? "Today" : at >= today - 6 * DAY ? "This week" : "Earlier";
}

/** "12m ago", "3h ago", "Yesterday", "Tue", "Mar 4". */
export function relativeTime(at: number, now = Date.now()): string {
  const b = bucketOf(at, now);
  if (b === "Today") {
    const m = Math.max(1, Math.round((now - at) / 6e4));
    return m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`;
  }
  if (b === "This week")
    return startOfDay(at) === startOfDay(now) - DAY
      ? "Yesterday"
      : new Date(at).toLocaleDateString("en-US", { weekday: "short" });
  return new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
