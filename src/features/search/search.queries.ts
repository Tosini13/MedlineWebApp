import { queryOptions } from "@tanstack/react-query";
import { searchFn } from "./search.api";

export const searchQueryOptions = (q: string) =>
  queryOptions({
    queryKey: ["search", q],
    queryFn: () => searchFn({ data: { q } }),
    enabled: q.trim().length >= 2,
  });
