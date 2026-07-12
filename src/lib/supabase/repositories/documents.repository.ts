import type { DocumentMeta } from "@/lib/domain/types";
import type { Tables } from "../database.types";
import { BaseRepository } from "./base.repository";

export const DOCUMENTS_BUCKET = "documents";

export interface CreateDocumentInput {
  eventId: string;
  name: string;
  storagePath: string;
  mimeType?: string | null;
  size?: number | null;
}

export interface UploadFileInput {
  path: string;
  body: ArrayBuffer | Blob | Uint8Array;
  contentType: string;
}

function toDocument(row: Tables<"documents">): DocumentMeta {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    size: row.size,
    createdAt: row.created_at,
  };
}

export class DocumentsRepository extends BaseRepository {
  async listByEvent(eventId: string): Promise<DocumentMeta[]> {
    const { data, error } = await this.client
      .from("documents")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });
    if (error) this.fail("Failed to load documents.", error);
    return (data ?? []).map(toDocument);
  }

  async getById(id: string): Promise<DocumentMeta | null> {
    const { data, error } = await this.client
      .from("documents")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) this.fail("Failed to load document.", error);
    return data ? toDocument(data) : null;
  }

  async createRecord(input: CreateDocumentInput): Promise<DocumentMeta> {
    const { data, error } = await this.client
      .from("documents")
      .insert({
        event_id: input.eventId,
        name: input.name,
        storage_path: input.storagePath,
        mime_type: input.mimeType ?? null,
        size: input.size ?? null,
      })
      .select("*")
      .single();
    if (error || !data) this.fail("Failed to save document.", error);
    return toDocument(data);
  }

  async deleteRecord(id: string): Promise<void> {
    const { error } = await this.client.from("documents").delete().eq("id", id);
    if (error) this.fail("Failed to delete document.", error);
  }

  async uploadFile(input: UploadFileInput): Promise<void> {
    const { error } = await this.client.storage
      .from(DOCUMENTS_BUCKET)
      .upload(input.path, input.body, {
        contentType: input.contentType,
        upsert: false,
      });
    if (error) throw new Error("Failed to upload file.");
  }

  async createSignedUrl(path: string, expiresInSeconds = 60): Promise<string> {
    const { data, error } = await this.client.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(path, expiresInSeconds);
    if (error || !data) throw new Error("Failed to create download link.");
    return data.signedUrl;
  }

  async removeFiles(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    const { error } = await this.client.storage.from(DOCUMENTS_BUCKET).remove(paths);
    if (error) throw new Error("Failed to remove files.");
  }
}
