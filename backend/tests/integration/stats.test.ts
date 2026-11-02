import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { pool } from "../../src/db/index.js";
import { purchasedDeal, resetDb, soldDeal } from "../helpers.js";

const app = createApp();

beforeEach(resetDb);
afterAll(() => pool.end());

describe("GET /stats/summary", () => {
  it("returns zeros when there are no deals", async () => {
    const res = await request(app).get("/api/v1/stats/summary");

    expect(res.status).toBe(200);
    expect(res.body.data.sold).toEqual({ units: 0, vehicleCents: 0, addOnCents: 0, grossCents: 0 });
    expect(res.body.data.purchased.units).toBe(0);
    expect(res.body.data.monthly).toEqual([]);
  });

  it("totals units and gross (vehicle + add-ons) per type", async () => {
    await request(app).post("/api/v1/transactions").send(soldDeal()); // 42,999 + 1,500
    await request(app)
      .post("/api/v1/transactions")
      .send(soldDeal({ priceCents: 30_000_00, addOns: [], dealDate: "2026-01-20" }));
    await request(app).post("/api/v1/transactions").send(purchasedDeal()); // 48,000 + 450

    const { body } = await request(app).get("/api/v1/stats/summary");

    expect(body.data.sold).toEqual({
      units: 2,
      vehicleCents: 72_999_00,
      addOnCents: 1_500_00,
      grossCents: 74_499_00,
    });
    expect(body.data.purchased).toEqual({
      units: 1,
      vehicleCents: 48_000_00,
      addOnCents: 450_00,
      grossCents: 48_450_00,
    });
  });

  it("does not double count when a deal has several add-ons", async () => {
    await request(app)
      .post("/api/v1/transactions")
      .send(
        soldDeal({
          addOns: [
            { name: "Tint", priceCents: 400_00 },
            { name: "Coat", priceCents: 1_000_00 },
          ],
        }),
      );

    const { body } = await request(app).get("/api/v1/stats/summary");
    expect(body.data.sold.units).toBe(1);
    expect(body.data.sold.vehicleCents).toBe(42_999_00);
    expect(body.data.sold.addOnCents).toBe(1_400_00);
  });

  it("breaks totals down by month", async () => {
    await request(app).post("/api/v1/transactions").send(soldDeal({ dealDate: "2026-01-05" }));
    await request(app).post("/api/v1/transactions").send(purchasedDeal({ dealDate: "2026-02-10" }));

    const { body } = await request(app).get("/api/v1/stats/summary");
    expect(body.data.monthly.map((m: { month: string }) => m.month)).toEqual(["2026-01", "2026-02"]);
    expect(body.data.monthly[0].sold.units).toBe(1);
    expect(body.data.monthly[0].purchased.units).toBe(0);
  });

  it("respects the date range", async () => {
    await request(app).post("/api/v1/transactions").send(soldDeal({ dealDate: "2026-01-05" }));
    await request(app).post("/api/v1/transactions").send(soldDeal({ dealDate: "2026-03-05" }));

    const { body } = await request(app)
      .get("/api/v1/stats/summary")
      .query({ from: "2026-03-01", to: "2026-03-31" });

    expect(body.data.sold.units).toBe(1);
    expect(body.data.range).toEqual({ from: "2026-03-01", to: "2026-03-31" });
  });
});
