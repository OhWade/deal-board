export type TransactionType = "SOLD" | "PURCHASED";

export interface AddOn {
  id: string;
  transactionId: string;
  name: string;
  priceCents: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  partyName: string;
  year: number;
  make: string;
  model: string;
  vin: string | null;
  priceCents: number;
  dealDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  addOns: AddOn[];
}

export interface TransactionInput {
  type: TransactionType;
  partyName: string;
  year: number;
  make: string;
  model: string;
  vin: string | null;
  priceCents: number;
  dealDate: string;
  addOns: { name: string; priceCents: number }[];
}

export interface TransactionListQuery {
  type?: TransactionType;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface ListResponse<T> {
  data: T[];
  meta: { total: number; limit: number; offset: number };
}

export interface TypeTotals {
  units: number;
  vehicleCents: number;
  addOnCents: number;
  grossCents: number;
}

export interface StatsSummary {
  range: { from: string | null; to: string | null };
  sold: TypeTotals;
  purchased: TypeTotals;
  monthly: { month: string; sold: TypeTotals; purchased: TypeTotals }[];
}

export const dealTotalCents = (t: Pick<Transaction, "priceCents" | "addOns">) =>
  t.priceCents + t.addOns.reduce((sum, a) => sum + a.priceCents, 0);
