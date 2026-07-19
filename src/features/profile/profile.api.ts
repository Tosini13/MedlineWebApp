import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/lib/server/context";
import { upsertProfileSchema } from "./profile.schema";

export const fetchProfile = createServerFn({ method: "GET" }).handler(async () => {
  const { user, repos } = await requireUser();
  return repos.profiles.getByUserId(user.id);
});

export const upsertProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => upsertProfileSchema.parse(data))
  .handler(async ({ data }) => {
    const { user, repos } = await requireUser();
    return repos.profiles.upsert(user.id, data);
  });
