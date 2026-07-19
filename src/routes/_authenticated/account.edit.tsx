import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { profileQueryOptions, useUpsertProfile } from "@/features/profile/profile.queries";
import { mutationErrorMessage } from "@/lib/mutation-error";

export const Route = createFileRoute("/_authenticated/account/edit")({
  component: EditProfilePage,
});

function EditProfilePage() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useQuery(profileQueryOptions());
  const upsert = useUpsertProfile();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/account"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to account
      </Link>
      <PageHeader
        title="Edit profile"
        description="All fields are optional. Only you can see this information."
      />
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-40" />
            </div>
          ) : (
            <ProfileForm
              submitLabel="Save profile"
              isPending={upsert.isPending}
              defaultValues={{
                dateOfBirth: profile?.dateOfBirth ?? "",
                bloodType: profile?.bloodType ?? "",
                emergencyContact: profile?.emergencyContact ?? "",
                medicaments: profile?.medicaments ?? "",
                chronicHealthIssues: profile?.chronicHealthIssues ?? "",
                lockScreenSummary: profile?.lockScreenSummary ?? "",
              }}
              onSubmit={(values) =>
                upsert.mutate(values, {
                  onSuccess: () => {
                    toast.success("Profile saved.");
                    navigate({ to: "/account" });
                  },
                  onError: (error) =>
                    toast.error(mutationErrorMessage(error, "Could not save profile.")),
                })
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
