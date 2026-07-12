import { FileText, ImageIcon, Paperclip, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import type { DocumentMeta } from "@/lib/domain/types";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ALLOWED_MIME_TYPES } from "../documents.schema";

const ACCEPT = ALLOWED_MIME_TYPES.join(",");

export interface EventDocumentsFieldProps {
  pendingFiles: File[];
  onPendingFilesChange: (files: File[]) => void;
  existingDocuments?: DocumentMeta[];
  removedDocumentIds?: string[];
  onToggleRemoveExisting?: (documentId: string) => void;
  disabled?: boolean;
  className?: string;
}

function fileIcon(mimeType: string | null | undefined) {
  return mimeType?.startsWith("image/") ? ImageIcon : FileText;
}

function dedupeFileName(name: string, existing: string[]): string {
  if (!existing.includes(name)) return name;
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  return `${base}_${crypto.randomUUID().slice(0, 8)}${ext}`;
}

export function EventDocumentsField({
  pendingFiles,
  onPendingFilesChange,
  existingDocuments = [],
  removedDocumentIds = [],
  onToggleRemoveExisting,
  disabled = false,
  className,
}: EventDocumentsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const visibleExisting = existingDocuments.filter((doc) => !removedDocumentIds.includes(doc.id));
  const totalCount = visibleExisting.length + pendingFiles.length;

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const takenNames = [...visibleExisting.map((d) => d.name), ...pendingFiles.map((f) => f.name)];
    const next = [...pendingFiles];
    for (const file of Array.from(fileList)) {
      const name = dedupeFileName(file.name, takenNames);
      takenNames.push(name);
      next.push(name === file.name ? file : new File([file], name, { type: file.type }));
    }
    onPendingFilesChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Paperclip className="size-4 text-muted-foreground" />
          Documents
          {totalCount > 0 && (
            <span className="text-muted-foreground font-normal">({totalCount})</span>
          )}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          Add files
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {totalCount === 0 ? (
        <p className="text-sm text-muted-foreground">
          Attach PDFs or images (max 10 MB each). You can also add more from the event page later.
        </p>
      ) : (
        <ul className="space-y-2">
          {visibleExisting.map((doc) => {
            const Icon = fileIcon(doc.mimeType);
            return (
              <li
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(doc.size)}</p>
                </div>
                {onToggleRemoveExisting && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${doc.name}`}
                    disabled={disabled}
                    onClick={() => onToggleRemoveExisting(doc.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </li>
            );
          })}
          {pendingFiles.map((file) => {
            const Icon = fileIcon(file.type);
            return (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex items-center gap-3 rounded-lg border border-dashed bg-card p-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${file.name}`}
                  disabled={disabled}
                  onClick={() =>
                    onPendingFilesChange(
                      pendingFiles.filter(
                        (f) =>
                          !(
                            f.name === file.name &&
                            f.size === file.size &&
                            f.lastModified === file.lastModified
                          ),
                      ),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
