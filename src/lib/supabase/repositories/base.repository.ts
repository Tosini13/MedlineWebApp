import type { PostgrestError } from "@supabase/supabase-js";
import type { TypedSupabaseClient } from "../provider";

/** Error type that never carries raw DB details or PHI to the caller. */
export class RepositoryError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "RepositoryError";
    this.code = code;
  }
}

export abstract class BaseRepository {
  protected readonly client: TypedSupabaseClient;

  constructor(client: TypedSupabaseClient) {
    this.client = client;
  }

  protected fail(message: string, error: PostgrestError | null): never {
    throw new RepositoryError(message, error?.code);
  }
}
