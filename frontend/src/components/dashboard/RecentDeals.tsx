import { Link } from "react-router";
import { dealTotalCents, type Transaction } from "../../types/transaction";
import { formatDate } from "../../utils/dates";
import { formatCurrency } from "../../utils/money";
import styles from "./Dashboard.module.css";

export default function RecentDeals({ deals }: { deals: Transaction[] }) {
  return (
    <section className={styles.recent} aria-labelledby="recent-title">
      <div className={styles.recentHead}>
        <h2 id="recent-title">Latest deals</h2>
        <Link to="/deals">See all</Link>
      </div>
      {deals.length === 0 ? (
        <p className="muted">
          Nothing logged yet. <Link to="/deals/new">Log your first deal</Link> and it shows up here.
        </p>
      ) : (
        <ul className={styles.recentList}>
          {deals.map((d) => (
            <li key={d.id} className={d.type === "SOLD" ? styles.rowSold : styles.rowPurchased}>
              <Link to={`/deals/${d.id}`} className={styles.recentLink}>
                <span className={styles.recentCar}>
                  {d.year} {d.make} {d.model}
                </span>
                <span className={styles.recentMeta}>
                  {d.type === "SOLD" ? "Sold to" : "Bought from"} {d.partyName}, {formatDate(d.dealDate)}
                </span>
                <span className={styles.recentAmount}>{formatCurrency(dealTotalCents(d))}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
