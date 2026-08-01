import { eventCountFromRelation } from "@/lib/domain/line-event-count";
import type { Line } from "@/lib/domain/types";
import type { Tables } from "../database.types";
import { BaseRepository } from "./base.repository";

export interface CreateLineInput {
  title: string;
  description?: string | null;
  color: string;
}

export interface UpdateLineInput {
  title?: string;
  description?: string | null;
  color?: string;
}

type LineRow = Tables<"lines">;
type LineRowWithEventCount = LineRow & {
  events?: Array<{ count: number }> | null;
};

function toLine(row: LineRowWithEventCount, eventCount = 0): Line {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    color: row.color,
    eventCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class LinesRepository extends BaseRepository {
  async list(): Promise<Line[]> {
    const { data, error } = await this.client
      .from("lines")
      .select("*, events(count)")
      .order("created_at", { ascending: false });
    if (error) this.fail("Failed to load timelines.", error);
    return ((data ?? []) as LineRowWithEventCount[]).map((row) =>
      toLine(row, eventCountFromRelation(row.events)),
    );
  }

  async getById(id: string): Promise<Line | null> {
    const { data, error } = await this.client.from("lines").select("*").eq("id", id).maybeSingle();
    if (error) this.fail("Failed to load timeline.", error);
    return data ? toLine(data) : null;
  }

  async create(ownerId: string, input: CreateLineInput): Promise<Line> {
    const { data, error } = await this.client
      .from("lines")
      .insert({
        owner_id: ownerId,
        title: input.title,
        description: input.description ?? null,
        color: input.color,
      })
      .select("*")
      .single();
    if (error || !data) this.fail("Failed to create timeline.", error);
    return toLine(data);
  }

  async update(id: string, input: UpdateLineInput): Promise<Line> {
    const { data, error } = await this.client
      .from("lines")
      .update({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) this.fail("Failed to update timeline.", error);
    return toLine(data);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from("lines").delete().eq("id", id);
    if (error) this.fail("Failed to delete timeline.", error);
  }

  async search(term: string): Promise<Line[]> {
    const like = `%${term}%`;
    const { data, error } = await this.client
      .from("lines")
      .select("*, events(count)")
      .or(`title.ilike.${like},description.ilike.${like}`)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (error) this.fail("Search failed.", error);
    return ((data ?? []) as LineRowWithEventCount[]).map((row) =>
      toLine(row, eventCountFromRelation(row.events)),
    );
  }
}
