import { sanitizeFileName } from "@/features/documents/documents.schema";
import {
  normalizeColor,
  normalizeEventDate,
  normalizeEventType,
} from "@/features/migration/migration.transform";
import type { Repositories } from "@/lib/supabase/repositories";
import { downloadFirebaseFile } from "./data";
import { getFirebaseDataProvider } from "./provider";

export interface MigrationResult {
  migratedLines: number;
  migratedEvents: number;
  migratedDocuments: number;
  skippedFiles: number;
}

export interface MigrateParams {
  email: string;
  userId: string;
  repos: Repositories;
}

/**
 * Reads a user's legacy Firebase data and recreates it in Supabase (owned by the
 * current user). Writes go through the request-scoped, RLS-enforced repositories,
 * so ownership and storage paths stay valid. Existing Supabase data is left
 * untouched — this only inserts.
 */
export async function migrateFirebaseToSupabase(params: MigrateParams): Promise<MigrationResult> {
  const { email, userId, repos } = params;
  const result: MigrationResult = {
    migratedLines: 0,
    migratedEvents: 0,
    migratedDocuments: 0,
    skippedFiles: 0,
  };

  const lines = await getFirebaseDataProvider().exportData(email);

  for (const line of lines) {
    const newLine = await repos.lines.create(userId, {
      title: line.title,
      description: line.description ?? null,
      color: normalizeColor(line.color),
    });
    result.migratedLines += 1;

    for (const event of line.events) {
      const newEvent = await repos.events.create({
        lineId: newLine.id,
        title: event.title,
        date: normalizeEventDate(event.date),
        description: event.description.length > 0 ? event.description : null,
        type: normalizeEventType(event.type),
      });
      result.migratedEvents += 1;

      for (const document of event.documents) {
        const file = await downloadFirebaseFile(document.path);
        if (!file) {
          result.skippedFiles += 1;
          continue;
        }

        const storagePath = `${userId}/${newLine.id}/${newEvent.id}/${Date.now()}-${sanitizeFileName(
          document.name,
        )}`;

        await repos.documents.uploadFile({
          path: storagePath,
          body: file.buffer,
          contentType: document.type ?? file.contentType,
        });

        await repos.documents.createRecord({
          eventId: newEvent.id,
          name: document.name,
          storagePath,
          mimeType: document.type ?? file.contentType,
          size: file.buffer.byteLength,
        });
        result.migratedDocuments += 1;
      }
    }
  }

  return result;
}
