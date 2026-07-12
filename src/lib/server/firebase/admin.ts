import { readFileSync } from "node:fs";
import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

/**
 * Server-only access to the legacy Firebase project (Firestore + Storage + Auth).
 *
 * Used exclusively by migration server functions to read, migrate, and delete a
 * user's legacy data. This module must NEVER be imported by client-reachable
 * code: it initializes the Firebase Admin SDK with a service account (a secret).
 *
 * Configuration (all server-only env vars, never `VITE_`-prefixed):
 *   FIREBASE_SERVICE_ACCOUNT       full service-account JSON as a string, OR
 *   FIREBASE_SERVICE_ACCOUNT_PATH  path to a service-account JSON file
 *   FIREBASE_STORAGE_BUCKET        optional; defaults to `{project_id}.appspot.com`
 *
 * When no service account is configured the feature degrades gracefully: the
 * account page simply hides the Firebase migration section.
 */

interface ServiceAccountJson {
  project_id: string;
  client_email: string;
  private_key: string;
}

function readServiceAccount(): ServiceAccountJson | null {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  let raw: string | undefined;
  if (inline && inline.trim().length > 0) {
    raw = inline;
  } else if (path && path.trim().length > 0) {
    try {
      raw = readFileSync(path, "utf8");
    } catch {
      return null;
    }
  }

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccountJson>;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      return null;
    }
    return parsed as ServiceAccountJson;
  } catch {
    return null;
  }
}

/** True when a valid Firebase service account is configured on the server. */
export function isFirebaseConfigured(): boolean {
  return readServiceAccount() !== null;
}

let cachedApp: App | null = null;

function getFirebaseApp(): App {
  if (cachedApp) return cachedApp;

  const serviceAccount = readServiceAccount();
  if (!serviceAccount) {
    throw new Error("Firebase is not configured on the server.");
  }

  const existing = getApps().find((app) => app.name === "legacy-firebase");
  cachedApp =
    existing ??
    initializeApp(
      {
        credential: cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          // Env-provided keys often contain literal "\n" sequences.
          privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
        }),
        storageBucket:
          process.env.FIREBASE_STORAGE_BUCKET ?? `${serviceAccount.project_id}.appspot.com`,
      },
      "legacy-firebase",
    );

  return cachedApp;
}

export interface FirebaseServices {
  auth: ReturnType<typeof getAuth>;
  db: ReturnType<typeof getFirestore>;
  bucket: ReturnType<ReturnType<typeof getStorage>["bucket"]>;
}

/** Returns memoised Firebase Admin services. Throws if not configured. */
export function getFirebaseServices(): FirebaseServices {
  const app = getFirebaseApp();
  return {
    auth: getAuth(app),
    db: getFirestore(app),
    bucket: getStorage(app).bucket(),
  };
}
