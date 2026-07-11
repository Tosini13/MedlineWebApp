import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { LineForm } from "@/features/lines/components/line-form";
import { useCreateLine } from "@/features/lines/lines.queries";

export const Route = createFileRoute("/_authenticated/lines/new")({
  component: NewLinePage,
});

function NewLinePage() {
  const navigate = useNavigate();
  const create = useCreateLine();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Timelines
      </Link>
      <PageHeader title="New timeline" description="Give your timeline a name and color." />
      <Card>
        <CardContent className="pt-6">
          <LineForm
            submitLabel="Create timeline"
            isPending={create.isPending}
            onSubmit={(values) =>
              create.mutate(values, {
                onSuccess: (line) => {
                  toast.success("Timeline created.");
                  navigate({ to: "/lines/$lineId", params: { lineId: line.id } });
                },
                onError: () => toast.error("Could not create timeline."),
              })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
