import type { Line } from "@/lib/domain/types";

/** Case-insensitive title substring filter for sidebar timeline search. */
export function filterLinesByTitle(lines: Line[], query: string): Line[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return lines;
  return lines.filter((line) => line.title.toLowerCase().includes(normalized));
}
