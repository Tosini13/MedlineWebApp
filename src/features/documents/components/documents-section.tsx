import { useQuery } from "@tanstack/react-query";
import { Loader2, Paperclip, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { mutationErrorMessage } from "@/lib/mutation-error";
import {
  downloadDocument,
  eventDocumentsQueryOptions,
  useDeleteDocument,
  useUploadDocument,
} from "../documents.queries";
import { ALLOWED_MIME_TYPES } from "../documents.schema";
import { DocumentTile } from "./document-tile";

interface DocumentsSectionProps {
  eventId: string;
}

const ACCEPT = ALLOWED_MIME_TYPES.join(",");

export function DocumentsSection({ eventId }: DocumentsSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const documentsQuery = useQuery(eventDocumentsQueryOptions(eventId));
  const upload = useUploadDocument(eventId);
  const remove = useDeleteDocument(eventId);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    for (const file of Array.from(fileList)) {
      upload.mutate(file, {
        onError: (error) => toast.error(mutationErrorMessage(error, "Upload failed.")),
      });
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  const documents = documentsQuery.data ?? [];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Paperclip className="size-4 text-muted-foreground" />
          Documents
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
        >
          {upload.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {documentsQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((document) => (
            <DocumentTile
              key={document.id}
              document={document}
              onDownload={(id) =>
                downloadDocument(id).catch(() => toast.error("Could not open document."))
              }
              onDelete={(id) =>
                remove.mutate(id, {
                  onSuccess: () => toast.success("Document deleted."),
                  onError: (error) =>
                    toast.error(mutationErrorMessage(error, "Could not delete document.")),
                })
              }
              isDeleting={remove.isPending && remove.variables === document.id}
            />
          ))}
          {upload.isPending && (
            <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Uploading…
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <Upload className="size-6" />
          <span>Upload PDFs, images or documents (max 10 MB each)</span>
        </button>
      )}
    </section>
  );
}
