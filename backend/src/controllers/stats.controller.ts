import type { Request, Response } from "express";
import { getSummary } from "../services/stats.service.js";
import { statsQuerySchema } from "../validators/transactions.schema.js";

export async function summary(req: Request, res: Response) {
  const range = statsQuerySchema.parse(req.query);
  res.json({ data: await getSummary(range) });
}
