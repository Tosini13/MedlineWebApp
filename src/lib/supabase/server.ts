import { getCookies, setCookie } from "@tanstack/react-start/server";
import { type CookieAdapter, SupabaseProvider, type TypedSupabaseClient } from "./provider";

/**
 * Adapts TanStack Start's request cookie helpers to the provider's interface.
 * Session cookies are forced to HttpOnly + SameSite=Lax (+ Secure in prod) so
 * auth tokens are never exposed to client-side JavaScript.
 */
function tanstackCookieAdapter(): CookieAdapter {
  return {
    getAll() {
      const all = getCookies() ?? {};
      return Object.entries(all).map(([name, value]) => ({
        name,
        value: value ?? "",
      }));
    },
    setAll(cookies) {
      for (const { name, value, options } of cookies) {
        setCookie(name, value, {
          ...options,
          httpOnly: true,
          sameSite: "lax",
          secure: import.meta.env.PROD,
          path: "/",
        });
      }
    },
  };
}

/** Creates a request-scoped Supabase client bound to the current request cookies. */
export function getSupabaseServerClient(): TypedSupabaseClient {
  return SupabaseProvider.server(tanstackCookieAdapter());
}
