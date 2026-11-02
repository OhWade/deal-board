import { sql, type SQL } from "drizzle-orm";
import { db } from "../db/index.js";
import type { StatsQuery } from "../validators/transactions.schema.js";

export interface TypeTotals {
  units: number;
  vehicleCents: number; // sum of sale/purchase prices
  addOnCents: number; // sum of add-ons
  grossCents: number; // vehicle + add-ons
}

export interface MonthTotals {
  month: string; // YYYY-MM
  sold: TypeTotals;
  purchased: TypeTotals;
}

export interface StatsSummary {
  range: { from: string | null; to: string | null };
  sold: TypeTotals;
  purchased: TypeTotals;
  monthly: MonthTotals[];
}

interface Row extends Record<string, unknown> {
  month: string | null;
  type: "SOLD" | "PURCHASED";
  units: number;
  vehicle_cents: string;
  add_on_cents: string;
}

const empty = (): TypeTotals => ({ units: 0, vehicleCents: 0, addOnCents: 0, grossCents: 0 });

const toTotals = (r: Row): TypeTotals => {
  const vehicleCents = Number(r.vehicle_cents);
  const addOnCents = Number(r.add_on_cents);
  return { units: r.units, vehicleCents, addOnCents, grossCents: vehicleCents + addOnCents };
};

// Pure function so the aggregation logic is unit-testable without a database
export function shapeSummary(rows: Row[], range: StatsQuery): StatsSummary {
  const summary: StatsSummary = {
    range: { from: range.from ?? null, to: range.to ?? null },
    sold: empty(),
    purchased: empty(),
    monthly: [],
  };
  const months = new Map<string, MonthTotals>();

  for (const r of rows) {
    const key = r.type === "SOLD" ? "sold" : "purchased";
    if (r.month === null) {
      summary[key] = toTotals(r); // grand total row from GROUPING SETS
      continue;
    }
    const m = months.get(r.month) ?? { month: r.month, sold: empty(), purchased: empty() };
    m[key] = toTotals(r);
    months.set(r.month, m);
  }

  summary.monthly = [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
  return summary;
}

export async function getSummary(range: StatsQuery): Promise<StatsSummary> {
  const conditions: SQL[] = [];
  if (range.from) conditions.push(sql`t.deal_date >= ${range.from}`);
  if (range.to) conditions.push(sql`t.deal_date <= ${range.to}`);
  const where = conditions.length ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``;

  // One query: per-month totals plus a grand total per type (month = NULL)
  const result = await db.execute<Row>(sql`
    SELECT
      to_char(date_trunc('month', t.deal_date), 'YYYY-MM') AS month,
      t.type,
      count(*)::int AS units,
      coalesce(sum(t.price_cents), 0)::bigint AS vehicle_cents,
      coalesce(sum(a.add_on_cents), 0)::bigint AS add_on_cents
    FROM transactions t
    LEFT JOIN (
      SELECT transaction_id, sum(price_cents) AS add_on_cents
      FROM add_ons
      GROUP BY transaction_id
    ) a ON a.transaction_id = t.id
    ${where}
    GROUP BY GROUPING SETS ((t.type, date_trunc('month', t.deal_date)), (t.type))
  `);

  return shapeSummary(result.rows, range);
}
