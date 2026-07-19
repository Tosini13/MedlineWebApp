import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRightLeft, CheckCircle2, Database, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { mutationErrorMessage } from "@/lib/mutation-error";
import type { MigrationResult } from "@/lib/server/firebase/migrate";
import { firebaseSummaryQueryOptions, useMigrateFromFirebase } from "../migration.queries";

function countLabel(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

export function FirebaseMigrationSection() {
  const [checkRequested, setCheckRequested] = useState(false);
  const summaryQuery = useQuery({
    ...firebaseSummaryQueryOptions(),
    enabled: checkRequested,
  });
  const migrate = useMigrateFromFirebase();
  const [migrated, setMigrated] = useState<MigrationResult | null>(null);

  const summary = summaryQuery.data;
  const loadFailed = summaryQuery.isError;
  const summaryError =
    summary?.error ??
    (loadFailed
      ? "Could not check for data from the old app. Please refresh and try again."
      : undefined);

  if (!checkRequested) {
    return (
      <Card className="border-amber-500/30">
        <CardHeader className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Database className="size-4 text-amber-600 dark:text-amber-500" />
            Legacy app compatibility
          </h2>
          <p className="text-sm text-muted-foreground">
            Check whether data from the previous version of the app can be migrated to this account.
          </p>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setCheckRequested(true)}>
            <Search className="size-4" />
            Check compatibility with legacy apps
          </Button>
        </CardContent>
      </Card>
    );
  }

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

  if (!loadFailed && !summary?.configured) {
    return (
      <Card className="border-amber-500/30">
        <CardHeader className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Database className="size-4 text-amber-600 dark:text-amber-500" />
            Legacy app compatibility
          </h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Legacy migration is not available on this server.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!loadFailed && summary?.configured && !summary.hasData && !summary.error) {
    return (
      <Card className="border-amber-500/30">
        <CardHeader className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Database className="size-4 text-amber-600 dark:text-amber-500" />
            Legacy app compatibility
          </h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No data was found in the previous app for your email address.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isBusy = migrate.isPending;

  function handleMigrate() {
    migrate.mutate(undefined, {
      onSuccess: (result) => {
        setMigrated(result);
        toast.success("Migration complete.");
      },
      onError: (error) => toast.error(mutationErrorMessage(error, "Migration failed.")),
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
          {summaryError
            ? "We could not reach the previous (Firebase) version of the app to check for your data."
            : "We found data in the previous (Firebase) version of the app linked to your email. Migrate it here to continue where you left off."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {summaryError && (
          <Alert variant="destructive">
            <AlertTitle>Could not load legacy data</AlertTitle>
            <AlertDescription>{summaryError}</AlertDescription>
          </Alert>
        )}

        {!summaryError && summary && (
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
        )}

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

        <Button onClick={handleMigrate} disabled={isBusy || Boolean(summaryError)}>
          {migrate.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRightLeft className="size-4" />
          )}
          {migrated ? "Migrate again" : "Migrate to new application"}
        </Button>
      </CardContent>
    </Card>
  );
}
