import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { linesKeys } from "@/features/lines/lines.queries";
import { migrateFromFirebase } from "./migration.api";
import { fetchFirebaseSummary } from "./migration-summary.api";

export const migrationKeys = {
  summary: ["migration", "firebase-summary"] as const,
};

export const firebaseSummaryQueryOptions = () =>
  queryOptions({
    queryKey: migrationKeys.summary,
    queryFn: () => fetchFirebaseSummary(),
    staleTime: 0,
  });

export function useMigrateFromFirebase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => migrateFromFirebase(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linesKeys.all });
      queryClient.invalidateQueries({ queryKey: migrationKeys.summary });
    },
  });
}
