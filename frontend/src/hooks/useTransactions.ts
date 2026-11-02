import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "../api/transactions";
import type { TransactionInput, TransactionListQuery } from "../types/transaction";

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (q: TransactionListQuery) => ["transactions", "list", q] as const,
  detail: (id: string) => ["transactions", "detail", id] as const,
};

export function useTransactions(query: TransactionListQuery) {
  return useQuery({
    queryKey: transactionKeys.list(query),
    queryFn: () => transactionsApi.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: transactionKeys.detail(id ?? ""),
    queryFn: () => transactionsApi.get(id!),
    enabled: Boolean(id),
  });
}

// Any write changes the list and the dashboard numbers, so refresh both
function useInvalidateDeals() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: transactionKeys.all }),
      qc.invalidateQueries({ queryKey: ["stats"] }),
    ]);
}

export function useCreateTransaction() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: (input: TransactionInput) => transactionsApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction(id: string) {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: (input: Partial<TransactionInput>) => transactionsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateDeals();
  return useMutation({
    mutationFn: (id: string) => transactionsApi.remove(id),
    onSuccess: invalidate,
  });
}
