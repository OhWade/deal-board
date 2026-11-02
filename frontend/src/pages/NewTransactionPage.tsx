import { useNavigate } from "react-router";
import { ApiError } from "../api/client";
import type { FlashState } from "../components/layout/AppShell";
import TransactionForm from "../components/transactions/TransactionForm";
import { useCreateTransaction } from "../hooks/useTransactions";

export default function NewTransactionPage() {
  const navigate = useNavigate();
  const create = useCreateTransaction();
  const err = create.error instanceof ApiError ? create.error : null;

  return (
    <div className="page">
      <div className="page-head">
        <h1>Log a deal</h1>
      </div>
      <TransactionForm
        submitting={create.isPending}
        serverErrors={err?.details}
        serverMessage={create.error?.message}
        onSubmit={(input) =>
          create.mutate(input, {
            onSuccess: (t) => {
              const verb = t.type === "SOLD" ? "Sale logged" : "Purchase logged";
              const state: FlashState = { flash: `${verb}: ${t.year} ${t.make} ${t.model}` };
              navigate("/", { state });
            },
          })
        }
      />
    </div>
  );
}
