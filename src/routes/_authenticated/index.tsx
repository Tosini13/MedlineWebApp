import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ListPlus, Plus } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineCard } from "@/features/lines/components/line-card";
import { linesQueryOptions } from "@/features/lines/lines.queries";

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: lines, isLoading } = useQuery(linesQueryOptions());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timelines"
        description="Organise your medical history into focused timelines."
        actions={
          <Button asChild>
            <Link to="/lines/new">
              <Plus className="size-4" />
              New timeline
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((n) => (
            <Card key={n}>
              <CardHeader className="space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : lines && lines.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lines.map((line) => (
            <LineCard key={line.id} line={line} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ListPlus}
          title="No timelines yet"
          description="Create your first timeline to start tracking appointments, tests and documents."
          action={
            <Button asChild>
              <Link to="/lines/new">
                <Plus className="size-4" />
                New timeline
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
