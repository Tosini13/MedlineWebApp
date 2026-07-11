import type { User } from "@supabase/supabase-js";
import { redirect } from "@tanstack/react-router";
import type { TypedSupabaseClient } from "@/lib/supabase/provider";
import { createRepositories, type Repositories } from "@/lib/supabase/repositories";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface ServerContext {
  client: TypedSupabaseClient;
  repos: Repositories;
}

export interface AuthedContext extends ServerContext {
  user: User;
}

/** Builds a request-scoped Supabase client + repositories (no auth requirement). */
export function getServerContext(): ServerContext {
  const client = getSupabaseServerClient();
  return { client, repos: createRepositories(client) };
}

/**
 * The authorization boundary for every protected server function. Verifies the
 * session against the auth server and redirects to /login when absent.
 */
export async function requireUser(): Promise<AuthedContext> {
  const { client, repos } = getServerContext();
  const user = await repos.auth.getUser();
  if (!user) {
    throw redirect({ to: "/login" });
  }
  return { client, repos, user };
}
