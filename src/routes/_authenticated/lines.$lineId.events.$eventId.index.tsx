import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentsSection } from "@/features/documents/components/documents-section";
import { EventTypeBadge } from "@/features/events/components/event-type-badge";
import { eventQueryOptions, useDeleteEvent } from "@/features/events/events.queries";
import { formatDate } from "@/lib/format";
import { mutationErrorMessage } from "@/lib/mutation-error";

export const Route = createFileRoute("/_authenticated/lines/$lineId/events/$eventId/")({
  component: EventDetailPage,
});

function EventDetailPage() {
  const { lineId, eventId } = Route.useParams();
  const navigate = useNavigate();
  const { data: event, isLoading } = useQuery(eventQueryOptions(eventId));
  const deleteEvent = useDeleteEvent(lineId);

  if (!isLoading && !event) {
    return (
      <EmptyState
        icon={Trash2}
        title="Event not found"
        description="It may have been deleted."
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
        to="/lines/$lineId"
        params={{ lineId }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to timeline
      </Link>

      {isLoading || !event ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <EventTypeBadge code={event.type} />
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarDays className="size-4" />
                  {formatDate(event.date)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="icon" aria-label="Edit event">
                <Link to="/lines/$lineId/events/$eventId/edit" params={{ lineId, eventId }}>
                  <Pencil className="size-4" />
                </Link>
              </Button>
              <ConfirmDialog
                destructive
                title="Delete this event?"
                description="This permanently deletes the event and its documents."
                confirmLabel="Delete"
                onConfirm={() =>
                  deleteEvent.mutate(eventId, {
                    onSuccess: () => {
                      toast.success("Event deleted.");
                      navigate({ to: "/lines/$lineId", params: { lineId } });
                    },
                    onError: (error) =>
                      toast.error(mutationErrorMessage(error, "Could not delete event.")),
                  })
                }
                trigger={
                  <Button variant="outline" size="icon" aria-label="Delete event">
                    <Trash2 className="size-4" />
                  </Button>
                }
              />
            </div>
          </div>

          {event.description && (
            <Card>
              <CardContent className="whitespace-pre-wrap pt-6 text-sm leading-relaxed">
                {event.description}
              </CardContent>
            </Card>
          )}

          <Separator />

          <DocumentsSection eventId={eventId} />
        </>
      )}
    </div>
  );
}
