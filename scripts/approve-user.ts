import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env file.
}

const url = process.env.VITE_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

function parseEmailArg(): string {
  const idx = process.argv.indexOf("--email");
  if (idx === -1 || !process.argv[idx + 1]) {
    console.error("Usage: pnpm approve-user --email user@example.com");
    process.exit(1);
  }
  return process.argv[idx + 1]!.trim().toLowerCase();
}

async function main() {
  if (!url || !secretKey) {
    console.error("Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY.");
    process.exit(1);
  }

  const email = parseEmailArg();
  const admin = createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: list, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error("Could not list users:", listError.message);
    process.exit(1);
  }

  const user = list.users.find((u) => u.email?.toLowerCase() === email);
  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, approved: true },
  });

  if (updateError) {
    console.error("Could not approve user:", updateError.message);
    process.exit(1);
  }

  console.warn(`Approved: ${email}`);
}

main();
