import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteDocument,
  fetchEventDocuments,
  getDocumentDownloadUrl,
  uploadDocument,
} from "./documents.api";

export const documentsKeys = {
  byEvent: (eventId: string) => ["documents", eventId] as const,
};

export const eventDocumentsQueryOptions = (eventId: string) =>
  queryOptions({
    queryKey: documentsKeys.byEvent(eventId),
    queryFn: () => fetchEventDocuments({ data: { eventId } }),
  });

export function useUploadDocument(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventId", eventId);
      return uploadDocument({ data: formData });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsKeys.byEvent(eventId) }),
  });
}

export function useDeleteDocument(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocument({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsKeys.byEvent(eventId) }),
  });
}

export async function downloadDocument(id: string): Promise<void> {
  const { url } = await getDocumentDownloadUrl({ data: { id } });
  window.open(url, "_blank", "noopener,noreferrer");
}
