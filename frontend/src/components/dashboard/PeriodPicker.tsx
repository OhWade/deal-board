import { PERIODS, type Period } from "../../utils/dates";
import styles from "./Dashboard.module.css";

interface Props {
  value: Period;
  onChange: (p: Period) => void;
}

export default function PeriodPicker({ value, onChange }: Props) {
  return (
    <div className={styles.periods} role="radiogroup" aria-label="Time period">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          role="radio"
          aria-checked={value === p.value}
          className={styles.period}
          onClick={() => onChange(p.value)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
