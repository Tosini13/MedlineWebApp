import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/lib/server/context";
import { createLineSchema, lineIdSchema, updateLineSchema } from "./lines.schema";

export const fetchLines = createServerFn({ method: "GET" }).handler(async () => {
  const { repos } = await requireUser();
  return repos.lines.list();
});

export const fetchLine = createServerFn({ method: "GET" })
  .validator((d: unknown) => lineIdSchema.parse(d))
  .handler(async ({ data }) => {
    const { repos } = await requireUser();
    return repos.lines.getById(data.id);
  });

export const createLine = createServerFn({ method: "POST" })
  .validator((d: unknown) => createLineSchema.parse(d))
  .handler(async ({ data }) => {
    const { user, repos } = await requireUser();
    return repos.lines.create(user.id, data);
  });

export const updateLine = createServerFn({ method: "POST" })
  .validator((d: unknown) => updateLineSchema.parse(d))
  .handler(async ({ data }) => {
    const { repos } = await requireUser();
    const { id, ...rest } = data;
    return repos.lines.update(id, rest);
  });

export const deleteLine = createServerFn({ method: "POST" })
  .validator((d: unknown) => lineIdSchema.parse(d))
  .handler(async ({ data }) => {
    const { repos } = await requireUser();

    // Remove any stored files before cascading DB deletes drop their rows.
    const events = await repos.events.listByLine(data.id);
    const docGroups = await Promise.all(
      events.map((event) => repos.documents.listByEvent(event.id)),
    );
    const paths = docGroups.flat().map((doc) => doc.storagePath);
    await repos.documents.removeFiles(paths);

    await repos.lines.remove(data.id);
    return { id: data.id };
  });
