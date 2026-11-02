import { Router } from "express";
import * as controller from "../controllers/transactions.controller.js";

export const transactionsRouter = Router();

transactionsRouter.get("/", controller.list);
transactionsRouter.post("/", controller.create);
transactionsRouter.get("/:id", controller.getOne);
transactionsRouter.patch("/:id", controller.update);
transactionsRouter.delete("/:id", controller.remove);
