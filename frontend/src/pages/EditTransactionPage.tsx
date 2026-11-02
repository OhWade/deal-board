import { Link, useNavigate, useParams } from "react-router";
import { ApiError } from "../api/client";
import type { FlashState } from "../components/layout/AppShell";
import TransactionForm from "../components/transactions/TransactionForm";
import {
  useDeleteTransaction,
  useTransaction,
  useUpdateTransaction,
} from "../hooks/useTransactions";

export default function EditTransactionPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, isPending, error } = useTransaction(id);
  const update = useUpdateTransaction(id);
  const remove = useDeleteTransaction();
  const err = update.error instanceof ApiError ? update.error : null;

  if (isPending) return <div className="page muted">Loading deal…</div>;

  if (error || !data) {
    const missing = error instanceof ApiError && (error.status === 404 || error.status === 400);
    return (
      <div className="page">
        <h1>{missing ? "Deal not found" : "Couldn't load this deal"}</h1>
        <p className="muted">
          {missing ? "It may have been deleted." : error?.message}{" "}
          <Link to="/deals">Back to all deals</Link>
        </p>
      </div>
    );
  }

  const name = `${data.year} ${data.make} ${data.model}`;

  const handleDelete = () => {
    if (!window.confirm(`Delete the ${name} deal? This can't be undone.`)) return;
    remove.mutate(id, {
      onSuccess: () => {
        const state: FlashState = { flash: `Deleted: ${name}` };
        navigate("/deals", { state });
      },
    });
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1>{name}</h1>
        <Link to="/deals">All deals</Link>
      </div>
      <TransactionForm
        key={data.updatedAt}
        initial={data}
        submitting={update.isPending}
        serverErrors={err?.details}
        serverMessage={update.error?.message ?? remove.error?.message}
        onSubmit={(input) =>
          update.mutate(input, {
            onSuccess: (t) => {
              const state: FlashState = { flash: `Saved changes to ${t.year} ${t.make} ${t.model}` };
              navigate("/deals", { state });
            },
          })
        }
        secondaryAction={
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={remove.isPending}
          >
            {remove.isPending ? "Deleting…" : "Delete deal"}
          </button>
        }
      />
    </div>
  );
}
