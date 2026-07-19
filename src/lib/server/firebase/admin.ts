import { readFileSync } from "node:fs";
import type { App } from "firebase-admin/app";

/**
 * Server-only access to the legacy Firebase project (Firestore + Storage + Auth).
 *
 * Used exclusively by migration server functions to read and migrate a user's
 * legacy data. This module must NEVER be imported by client-reachable code: it
 * initializes the Firebase Admin SDK with a service account (a secret).
 *
 * Configuration (all server-only env vars, never `VITE_`-prefixed):
 *   FIREBASE_SERVICE_ACCOUNT       full service-account JSON as a string, OR
 *   FIREBASE_SERVICE_ACCOUNT_PATH  path to a service-account JSON file
 *   FIREBASE_STORAGE_BUCKET        optional; defaults to `{project_id}.appspot.com`
 *
 * When no service account is configured the feature degrades gracefully: the
 * account page simply hides the Firebase migration section.
 */

export interface ServiceAccountJson {
  project_id: string;
  client_email: string;
  private_key: string;
}

type FirebaseAdminModules = {
  cert: typeof import("firebase-admin/app").cert;
  getApps: typeof import("firebase-admin/app").getApps;
  initializeApp: typeof import("firebase-admin/app").initializeApp;
  getAuth: typeof import("firebase-admin/auth").getAuth;
  getFirestore: typeof import("firebase-admin/firestore").getFirestore;
  getStorage: typeof import("firebase-admin/storage").getStorage;
};

export interface FirebaseServices {
  auth: ReturnType<FirebaseAdminModules["getAuth"]>;
  db: ReturnType<FirebaseAdminModules["getFirestore"]>;
  bucket: ReturnType<ReturnType<FirebaseAdminModules["getStorage"]>["bucket"]>;
}

/** Normalizes a service-account JSON string from env vars or hosting dashboards. */
export function parseServiceAccountJson(raw: string): ServiceAccountJson | null {
  let trimmed = raw.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.includes("project_id"))
  ) {
    trimmed = trimmed.slice(1, -1);
  }

  try {
    const parsed = JSON.parse(trimmed) as Partial<ServiceAccountJson>;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      return null;
    }
    return {
      project_id: parsed.project_id,
      client_email: parsed.client_email,
      // Env-provided keys often contain literal "\n" sequences.
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
    };
  } catch {
    return null;
  }
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
  return parseServiceAccountJson(raw);
}

/** True when a valid Firebase service account is configured on the server. */
export function isFirebaseConfigured(): boolean {
  return readServiceAccount() !== null;
}

let modulesPromise: Promise<FirebaseAdminModules> | null = null;

/** Loads firebase-admin lazily so missing/broken installs fail at call time, not import time. */
function loadFirebaseAdminModules(): Promise<FirebaseAdminModules> {
  modulesPromise ??= Promise.all([
    import("firebase-admin/app"),
    import("firebase-admin/auth"),
    import("firebase-admin/firestore"),
    import("firebase-admin/storage"),
  ]).then(([app, auth, firestore, storage]) => ({
    cert: app.cert,
    getApps: app.getApps,
    initializeApp: app.initializeApp,
    getAuth: auth.getAuth,
    getFirestore: firestore.getFirestore,
    getStorage: storage.getStorage,
  }));
  return modulesPromise;
}

let cachedApp: App | null = null;
let cachedAppPromise: Promise<App> | null = null;

async function getFirebaseApp(): Promise<App> {
  if (cachedApp) return cachedApp;
  if (cachedAppPromise) return cachedAppPromise;

  cachedAppPromise = (async () => {
    const serviceAccount = readServiceAccount();
    if (!serviceAccount) {
      throw new Error("Firebase is not configured on the server.");
    }

    const { cert, getApps, initializeApp } = await loadFirebaseAdminModules();
    const existing = getApps().find((app) => app.name === "legacy-firebase");
    cachedApp =
      existing ??
      initializeApp(
        {
          credential: cert({
            projectId: serviceAccount.project_id,
            clientEmail: serviceAccount.client_email,
            privateKey: serviceAccount.private_key,
          }),
          storageBucket:
            process.env.FIREBASE_STORAGE_BUCKET ?? `${serviceAccount.project_id}.appspot.com`,
        },
        "legacy-firebase",
      );
    return cachedApp;
  })();

  try {
    return await cachedAppPromise;
  } finally {
    cachedAppPromise = null;
  }
}

/** Returns memoised Firebase Admin services. Throws if not configured. */
export async function getFirebaseServices(): Promise<FirebaseServices> {
  const app = await getFirebaseApp();
  const { getAuth, getFirestore, getStorage } = await loadFirebaseAdminModules();
  return {
    auth: getAuth(app),
    db: getFirestore(app),
    bucket: getStorage(app).bucket(),
  };
}
