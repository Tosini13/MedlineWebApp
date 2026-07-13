import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdminClient() {
  if (adminClient) return adminClient;

  const url = process.env.VITE_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY.");
  }

  adminClient = createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return adminClient;
}
