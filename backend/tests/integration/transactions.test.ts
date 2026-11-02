import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { pool } from "../../src/db/index.js";
import { purchasedDeal, resetDb, soldDeal } from "../helpers.js";

const app = createApp();
const api = "/api/v1/transactions";

beforeEach(resetDb);
afterAll(() => pool.end());

describe("POST /transactions", () => {
  it("creates a sold deal with add-ons and returns 201 + Location", async () => {
    const res = await request(app).post(api).send(soldDeal());

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`${api}/${res.body.data.id}`);
    expect(res.body.data).toMatchObject({
      type: "SOLD",
      partyName: "Zack B",
      priceCents: 4_299_900,
      dealDate: "2026-01-01",
      vin: null,
    });
    expect(res.body.data.addOns).toHaveLength(1);
    expect(res.body.data.addOns[0]).toMatchObject({ name: "Ceramic coat", priceCents: 150_000 });
  });

  it("defaults add-ons to an empty list and normalizes VIN", async () => {
    const res = await request(app)
      .post(api)
      .send({ ...soldDeal({ vin: "wbs3r9c50fk331234" }), addOns: undefined });

    expect(res.status).toBe(201);
    expect(res.body.data.addOns).toEqual([]);
    expect(res.body.data.vin).toBe("WBS3R9C50FK331234");
  });

  it("returns 400 with field details on invalid input", async () => {
    const res = await request(app)
      .post(api)
      .send({ type: "LEASED", year: 1800, priceCents: -1, dealDate: "1/1/2026" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(
      expect.arrayContaining(["type", "partyName", "year", "make", "model", "priceCents", "dealDate"]),
    );
  });

  it("rejects fractional cents", async () => {
    const res = await request(app).post(api).send(soldDeal({ priceCents: 42999.5 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 on malformed JSON", async () => {
    const res = await request(app).post(api).set("content-type", "application/json").send("{oops");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });
});

describe("GET /transactions", () => {
  beforeEach(async () => {
    await request(app).post(api).send(soldDeal());
    await request(app).post(api).send(soldDeal({ partyName: "Marcus Lee", dealDate: "2026-03-10" }));
    await request(app).post(api).send(purchasedDeal());
  });

  it("lists newest first with pagination meta", async () => {
    const res = await request(app).get(api);

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ total: 3, limit: 25, offset: 0 });
    expect(res.body.data.map((t: { dealDate: string }) => t.dealDate)).toEqual([
      "2026-03-10",
      "2026-02-15",
      "2026-01-01",
    ]);
  });

  it("filters by type", async () => {
    const res = await request(app).get(api).query({ type: "PURCHASED" });
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].make).toBe("Porsche");
  });

  it("filters by date range", async () => {
    const res = await request(app).get(api).query({ from: "2026-02-01", to: "2026-02-28" });
    expect(res.body.meta.total).toBe(1);
  });

  it("searches name, make, and model case-insensitively", async () => {
    const res = await request(app).get(api).query({ q: "marcus" });
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].partyName).toBe("Marcus Lee");
  });

  it("paginates", async () => {
    const res = await request(app).get(api).query({ limit: 1, offset: 1 });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toEqual({ total: 3, limit: 1, offset: 1 });
  });

  it("rejects an invalid type filter", async () => {
    const res = await request(app).get(api).query({ type: "LEASED" });
    expect(res.status).toBe(400);
  });
});

describe("GET /transactions/:id", () => {
  it("returns one deal", async () => {
    const created = await request(app).post(api).send(soldDeal());
    const res = await request(app).get(`${api}/${created.body.data.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(created.body.data.id);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).get(`${api}/00000000-0000-4000-8000-000000000000`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 for a malformed id", async () => {
    const res = await request(app).get(`${api}/not-a-uuid`);
    expect(res.status).toBe(400);
  });
});

describe("PATCH /transactions/:id", () => {
  it("updates only the fields sent", async () => {
    const created = await request(app).post(api).send(soldDeal());
    const res = await request(app)
      .patch(`${api}/${created.body.data.id}`)
      .send({ priceCents: 41_500_00 });

    expect(res.status).toBe(200);
    expect(res.body.data.priceCents).toBe(4_150_000);
    expect(res.body.data.partyName).toBe("Zack B");
    expect(res.body.data.addOns).toHaveLength(1);
  });

  it("replaces add-ons when they are sent", async () => {
    const created = await request(app).post(api).send(soldDeal());
    const res = await request(app)
      .patch(`${api}/${created.body.data.id}`)
      .send({
        addOns: [
          { name: "Tint", priceCents: 400_00 },
          { name: "Warranty", priceCents: 2_000_00 },
        ],
      });

    expect(res.body.data.addOns.map((a: { name: string }) => a.name)).toEqual(["Tint", "Warranty"]);
  });

  it("rejects an empty body", async () => {
    const created = await request(app).post(api).send(soldDeal());
    const res = await request(app).patch(`${api}/${created.body.data.id}`).send({});
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app)
      .patch(`${api}/00000000-0000-4000-8000-000000000000`)
      .send({ priceCents: 1 });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /transactions/:id", () => {
  it("deletes and returns 204", async () => {
    const created = await request(app).post(api).send(soldDeal());
    const id = created.body.data.id;

    const res = await request(app).delete(`${api}/${id}`);
    expect(res.status).toBe(204);

    const after = await request(app).get(`${api}/${id}`);
    expect(after.status).toBe(404);
  });

  it("returns 404 when already deleted", async () => {
    const res = await request(app).delete(`${api}/00000000-0000-4000-8000-000000000000`);
    expect(res.status).toBe(404);
  });
});
