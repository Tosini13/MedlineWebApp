import type { EventTypeCode } from "@/lib/supabase/database.types";

export type { EventTypeCode };

/** A medical timeline owned by a single user. */
export interface Line {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

/** A dated entry on a timeline. Named `MedEvent` to avoid clashing with DOM `Event`. */
export interface MedEvent {
  id: string;
  lineId: string;
  title: string;
  date: string;
  description: string | null;
  type: EventTypeCode;
  createdAt: string;
  updatedAt: string;
}

/** Metadata for a file attached to an event. */
export interface DocumentMeta {
  id: string;
  eventId: string;
  name: string;
  storagePath: string;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
}

/** An event with its attached documents, used by detail/timeline views. */
export interface MedEventWithDocuments extends MedEvent {
  documents: DocumentMeta[];
}

/** Optional health information stored at the account level. */
export interface Profile {
  userId: string;
  dateOfBirth: string | null;
  bloodType: string | null;
  emergencyContact: string | null;
  medicaments: string | null;
  chronicHealthIssues: string | null;
  lockScreenSummary: string | null;
  createdAt: string;
  updatedAt: string;
}
