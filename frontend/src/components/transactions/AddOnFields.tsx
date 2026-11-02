import type { AddOnDraft } from "./addOnDraft";
import { newAddOnRow } from "./addOnDraft";
import styles from "./Transactions.module.css";

interface Props {
  rows: AddOnDraft[];
  onChange: (rows: AddOnDraft[]) => void;
  errors: Record<number, { name?: string; price?: string }>;
}

export default function AddOnFields({ rows, onChange, errors }: Props) {
  const update = (i: number, patch: Partial<AddOnDraft>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className={styles.addOns}>
      {rows.length === 0 && <p className="muted">No add-ons on this deal.</p>}

      {rows.map((row, i) => (
        <div key={row.key} className={styles.addOnRow}>
          <div className="field">
            <label htmlFor={`${row.key}-name`}>Add-on</label>
            <input
              id={`${row.key}-name`}
              className="input"
              value={row.name}
              placeholder="e.g. Ceramic coating"
              aria-invalid={Boolean(errors[i]?.name)}
              onChange={(e) => update(i, { name: e.target.value })}
            />
            {errors[i]?.name && <span className="field-error">{errors[i].name}</span>}
          </div>
          <div className="field">
            <label htmlFor={`${row.key}-price`}>Price</label>
            <div className="money">
              <input
                id={`${row.key}-price`}
                className="input"
                inputMode="decimal"
                value={row.price}
                placeholder="1,500"
                aria-invalid={Boolean(errors[i]?.price)}
                onChange={(e) => update(i, { price: e.target.value })}
              />
            </div>
            {errors[i]?.price && <span className="field-error">{errors[i].price}</span>}
          </div>
          <button
            type="button"
            className={`btn btn-quiet ${styles.removeAddOn}`}
            aria-label={`Remove ${row.name || "add-on"}`}
            onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
          >
            Remove
          </button>
        </div>
      ))}

      <button type="button" className="btn" onClick={() => onChange([...rows, newAddOnRow()])}>
        Add an add-on
      </button>
    </div>
  );
}
