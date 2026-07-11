import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarPlus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Timeline } from "@/features/events/components/timeline";
import { eventsByLineQueryOptions } from "@/features/events/events.queries";
import { lineQueryOptions, useDeleteLine } from "@/features/lines/lines.queries";

export const Route = createFileRoute("/_authenticated/lines/$lineId")({
  component: LineDetailPage,
});

function LineDetailPage() {
  const { lineId } = Route.useParams();
  const navigate = useNavigate();
  const lineQuery = useQuery(lineQueryOptions(lineId));
  const eventsQuery = useQuery(eventsByLineQueryOptions(lineId));
  const deleteLine = useDeleteLine();

  const line = lineQuery.data;

  if (!lineQuery.isLoading && !line) {
    return (
      <EmptyState
        icon={Trash2}
        title="Timeline not found"
        description="It may have been deleted."
        action={
          <Button asChild variant="outline">
            <Link to="/">Back to timelines</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Timelines
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          {lineQuery.isLoading ? (
            <Skeleton className="h-8 w-56" />
          ) : (
            <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
              <span
                aria-hidden
                className="size-3 rounded-full"
                style={{ backgroundColor: line?.color }}
              />
              {line?.title}
            </h1>
          )}
          {line?.description && (
            <p className="max-w-2xl text-sm text-muted-foreground">{line.description}</p>
          )}
        </div>

        {line && (
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link to="/lines/$lineId/events/new" params={{ lineId }}>
                <CalendarPlus className="size-4" />
                Add event
              </Link>
            </Button>
            <Button asChild variant="outline" size="icon" aria-label="Edit timeline">
              <Link to="/lines/$lineId/edit" params={{ lineId }}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            <ConfirmDialog
              destructive
              title="Delete this timeline?"
              description="This permanently deletes the timeline and all of its events and documents."
              confirmLabel="Delete"
              onConfirm={() =>
                deleteLine.mutate(lineId, {
                  onSuccess: () => {
                    toast.success("Timeline deleted.");
                    navigate({ to: "/" });
                  },
                  onError: () => toast.error("Could not delete timeline."),
                })
              }
              trigger={
                <Button variant="outline" size="icon" aria-label="Delete timeline">
                  <Trash2 className="size-4" />
                </Button>
              }
            />
          </div>
        )}
      </div>

      {eventsQuery.isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((n) => (
            <div key={n} className="flex gap-4">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-24 flex-1 rounded-lg" />
            </div>
          ))}
        </div>
      ) : eventsQuery.data && eventsQuery.data.length > 0 ? (
        <Timeline events={eventsQuery.data} lineId={lineId} />
      ) : (
        <EmptyState
          icon={CalendarPlus}
          title="No events yet"
          description="Add appointments, tests, occurrences and more to build this timeline."
          action={
            <Button asChild>
              <Link to="/lines/$lineId/events/new" params={{ lineId }}>
                <CalendarPlus className="size-4" />
                Add event
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
