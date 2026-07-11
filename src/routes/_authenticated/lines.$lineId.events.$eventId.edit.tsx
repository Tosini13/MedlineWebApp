import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EventForm } from "@/features/events/components/event-form";
import { eventQueryOptions, useUpdateEvent } from "@/features/events/events.queries";

export const Route = createFileRoute("/_authenticated/lines/$lineId/events/$eventId/edit")({
  component: EditEventPage,
});

function EditEventPage() {
  const { lineId, eventId } = Route.useParams();
  const navigate = useNavigate();
  const { data: event, isLoading } = useQuery(eventQueryOptions(eventId));
  const update = useUpdateEvent(lineId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/lines/$lineId/events/$eventId"
        params={{ lineId, eventId }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
              isPending={update.isPending}
              defaultValues={{
                title: event.title,
                date: new Date(event.date),
                description: event.description ?? "",
                type: event.type,
              }}
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
                    onSuccess: () => {
                      toast.success("Event updated.");
                      navigate({
                        to: "/lines/$lineId/events/$eventId",
                        params: { lineId, eventId },
                      });
                    },
                    onError: () => toast.error("Could not update event."),
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
