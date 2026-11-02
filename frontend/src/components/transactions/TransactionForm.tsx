import { useState, type FormEvent } from "react";
import type { FieldError } from "../../api/client";
import type { Transaction, TransactionInput, TransactionType } from "../../types/transaction";
import { toISODate } from "../../utils/dates";
import { centsToInput, formatCurrency, parseDollarsToCents } from "../../utils/money";
import AddOnFields from "./AddOnFields";
import { newAddOnRow, type AddOnDraft } from "./addOnDraft";
import styles from "./Transactions.module.css";
import TypeToggle from "./TypeToggle";

interface Draft {
  type: TransactionType;
  partyName: string;
  year: string;
  make: string;
  model: string;
  vin: string;
  price: string;
  dealDate: string;
  addOns: AddOnDraft[];
}

type Errors = Partial<Record<keyof Omit<Draft, "addOns">, string>> & {
  addOns: Record<number, { name?: string; price?: string }>;
  form?: string;
};

interface Props {
  initial?: Transaction;
  submitting: boolean;
  serverErrors?: FieldError[];
  serverMessage?: string;
  onSubmit: (input: TransactionInput) => void;
  secondaryAction?: React.ReactNode;
}

const labels = {
  SOLD: {
    party: "Customer name",
    price: "Sale price",
    date: "Date driven off the lot",
    submit: "Log sale",
    total: "Deal total",
  },
  PURCHASED: {
    party: "Bought from",
    price: "Purchase price",
    date: "Date acquired",
    submit: "Log purchase",
    total: "Total cost",
  },
} as const;

function toDraft(t?: Transaction): Draft {
  if (!t) {
    return {
      type: "SOLD",
      partyName: "",
      year: "",
      make: "",
      model: "",
      vin: "",
      price: "",
      dealDate: toISODate(new Date()),
      addOns: [],
    };
  }
  return {
    type: t.type,
    partyName: t.partyName,
    year: String(t.year),
    make: t.make,
    model: t.model,
    vin: t.vin ?? "",
    price: centsToInput(t.priceCents),
    dealDate: t.dealDate,
    addOns: t.addOns.map((a) => newAddOnRow(a.name, centsToInput(a.priceCents))),
  };
}

function validate(d: Draft): { input?: TransactionInput; errors: Errors } {
  const errors: Errors = { addOns: {} };
  const maxYear = new Date().getFullYear() + 2;
  const year = Number(d.year);
  const priceCents = parseDollarsToCents(d.price);

  if (!d.partyName.trim()) errors.partyName = "Enter a name";
  if (!/^\d{4}$/.test(d.year)) errors.year = "Enter a 4-digit year";
  else if (year < 1900 || year > maxYear) errors.year = `Use 1900 to ${maxYear}`;
  if (!d.make.trim()) errors.make = "Enter the make";
  if (!d.model.trim()) errors.model = "Enter the model";
  if (d.vin.trim() && !/^[A-HJ-NPR-Z0-9]{17}$/i.test(d.vin.trim()))
    errors.vin = "A VIN is 17 letters and numbers, without I, O or Q";
  if (priceCents === null) errors.price = "Enter a price like 42,999";
  if (!d.dealDate) errors.dealDate = "Pick a date";

  const addOns = d.addOns.map((a, i) => {
    const cents = parseDollarsToCents(a.price);
    const rowErr: { name?: string; price?: string } = {};
    if (!a.name.trim()) rowErr.name = "Name the add-on";
    if (cents === null) rowErr.price = "Enter a price";
    if (rowErr.name || rowErr.price) errors.addOns[i] = rowErr;
    return { name: a.name.trim(), priceCents: cents ?? 0 };
  });

  const hasErrors =
    Object.keys(errors).some((k) => k !== "addOns") || Object.keys(errors.addOns).length > 0;
  if (hasErrors) return { errors };

  return {
    errors,
    input: {
      type: d.type,
      partyName: d.partyName.trim(),
      year,
      make: d.make.trim(),
      model: d.model.trim(),
      vin: d.vin.trim() ? d.vin.trim().toUpperCase() : null,
      priceCents: priceCents!,
      dealDate: d.dealDate,
      addOns,
    },
  };
}

const serverFieldMap: Record<string, keyof Omit<Draft, "addOns">> = {
  partyName: "partyName",
  year: "year",
  make: "make",
  model: "model",
  vin: "vin",
  priceCents: "price",
  dealDate: "dealDate",
};

export default function TransactionForm({
  initial,
  submitting,
  serverErrors = [],
  serverMessage,
  onSubmit,
  secondaryAction,
}: Props) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [errors, setErrors] = useState<Errors>({ addOns: {} });
  const l = labels[draft.type];

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // Server-side validation messages land on the matching field
  const fieldError = (key: keyof Omit<Draft, "addOns">) =>
    errors[key] ?? serverErrors.find((e) => serverFieldMap[e.path] === key)?.message;

  const totalCents =
    (parseDollarsToCents(draft.price) ?? 0) +
    draft.addOns.reduce((sum, a) => sum + (parseDollarsToCents(a.price) ?? 0), 0);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = validate(draft);
    setErrors(result.errors);
    if (result.input) onSubmit(result.input);
  }

  const text = (key: "partyName" | "make" | "model", label: string, placeholder: string) => (
    <div className="field">
      <label htmlFor={key}>{label}</label>
      <input
        id={key}
        className="input"
        value={draft[key]}
        placeholder={placeholder}
        aria-invalid={Boolean(fieldError(key))}
        onChange={(e) => set(key, e.target.value)}
      />
      {fieldError(key) && <span className="field-error">{fieldError(key)}</span>}
    </div>
  );

  return (
    <form
      className={`${styles.form} ${draft.type === "SOLD" ? styles.formSold : styles.formPurchased}`}
      onSubmit={handleSubmit}
      noValidate
    >
      <TypeToggle value={draft.type} onChange={(t) => set("type", t)} />

      {serverMessage && serverErrors.length === 0 && (
        <p className="banner" role="alert">
          {serverMessage}
        </p>
      )}

      <section className={styles.formSection} aria-labelledby="vehicle-heading">
        <h2 id="vehicle-heading">Vehicle</h2>
        <div className={styles.gridVehicle}>
          <div className="field">
            <label htmlFor="year">Year</label>
            <input
              id="year"
              className="input"
              inputMode="numeric"
              maxLength={4}
              value={draft.year}
              placeholder="e.g. 2018"
              aria-invalid={Boolean(fieldError("year"))}
              onChange={(e) => set("year", e.target.value.replace(/\D/g, ""))}
            />
            {fieldError("year") && <span className="field-error">{fieldError("year")}</span>}
          </div>
          {text("make", "Make", "e.g. BMW")}
          {text("model", "Model", "e.g. M4")}
        </div>
        <div className="field">
          <label htmlFor="vin">
            VIN <span className="hint">optional</span>
          </label>
          <input
            id="vin"
            className="input"
            value={draft.vin}
            maxLength={17}
            autoCapitalize="characters"
            spellCheck={false}
            aria-invalid={Boolean(fieldError("vin"))}
            onChange={(e) => set("vin", e.target.value.toUpperCase())}
          />
          {fieldError("vin") && <span className="field-error">{fieldError("vin")}</span>}
        </div>
      </section>

      <section className={styles.formSection} aria-labelledby="deal-heading">
        <h2 id="deal-heading">Deal</h2>
        {text("partyName", l.party, draft.type === "SOLD" ? "e.g. Zack B" : "e.g. Manheim auction")}
        <div className={styles.gridDeal}>
          <div className="field">
            <label htmlFor="price">{l.price}</label>
            <div className="money">
              <input
                id="price"
                className="input"
                inputMode="decimal"
                value={draft.price}
                placeholder="42,999"
                aria-invalid={Boolean(fieldError("price"))}
                onChange={(e) => set("price", e.target.value)}
              />
            </div>
            {fieldError("price") && <span className="field-error">{fieldError("price")}</span>}
          </div>
          <div className="field">
            <label htmlFor="dealDate">{l.date}</label>
            <input
              id="dealDate"
              type="date"
              className="input"
              value={draft.dealDate}
              aria-invalid={Boolean(fieldError("dealDate"))}
              onChange={(e) => set("dealDate", e.target.value)}
            />
            {fieldError("dealDate") && (
              <span className="field-error">{fieldError("dealDate")}</span>
            )}
          </div>
        </div>
      </section>

      <section className={styles.formSection} aria-labelledby="addons-heading">
        <h2 id="addons-heading">Add-ons</h2>
        <AddOnFields rows={draft.addOns} onChange={(rows) => set("addOns", rows)} errors={errors.addOns} />
      </section>

      <footer className={styles.formFooter}>
        <p className={styles.total}>
          <span className={styles.totalLabel}>{l.total}</span>
          <span className={styles.totalValue}>{formatCurrency(totalCents)}</span>
        </p>
        <div className={styles.footerActions}>
          {secondaryAction}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : initial ? "Save changes" : l.submit}
          </button>
        </div>
      </footer>
    </form>
  );
}
