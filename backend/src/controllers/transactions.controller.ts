import type { Request, Response } from "express";
import * as service from "../services/transactions.service.js";
import {
  createTransactionSchema,
  idParamSchema,
  listTransactionsQuerySchema,
  updateTransactionSchema,
} from "../validators/transactions.schema.js";

export async function list(req: Request, res: Response) {
  const query = listTransactionsQuerySchema.parse(req.query);
  const { rows, total } = await service.listTransactions(query);
  res.json({ data: rows, meta: { total, limit: query.limit, offset: query.offset } });
}

export async function getOne(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json({ data: await service.getTransaction(id) });
}

export async function create(req: Request, res: Response) {
  const input = createTransactionSchema.parse(req.body);
  const created = await service.createTransaction(input);
  res.status(201).location(`${req.baseUrl}/${created.id}`).json({ data: created });
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = updateTransactionSchema.parse(req.body);
  res.json({ data: await service.updateTransaction(id, input) });
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await service.deleteTransaction(id);
  res.status(204).end();
}
