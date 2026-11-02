import { describe, expect, it } from "vitest";
import { shapeSummary } from "../../src/services/stats.service.js";

const row = (
  month: string | null,
  type: "SOLD" | "PURCHASED",
  units: number,
  vehicle: number,
  addOn: number,
) => ({ month, type, units, vehicle_cents: String(vehicle), add_on_cents: String(addOn) });

describe("shapeSummary", () => {
  it("returns empty totals for no rows", () => {
    const s = shapeSummary([], {});
    expect(s.sold).toEqual({ units: 0, vehicleCents: 0, addOnCents: 0, grossCents: 0 });
    expect(s.purchased.units).toBe(0);
    expect(s.monthly).toEqual([]);
    expect(s.range).toEqual({ from: null, to: null });
  });

  it("uses null-month rows as grand totals and computes gross", () => {
    const s = shapeSummary([row(null, "SOLD", 3, 100_000, 5_000)], {});
    expect(s.sold).toEqual({ units: 3, vehicleCents: 100_000, addOnCents: 5_000, grossCents: 105_000 });
  });

  it("parses bigint strings from Postgres into numbers", () => {
    const s = shapeSummary([row(null, "PURCHASED", 1, 9_000_000_000, 0)], {});
    expect(s.purchased.vehicleCents).toBe(9_000_000_000);
  });

  it("merges sold and purchased rows into sorted months", () => {
    const s = shapeSummary(
      [
        row("2026-03", "SOLD", 1, 10, 0),
        row("2026-01", "PURCHASED", 2, 20, 1),
        row("2026-01", "SOLD", 4, 40, 2),
      ],
      { from: "2026-01-01" },
    );

    expect(s.monthly.map((m) => m.month)).toEqual(["2026-01", "2026-03"]);
    expect(s.monthly[0]?.sold.units).toBe(4);
    expect(s.monthly[0]?.purchased.grossCents).toBe(21);
    expect(s.monthly[1]?.purchased.units).toBe(0);
    expect(s.range).toEqual({ from: "2026-01-01", to: null });
  });
});
