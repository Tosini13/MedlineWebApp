/** Extract event count from a Supabase nested `events(count)` relation payload. */
export function eventCountFromRelation(
  relation: Array<{ count: number }> | null | undefined,
): number {
  return relation?.[0]?.count ?? 0;
}

/** Resolve the active timeline id from a pathname, ignoring `/lines/new`. */
export function activeLineIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/lines\/([^/]+)/);
  const id = match?.[1];
  if (!id || id === "new") return null;
  return id;
}
