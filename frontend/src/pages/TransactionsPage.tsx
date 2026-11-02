import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import styles from "../components/transactions/Transactions.module.css";
import TransactionTable from "../components/transactions/TransactionTable";
import dash from "../components/dashboard/Dashboard.module.css";
import { useTransactions } from "../hooks/useTransactions";
import type { TransactionType } from "../types/transaction";

const PAGE_SIZE = 20;

const filters: { value: TransactionType | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "SOLD", label: "Sold" },
  { value: "PURCHASED", label: "Purchased" },
];

export default function TransactionsPage() {
  // Filters live in the URL so a filtered view can be bookmarked or shared
  const [params, setParams] = useSearchParams();
  const type = (params.get("type") ?? "") as TransactionType | "";
  const q = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1));

  const [search, setSearch] = useState(q);

  const update = (next: Record<string, string>) => {
    const merged = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) merged.set(k, v);
      else merged.delete(k);
    }
    setParams(merged, { replace: true });
  };

  // Debounce typing so every keystroke doesn't fire a request
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== q) update({ q: search.trim(), page: "" });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const { data, isPending, isError, error } = useTransactions({
    type: type || undefined,
    q: q || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const total = data?.meta.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="page">
      <div className="page-head">
        <h1>Deals</h1>
        <span className="muted">{data ? `${total} ${total === 1 ? "deal" : "deals"}` : ""}</span>
      </div>

      <div className={styles.toolbar}>
        <div className={dash.periods} role="radiogroup" aria-label="Deal type">
          {filters.map((f) => (
            <button
              key={f.label}
              type="button"
              role="radio"
              aria-checked={type === f.value}
              className={dash.period}
              onClick={() => update({ type: f.value, page: "" })}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label htmlFor="search" className="visually-hidden">
          Search deals
        </label>
        <input
          id="search"
          type="search"
          className={`input ${styles.search}`}
          placeholder="Search name, make, model, or VIN"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isError && (
        <p className="banner" role="alert">
          {error.message}
        </p>
      )}

      {isPending && <p className="muted">Loading deals…</p>}

      {data && data.data.length === 0 && (
        <div className={styles.empty}>
          <p>{q || type ? "No deals match these filters." : "No deals logged yet."}</p>
          {q || type ? (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setSearch("");
                setParams({}, { replace: true });
              }}
            >
              Clear filters
            </button>
          ) : (
            <Link to="/deals/new" className="btn btn-primary">
              Log a deal
            </Link>
          )}
        </div>
      )}

      {data && data.data.length > 0 && (
        <>
          <TransactionTable rows={data.data} />
          {pages > 1 && (
            <nav className={styles.pager} aria-label="Pagination">
              <button
                type="button"
                className="btn"
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) })}
              >
                Previous
              </button>
              <span className="muted">
                Page {page} of {pages}
              </span>
              <button
                type="button"
                className="btn"
                disabled={page >= pages}
                onClick={() => update({ page: String(page + 1) })}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
