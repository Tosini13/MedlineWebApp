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
/** Publishable key (`sb_publishable_...`). */
const supabasePublishableKey = (import.meta.env.VITE_SUPABASE_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

/**
 * The single object-oriented seam in the codebase (per project convention).
 * Encapsulates creation of both the browser and server Supabase clients so the
 * rest of the app can stay purely functional.
 *
 * Uses `@supabase/ssr` (not a bare `createClient`) so auth sessions live in
 * HttpOnly cookies and work across SSR + server functions — required for
 * TanStack Start. The publishable key is safe to expose to the browser.
 */
function requireConfig(): { url: string; publishableKey: string } {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and a publishable key (VITE_SUPABASE_KEY, VITE_SUPABASE_PUBLISHABLE_KEY, or VITE_SUPABASE_ANON_KEY).",
    );
  }
  return { url: supabaseUrl, publishableKey: supabasePublishableKey };
}

// biome-ignore lint/complexity/noStaticOnlyClass: the data provider is intentionally OOP to encapsulate client lifecycle/memoisation
export class SupabaseProvider {
  private static browserClient: TypedSupabaseClient | null = null;

  /** Memoised browser client. Uses the publishable key only; safe for the client bundle. */
  static browser(): TypedSupabaseClient {
    const { url, publishableKey } = requireConfig();
    if (!SupabaseProvider.browserClient) {
      SupabaseProvider.browserClient = createBrowserClient<Database>(url, publishableKey);
    }
    return SupabaseProvider.browserClient;
  }

  /**
   * Per-request server client. The cookie adapter is injected by the server
   * entrypoint so this module never imports server-only APIs directly.
   */
  static server(cookies: CookieAdapter): TypedSupabaseClient {
    const { url, publishableKey } = requireConfig();
    return createServerClient<Database>(url, publishableKey, {
      cookies: {
        getAll: () => cookies.getAll(),
        setAll: (toSet) => cookies.setAll(toSet),
      },
    });
  }
}
