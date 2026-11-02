import type {
  ListResponse,
  Transaction,
  TransactionInput,
  TransactionListQuery,
} from "../types/transaction";
import { request } from "./client";

export const transactionsApi = {
  list: (query: TransactionListQuery = {}) =>
    request<ListResponse<Transaction>>("/transactions", { query: { ...query } }),

  get: (id: string) => request<{ data: Transaction }>(`/transactions/${id}`).then((r) => r.data),

  create: (input: TransactionInput) =>
    request<{ data: Transaction }>("/transactions", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((r) => r.data),

  update: (id: string, input: Partial<TransactionInput>) =>
    request<{ data: Transaction }>(`/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then((r) => r.data),

  remove: (id: string) => request<void>(`/transactions/${id}`, { method: "DELETE" }),
};
