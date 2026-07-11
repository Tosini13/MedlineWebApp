import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EventForm } from "@/features/events/components/event-form";
import { useCreateEvent } from "@/features/events/events.queries";

export const Route = createFileRoute("/_authenticated/lines/$lineId/events/new")({
  component: NewEventPage,
});

function NewEventPage() {
  const { lineId } = Route.useParams();
  const navigate = useNavigate();
  const create = useCreateEvent(lineId);

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
      <PageHeader title="Add event" description="Record an appointment, test, or occurrence." />
      <Card>
        <CardContent className="pt-6">
          <EventForm
            submitLabel="Add event"
            isPending={create.isPending}
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
                  onSuccess: (event) => {
                    toast.success("Event added.");
                    navigate({
                      to: "/lines/$lineId/events/$eventId",
                      params: { lineId, eventId: event.id },
                    });
                  },
                  onError: () => toast.error("Could not add event."),
                },
              )
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
