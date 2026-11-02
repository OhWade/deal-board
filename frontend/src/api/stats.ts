import type { StatsSummary } from "../types/transaction";
import { request } from "./client";

export const statsApi = {
  summary: (range: { from?: string; to?: string } = {}) =>
    request<{ data: StatsSummary }>("/stats/summary", { query: range }).then((r) => r.data),
};
