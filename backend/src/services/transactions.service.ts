import { and, asc, count, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { db } from "../db/index.js";
import { addOns, transactions } from "../db/schema.js";
import { notFound } from "../utils/httpError.js";
import type {
  CreateTransactionInput,
  ListTransactionsQuery,
  UpdateTransactionInput,
} from "../validators/transactions.schema.js";

function buildFilters({ type, from, to, q }: Omit<ListTransactionsQuery, "limit" | "offset">) {
  const conditions: SQL[] = [];
  if (type) conditions.push(eq(transactions.type, type));
  if (from) conditions.push(gte(transactions.dealDate, from));
  if (to) conditions.push(lte(transactions.dealDate, to));
  if (q) {
    const term = `%${q}%`;
    const search = or(
      ilike(transactions.partyName, term),
      ilike(transactions.make, term),
      ilike(transactions.model, term),
      ilike(transactions.vin, term),
    );
    if (search) conditions.push(search);
  }
  return conditions.length ? and(...conditions) : undefined;
}

export async function listTransactions(query: ListTransactionsQuery) {
  const where = buildFilters(query);

  const [rows, totalRows] = await Promise.all([
    db.query.transactions.findMany({
      where,
      with: { addOns: { orderBy: [asc(addOns.name)] } },
      orderBy: [desc(transactions.dealDate), desc(transactions.createdAt)],
      limit: query.limit,
      offset: query.offset,
    }),
    db.select({ total: count() }).from(transactions).where(where),
  ]);

  return { rows, total: totalRows[0]?.total ?? 0 };
}

export async function getTransaction(id: string) {
  const row = await db.query.transactions.findFirst({
    where: eq(transactions.id, id),
    with: { addOns: { orderBy: [asc(addOns.name)] } },
  });
  if (!row) throw notFound("Transaction");
  return row;
}

export async function createTransaction(input: CreateTransactionInput) {
  const { addOns: addOnInput, ...fields } = input;

  const id = await db.transaction(async (tx) => {
    const [created] = await tx.insert(transactions).values(fields).returning({ id: transactions.id });
    if (!created) throw new Error("Insert returned no row");

    if (addOnInput.length) {
      await tx.insert(addOns).values(addOnInput.map((a) => ({ ...a, transactionId: created.id })));
    }
    return created.id;
  });

  return getTransaction(id);
}

export async function updateTransaction(id: string, input: UpdateTransactionInput) {
  const { addOns: addOnInput, ...fields } = input;

  await db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.id, id));
    if (!existing.length) throw notFound("Transaction");

    // Always touch the row so updatedAt moves, even for add-on-only edits
    await tx.update(transactions).set({ ...fields, updatedAt: new Date() }).where(eq(transactions.id, id));

    if (addOnInput) {
      await tx.delete(addOns).where(eq(addOns.transactionId, id));
      if (addOnInput.length) {
        await tx.insert(addOns).values(addOnInput.map((a) => ({ ...a, transactionId: id })));
      }
    }
  });

  return getTransaction(id);
}

export async function deleteTransaction(id: string) {
  const deleted = await db
    .delete(transactions)
    .where(eq(transactions.id, id))
    .returning({ id: transactions.id });
  if (!deleted.length) throw notFound("Transaction");
}
