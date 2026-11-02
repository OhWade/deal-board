import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { statsApi } from "../api/stats";

export function useStats(range: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["stats", "summary", range],
    queryFn: () => statsApi.summary(range),
    placeholderData: keepPreviousData,
  });
}
