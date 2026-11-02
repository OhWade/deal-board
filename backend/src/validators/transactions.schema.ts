import { z } from "zod";

const MAX_PRICE_CENTS = 100_000_000_00; // $100M ceiling, keeps values inside a Postgres integer
const maxYear = () => new Date().getFullYear() + 2;

export const transactionTypeSchema = z.enum(["SOLD", "PURCHASED"]);

const addOnSchema = z.object({
  name: z.string().trim().min(1, "Add-on name is required").max(100),
  priceCents: z.number().int().min(0).max(MAX_PRICE_CENTS),
});

// Empty string from a form means "no VIN"
const vinSchema = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, "VIN must be 17 characters (no I, O or Q)")
    .nullable()
    .optional(),
);

const baseSchema = z.object({
  type: transactionTypeSchema,
  partyName: z.string().trim().min(1, "Name is required").max(120),
  year: z.number().int().min(1900).max(maxYear()),
  make: z.string().trim().min(1, "Make is required").max(60),
  model: z.string().trim().min(1, "Model is required").max(80),
  vin: vinSchema,
  priceCents: z.number().int().min(0).max(MAX_PRICE_CENTS),
  dealDate: z.iso.date(),
  addOns: z.array(addOnSchema).max(50),
});

export const createTransactionSchema = baseSchema.extend({
  addOns: baseSchema.shape.addOns.default([]),
});

// PATCH: any subset of fields. If addOns is sent, it replaces the existing list.
export const updateTransactionSchema = baseSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, { message: "Provide at least one field to update" });

export const listTransactionsQuerySchema = z.object({
  type: transactionTypeSchema.optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  q: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const statsQuerySchema = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});

export const idParamSchema = z.object({ id: z.uuid("Invalid id") });

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type StatsQuery = z.infer<typeof statsQuerySchema>;
