import { useNavigate } from "react-router";
import { dealTotalCents, type Transaction } from "../../types/transaction";
import { formatDate } from "../../utils/dates";
import { formatCurrency } from "../../utils/money";
import styles from "./Transactions.module.css";

export default function TransactionTable({ rows }: { rows: Transaction[] }) {
  const navigate = useNavigate();

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Type</th>
            <th scope="col">Vehicle</th>
            <th scope="col">Customer or seller</th>
            <th scope="col" className={styles.num}>
              Price
            </th>
            <th scope="col" className={styles.num}>
              Add-ons
            </th>
            <th scope="col" className={styles.num}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const addOnCents = dealTotalCents(t) - t.priceCents;
            return (
              <tr
                key={t.id}
                className={t.type === "SOLD" ? styles.trSold : styles.trPurchased}
                onClick={() => navigate(`/deals/${t.id}`)}
              >
                <td className={styles.nowrap}>{formatDate(t.dealDate)}</td>
                <td>
                  <span className={styles.typeTag}>{t.type === "SOLD" ? "Sold" : "Purchased"}</span>
                </td>
                <td>
                  {/* The link keeps rows reachable by keyboard and screen readers */}
                  <a
                    href={`/deals/${t.id}`}
                    className={styles.rowLink}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/deals/${t.id}`);
                    }}
                  >
                    {t.year} {t.make} {t.model}
                  </a>
                </td>
                <td>{t.partyName}</td>
                <td className={styles.num}>{formatCurrency(t.priceCents)}</td>
                <td className={styles.num}>
                  {t.addOns.length ? formatCurrency(addOnCents) : <span className="muted">None</span>}
                </td>
                <td className={`${styles.num} ${styles.strong}`}>{formatCurrency(dealTotalCents(t))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
