import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Line, MedEvent } from "@/lib/domain/types";
import { requireUser } from "@/lib/server/context";

const searchSchema = z.object({ q: z.string().max(100).default("") });

export interface SearchResults {
  lines: Line[];
  events: MedEvent[];
}

export const searchFn = createServerFn({ method: "GET" })
  .validator((d: unknown) => searchSchema.parse(d))
  .handler(async ({ data }): Promise<SearchResults> => {
    const term = data.q.replace(/[%,()]/g, " ").trim();
    if (term.length < 2) return { lines: [], events: [] };

    const { repos } = await requireUser();
    const [lines, events] = await Promise.all([
      repos.lines.search(term),
      repos.events.search(term),
    ]);
    return { lines, events };
  });
