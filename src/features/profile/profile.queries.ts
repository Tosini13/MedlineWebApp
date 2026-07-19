import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, upsertProfile } from "./profile.api";
import type { UpsertProfileValues } from "./profile.schema";

export const profileKeys = {
  all: ["profile"] as const,
};

export const profileQueryOptions = () =>
  queryOptions({
    queryKey: profileKeys.all,
    queryFn: () => fetchProfile(),
  });

export function useUpsertProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: UpsertProfileValues) => upsertProfile({ data: values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.all }),
  });
}
