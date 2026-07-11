import type { EventTypeCode, MedEvent } from "@/lib/domain/types";
import type { Tables } from "../database.types";
import { BaseRepository } from "./base.repository";

export interface CreateEventInput {
  lineId: string;
  title: string;
  date: string;
  description?: string | null;
  type: EventTypeCode;
}

export interface UpdateEventInput {
  title?: string;
  date?: string;
  description?: string | null;
  type?: EventTypeCode;
}

function toEvent(row: Tables<"events">): MedEvent {
  return {
    id: row.id,
    lineId: row.line_id,
    title: row.title,
    date: row.event_date,
    description: row.description,
    type: row.type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class EventsRepository extends BaseRepository {
  async listByLine(lineId: string): Promise<MedEvent[]> {
    const { data, error } = await this.client
      .from("events")
      .select("*")
      .eq("line_id", lineId)
      .order("event_date", { ascending: false });
    if (error) this.fail("Failed to load events.", error);
    return (data ?? []).map(toEvent);
  }

  async getById(id: string): Promise<MedEvent | null> {
    const { data, error } = await this.client.from("events").select("*").eq("id", id).maybeSingle();
    if (error) this.fail("Failed to load event.", error);
    return data ? toEvent(data) : null;
  }

  async create(input: CreateEventInput): Promise<MedEvent> {
    const { data, error } = await this.client
      .from("events")
      .insert({
        line_id: input.lineId,
        title: input.title,
        event_date: input.date,
        description: input.description ?? null,
        type: input.type,
      })
      .select("*")
      .single();
    if (error || !data) this.fail("Failed to create event.", error);
    return toEvent(data);
  }

  async update(id: string, input: UpdateEventInput): Promise<MedEvent> {
    const { data, error } = await this.client
      .from("events")
      .update({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.date !== undefined ? { event_date: input.date } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) this.fail("Failed to update event.", error);
    return toEvent(data);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from("events").delete().eq("id", id);
    if (error) this.fail("Failed to delete event.", error);
  }

  async search(term: string): Promise<MedEvent[]> {
    const like = `%${term}%`;
    const { data, error } = await this.client
      .from("events")
      .select("*")
      .or(`title.ilike.${like},description.ilike.${like}`)
      .order("event_date", { ascending: false })
      .limit(30);
    if (error) this.fail("Search failed.", error);
    return (data ?? []).map(toEvent);
  }
}
