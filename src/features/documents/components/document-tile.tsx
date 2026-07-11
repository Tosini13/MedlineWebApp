import { Download, FileText, ImageIcon, Loader2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { DocumentMeta } from "@/lib/domain/types";
import { formatFileSize } from "@/lib/format";

interface DocumentTileProps {
  document: DocumentMeta;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function DocumentTile({
  document,
  onDownload,
  onDelete,
  isDeleting = false,
}: DocumentTileProps) {
  const isImage = document.mimeType?.startsWith("image/") ?? false;
  const Icon = isImage ? ImageIcon : FileText;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{document.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(document.size)}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Download ${document.name}`}
        onClick={() => onDownload(document.id)}
      >
        <Download className="size-4" />
      </Button>
      <ConfirmDialog
        destructive
        title="Delete this document?"
        description="This permanently removes the file."
        confirmLabel="Delete"
        onConfirm={() => onDelete(document.id)}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${document.name}`}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        }
      />
    </div>
  );
}
