import { Router } from "express";
import { statsRouter } from "./stats.routes.js";
import { transactionsRouter } from "./transactions.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

apiRouter.use("/transactions", transactionsRouter);
apiRouter.use("/stats", statsRouter);
