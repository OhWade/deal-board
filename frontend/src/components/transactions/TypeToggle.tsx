import type { TransactionType } from "../../types/transaction";
import styles from "./Transactions.module.css";

interface Props {
  value: TransactionType;
  onChange: (t: TransactionType) => void;
}

const options: { value: TransactionType; label: string; hint: string }[] = [
  { value: "SOLD", label: "Sold", hint: "A car went out to a customer" },
  { value: "PURCHASED", label: "Purchased", hint: "A car came in to inventory" },
];

export default function TypeToggle({ value, onChange }: Props) {
  return (
    <fieldset className={styles.toggle}>
      <legend className="visually-hidden">Deal type</legend>
      {options.map((o) => (
        <label
          key={o.value}
          className={`${styles.toggleOption} ${o.value === "SOLD" ? styles.optSold : styles.optPurchased}`}
        >
          <input
            type="radio"
            name="type"
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          <span className={styles.toggleLabel}>{o.label}</span>
          <span className={styles.toggleHint}>{o.hint}</span>
        </label>
      ))}
    </fieldset>
  );
}
