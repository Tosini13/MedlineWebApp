import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EventDocumentsField } from "@/features/documents/components/event-documents-field";
import {
  deleteDocumentsById,
  documentsKeys,
  uploadFilesForEvent,
} from "@/features/documents/documents.queries";
import { EventForm } from "@/features/events/components/event-form";
import { eventQueryOptions, useUpdateEvent } from "@/features/events/events.queries";
import { mutationErrorMessage } from "@/lib/mutation-error";

export const Route = createFileRoute("/_authenticated/lines/$lineId/events/$eventId/edit")({
  component: EditEventPage,
});

function EditEventPage() {
  const { lineId, eventId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: event, isLoading, isError } = useQuery(eventQueryOptions(eventId));
  const update = useUpdateEvent(lineId);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [removedDocumentIds, setRemovedDocumentIds] = useState<string[]>([]);
  const [isSyncingDocs, setIsSyncingDocs] = useState(false);

  const isBusy = update.isPending || isSyncingDocs;

  function toggleRemoveDocument(id: string) {
    setRemovedDocumentIds((current) =>
      current.includes(id) ? current.filter((docId) => docId !== id) : [...current, id],
    );
  }

  if (!isLoading && (isError || !event)) {
    return (
      <EmptyState
        icon={Pencil}
        title="Event not found"
        description="It may have been deleted or you may not have access."
        action={
          <Button asChild variant="outline">
            <Link to="/lines/$lineId" params={{ lineId }}>
              Back to timeline
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/lines/$lineId/events/$eventId"
        params={{ lineId, eventId }}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to event
      </Link>
      <PageHeader title="Edit event" />
      <Card>
        <CardContent className="pt-6">
          {isLoading || !event ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <EventForm
              submitLabel="Save changes"
              isPending={isBusy}
              defaultValues={{
                title: event.title,
                date: new Date(event.date),
                description: event.description ?? "",
                type: event.type,
              }}
              documentsSlot={
                <EventDocumentsField
                  pendingFiles={pendingFiles}
                  onPendingFilesChange={setPendingFiles}
                  existingDocuments={event.documents}
                  removedDocumentIds={removedDocumentIds}
                  onToggleRemoveExisting={toggleRemoveDocument}
                  disabled={isBusy}
                />
              }
              onSubmit={(values) =>
                update.mutate(
                  {
                    id: eventId,
                    title: values.title,
                    date: values.date.toISOString(),
                    description: values.description,
                    type: values.type,
                  },
                  {
                    onSuccess: async () => {
                      try {
                        setIsSyncingDocs(true);
                        if (removedDocumentIds.length > 0) {
                          await deleteDocumentsById(removedDocumentIds);
                        }
                        if (pendingFiles.length > 0) {
                          await uploadFilesForEvent(eventId, pendingFiles);
                        }
                        await queryClient.invalidateQueries({
                          queryKey: documentsKeys.byEvent(eventId),
                        });
                        toast.success("Event updated.");
                        navigate({
                          to: "/lines/$lineId/events/$eventId",
                          params: { lineId, eventId },
                        });
                      } catch (error) {
                        toast.error(
                          mutationErrorMessage(error, "Event saved but document sync failed."),
                        );
                        navigate({
                          to: "/lines/$lineId/events/$eventId",
                          params: { lineId, eventId },
                        });
                      } finally {
                        setIsSyncingDocs(false);
                      }
                    },
                    onError: (error) =>
                      toast.error(mutationErrorMessage(error, "Could not update event.")),
                  },
                )
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
