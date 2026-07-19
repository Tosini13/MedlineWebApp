import { isFirebaseConfigured } from "./admin";
import type { FirebaseLine, FirebaseSummary } from "./data";
import { exportFirebaseData, getFirebaseSummary } from "./data";

/**
 * Server-only provider for read-only checks against the legacy Firebase project.
 * Mirrors the Supabase repository pattern: a single entry point for all Firebase
 * Admin access from server functions.
 */
export class FirebaseDataProvider {
  /** Whether a service account is configured on the server. */
  isConfigured(): boolean {
    return isFirebaseConfigured();
  }

  /** Counts legacy timelines/events/documents for an email (used by the account page). */
  async getSummary(email: string): Promise<FirebaseSummary> {
    return getFirebaseSummary(email);
  }

  /** Exports the full legacy dataset for an email (used by the migration runner). */
  async exportData(email: string): Promise<FirebaseLine[]> {
    return exportFirebaseData(email);
  }
}

let cachedProvider: FirebaseDataProvider | null = null;

export function getFirebaseDataProvider(): FirebaseDataProvider {
  cachedProvider ??= new FirebaseDataProvider();
  return cachedProvider;
}
