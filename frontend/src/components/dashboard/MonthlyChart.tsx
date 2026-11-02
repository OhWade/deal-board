import type { StatsSummary } from "../../types/transaction";
import { formatMonth, lastMonths } from "../../utils/dates";
import styles from "./Dashboard.module.css";

interface Props {
  monthly: StatsSummary["monthly"];
  months?: number;
}

const W = 560;
const H = 220;
const PAD = { top: 22, right: 8, bottom: 28, left: 8 };

/** Units per month, sold vs purchased, as grouped bars. Hand-rolled SVG, no chart library. */
export default function MonthlyChart({ monthly, months = 6 }: Props) {
  const byMonth = new Map(monthly.map((m) => [m.month, m]));
  const data = lastMonths(months).map((month) => ({
    month,
    sold: byMonth.get(month)?.sold.units ?? 0,
    purchased: byMonth.get(month)?.purchased.units ?? 0,
  }));

  const max = Math.max(1, ...data.flatMap((d) => [d.sold, d.purchased]));
  const plotH = H - PAD.top - PAD.bottom;
  const slot = (W - PAD.left - PAD.right) / data.length;
  const barW = Math.min(26, slot * 0.3);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;

  const summary = data
    .map((d) => `${formatMonth(d.month, true)}: ${d.sold} sold, ${d.purchased} purchased`)
    .join("; ");

  return (
    <figure className={styles.chart}>
      <figcaption className={styles.chartHead}>
        <h2>Units by month</h2>
        <span className={styles.legend}>
          <span className={styles.keySold}>Sold</span>
          <span className={styles.keyPurchased}>Purchased</span>
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + plotH}
          y2={PAD.top + plotH}
          className={styles.axis}
        />
        {data.map((d, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          return (
            <g key={d.month}>
              {(["sold", "purchased"] as const).map((key, k) => {
                const v = d[key];
                const x = cx + (k === 0 ? -barW - 2 : 2);
                return (
                  <g key={key}>
                    <rect
                      x={x}
                      y={y(v)}
                      width={barW}
                      height={Math.max(0, PAD.top + plotH - y(v))}
                      rx={2}
                      className={key === "sold" ? styles.barSold : styles.barPurchased}
                    />
                    {v > 0 && (
                      <text x={x + barW / 2} y={y(v) - 6} className={styles.barValue}>
                        {v}
                      </text>
                    )}
                  </g>
                );
              })}
              <text x={cx} y={H - 8} className={styles.monthLabel}>
                {formatMonth(d.month)}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
