import { getFirebaseServices, isFirebaseConfigured } from "./admin";

export interface FirebaseDocument {
  name: string;
  /** Full Firebase Storage object path. */
  path: string;
  type?: string;
}

export interface FirebaseEvent {
  id: string;
  title: string;
  date: unknown;
  description: string;
  type: unknown;
  documents: FirebaseDocument[];
}

export interface FirebaseLine {
  id: string;
  title: string;
  description?: string;
  color: unknown;
  events: FirebaseEvent[];
}

export interface FirebaseSummary {
  configured: boolean;
  hasData: boolean;
  lineCount: number;
  eventCount: number;
  documentCount: number;
}

const EMPTY_SUMMARY: FirebaseSummary = {
  configured: false,
  hasData: false,
  lineCount: 0,
  eventCount: 0,
  documentCount: 0,
};

/** Resolves a Firebase Auth UID from an email, or null when not found. */
async function resolveUidByEmail(email: string): Promise<string | null> {
  const { auth } = getFirebaseServices();
  try {
    const user = await auth.getUserByEmail(email);
    return user.uid;
  } catch {
    return null;
  }
}

function readDocuments(value: unknown): FirebaseDocument[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((d): d is Record<string, unknown> => !!d && typeof d === "object")
    .map((d) => ({
      name: typeof d.name === "string" ? d.name : "document",
      path: typeof d.path === "string" ? d.path : "",
      type: typeof d.type === "string" ? d.type : undefined,
    }))
    .filter((d) => d.path.length > 0);
}

/** Reads all of a user's legacy lines, events and embedded document metadata. */
export async function exportFirebaseData(email: string): Promise<FirebaseLine[]> {
  if (!isFirebaseConfigured()) return [];
  const uid = await resolveUidByEmail(email);
  if (!uid) return [];

  const { db } = getFirebaseServices();
  const linesSnap = await db.collection("lines").where("ownerId", "==", uid).get();

  const lines: FirebaseLine[] = [];
  for (const lineDoc of linesSnap.docs) {
    const lineData = lineDoc.data();
    const eventsSnap = await lineDoc.ref.collection("events").get();

    const events: FirebaseEvent[] = eventsSnap.docs.map((eventDoc) => {
      const eventData = eventDoc.data();
      return {
        id: eventDoc.id,
        title: typeof eventData.title === "string" ? eventData.title : "Untitled event",
        date: eventData.date,
        description: typeof eventData.description === "string" ? eventData.description : "",
        type: eventData.type,
        documents: readDocuments(eventData.documents),
      };
    });

    lines.push({
      id: lineDoc.id,
      title: typeof lineData.title === "string" ? lineData.title : "Untitled timeline",
      description: typeof lineData.description === "string" ? lineData.description : undefined,
      color: lineData.color,
      events,
    });
  }

  return lines;
}

/** Lightweight count of a user's legacy data, used to decide whether to show the migration UI. */
export async function getFirebaseSummary(email: string): Promise<FirebaseSummary> {
  if (!isFirebaseConfigured()) return EMPTY_SUMMARY;

  const uid = await resolveUidByEmail(email);
  if (!uid) return { ...EMPTY_SUMMARY, configured: true };

  const { db } = getFirebaseServices();
  const linesSnap = await db.collection("lines").where("ownerId", "==", uid).get();

  let eventCount = 0;
  let documentCount = 0;
  for (const lineDoc of linesSnap.docs) {
    const eventsSnap = await lineDoc.ref.collection("events").get();
    eventCount += eventsSnap.size;
    for (const eventDoc of eventsSnap.docs) {
      documentCount += readDocuments(eventDoc.data().documents).length;
    }
  }

  const lineCount = linesSnap.size;
  return {
    configured: true,
    hasData: lineCount > 0,
    lineCount,
    eventCount,
    documentCount,
  };
}

export interface DownloadedFile {
  buffer: Buffer;
  contentType: string;
}

/** Downloads a single Storage object by its full path. Returns null if missing. */
export async function downloadFirebaseFile(path: string): Promise<DownloadedFile | null> {
  const { bucket } = getFirebaseServices();
  const file = bucket.file(path);
  try {
    const [exists] = await file.exists();
    if (!exists) return null;
    const [metadata] = await file.getMetadata();
    const [buffer] = await file.download();
    return {
      buffer,
      contentType:
        typeof metadata.contentType === "string"
          ? metadata.contentType
          : "application/octet-stream",
    };
  } catch {
    return null;
  }
}

export interface DeleteFirebaseResult {
  deletedLines: number;
  deletedEvents: number;
  deletedFiles: number;
}

/** Permanently deletes all of a user's legacy Firestore data and Storage files. */
export async function deleteFirebaseData(email: string): Promise<DeleteFirebaseResult> {
  const result: DeleteFirebaseResult = { deletedLines: 0, deletedEvents: 0, deletedFiles: 0 };
  if (!isFirebaseConfigured()) return result;

  const uid = await resolveUidByEmail(email);
  if (!uid) return result;

  const { db, bucket } = getFirebaseServices();
  const linesSnap = await db.collection("lines").where("ownerId", "==", uid).get();

  for (const lineDoc of linesSnap.docs) {
    // Remove all Storage objects under this line first.
    try {
      const [files] = await bucket.getFiles({ prefix: `lines/${lineDoc.id}/` });
      await Promise.all(files.map((file) => file.delete({ ignoreNotFound: true })));
      result.deletedFiles += files.length;
    } catch {
      // Continue deleting Firestore data even if some files fail to delete.
    }

    const eventsSnap = await lineDoc.ref.collection("events").get();
    for (const eventDoc of eventsSnap.docs) {
      await eventDoc.ref.delete();
      result.deletedEvents += 1;
    }

    await lineDoc.ref.delete();
    result.deletedLines += 1;
  }

  return result;
}
