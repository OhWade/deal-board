import { relations, sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const transactionType = pgEnum("transaction_type", ["SOLD", "PURCHASED"]);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: transactionType("type").notNull(),
    // Customer when SOLD, seller/source when PURCHASED
    partyName: text("party_name").notNull(),
    year: integer("year").notNull(),
    make: text("make").notNull(),
    model: text("model").notNull(),
    vin: varchar("vin", { length: 17 }),
    // Money is stored as integer cents to avoid floating point rounding
    priceCents: integer("price_cents").notNull(),
    // Date driven off the lot (SOLD) or acquired (PURCHASED)
    dealDate: date("deal_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("transactions_type_deal_date_idx").on(t.type, t.dealDate),
    check("transactions_price_non_negative", sql`${t.priceCents} >= 0`),
  ],
);

export const addOns = pgTable(
  "add_ons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    priceCents: integer("price_cents").notNull(),
  },
  (t) => [
    index("add_ons_transaction_id_idx").on(t.transactionId),
    check("add_ons_price_non_negative", sql`${t.priceCents} >= 0`),
  ],
);

export const transactionsRelations = relations(transactions, ({ many }) => ({
  addOns: many(addOns),
}));

export const addOnsRelations = relations(addOns, ({ one }) => ({
  transaction: one(transactions, {
    fields: [addOns.transactionId],
    references: [transactions.id],
  }),
}));

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type AddOn = typeof addOns.$inferSelect;
