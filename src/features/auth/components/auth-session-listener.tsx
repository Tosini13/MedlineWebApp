import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { SupabaseProvider } from "@/lib/supabase/provider";
import { applyAuthStateChange } from "../auth.queries";

/**
 * Keeps the in-memory auth cache aligned with the browser Supabase session.
 * Cross-tab / expired-session sign-outs emit `SIGNED_OUT` here so route guards
 * redirect without waiting for the next data fetch.
 */
export function AuthSessionListener() {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    const client = SupabaseProvider.browser();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event) => {
      if (applyAuthStateChange(event, queryClient)) {
        void router.invalidate();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, router]);

  return null;
}
