import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EventDocumentsField } from "@/features/documents/components/event-documents-field";
import { documentsKeys, uploadFilesForEvent } from "@/features/documents/documents.queries";
import { EventForm } from "@/features/events/components/event-form";
import { useCreateEvent } from "@/features/events/events.queries";
import { mutationErrorMessage } from "@/lib/mutation-error";

export const Route = createFileRoute("/_authenticated/lines/$lineId/events/new")({
  component: NewEventPage,
});

function NewEventPage() {
  const { lineId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const create = useCreateEvent(lineId);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const isBusy = create.isPending || isUploading;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/lines/$lineId"
        params={{ lineId }}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to timeline
      </Link>
      <PageHeader title="Add event" description="Record an appointment, test, or occurrence." />
      <Card>
        <CardContent className="pt-6">
          <EventForm
            submitLabel="Add event"
            isPending={isBusy}
            documentsSlot={
              <EventDocumentsField
                pendingFiles={pendingFiles}
                onPendingFilesChange={setPendingFiles}
                disabled={isBusy}
              />
            }
            onSubmit={(values) =>
              create.mutate(
                {
                  lineId,
                  title: values.title,
                  date: values.date.toISOString(),
                  description: values.description,
                  type: values.type,
                },
                {
                  onSuccess: async (event) => {
                    try {
                      if (pendingFiles.length > 0) {
                        setIsUploading(true);
                        await uploadFilesForEvent(event.id, pendingFiles);
                        await queryClient.invalidateQueries({
                          queryKey: documentsKeys.byEvent(event.id),
                        });
                      }
                      toast.success(
                        pendingFiles.length > 0 ? "Event and documents added." : "Event added.",
                      );
                      navigate({
                        to: "/lines/$lineId/events/$eventId",
                        params: { lineId, eventId: event.id },
                      });
                    } catch (error) {
                      toast.error(mutationErrorMessage(error, "Event saved but upload failed."));
                      navigate({
                        to: "/lines/$lineId/events/$eventId",
                        params: { lineId, eventId: event.id },
                      });
                    } finally {
                      setIsUploading(false);
                    }
                  },
                  onError: (error) =>
                    toast.error(mutationErrorMessage(error, "Could not add event.")),
                },
              )
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
