import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { type AppUser, fetchCurrentUser } from "./auth.api";

export const authKeys = {
  user: ["auth", "user"] as const,
};

export const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: authKeys.user,
    queryFn: () => fetchCurrentUser(),
    staleTime: Number.POSITIVE_INFINITY,
  });

/**
 * Resolve the current user for route `beforeLoad`.
 * Returns cached data immediately so client navigations are not blocked by a
 * session round-trip; only a cold cache hits the network.
 */
export async function resolveCurrentUser(queryClient: QueryClient): Promise<AppUser | null> {
  const cached = queryClient.getQueryData<AppUser | null>(authKeys.user);
  if (cached !== undefined) {
    return cached;
  }
  return queryClient.fetchQuery(currentUserQueryOptions());
}

/** Drop the cached session so the next resolve hits the network (e.g. after sign-in). */
export function clearCurrentUserCache(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: authKeys.user });
}

/** Seed/overwrite the cached session (e.g. set null on sign-out). */
export function setCurrentUserCache(queryClient: QueryClient, user: AppUser | null): void {
  queryClient.setQueryData(authKeys.user, user);
}
