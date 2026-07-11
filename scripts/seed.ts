/**
 * Seeds a Supabase project with a demo user and sample timelines/events.
 *
 * Requires a service-role key (admin) — never ship this key to the client.
 * Run with:  pnpm seed
 *
 * Reads config from the environment (loads `.env` via Node's built-in loader):
 *   VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional: SEED_EMAIL, SEED_PASSWORD (defaults below).
 */
import { createClient } from "@supabase/supabase-js";
import type { Database, EventTypeCode } from "@/lib/supabase/database.types";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env file — rely on real environment variables instead.
}

const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SEED_EMAIL ?? "demo@medline.app";
const password = process.env.SEED_PASSWORD ?? "Demo-Passw0rd!";

if (!url || !serviceRoleKey) {
  console.error(
    "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env before seeding.",
  );
  process.exit(1);
}

const admin = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureUser(): Promise<string> {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (created.data.user) {
    console.warn(`Created demo user ${email}`);
    return created.data.user.id;
  }

  // Likely already exists — find them by paging through the user list.
  const existing = await admin.auth.admin.listUsers();
  const match = existing.data.users.find((u) => u.email === email);
  if (!match) {
    throw created.error ?? new Error("Could not create or find the demo user.");
  }
  console.warn(`Reusing existing demo user ${email}`);
  return match.id;
}

async function seed(): Promise<void> {
  const ownerId = await ensureUser();

  // Start from a clean slate for this user so re-runs stay idempotent.
  await admin.from("lines").delete().eq("owner_id", ownerId);

  const { data: lines, error: linesError } = await admin
    .from("lines")
    .insert([
      {
        owner_id: ownerId,
        title: "Cardiology",
        description: "Heart health journey",
        color: "#0E7C86",
      },
      {
        owner_id: ownerId,
        title: "Annual Checkups",
        description: "Routine physicals",
        color: "#2563EB",
      },
    ])
    .select();

  if (linesError || !lines) {
    throw linesError ?? new Error("Failed to insert lines.");
  }

  const [cardiology, checkups] = lines;
  if (!cardiology || !checkups) {
    throw new Error("Expected two seeded lines.");
  }
  const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

  const events: Array<{
    line_id: string;
    title: string;
    event_date: string;
    type: EventTypeCode;
    description: string | null;
  }> = [
    {
      line_id: cardiology.id,
      title: "Cardiologist consultation",
      event_date: iso(30),
      type: "MA",
      description: "Initial consultation and history review.",
    },
    {
      line_id: cardiology.id,
      title: "ECG + blood panel",
      event_date: iso(20),
      type: "MT",
      description: "Baseline diagnostics ordered.",
    },
    {
      line_id: checkups.id,
      title: "Annual physical",
      event_date: iso(90),
      type: "MA",
      description: null,
    },
  ];

  const { error: eventsError } = await admin.from("events").insert(events);
  if (eventsError) {
    throw eventsError;
  }

  console.warn(`Seeded ${lines.length} timelines and ${events.length} events for ${email}.`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
