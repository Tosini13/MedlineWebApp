import type { TypedSupabaseClient } from "../provider";
import { AuthRepository } from "./auth.repository";
import { DocumentsRepository } from "./documents.repository";
import { EventsRepository } from "./events.repository";
import { LinesRepository } from "./lines.repository";

export interface Repositories {
  auth: AuthRepository;
  lines: LinesRepository;
  events: EventsRepository;
  documents: DocumentsRepository;
}

/** Composes the repository layer over a given Supabase client. */
export function createRepositories(client: TypedSupabaseClient): Repositories {
  return {
    auth: new AuthRepository(client),
    lines: new LinesRepository(client),
    events: new EventsRepository(client),
    documents: new DocumentsRepository(client),
  };
}

export { AuthRepository } from "./auth.repository";
export { RepositoryError } from "./base.repository";
export type { CreateDocumentInput } from "./documents.repository";
export { DOCUMENTS_BUCKET, DocumentsRepository } from "./documents.repository";
export type { CreateEventInput, UpdateEventInput } from "./events.repository";
export { EventsRepository } from "./events.repository";
export type { CreateLineInput, UpdateLineInput } from "./lines.repository";
export { LinesRepository } from "./lines.repository";
