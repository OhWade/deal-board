/** Local-time YYYY-MM-DD (toISOString would shift to UTC and can land on the wrong day) */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parses YYYY-MM-DD as a local date */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function formatDate(iso: string): string {
  return fromISODate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "2026-03" → "Mar" */
export function formatMonth(ym: string, withYear = false): string {
  return fromISODate(`${ym}-01`).toLocaleDateString("en-US", {
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

export type Period = "month" | "90d" | "year" | "all";

export const PERIODS: { value: Period; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "90d", label: "Last 90 days" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
];

export function periodRange(period: Period, now = new Date()): { from?: string; to?: string } {
  switch (period) {
    case "month":
      return { from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)) };
    case "90d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 89);
      return { from: toISODate(d) };
    }
    case "year":
      return { from: toISODate(new Date(now.getFullYear(), 0, 1)) };
    case "all":
      return {};
  }
}

/** The last n months as YYYY-MM, oldest first, ending with the current month */
export function lastMonths(n: number, now = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return toISODate(d).slice(0, 7);
  });
}
