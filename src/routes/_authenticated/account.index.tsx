import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FirebaseMigrationSection } from "@/features/migration/components/firebase-migration-section";
import { ProfileDetails } from "@/features/profile/components/profile-details";
import { profileQueryOptions } from "@/features/profile/profile.queries";

export const Route = createFileRoute("/_authenticated/account/")({
  component: AccountPage,
});

function AccountPage() {
  const { user } = Route.useRouteContext();
  const email = user?.email ?? "Unknown";
  const { data: profile, isLoading } = useQuery(profileQueryOptions());

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Account" description="Manage your account and legacy data." />

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <h2 className="text-lg font-semibold">Profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">Signed in as {email}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/account/edit">
              <Pencil className="mr-2 size-4" />
              Edit profile
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <ProfileDetails profile={profile} />
          )}
        </CardContent>
      </Card>

      <FirebaseMigrationSection />
    </div>
  );
}
