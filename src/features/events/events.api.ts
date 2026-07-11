import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/server/context";
import { createEventSchema, eventIdSchema, updateEventSchema } from "./events.schema";

const lineEventsSchema = z.object({ lineId: z.uuid() });

export const fetchEventsByLine = createServerFn({ method: "GET" })
  .validator((d: unknown) => lineEventsSchema.parse(d))
  .handler(async ({ data }) => {
    const { repos } = await requireUser();
    return repos.events.listByLine(data.lineId);
  });

export const fetchEvent = createServerFn({ method: "GET" })
  .validator((d: unknown) => eventIdSchema.parse(d))
  .handler(async ({ data }) => {
    const { repos } = await requireUser();
    const event = await repos.events.getById(data.id);
    if (!event) return null;
    const documents = await repos.documents.listByEvent(event.id);
    return { ...event, documents };
  });

export const createEvent = createServerFn({ method: "POST" })
  .validator((d: unknown) => createEventSchema.parse(d))
  .handler(async ({ data }) => {
    const { repos } = await requireUser();
    return repos.events.create(data);
  });

export const updateEvent = createServerFn({ method: "POST" })
  .validator((d: unknown) => updateEventSchema.parse(d))
  .handler(async ({ data }) => {
    const { repos } = await requireUser();
    const { id, ...rest } = data;
    return repos.events.update(id, rest);
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .validator((d: unknown) => eventIdSchema.parse(d))
  .handler(async ({ data }) => {
    const { repos } = await requireUser();

    const documents = await repos.documents.listByEvent(data.id);
    await repos.documents.removeFiles(documents.map((doc) => doc.storagePath));

    await repos.events.remove(data.id);
    return { id: data.id };
  });
