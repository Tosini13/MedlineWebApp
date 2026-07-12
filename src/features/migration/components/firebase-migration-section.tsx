import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRightLeft, CheckCircle2, Database, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { mutationErrorMessage } from "@/lib/mutation-error";
import type { MigrationResult } from "@/lib/server/firebase/migrate";
import {
  firebaseSummaryQueryOptions,
  useDeleteFirebaseData,
  useMigrateFromFirebase,
} from "../migration.queries";

function countLabel(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

export function FirebaseMigrationSection() {
  const summaryQuery = useQuery(firebaseSummaryQueryOptions());
  const migrate = useMigrateFromFirebase();
  const remove = useDeleteFirebaseData();
  const [migrated, setMigrated] = useState<MigrationResult | null>(null);

  const summary = summaryQuery.data;

  if (summaryQuery.isLoading) {
    return (
      <Card className="border-amber-500/30">
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Checking for data from the old app…
        </CardContent>
      </Card>
    );
  }

  // Hide the whole section unless Firebase is configured AND the user still has
  // legacy data. This also hides it permanently once the data has been deleted.
  if (!summary?.configured || !summary.hasData) {
    return null;
  }

  const isBusy = migrate.isPending || remove.isPending;

  function handleMigrate() {
    migrate.mutate(undefined, {
      onSuccess: (result) => {
        setMigrated(result);
        toast.success("Migration complete.");
      },
      onError: (error) => toast.error(mutationErrorMessage(error, "Migration failed.")),
    });
  }

  function handleDelete() {
    remove.mutate(undefined, {
      onSuccess: (result) => {
        setMigrated(null);
        toast.success(`Deleted ${countLabel(result.deletedLines, "timeline")} from the old app.`);
      },
      onError: (error) =>
        toast.error(mutationErrorMessage(error, "Could not delete your old data.")),
    });
  }

  return (
    <Card className="border-amber-500/30">
      <CardHeader className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Database className="size-4 text-amber-600 dark:text-amber-500" />
          Data from the old app
        </h2>
        <p className="text-sm text-muted-foreground">
          We found data in the previous (Firebase) version of the app linked to your email. Migrate
          it here to continue where you left off.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span>
            <span className="font-semibold">{summary.lineCount}</span>{" "}
            <span className="text-muted-foreground">
              {summary.lineCount === 1 ? "timeline" : "timelines"}
            </span>
          </span>
          <span>
            <span className="font-semibold">{summary.eventCount}</span>{" "}
            <span className="text-muted-foreground">
              {summary.eventCount === 1 ? "event" : "events"}
            </span>
          </span>
          <span>
            <span className="font-semibold">{summary.documentCount}</span>{" "}
            <span className="text-muted-foreground">
              {summary.documentCount === 1 ? "document" : "documents"}
            </span>
          </span>
        </div>

        {migrated && (
          <Alert>
            <CheckCircle2 className="text-emerald-600 dark:text-emerald-500" />
            <AlertTitle>Migration successful</AlertTitle>
            <AlertDescription>
              <p>
                Imported {countLabel(migrated.migratedLines, "timeline")},{" "}
                {countLabel(migrated.migratedEvents, "event")} and{" "}
                {countLabel(migrated.migratedDocuments, "document")}
                {migrated.skippedFiles > 0
                  ? ` (${countLabel(migrated.skippedFiles, "file")} could not be found and were skipped)`
                  : ""}
                .
              </p>
              <Button asChild variant="link" className="h-auto p-0">
                <Link to="/">View your timelines</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {migrate.isPending && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Migrating your timelines, events and documents… this can take a moment.
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={handleMigrate} disabled={isBusy}>
            {migrate.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowRightLeft className="size-4" />
            )}
            {migrated ? "Migrate again" : "Migrate to new application"}
          </Button>

          <ConfirmDialog
            destructive
            title="Delete data from the old app?"
            description="This permanently deletes all of your timelines, events and documents from the previous (Firebase) app. This cannot be undone. Anything you already migrated here will not be affected."
            confirmLabel="Delete old data"
            onConfirm={handleDelete}
            trigger={
              <Button variant="outline" disabled={isBusy}>
                {remove.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Delete data from old app
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
