/**
 * Migrates medical timeline data from Firebase (Firestore + Storage) to Supabase
 * (Postgres + Storage) as a standalone admin/batch CLI.
 *
 * Required env vars:
 *   VITE_SUPABASE_URL
 *   SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)
 *   FIREBASE_SERVICE_ACCOUNT (JSON string) or FIREBASE_SERVICE_ACCOUNT_PATH (path to JSON)
 * Optional env var:
 *   FIREBASE_STORAGE_BUCKET (defaults to `${serviceAccount.project_id}.appspot.com`)
 *
 * Usage examples:
 *   pnpm tsx scripts/migrate-from-firebase.ts --email user@example.com
 *   pnpm tsx scripts/migrate-from-firebase.ts --all
 *   pnpm tsx scripts/migrate-from-firebase.ts --all --dry-run
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type UserRecord } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import type { Database, EventTypeCode } from "@/lib/supabase/database.types";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env file — rely on real environment variables instead.
}

type MigrationTotals = {
  usersProcessed: number;
  usersSkipped: number;
  lines: number;
  events: number;
  documents: number;
};

type UserMigrationTotals = {
  lines: number;
  events: number;
  documents: number;
};

type WarningCounters = {
  missingFiles: number;
  skippedUsers: number;
  unparseableDates: number;
};

type CliOptions = {
  all: boolean;
  email: string | null;
  dryRun: boolean;
};

type FirebaseLine = {
  title: string;
  description?: string;
  color: string;
  ownerId: string;
};

type FirebaseDocumentRef = {
  name: string;
  path: string;
  type?: string;
};

type FirebaseEvent = {
  title: string;
  date: string | Timestamp | { seconds: number };
  description: string;
  type: "MA" | "O" | "MT" | "S" | "other";
  documents?: FirebaseDocumentRef[];
};

type ParsedServiceAccount = ServiceAccount & { project_id?: string };

type SupabaseAdminUser = {
  id: string;
  email: string | null;
};

const VALID_EVENT_TYPES = new Set<EventTypeCode>(["MA", "O", "MT", "S", "other"]);
const CSS_COLOR_MAP: Record<string, string> = {
  red: "#EF4444",
  blue: "#2563EB",
  green: "#16A34A",
  orange: "#F97316",
  purple: "#9333EA",
  yellow: "#EAB308",
  teal: "#0E7C86",
  pink: "#EC4899",
  gray: "#6B7280",
  grey: "#6B7280",
  black: "#111827",
};

const url = process.env.VITE_SUPABASE_URL;
/** Secret key (`sb_secret_...`). Falls back to legacy `SUPABASE_SERVICE_ROLE_KEY`. */
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secretKey) {
  console.error(
    "Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY. Set them in .env before migrating.",
  );
  process.exit(1);
}

const admin = createClient<Database>(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function parseArgs(argv: string[]): CliOptions {
  let all = false;
  let email: string | null = null;
  let dryRun = false;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--all") {
      all = true;
      continue;
    }
    if (token === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (token === "--email") {
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        throw new Error("Missing value for --email.");
      }
      email = next.trim().toLowerCase();
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  if (!all && !email) {
    throw new Error("Provide either --email <email> or --all.");
  }
  if (all && email) {
    throw new Error("Use only one mode: --email <email> or --all.");
  }

  return { all, email, dryRun };
}

function parseServiceAccount(): ParsedServiceAccount {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const accountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!rawJson && !accountPath) {
    throw new Error(
      "Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH.",
    );
  }

  let parsed: unknown;
  if (rawJson) {
    parsed = JSON.parse(rawJson);
  } else {
    const fileContents = readFileSync(accountPath ?? "", "utf8");
    parsed = JSON.parse(fileContents);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Firebase service account is not a valid JSON object.");
  }

  const account = parsed as ParsedServiceAccount & {
    client_email?: string;
    private_key?: string;
    project_id?: string;
  };
  const clientEmail = account.clientEmail ?? account.client_email;
  const privateKey = account.privateKey ?? account.private_key;
  const projectId = account.projectId ?? account.project_id;
  if (!clientEmail || !privateKey || !projectId) {
    throw new Error(
      "Firebase service account must include client_email, private_key, and project_id.",
    );
  }

  return {
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
    projectId,
  };
}

function normalizeColor(input: unknown): string {
  if (typeof input === "string") {
    if (/^#[0-9a-fA-F]{6}$/.test(input)) {
      return input;
    }
    const mapped = CSS_COLOR_MAP[input.trim().toLowerCase()];
    if (mapped) {
      return mapped;
    }
  }
  return "#0E7C86";
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function coerceEventType(input: unknown): EventTypeCode {
  if (typeof input === "string" && VALID_EVENT_TYPES.has(input as EventTypeCode)) {
    return input as EventTypeCode;
  }
  return "other";
}

function normalizeDate(value: unknown, warnings: WarningCounters): string {
  let parsed: Date | null = null;

  if (typeof value === "string") {
    const candidate = new Date(value);
    if (!Number.isNaN(candidate.getTime())) {
      parsed = candidate;
    }
  } else if (value instanceof Timestamp) {
    parsed = value.toDate();
  } else if (
    value &&
    typeof value === "object" &&
    "seconds" in value &&
    typeof (value as { seconds: unknown }).seconds === "number"
  ) {
    parsed = new Date((value as { seconds: number }).seconds * 1000);
  } else if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    const converted = (value as { toDate: () => Date }).toDate();
    if (converted instanceof Date && !Number.isNaN(converted.getTime())) {
      parsed = converted;
    }
  }

  if (!parsed || Number.isNaN(parsed.getTime())) {
    warnings.unparseableDates += 1;
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

async function listAllSupabaseUsersByEmail(): Promise<Map<string, SupabaseAdminUser>> {
  const usersByEmail = new Map<string, SupabaseAdminUser>();
  const perPage = 1000;
  let page = 1;

  while (true) {
    const response = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (response.error) {
      throw response.error;
    }

    const users = response.data.users;
    for (const user of users) {
      const email = user.email?.trim().toLowerCase();
      if (email) {
        usersByEmail.set(email, {
          id: user.id,
          email: user.email ?? null,
        });
      }
    }

    if (users.length < perPage) {
      break;
    }
    page += 1;
  }

  return usersByEmail;
}

async function listAllFirebaseUsers(): Promise<UserRecord[]> {
  const firebaseAuth = getAuth();
  const users: UserRecord[] = [];
  let pageToken: string | undefined;

  do {
    const page = await firebaseAuth.listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);

  return users;
}

async function migrateUserData(params: {
  firebaseUid: string;
  email: string;
  supabaseUserId: string;
  bucketName: string;
  dryRun: boolean;
  warnings: WarningCounters;
  hardErrors: string[];
}): Promise<UserMigrationTotals> {
  const { firebaseUid, email, supabaseUserId, bucketName, dryRun, warnings, hardErrors } = params;
  const firestore = getFirestore();
  const storage = getStorage().bucket(bucketName);
  const userTotals: UserMigrationTotals = { lines: 0, events: 0, documents: 0 };

  const linesSnapshot = await firestore
    .collection("lines")
    .where("ownerId", "==", firebaseUid)
    .get();
  console.warn(`Processing ${linesSnapshot.docs.length} line(s) for ${email}`);

  for (const lineDoc of linesSnapshot.docs) {
    try {
      const rawLine = lineDoc.data() as FirebaseLine;
      const lineTitle = typeof rawLine.title === "string" ? rawLine.title : "Untitled line";
      const lineDescription = typeof rawLine.description === "string" ? rawLine.description : null;
      const lineColor = normalizeColor(rawLine.color);

      // Idempotency note: this script is append-only; it does not delete existing Supabase rows.
      let newLineId = `dry-line-${lineDoc.id}`;
      if (!dryRun) {
        const insertedLine = await admin
          .from("lines")
          .insert({
            owner_id: supabaseUserId,
            title: lineTitle,
            description: lineDescription,
            color: lineColor,
          })
          .select("id")
          .single();

        if (insertedLine.error || !insertedLine.data) {
          throw insertedLine.error ?? new Error(`Failed to insert line ${lineDoc.id}.`);
        }
        newLineId = insertedLine.data.id;
      }

      userTotals.lines += 1;

      const eventsSnapshot = await lineDoc.ref.collection("events").get();
      for (const eventDoc of eventsSnapshot.docs) {
        try {
          const rawEvent = eventDoc.data() as FirebaseEvent;
          const eventTitle = typeof rawEvent.title === "string" ? rawEvent.title : "Untitled event";
          const eventDescription =
            typeof rawEvent.description === "string" ? rawEvent.description : null;
          const eventDate = normalizeDate(rawEvent.date, warnings);
          const eventType = coerceEventType(rawEvent.type);

          let newEventId = `dry-event-${eventDoc.id}`;
          if (!dryRun) {
            const insertedEvent = await admin
              .from("events")
              .insert({
                line_id: newLineId,
                title: eventTitle,
                event_date: eventDate,
                description: eventDescription,
                type: eventType,
              })
              .select("id")
              .single();

            if (insertedEvent.error || !insertedEvent.data) {
              throw insertedEvent.error ?? new Error(`Failed to insert event ${eventDoc.id}.`);
            }
            newEventId = insertedEvent.data.id;
          }

          userTotals.events += 1;

          const eventDocuments = Array.isArray(rawEvent.documents) ? rawEvent.documents : [];
          for (const docRef of eventDocuments) {
            if (
              !docRef ||
              typeof docRef !== "object" ||
              typeof docRef.name !== "string" ||
              typeof docRef.path !== "string"
            ) {
              continue;
            }

            if (dryRun) {
              userTotals.documents += 1;
              continue;
            }

            try {
              const [buffer] = await storage.file(docRef.path).download();
              const sanitizedName = sanitize(docRef.name);
              const destinationPath = `${supabaseUserId}/${newLineId}/${newEventId}/${Date.now()}-${sanitizedName}`;
              const mimeType =
                typeof docRef.type === "string" && docRef.type.trim()
                  ? docRef.type
                  : "application/octet-stream";

              const uploadResult = await admin.storage
                .from("documents")
                .upload(destinationPath, buffer, {
                  contentType: mimeType,
                  upsert: true,
                });
              if (uploadResult.error) {
                throw uploadResult.error;
              }

              const insertedDocument = await admin.from("documents").insert({
                event_id: newEventId,
                name: docRef.name,
                storage_path: destinationPath,
                mime_type: mimeType,
                size: buffer.byteLength,
              });
              if (insertedDocument.error) {
                throw insertedDocument.error;
              }

              userTotals.documents += 1;
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              warnings.missingFiles += 1;
              console.warn(`Missing or unreadable Firebase file ${docRef.path}: ${message}`);
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          hardErrors.push(`User ${email}, line ${lineDoc.id}, event ${eventDoc.id}: ${message}`);
          console.error(
            `Failed event migration for line ${lineDoc.id}, event ${eventDoc.id}:`,
            error,
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      hardErrors.push(`User ${email}, line ${lineDoc.id}: ${message}`);
      console.error(`Failed line migration for line ${lineDoc.id}:`, error);
    }
  }

  return userTotals;
}

async function migrate(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const serviceAccount = parseServiceAccount();
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET ?? `${serviceAccount.projectId}.appspot.com`;

  if (!bucketName || bucketName.startsWith("undefined.")) {
    throw new Error("Could not determine Firebase storage bucket. Set FIREBASE_STORAGE_BUCKET.");
  }

  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: bucketName,
  });

  const firebaseAuth = getAuth();
  const totals: MigrationTotals = {
    usersProcessed: 0,
    usersSkipped: 0,
    lines: 0,
    events: 0,
    documents: 0,
  };
  const warnings: WarningCounters = {
    missingFiles: 0,
    skippedUsers: 0,
    unparseableDates: 0,
  };
  const hardErrors: string[] = [];

  const supabaseUsersByEmail = await listAllSupabaseUsersByEmail();
  let firebaseUsers: Array<{ uid: string; email: string }> = [];

  if (options.all) {
    const users = await listAllFirebaseUsers();
    firebaseUsers = users
      .map((user) => ({ uid: user.uid, email: user.email?.trim().toLowerCase() ?? "" }))
      .filter((user) => user.email.length > 0);
  } else {
    const email = options.email;
    if (!email) {
      throw new Error("Missing --email value.");
    }
    const user = await firebaseAuth.getUserByEmail(email);
    if (!user.email) {
      throw new Error(`Firebase user has no email: ${email}`);
    }
    firebaseUsers = [{ uid: user.uid, email: user.email.trim().toLowerCase() }];
  }

  console.warn(
    `Starting migration in ${options.dryRun ? "DRY-RUN" : "WRITE"} mode for ${firebaseUsers.length} user(s).`,
  );

  for (const user of firebaseUsers) {
    const supabaseUser = supabaseUsersByEmail.get(user.email);
    if (!supabaseUser) {
      warnings.skippedUsers += 1;
      totals.usersSkipped += 1;
      console.warn(
        `Skipping ${user.email}: no matching Supabase auth user found (match is by email only).`,
      );
      continue;
    }

    totals.usersProcessed += 1;
    try {
      const userTotals = await migrateUserData({
        firebaseUid: user.uid,
        email: user.email,
        supabaseUserId: supabaseUser.id,
        bucketName,
        dryRun: options.dryRun,
        warnings,
        hardErrors,
      });
      totals.lines += userTotals.lines;
      totals.events += userTotals.events;
      totals.documents += userTotals.documents;
      console.warn(
        `Finished ${user.email}: lines=${userTotals.lines}, events=${userTotals.events}, documents=${userTotals.documents}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      hardErrors.push(`User ${user.email}: ${message}`);
      console.error(`Failed user migration for ${user.email}:`, error);
    }
  }

  console.warn("Migration summary:");
  console.warn(`  users processed: ${totals.usersProcessed}`);
  console.warn(`  users skipped: ${totals.usersSkipped}`);
  console.warn(`  lines migrated: ${totals.lines}`);
  console.warn(`  events migrated: ${totals.events}`);
  console.warn(`  documents migrated: ${totals.documents}`);
  console.warn(`  warnings (missing files): ${warnings.missingFiles}`);
  console.warn(`  warnings (skipped users): ${warnings.skippedUsers}`);
  console.warn(`  warnings (unparseable dates): ${warnings.unparseableDates}`);

  if (hardErrors.length > 0) {
    console.error("Hard errors encountered:");
    for (const item of hardErrors) {
      console.error(`  - ${item}`);
    }
    throw new Error(`Migration completed with ${hardErrors.length} hard error(s).`);
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
