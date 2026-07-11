import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/lib/server/context";
import {
  documentIdSchema,
  eventDocumentsSchema,
  isAllowedMimeType,
  MAX_UPLOAD_BYTES,
  sanitizeFileName,
} from "./documents.schema";

export const fetchEventDocuments = createServerFn({ method: "GET" })
  .validator((d: unknown) => eventDocumentsSchema.parse(d))
  .handler(async ({ data }) => {
    const { repos } = await requireUser();
    return repos.documents.listByEvent(data.eventId);
  });

export const getDocumentDownloadUrl = createServerFn({ method: "POST" })
  .validator((d: unknown) => documentIdSchema.parse(d))
  .handler(async ({ data }) => {
    const { repos } = await requireUser();
    const doc = await repos.documents.getById(data.id);
    if (!doc) throw new Error("Document not found.");
    const url = await repos.documents.createSignedUrl(doc.storagePath, 60);
    return { url, name: doc.name };
  });

export const uploadDocument = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) {
      throw new Error("Expected multipart form data.");
    }
    const file = data.get("file");
    const eventId = data.get("eventId");
    if (!(file instanceof File)) throw new Error("No file was provided.");
    const { eventId: parsedEventId } = eventDocumentsSchema.parse({ eventId });

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error("File is larger than the 10 MB limit.");
    }
    if (!isAllowedMimeType(file.type)) {
      throw new Error("That file type is not supported.");
    }
    return { file, eventId: parsedEventId };
  })
  .handler(async ({ data }) => {
    const { user, repos } = await requireUser();

    const event = await repos.events.getById(data.eventId);
    if (!event) throw new Error("Event not found.");

    const safeName = sanitizeFileName(data.file.name);
    const storagePath = `${user.id}/${event.lineId}/${data.eventId}/${Date.now()}-${safeName}`;
    const body = await data.file.arrayBuffer();

    await repos.documents.uploadFile({
      path: storagePath,
      body,
      contentType: data.file.type || "application/octet-stream",
    });

    return repos.documents.createRecord({
      eventId: data.eventId,
      name: data.file.name,
      storagePath,
      mimeType: data.file.type || null,
      size: data.file.size,
    });
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .validator((d: unknown) => documentIdSchema.parse(d))
  .handler(async ({ data }) => {
    const { repos } = await requireUser();
    const doc = await repos.documents.getById(data.id);
    if (!doc) return { id: data.id };
    await repos.documents.removeFiles([doc.storagePath]);
    await repos.documents.deleteRecord(data.id);
    return { id: data.id };
  });
