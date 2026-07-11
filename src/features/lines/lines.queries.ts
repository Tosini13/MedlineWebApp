import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { createLine, deleteLine, fetchLine, fetchLines, updateLine } from "./lines.api";
import type { CreateLineValues, UpdateLineValues } from "./lines.schema";

export const linesKeys = {
  all: ["lines"] as const,
  detail: (id: string) => ["lines", id] as const,
};

export const linesQueryOptions = () =>
  queryOptions({
    queryKey: linesKeys.all,
    queryFn: () => fetchLines(),
  });

export const lineQueryOptions = (id: string) =>
  queryOptions({
    queryKey: linesKeys.detail(id),
    queryFn: () => fetchLine({ data: { id } }),
  });

export function useCreateLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateLineValues) => createLine({ data: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: linesKeys.all }),
  });
}

export function useUpdateLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: UpdateLineValues) => updateLine({ data: values }),
    onSuccess: (line) => {
      queryClient.invalidateQueries({ queryKey: linesKeys.all });
      queryClient.invalidateQueries({ queryKey: linesKeys.detail(line.id) });
    },
  });
}

export function useDeleteLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLine({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: linesKeys.all }),
  });
}
