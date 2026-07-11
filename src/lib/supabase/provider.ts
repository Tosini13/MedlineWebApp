import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type TypedSupabaseClient = SupabaseClient<Database>;

export interface CookieRecord {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

/** Abstraction over the host framework's cookie access, injected on the server. */
export interface CookieAdapter {
  getAll(): { name: string; value: string }[];
  setAll(cookies: CookieRecord[]): void;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * The single object-oriented seam in the codebase (per project convention).
 * Encapsulates creation of both the browser and server Supabase clients so the
 * rest of the app can stay purely functional.
 */
function requireConfig(): { url: string; anonKey: string } {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.",
    );
  }
  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}

// biome-ignore lint/complexity/noStaticOnlyClass: the data provider is intentionally OOP to encapsulate client lifecycle/memoisation
export class SupabaseProvider {
  private static browserClient: TypedSupabaseClient | null = null;

  /** Memoised browser client. Reads the anon key only; safe for the client bundle. */
  static browser(): TypedSupabaseClient {
    const { url, anonKey } = requireConfig();
    if (!SupabaseProvider.browserClient) {
      SupabaseProvider.browserClient = createBrowserClient<Database>(url, anonKey);
    }
    return SupabaseProvider.browserClient;
  }

  /**
   * Per-request server client. The cookie adapter is injected by the server
   * entrypoint so this module never imports server-only APIs directly.
   */
  static server(cookies: CookieAdapter): TypedSupabaseClient {
    const { url, anonKey } = requireConfig();
    return createServerClient<Database>(url, anonKey, {
      cookies: {
        getAll: () => cookies.getAll(),
        setAll: (toSet) => cookies.setAll(toSet),
      },
    });
  }
}
