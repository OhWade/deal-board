const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdCents = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** 4299900 → "$42,999". Shows cents only when they aren't zero. */
export function formatCurrency(cents: number): string {
  return cents % 100 === 0 ? usd.format(cents / 100) : usdCents.format(cents / 100);
}

/** 184772500 → "$1.85M", 4299900 → "$43K" */
export function formatCompact(cents: number): string {
  const dollars = cents / 100;
  if (Math.abs(dollars) < 1000) return usd.format(dollars);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: dollars >= 1_000_000 ? 2 : 0,
  }).format(dollars);
}

/**
 * Parses what a person types into a price box into integer cents.
 * "42,999" → 4299900, "$1,500.50" → 150050, "" → null, "abc" → null
 */
export function parseDollarsToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole = "0", fraction = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

/** 4299900 → "42,999" for prefilling an input */
export function centsToInput(cents: number): string {
  const dollars = Math.floor(cents / 100);
  const rest = cents % 100;
  const whole = dollars.toLocaleString("en-US");
  return rest ? `${whole}.${String(rest).padStart(2, "0")}` : whole;
}
