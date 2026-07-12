import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineForm } from "@/features/lines/components/line-form";
import { lineQueryOptions, useUpdateLine } from "@/features/lines/lines.queries";
import { mutationErrorMessage } from "@/lib/mutation-error";

export const Route = createFileRoute("/_authenticated/lines/$lineId/edit")({
  component: EditLinePage,
});

function EditLinePage() {
  const { lineId } = Route.useParams();
  const navigate = useNavigate();
  const { data: line, isLoading, isError } = useQuery(lineQueryOptions(lineId));
  const update = useUpdateLine();

  if (!isLoading && (isError || !line)) {
    return (
      <EmptyState
        icon={Pencil}
        title="Timeline not found"
        description="It may have been deleted or you may not have access."
        action={
          <Button asChild variant="outline">
            <Link to="/">Back to timelines</Link>
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
      <PageHeader title="Edit timeline" />
      <Card>
        <CardContent className="pt-6">
          {isLoading || !line ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-40" />
            </div>
          ) : (
            <LineForm
              submitLabel="Save changes"
              isPending={update.isPending}
              defaultValues={{
                title: line.title,
                description: line.description ?? "",
                color: line.color,
              }}
              onSubmit={(values) =>
                update.mutate(
                  { id: lineId, ...values },
                  {
                    onSuccess: () => {
                      toast.success("Timeline updated.");
                      navigate({ to: "/lines/$lineId", params: { lineId } });
                    },
                    onError: (error) =>
                      toast.error(mutationErrorMessage(error, "Could not update timeline.")),
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
