import type { TypeTotals } from "../../types/transaction";
import { formatCompact, formatCurrency } from "../../utils/money";
import styles from "./Dashboard.module.css";
import Tally from "./Tally";

interface Props {
  variant: "sold" | "purchased";
  totals: TypeTotals;
}

const copy = {
  sold: { title: "Sold", unitWord: "units sold", grossLabel: "gross", vehicleLabel: "from cars" },
  purchased: {
    title: "Purchased",
    unitWord: "units bought",
    grossLabel: "spent",
    vehicleLabel: "on cars",
  },
};

export default function BoardColumn({ variant, totals }: Props) {
  const c = copy[variant];

  return (
    <section className={`${styles.column} ${styles[variant]}`} aria-labelledby={`${variant}-title`}>
      <h2 id={`${variant}-title`} className={styles.columnTitle}>
        {c.title}
      </h2>

      <p className={styles.units}>
        <span className={styles.unitsNumber}>{totals.units}</span>
        <span className="visually-hidden">{c.unitWord}</span>
      </p>
      <Tally count={totals.units} />

      <p className={styles.gross}>
        <span title={formatCurrency(totals.grossCents)}>{formatCompact(totals.grossCents)}</span>{" "}
        <span className={styles.grossLabel}>{c.grossLabel}</span>
      </p>
      <dl className={styles.split}>
        <div>
          <dt>{c.vehicleLabel}</dt>
          <dd>{formatCurrency(totals.vehicleCents)}</dd>
        </div>
        <div>
          <dt>from add-ons</dt>
          <dd>{formatCurrency(totals.addOnCents)}</dd>
        </div>
      </dl>
    </section>
  );
}
