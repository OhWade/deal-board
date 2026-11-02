import { db } from "../src/db/index.js";
import { transactions } from "../src/db/schema.js";

export async function resetDb() {
  await db.delete(transactions); // add-ons cascade
}

export const soldDeal = (overrides: Record<string, unknown> = {}) => ({
  type: "SOLD",
  partyName: "Zack B",
  year: 2018,
  make: "BMW",
  model: "M4",
  priceCents: 42_999_00,
  dealDate: "2026-01-01",
  addOns: [{ name: "Ceramic coat", priceCents: 1_500_00 }],
  ...overrides,
});

export const purchasedDeal = (overrides: Record<string, unknown> = {}) => ({
  type: "PURCHASED",
  partyName: "Manheim Riverside",
  year: 2020,
  make: "Porsche",
  model: "Macan GTS",
  priceCents: 48_000_00,
  dealDate: "2026-02-15",
  addOns: [{ name: "Transport", priceCents: 450_00 }],
  ...overrides,
});
