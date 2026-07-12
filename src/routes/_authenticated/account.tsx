import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FirebaseMigrationSection } from "@/features/migration/components/firebase-migration-section";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
});

function AccountPage() {
  const { user } = Route.useRouteContext();
  const email = user?.email ?? "Unknown";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Account" description="Manage your account and legacy data." />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Profile</h2>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="font-medium">{email}</p>
        </CardContent>
      </Card>

      <FirebaseMigrationSection />
    </div>
  );
}
